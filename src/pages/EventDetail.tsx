import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { MapPin, Share2, Heart, Calendar, Phone, Mail, ArrowLeft, Copy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SimilarItems } from "@/components/SimilarItems";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ReviewSection } from "@/components/ReviewSection";
import { useSavedItems } from "@/hooks/useSavedItems";
import { MultiStepBooking, BookingFormData } from "@/components/booking/MultiStepBooking";
import { generateReferralLink, trackReferralClick } from "@/lib/referralUtils";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { extractIdFromSlug } from "@/lib/slugUtils";

interface Activity {
  name: string;
  price: number;
}
interface Event {
  id: string;
  name: string;
  location: string;
  country: string;
  place: string;
  image_url: string;
  images: string[];
  description: string;
  price: number;
  price_child: number;
  date: string;
  is_custom_date: boolean;
  available_tickets: number;
  phone_number?: string;
  email?: string;
  map_link?: string;
  activities?: Activity[];
  type: string;
  created_by: string | null;
}

const TEAL_COLOR = "#008080";
const ORANGE_COLOR = "#FF9800";
const RED_COLOR = "#FF0000";

const EventDetail = () => {
  const { slug } = useParams();
  const id = slug ? extractIdFromSlug(slug) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { savedItems, handleSave: handleSaveItem } = useSavedItems();
  const isSaved = savedItems.has(id || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (id) fetchEvent();
    const urlParams = new URLSearchParams(window.location.search);
    const refSlug = urlParams.get("ref");
    if (refSlug && id) trackReferralClick(refSlug, id, "event", "booking");
  }, [id]);

  const fetchEvent = async () => {
    if (!id) return;
    try {
      let { data, error } = await supabase.from("trips").select("*").eq("id", id).eq("type", "event").single();
      if (error && id.length === 8) {
        const { data: prefixData, error: prefixError } = await supabase.from("trips").select("*").ilike("id", `${id}%`).eq("type", "event").single();
        if (!prefixError) { data = prefixData; error = null; }
      }
      if (error) throw error;
      setEvent(data as any);
    } catch (error) {
      toast({ title: "Event not found", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => id && handleSaveItem(id, "event");

  const handleCopyLink = async () => {
    if (!event) return;
    const refLink = await generateReferralLink(event.id, "event", event.id);
    try {
      await navigator.clipboard.writeText(refLink);
      toast({ title: "Link Copied!", description: user ? "Share to earn commission!" : "Share this event!" });
    } catch (error) {
      toast({ title: "Copy Failed", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (!event) return;
    const refLink = await generateReferralLink(event.id, "event", event.id);
    if (navigator.share) {
      try { await navigator.share({ title: event.name, text: `Check out: ${event.name}`, url: refLink }); }
      catch (error) { console.log("Share failed", error); }
    } else { await handleCopyLink(); }
  };

  const openInMaps = () => {
    if (event?.map_link) window.open(event.map_link, "_blank");
    else {
      const query = encodeURIComponent(`${event?.name}, ${event?.location}, ${event?.country}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
    }
  };

  const { submitBooking } = useBookingSubmit();

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!event) return;
    setIsProcessing(true);
    try {
      const totalPeople = data.num_adults + data.num_children;
      const totalAmount = (data.num_adults * event.price) + (data.num_children * event.price_child) + 
                           data.selectedActivities.reduce((sum, a) => sum + a.price * a.numberOfPeople, 0);

      await submitBooking({
        itemId: event.id, itemName: event.name, bookingType: 'event', totalAmount, slotsBooked: totalPeople,
        visitDate: event.date, guestName: data.guest_name, guestEmail: data.guest_email, guestPhone: data.guest_phone,
        hostId: event.created_by,
        bookingDetails: { event_name: event.name, date: event.date, adults: data.num_adults, children: data.num_children, activities: data.selectedActivities }
      });
      setIsProcessing(false); setIsCompleted(true);
      toast({ title: "Booking Submitted" });
    } catch (error: any) {
      setIsProcessing(false); toast({ title: "Booking failed", variant: "destructive" });
    }
  };

  if (loading) return <div className="min-h-screen bg-background pb-20"><MobileBottomBar /></div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  const allImages = [event.image_url, ...(event.images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-10">
      <Header className="hidden md:block" /> 
      
      {/* HERO SECTION */}
      <div className="relative w-full overflow-hidden md:max-w-6xl md:mx-auto">
        <Button 
          variant="ghost" onClick={() => navigate(-1)} 
          className="absolute top-4 left-4 z-30 h-10 w-10 p-0 rounded-full text-white bg-black/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Button 
          variant="ghost" onClick={handleSave} 
          className={`absolute top-4 right-4 z-30 h-10 w-10 p-0 rounded-full text-white ${isSaved ? "" : "bg-black/50"}`}
          style={{ backgroundColor: isSaved ? RED_COLOR : 'rgba(0, 0, 0, 0.5)' }} 
        >
          <Heart className={`h-5 w-5 ${isSaved ? "fill-white" : ""}`} />
        </Button>
        
        <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 3000 })]} className="w-full">
          <CarouselContent>
            {allImages.map((img, idx) => (
              <CarouselItem key={idx}>
                <img src={img} alt={event.name} className="w-full h-[45vh] md:h-96 lg:h-[500px] object-cover" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-white bg-gradient-to-t from-black/90 to-transparent">
          <h1 className="text-2xl md:text-3xl font-bold uppercase">{event.name}</h1> 
        </div>
      </div>
      
      <main className="container px-4 max-w-6xl mx-auto mt-6">
        <div className="grid lg:grid-cols-[2fr,1fr] gap-8">
          
          {/* DESKTOP SIDEBAR */}
          <div className="hidden lg:block space-y-4 sticky top-20 h-fit">
            <div className="p-6 border bg-card rounded-xl space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5" style={{ color: TEAL_COLOR }} />
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Upcoming Event</p>
                  <p className="font-semibold">{new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                </div>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Adult</span>
                  <p className="text-2xl font-bold" style={{ color: TEAL_COLOR }}>KSh {event.price}</p>
                </div>
                {event.price_child > 0 && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Child</span>
                    <p className="text-lg font-semibold" style={{ color: TEAL_COLOR }}>KSh {event.price_child}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Users className="h-3 w-3" />
                  <span>{event.available_tickets} slots remaining</span>
                </div>
              </div>
              <Button 
                className="w-full text-white h-12" 
                style={{ backgroundColor: TEAL_COLOR }}
                onClick={() => { setIsCompleted(false); setShowBooking(true); }}
                disabled={event.available_tickets <= 0}
              >
                {event.available_tickets <= 0 ? "Sold Out" : "Book Now"}
              </Button>
            </div>
          </div>
          
          {/* CONTENT AREA */}
          <div className="w-full space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" style={{ color: TEAL_COLOR }} />
                <span className="font-medium">{event.location}, {event.country}</span>
              </div>

              {/* ACTION BUTTONS (Shared Mobile/Desktop) */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={openInMaps} className="rounded-full" style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}>
                  <MapPin className="h-4 w-4 mr-2" /> Google Maps
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyLink} className="rounded-full" style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}>
                  <Copy className="h-4 w-4 mr-2" /> Copy Link
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare} className="rounded-full" style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>
            </div>
            
            <div className="bg-card border rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold mb-3">About This Event</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>

            {event.activities && event.activities.length > 0 && (
              <div className="p-5 border bg-card rounded-xl shadow-sm">
                <h2 className="text-lg font-bold mb-4">Included Activities</h2>
                <div className="flex flex-wrap gap-3">
                  {event.activities.map((activity, idx) => (
                    <div key={idx} className="px-4 py-2 text-white rounded-lg flex flex-col" style={{ backgroundColor: ORANGE_COLOR }}>
                      <span className="font-bold text-sm">{activity.name}</span>
                      <span className="text-[10px] uppercase font-medium">{activity.price > 0 ? `+ KSh ${activity.price}` : 'Included'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(event.phone_number || event.email) && (
               <div className="p-5 border bg-card rounded-xl shadow-sm">
                 <h2 className="text-lg font-bold mb-4">Contact Host</h2>
                 <div className="flex flex-col sm:flex-row gap-3">
                   {event.phone_number && (
                     <a href={`tel:${event.phone_number}`} className="flex items-center gap-3 p-3 border rounded-lg flex-1" style={{ borderColor: TEAL_COLOR }}>
                       <Phone className="h-4 w-4" style={{ color: TEAL_COLOR }} />
                       <span className="text-sm font-medium">{event.phone_number}</span>
                     </a>
                   )}
                   {event.email && (
                     <a href={`mailto:${event.email}`} className="flex items-center gap-3 p-3 border rounded-lg flex-1" style={{ borderColor: TEAL_COLOR }}>
                       <Mail className="h-4 w-4" style={{ color: TEAL_COLOR }} />
                       <span className="text-sm font-medium">Email Host</span>
                     </a>
                   )}
                 </div>
               </div>
            )}
          </div>
        </div>

        <div className="mt-12 space-y-8">
          <ReviewSection itemId={event.id} itemType="event" />
          <SimilarItems currentItemId={event.id} itemType="trip" location={event.location} country={event.country} />
        </div>
      </main>

      {/* FLOATING MOBILE CTA BAR */}
      <div className="fixed bottom-[64px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t p-4 lg:hidden shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-3">
          {/* Mobile Pricing and Info Summary */}
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3 w-3" style={{ color: TEAL_COLOR }} />
                <span>{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="mx-1">•</span>
                <Users className="h-3 w-3" />
                <span>{event.available_tickets} Left</span>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <span className="block text-[10px] uppercase text-muted-foreground font-medium">Adult</span>
                  <p className="text-xl font-black leading-none" style={{ color: TEAL_COLOR }}>KSh {event.price}</p>
                </div>
                {event.price_child > 0 && (
                  <div className="border-l pl-3">
                    <span className="block text-[10px] uppercase text-muted-foreground font-medium">Child</span>
                    <p className="text-sm font-bold leading-none" style={{ color: TEAL_COLOR }}>KSh {event.price_child}</p>
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              className="h-12 px-8 text-white font-bold rounded-xl shadow-lg" 
              style={{ backgroundColor: TEAL_COLOR }}
              onClick={() => { setIsCompleted(false); setShowBooking(true); }}
              disabled={event.available_tickets <= 0}
            >
              {event.available_tickets <= 0 ? "Sold Out" : "Book Now"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <MultiStepBooking 
            onSubmit={handleBookingSubmit} activities={event.activities || []} 
            priceAdult={event.price} priceChild={event.price_child} 
            isProcessing={isProcessing} isCompleted={isCompleted} 
            itemName={event.name} skipDateSelection={true} fixedDate={event.date} 
            skipFacilitiesAndActivities={true} itemId={event.id} 
            bookingType="event" hostId={event.created_by || ""} 
            onPaymentSuccess={() => setIsCompleted(true)} 
          />
        </DialogContent>
      </Dialog>

      <MobileBottomBar />
    </div>
  );
};

export default EventDetail;