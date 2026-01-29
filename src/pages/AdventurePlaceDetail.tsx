import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, Clock, ArrowLeft, AlertCircle, Heart, Star, Circle, 
  ShieldCheck, Zap, Calendar, Loader2, Share2, Copy, Navigation, 
  Mountain, Info, Users
} from "lucide-react";
import { SimilarItems } from "@/components/SimilarItems";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ReviewSection } from "@/components/ReviewSection";
import { useSavedItems } from "@/hooks/useSavedItems";
import { MultiStepBooking, BookingFormData } from "@/components/booking/MultiStepBooking";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { extractIdFromSlug } from "@/lib/slugUtils";
import { useGeolocation } from "@/hooks/useGeolocation";
import { trackReferralClick, generateReferralLink } from "@/lib/referralUtils";

const AdventurePlaceDetail = () => {
  const { slug } = useParams();
  const id = slug ? extractIdFromSlug(slug) : null;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requestLocation } = useGeolocation();
  
  const [adventure, setAdventure] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [liveRating, setLiveRating] = useState({ avg: 0, count: 0 });
  const [scrolled, setScrolled] = useState(false);

  const { savedItems, handleSave: handleSaveItem } = useSavedItems();
  const isSaved = savedItems.has(id || "");

  // Sticky Header Logic
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Database Fetching (Untouched logic)
  useEffect(() => {
    if (id) {
      fetchAdventure();
      fetchLiveRating();
    }
    const urlParams = new URLSearchParams(window.location.search);
    const refSlug = urlParams.get("ref");
    if (refSlug && id) trackReferralClick(refSlug, id, "adventure", "booking");
    requestLocation();
    window.scrollTo(0, 0);
  }, [id, slug]);

  const fetchAdventure = async () => {
    if (!id) return;
    try {
      let { data, error } = await supabase
        .from("adventures")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setAdventure(data);
    } catch (error) {
      toast({ title: "Adventure not found", variant: "destructive" });
      navigate('/');
    } finally { setLoading(false); }
  };

  const fetchLiveRating = async () => {
    if (!id) return;
    const { data } = await supabase.from("reviews").select("rating").eq("item_id", id).eq("item_type", "adventure");
    if (data && data.length > 0) {
      const avg = data.reduce((acc, curr) => acc + curr.rating, 0) / data.length;
      setLiveRating({ avg: parseFloat(avg.toFixed(1)), count: data.length });
    }
  };

  const { submitBooking } = useBookingSubmit();

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!adventure) return;
    setIsProcessing(true);
    try {
      await submitBooking({
        itemId: adventure.id, itemName: adventure.name, bookingType: 'adventure', 
        totalAmount: adventure.price || 0, slotsBooked: data.num_adults, 
        visitDate: data.visit_date, guestName: data.guest_name, guestEmail: data.guest_email, 
        guestPhone: data.guest_phone, hostId: adventure.created_by, 
        bookingDetails: { ...data, adventure_name: adventure.name }
      });
      setIsCompleted(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setIsProcessing(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-orange-600 mb-4" />
      <p className="text-sm font-black uppercase tracking-tighter animate-pulse text-orange-600">Loading Adventure...</p>
    </div>
  );

  if (!adventure) return null;

  const allImages = [adventure.image_url, ...(adventure.gallery_images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* 1. DYNAMIC STICKY ACTION BAR */}
      <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-4 py-3 flex justify-between items-center ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100" : "bg-transparent"}`}>
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate(-1)} className={`rounded-full transition-all duration-300 w-10 h-10 p-0 border-none ${scrolled ? "bg-slate-100 text-slate-900 shadow-sm" : "bg-black/30 text-white backdrop-blur-md"}`}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {scrolled && (
            <h2 className="text-sm font-black uppercase tracking-tighter text-slate-900 truncate max-w-[180px] animate-in fade-in slide-in-from-left-2">{adventure.name}</h2>
          )}
        </div>
        <Button onClick={() => id && handleSaveItem(id, "adventure")} className={`rounded-full transition-all duration-300 w-10 h-10 p-0 border-none shadow-lg ${isSaved ? "bg-red-500" : scrolled ? "bg-slate-100 text-slate-900" : "bg-black/30 text-white backdrop-blur-md"}`}>
          <Heart className={`h-5 w-5 ${isSaved ? "fill-white text-white" : scrolled ? "text-slate-900" : "text-white"}`} />
        </Button>
      </div>

      <main className="container px-4 max-w-6xl mx-auto pt-0 relative z-50">
        
        {/* HERO SECTION - Hotel Style Styling */}
        <div className="relative w-full h-[45vh] md:h-[65vh] bg-slate-900 overflow-hidden rounded-b-[32px] mb-8 shadow-xl">
          <Carousel plugins={[Autoplay({ delay: 3500 })]} className="w-full h-full">
            <CarouselContent className="h-full ml-0">
              {allImages.length > 0 ? allImages.map((img, idx) => (
                <CarouselItem key={idx} className="h-full pl-0 basis-full">
                  <div className="relative h-full w-full">
                    <img src={img} alt={adventure.name} className="w-full h-full object-cover object-center" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent z-10" />
                  </div>
                </CarouselItem>
              )) : (
                <div className="h-full w-full bg-slate-200 flex items-center justify-center text-slate-400 font-black uppercase text-xs">Awaiting Gallery</div>
              )}
            </CarouselContent>
          </Carousel>

          <div className="absolute bottom-6 left-0 w-full px-6 z-20 pointer-events-none">
            <div className="bg-gradient-to-r from-black/70 via-black/50 to-transparent rounded-2xl p-4 max-w-xl pointer-events-auto">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className="bg-amber-400 text-black border-none px-2 py-0.5 text-[9px] font-black uppercase rounded-full flex items-center gap-1 shadow-lg">
                  <Star className="h-3 w-3 fill-current" />
                  {liveRating.avg > 0 ? liveRating.avg : "New"}
                </Badge>
                <Badge className="bg-orange-600 text-white border-none px-2 py-0.5 text-[9px] font-black uppercase rounded-full flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Experience
                </Badge>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2 drop-shadow-2xl">{adventure.name}</h1>
              <div className="flex items-center gap-1 text-white/90">
                <MapPin className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-xs font-bold uppercase truncate">{adventure.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.8fr,1fr] gap-6">
          <div className="space-y-6">
            {/* Bento Description */}
            <section className="bg-white rounded-[28px] p-7 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-orange-500" />
                <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Description</h2>
              </div>
              {adventure.description ? (
                <p className="text-slate-500 text-sm leading-relaxed">{adventure.description}</p>
              ) : (
                <div className="flex items-center gap-2 text-slate-300 italic py-4"><AlertCircle className="h-4 w-4" /> Description coming soon</div>
              )}
            </section>

            {/* Mobile Booking Card */}
            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 lg:hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Standard Rate</p>
                  <span className="text-4xl font-black text-orange-600">KSh {Number(adventure.price || 0).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-500 font-black text-lg">
                    <Star className="h-4 w-4 fill-current" />
                    <span>{liveRating.avg || "0"}</span>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">{liveRating.count} reviews</p>
                </div>
              </div>
              <Button onClick={() => setBookingOpen(true)} className="w-full mt-6 py-8 rounded-2xl text-md font-black uppercase tracking-widest bg-gradient-to-r from-orange-500 to-red-600 border-none shadow-lg text-white">Book Now</Button>
            </div>

            {/* Features/Highlights Card */}
            <section className="bg-white rounded-[28px] p-7 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-red-600" />
                <h2 className="text-sm font-black uppercase tracking-widest text-red-600">Highlights</h2>
              </div>
              {adventure.inclusions?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {adventure.inclusions.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-red-50/50 rounded-xl border border-red-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-[10px] font-black uppercase text-red-700 truncate">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-300 italic py-2"><AlertCircle className="h-4 w-4" /> Highlights coming soon</div>
              )}
            </section>
          </div>

          {/* Desktop Sidebar (Matching Hotel Style) */}
          <div className="hidden lg:block h-fit sticky top-24">
            <div className="bg-white rounded-[40px] p-8 shadow-2xl border border-slate-100 space-y-6">
                <div className="text-center">
                  <p className="text-xs font-black uppercase text-slate-400 mb-1">Price per slot</p>
                  <h3 className="text-5xl font-black text-orange-600 mb-2">KSh {Number(adventure.price || 0).toLocaleString()}</h3>
                  <div className="flex items-center justify-center gap-1.5 text-amber-500 font-black">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-lg">{liveRating.avg || "0"}</span>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase">
                    <div className="flex items-center gap-2 text-slate-400"><Clock className="h-4 w-4 text-orange-500" /> Duration</div>
                    <span className="text-slate-900">{adventure.duration || "Contact Provider"}</span>
                  </div>
                </div>

                <Button onClick={() => setBookingOpen(true)} className="w-full py-8 rounded-3xl text-lg font-black uppercase tracking-widest bg-gradient-to-r from-orange-500 to-red-600 border-none shadow-xl text-white hover:scale-[1.02] transition-transform">Reserve Now</Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <UtilityButton icon={<Navigation className="h-5 w-5" />} label="Map" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${adventure.name}, ${adventure.location}`)}`, "_blank")} />
                  <UtilityButton icon={<Share2 className="h-5 w-5" />} label="Share" onClick={() => navigator.share && navigator.share({title: adventure.name, url: window.location.href})} />
                </div>
            </div>
          </div>
        </div>

        {/* Review Section (Bento card style) */}
        <div className="mt-12 bg-white rounded-[28px] p-7 shadow-sm border border-slate-100">
          <ReviewSection itemId={adventure.id} itemType="adventure" />
        </div>
        
        {/* Similar items */}
        <div className="mt-16">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 text-slate-800">Explore Similar Adventures</h2>
          <SimilarItems currentItemId={adventure.id} itemType="adventure" country={adventure.country} />
        </div>
      </main>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[95vh] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
          <MultiStepBooking 
            onSubmit={handleBookingSubmit} itemName={adventure.name} itemId={adventure.id} bookingType="adventure"
            priceAdult={adventure.price} isProcessing={isProcessing} isCompleted={isCompleted} 
            onPaymentSuccess={() => setIsCompleted(true)} primaryColor="#f97316" accentColor="#ef4444"
          />
        </DialogContent>
      </Dialog>
      <MobileBottomBar />
    </div>
  );
};

// Utility button matching the hotel style
const UtilityButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <Button variant="ghost" onClick={onClick} className="flex-col h-auto py-4 bg-slate-50 text-slate-500 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors flex-1">
    <div className="mb-1">{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </Button>
);

export default AdventurePlaceDetail; 