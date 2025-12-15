import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { SearchBarWithSuggestions } from "@/components/SearchBarWithSuggestions";
import { ListingCard } from "@/components/ListingCard";

const MapView = lazy(() =>
  import("@/components/MapView").then((mod) => ({ default: mod.MapView }))
);

import {
  Calendar,
  Hotel,
  Tent,
  Compass,
  Grid,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/sessionManager";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { ListingSkeleton } from "@/components/ui/listing-skeleton";
import { useSavedItems } from "@/hooks/useSavedItems";
import {
  getCachedHomePageData,
  setCachedHomePageData
} from "@/hooks/useHomePageCache";

const Index = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [scrollableRows, setScrollableRows] = useState({
    trips: [],
    hotels: [],
    campsites: [],
    events: []
  });

  const [bookingStats, setBookingStats] = useState<Record<string, number>>({});
  const [loadingScrollable, setLoadingScrollable] = useState(true);

  const { savedItems, handleSave } = useSavedItems();
  const { position, requestLocation } = useGeolocation();

  const featuredForYouRef = useRef<HTMLDivElement>(null);
  const featuredTripsRef = useRef<HTMLDivElement>(null);
  const featuredHotelsRef = useRef<HTMLDivElement>(null);
  const featuredEventsRef = useRef<HTMLDivElement>(null);
  const featuredCampsitesRef = useRef<HTMLDivElement>(null);

  /* ---------------- LOCATION ---------------- */
  useEffect(() => {
    const handler = () => {
      requestLocation();
      window.removeEventListener("click", handler);
    };
    window.addEventListener("click", handler, { once: true });
    return () => window.removeEventListener("click", handler);
  }, [requestLocation]);

  /* ---------------- FETCH MAIN LISTINGS ---------------- */
  const fetchAllData = async () => {
    setLoading(true);

    const [hotels, places] = await Promise.all([
      supabase.from("hotels").select("*").eq("approval_status", "approved"),
      supabase
        .from("adventure_places")
        .select("*")
        .eq("approval_status", "approved")
    ]);

    const combined = [...(hotels.data || []), ...(places.data || [])];
    setListings(combined);
    setLoading(false);
  };

  /* ---------------- FETCH SCROLLABLE ROWS ---------------- */
  const fetchScrollableRows = async () => {
    setLoadingScrollable(true);

    const [trips, hotels, campsites, events] = await Promise.all([
      supabase
        .from("trips")
        .select("*")
        .eq("approval_status", "approved")
        .eq("type", "trip")
        .limit(10),

      supabase.from("hotels").select("*").eq("approval_status", "approved").limit(10),

      supabase
        .from("adventure_places")
        .select("*")
        .eq("approval_status", "approved")
        .limit(10),

      supabase
        .from("trips")
        .select("*")
        .eq("approval_status", "approved")
        .eq("type", "event")
        .limit(10)
    ]);

    setScrollableRows({
      trips: trips.data || [],
      hotels: hotels.data || [],
      campsites: campsites.data || [],
      events: events.data || []
    });

    setLoadingScrollable(false);
  };

  useEffect(() => {
    fetchAllData();
    fetchScrollableRows();
  }, []);

  /* ---------------- UI HELPERS ---------------- */
  const scroll = (ref: any, dir: "left" | "right") => {
    ref.current?.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth"
    });
  };

  /* ---------------- CATEGORIES ---------------- */
  const categories = [
    {
      icon: Calendar,
      title: "Trips & Tours",
      path: "/category/trips",
      image:
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828"
    },
    {
      icon: Compass,
      title: "Sports & Events",
      path: "/category/events",
      image:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30"
    },
    {
      icon: Hotel,
      title: "Hotels",
      path: "/category/hotels",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945"
    },
    {
      icon: Tent,
      title: "Campsites",
      path: "/category/campsite",
      image:
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      {/* HERO */}
      <div className="relative h-56 md:h-80 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1506929562872-bb421503ef21)"
        }}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold mb-4">
            Discover Your Next Adventure
          </h1>
          <SearchBarWithSuggestions
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={fetchAllData}
          />
        </div>
      </div>

      <main className="w-full px-4 md:px-6 py-6">

        {/* ✅ CATEGORIES */}
        <section className="mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 w-full">
            {categories.map((cat) => (
              <div
                key={cat.title}
                onClick={() => navigate(cat.path)}
                className="relative h-24 md:h-40 lg:h-48 rounded-lg overflow-hidden cursor-pointer"
                style={{
                  backgroundImage: `url(${cat.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                  <cat.icon className="text-white mb-2" />
                  <span className="text-white font-bold text-sm md:text-lg">
                    {cat.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= ROW SECTIONS ================= */}

        {[
          ["Events", scrollableRows.events, featuredEventsRef],
          ["Campsites & Experiences", scrollableRows.campsites, featuredCampsitesRef],
          ["Hotels", scrollableRows.hotels, featuredHotelsRef],
          ["Trips & Tours", scrollableRows.trips, featuredTripsRef]
        ].map(([title, items, ref]: any) => (
          <section key={title} className="mb-6">
            <h2 className="text-lg md:text-2xl font-bold mb-2">{title}</h2>

            <div className="relative w-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white"
                onClick={() => scroll(ref, "left")}
              >
                <ChevronLeft />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white"
                onClick={() => scroll(ref, "right")}
              >
                <ChevronRight />
              </Button>

              <div
                ref={ref}
                className="flex gap-3 overflow-x-auto w-full px-0 scrollbar-hide"
              >
                {loadingScrollable
                  ? [...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 w-[85vw] sm:w-[45vw] md:w-64"
                      >
                        <ListingSkeleton />
                      </div>
                    ))
                  : items.map((item: any) => {
                      const distance =
                        position && item.latitude && item.longitude
                          ? calculateDistance(
                              position.latitude,
                              position.longitude,
                              item.latitude,
                              item.longitude
                            )
                          : undefined;

                      return (
                        <div
                          key={item.id}
                          className="flex-shrink-0 w-[85vw] sm:w-[45vw] md:w-64"
                        >
                          <ListingCard
                            {...item}
                            isSaved={savedItems.has(item.id)}
                            onSave={() => handleSave(item.id, item.type)}
                            distance={distance}
                          />
                        </div>
                      );
                    })}
              </div>
            </div>
          </section>
        ))}
      </main>

      <MobileBottomBar />
    </div>
  );
};

export default Index;
