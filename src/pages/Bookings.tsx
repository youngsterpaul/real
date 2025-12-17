import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  RefreshCw, 
  Download, 
  Ticket,
  CheckCircle2,
  QrCode
} from "lucide-react";
import { RescheduleBookingDialog } from "@/components/booking/RescheduleBookingDialog";
import { toast } from "sonner";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Booking {
  id: string;
  booking_type: string;
  total_amount: number;
  booking_details: any;
  payment_status: string;
  status: string;
  created_at: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  slots_booked: number | null;
  visit_date: string | null;
  item_id: string;
  isPending?: boolean;
  payment_phone?: string;
  pendingPaymentId?: string;
  result_code?: string | null;
}

const Bookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [retryingPaymentId, setRetryingPaymentId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookings();
      const channel = supabase
        .channel('payments-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${user.id}` }, 
        () => fetchBookings())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data: confirmedBookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      const { data: pendingPayments } = await supabase
        .from("payments" as any)
        .select("*")
        .eq("user_id", user?.id)
        .in("payment_status", ["pending", "failed"]);

      const pendingAsBookings: Booking[] = (pendingPayments || []).map((pp: any) => ({
        id: pp.id,
        booking_type: pp.booking_data?.booking_type || "unknown",
        total_amount: pp.amount,
        booking_details: pp.booking_data?.booking_details || {},
        payment_status: pp.payment_status,
        status: "pending",
        created_at: pp.created_at,
        guest_name: pp.booking_data?.guest_name || null,
        guest_email: pp.booking_data?.guest_email || null,
        guest_phone: pp.booking_data?.guest_phone || null,
        slots_booked: pp.booking_data?.slots_booked || 1,
        visit_date: pp.booking_data?.visit_date || null,
        item_id: pp.booking_data?.item_id || "",
        isPending: true,
        payment_phone: pp.phone_number,
        pendingPaymentId: pp.id,
        result_code: pp.result_code,
      }));

      setBookings([...(confirmedBookings || []), ...pendingAsBookings].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ASYNC PDF Generation with QR Code
  const generateTicketPDF = async (booking: Booking, personIndex?: number) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [100, 160] });
    const ticketID = personIndex !== undefined ? `${booking.id}-T${personIndex + 1}` : booking.id;

    try {
      // 1. Generate QR Code
      const qrDataUrl = await QRCode.toDataURL(ticketID, { margin: 1, width: 200 });

      // 2. Styling - Header
      doc.setFillColor(15, 23, 42); // Navy Blue
      doc.rect(0, 0, 100, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("ADMISSION PASS", 50, 18, { align: "center" });
      
      doc.setFontSize(9);
      doc.text(personIndex !== undefined ? `TICKET ${personIndex + 1} OF ${booking.slots_booked}` : "GROUP SUMMARY", 50, 26, { align: "center" });

      // 3. QR Code Placement
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(30, 32, 40, 40, 3, 3, 'F');
      doc.addImage(qrDataUrl, 'PNG', 32, 34, 36, 36);

      // 4. Content - Booking Details
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const title = booking.booking_details.trip_name || booking.booking_details.hotel_name || 'Booking';
      doc.text(title.toUpperCase(), 10, 85);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Reference: #${booking.id.slice(0, 8).toUpperCase()}`, 10, 95);
      doc.text(`Date: ${booking.visit_date ? new Date(booking.visit_date).toDateString() : 'N/A'}`, 10, 102);
      doc.text(`Guest: ${booking.guest_name || 'Valued Customer'}`, 10, 109);
      
      if (personIndex === undefined) {
        doc.text(`Total Passengers: ${booking.slots_booked}`, 10, 116);
      }

      // 5. Footer Security
      doc.setDrawColor(200, 200, 200);
      doc.setLineDash([1, 1]);
      doc.line(5, 135, 95, 135);
      
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("Valid for one entry only. Do not share this QR code.", 50, 145, { align: "center" });
      doc.text(`Generated on ${new Date().toLocaleString()}`, 50, 150, { align: "center" });

      const fileName = personIndex !== undefined 
        ? `Ticket_${booking.id.slice(0,5)}_P${personIndex+1}.pdf`
        : `Booking_Summary_${booking.id.slice(0,5)}.pdf`;

      doc.save(fileName);
      toast.success("Ticket downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate QR code");
    }
  };

  const getStatusColor = (booking: Booking) => {
    if (booking.result_code === "0" || booking.payment_status === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (booking.isPending) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  if (authLoading || loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 container px-4 py-8 pb-24 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
        
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border-slate-200 shadow-sm">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant="outline" className={`mb-2 ${getStatusColor(booking)}`}>
                      {booking.payment_status === 'paid' ? 'Confirmed' : 'Pending'}
                    </Badge>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">
                      {booking.booking_details.trip_name || booking.booking_details.hotel_name || 'Package Booking'}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block uppercase">Price</span>
                    <span className="font-bold text-primary">KSh {booking.total_amount}</span>
                  </div>
                </div>

                <div className="flex gap-6 text-sm text-slate-600 mb-2">
                  <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {booking.visit_date}</div>
                  <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {booking.slots_booked} Pax</div>
                </div>
              </div>

              {/* DOWNLOAD SECTION */}
              {(booking.payment_status === 'paid' || booking.result_code === "0") && (
                <div className="bg-slate-50 border-t p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <QrCode className="h-3 w-3" /> Digital Tickets
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs text-primary"
                      onClick={() => generateTicketPDF(booking)}
                    >
                      Summary PDF
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: booking.slots_booked || 1 }).map((_, i) => (
                      <Button 
                        key={i} 
                        variant="outline" 
                        size="sm" 
                        className="bg-white text-xs h-8"
                        onClick={() => generateTicketPDF(booking, i)}
                      >
                        <Ticket className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                        Ticket {i + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </main>
      <MobileBottomBar />
    </div>
  );
};

export default Bookings;