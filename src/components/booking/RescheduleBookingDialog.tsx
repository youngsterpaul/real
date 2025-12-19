import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInHours, isBefore, startOfDay } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  CORAL_LIGHT: "#FF9E7A",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  RED: "#FF0000",
  SOFT_GRAY: "#F8F9FA"
};

interface RescheduleBookingDialogProps {
  booking: {
    id: string;
    item_id: string;
    booking_type: string;
    booking_details: any;
    visit_date: string | null;
    slots_booked: number | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RescheduleBookingDialog({
  booking,
  open,
  onOpenChange,
  onSuccess
}: RescheduleBookingDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [isEligible, setIsEligible] = useState(true);
  const [eligibilityMessage, setEligibilityMessage] = useState("");
  const [isFixedDate, setIsFixedDate] = useState(false);
  const [isNewSchedule, setIsNewSchedule] = useState(false);

  useEffect(() => {
    if (open) {
      setIsNewSchedule(!booking.visit_date);
      checkEligibility();
      loadWorkingDays();
      loadBookedDates();
    }
  }, [open, booking]);

  const checkEligibility = async () => {
    if (booking.booking_type === 'event') {
      setIsEligible(false);
      setEligibilityMessage("Events with fixed dates cannot be rescheduled.");
      return;
    }

    if (booking.booking_type === 'trip') {
      const { data: trip } = await supabase
        .from('trips')
        .select('is_flexible_date, is_custom_date')
        .eq('id', booking.item_id)
        .single();
      
      if (!trip?.is_flexible_date && !trip?.is_custom_date) {
        setIsEligible(false);
        setIsFixedDate(true);
        setEligibilityMessage("This trip has a fixed date and cannot be rescheduled.");
        return;
      }
    }

    if (booking.visit_date) {
      const bookingDate = new Date(booking.visit_date);
      const now = new Date();
      const hoursUntilBooking = differenceInHours(bookingDate, now);
      
      if (hoursUntilBooking < 48) {
        setIsEligible(false);
        setEligibilityMessage("Bookings cannot be rescheduled within 48 hours of the scheduled date.");
        return;
      }
    }

    setIsEligible(true);
    setEligibilityMessage("");
  };

  const loadWorkingDays = async () => {
    try {
      let data: any = null;
      if (booking.booking_type === 'trip') return;
      else if (booking.booking_type === 'hotel') {
        const result = await supabase.from('hotels').select('days_opened').eq('id', booking.item_id).single();
        data = result.data;
      } else if (booking.booking_type === 'adventure' || booking.booking_type === 'adventure_place') {
        const result = await supabase.from('adventure_places').select('days_opened').eq('id', booking.item_id).single();
        data = result.data;
      }
      
      if (data?.days_opened && Array.isArray(data.days_opened)) {
        setWorkingDays(data.days_opened);
      }
    } catch (error) {
      console.error('Error loading working days:', error);
    }
  };

  const loadBookedDates = async () => {
    let capacity = 0;
    if (booking.booking_type === 'trip') {
      const { data } = await supabase.from('trips').select('available_tickets').eq('id', booking.item_id).single();
      capacity = data?.available_tickets || 0;
    } else if (booking.booking_type === 'hotel') {
      const { data } = await supabase.from('hotels').select('available_rooms').eq('id', booking.item_id).single();
      capacity = data?.available_rooms || 0;
    } else if (booking.booking_type === 'adventure' || booking.booking_type === 'adventure_place') {
      const { data } = await supabase.from('adventure_places').select('available_slots').eq('id', booking.item_id).single();
      capacity = data?.available_slots || 0;
    }
    setTotalCapacity(capacity);

    const { data: bookings } = await supabase
      .from('bookings')
      .select('visit_date, slots_booked')
      .eq('item_id', booking.item_id)
      .neq('id', booking.id)
      .neq('status', 'cancelled')
      .neq('status', 'rejected');

    const bookingsByDate = new Map<string, number>();
    bookings?.forEach(b => {
      if (b.visit_date) {
        const current = bookingsByDate.get(b.visit_date) || 0;
        bookingsByDate.set(b.visit_date, current + (b.slots_booked || 1));
      }
    });

    const fullyBooked = new Set<string>();
    bookingsByDate.forEach((booked, date) => {
      if (booked + (booking.slots_booked || 1) > capacity) {
        fullyBooked.add(date);
      }
    });

    setBookedDates(fullyBooked);
  };

  const isDayDisabled = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayName = format(date, 'EEEE');
    if (isBefore(date, startOfDay(new Date()))) return true;
    if (workingDays.length > 0 && !workingDays.includes(dayName)) return true;
    if (bookedDates.has(dateStr)) return true;
    return false;
  };

  const handleReschedule = async () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    const newDateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayName = format(selectedDate, 'EEEE');
    
    if (workingDays.length > 0 && !workingDays.includes(dayName)) {
      toast.error("Selected date is not a working day");
      return;
    }

    if (bookedDates.has(newDateStr)) {
      toast.error("Selected date is fully booked");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ visit_date: newDateStr, updated_at: new Date().toISOString() })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      if (booking.visit_date) {
        await supabase.from('reschedule_log').insert({
          booking_id: booking.id, user_id: user.id, old_date: booking.visit_date, new_date: newDateStr
        });
      }

      let itemName = booking.booking_details.trip_name || 
                     booking.booking_details.event_name || 
                     booking.booking_details.hotel_name ||
                     booking.booking_details.place_name ||
                     'Your booking';

      const notificationMessage = isNewSchedule 
        ? `Your visit date for ${itemName} has been set to ${format(selectedDate, 'PPP')}.`
        : `Your booking for ${itemName} has been moved to ${format(selectedDate, 'PPP')}.`;

      await supabase.from('notifications').insert({
        user_id: user.id,
        type: isNewSchedule ? 'visit_date_set' : 'booking_rescheduled',
        title: isNewSchedule ? 'Visit Date Set' : 'Booking Rescheduled',
        message: notificationMessage,
        data: { booking_id: booking.id, old_date: booking.visit_date, new_date: newDateStr }
      });

      toast.success(isNewSchedule ? "Visit date set successfully" : "Booking rescheduled successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update booking");
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-[40px] border-none shadow-2xl bg-white">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>
              {isNewSchedule ? 'Set Visit Date' : 'Reschedule Booking'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
              {isNewSchedule 
                ? 'Select a visit date. Schedule at least 48 hours in advance.'
                : 'Move your booking to a new date.'}
            </DialogDescription>
          </DialogHeader>

          {!isEligible ? (
            <div className="flex items-start gap-4 p-6 bg-red-50 rounded-3xl border border-red-100">
              <div className="bg-white p-2 rounded-xl shadow-sm">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-black text-red-600 uppercase text-xs tracking-widest">Action Restricted</p>
                <p className="text-sm text-red-500/80 leading-relaxed mt-1 font-bold">{eligibilityMessage}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="grid grid-cols-2 gap-4">
                {booking.visit_date && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Date</p>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-black text-slate-600">{format(new Date(booking.visit_date), 'dd MMM yyyy')}</span>
                    </div>
                  </div>
                )}
                {selectedDate && (
                  <div className="p-4 rounded-2xl border border-[#008080]/20" style={{ backgroundColor: `${COLORS.TEAL}10` }}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: COLORS.TEAL }}>Selected Date</p>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" style={{ color: COLORS.TEAL }} />
                      <span className="text-xs font-black" style={{ color: COLORS.TEAL }}>{format(selectedDate, 'dd MMM yyyy')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Calendar Section */}
              <div className="bg-white rounded-[28px] p-4 shadow-sm border border-slate-100">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={isDayDisabled}
                  className="mx-auto"
                />
                
                <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-3 w-3 text-slate-400" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Policy & Availability</p>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <li className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                      <CheckCircle2 className="h-3 w-3 text-green-500" /> 48H ADVANCE NOTICE REQUIRED
                    </li>
                    {workingDays.length > 0 && (
                      <li className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <CheckCircle2 className="h-3 w-3 text-green-500" /> {workingDays.length} WORKING DAYS PER WEEK
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => onOpenChange(false)} 
                  disabled={loading}
                  className="flex-1 py-7 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleReschedule} 
                  disabled={!selectedDate || loading}
                  className="flex-[2] py-7 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 border-none"
                  style={{ 
                    background: `linear-gradient(135deg, ${COLORS.CORAL_LIGHT} 0%, ${COLORS.CORAL} 100%)`,
                    boxShadow: `0 12px 24px -8px ${COLORS.CORAL}88`
                  }}
                >
                  {loading ? "Processing..." : (isNewSchedule ? "Set Visit Date" : "Confirm Move")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}