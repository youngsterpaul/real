import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserId } from "@/lib/sessionManager";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, Bookmark, MapPin, ChevronRight, Loader2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useSavedItems } from "@/hooks/useSavedItems";
import { useAuth } from "@/contexts/AuthContext";

const ITEMS_PER_PAGE = 20;

const Saved = () => {
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const { savedItems } = useSavedItems();
  const { user, loading: authLoading } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();
  const hasFetched = useRef(false);

  useEffect(() => {
    const initializeData = async () => {
      if (authLoading) return;
      const uid = await getUserId();
      if (!uid) {
        setIsLoading(false);
        return;
      }
      setUserId(uid);
      fetchSavedItems(uid, 0);
    };
    initializeData();
  }, [authLoading]);

  useEffect(() => {
    if (userId && hasFetched.current) {
      fetchSavedItems(userId, 0);
    }
  }, [savedItems]);

  const fetchSavedItems = async (uid: string, fetchOffset: number) => {
    if (fetchOffset === 0) setIsLoading(true);
    else setLoadingMore(true);
    
    const { data: savedData } = await supabase
      .from("saved_items")
      .select("item_id, item_type")
      .eq("user_id", uid)
      .range(fetchOffset, fetchOffset + ITEMS_PER_PAGE - 1)
      .order('created_at', { ascending: false });

    if (!savedData || savedData.length === 0) {
      setHasMore(false);
      setIsLoading(false);
      setLoadingMore(false);
      return [];
    }

    const tripIds = savedData.filter(s => s.item_type === "trip" || s.item_type === "event").map(s => s.item_id);
    const hotelIds = savedData.filter(s => s.item_type === "hotel").map(s => s.item_id);
    const adventureIds = savedData.filter(s => s.item_type === "adventure_place").map(s => s.item_id);

    const [tripsRes, hotelsRes, adventuresRes] = await Promise.all([
      tripIds.length > 0 
        ? supabase.from("trips").select("id,name,location,country,image_url,is_hidden").in("id", tripIds)
        : Promise.resolve({ data: [] }),
      hotelIds.length > 0 
        ? supabase.from("hotels").select("id,name,location,country,image_url,is_hidden").in("id", hotelIds)
        : Promise.resolve({ data: [] }),
      adventureIds.length > 0 
        ? supabase.from("adventure_places").select("id,name,location,country,image_url,is_hidden").in("id", adventureIds)
        : Promise.resolve({ data: [] }),
    ]);

    const itemMap = new Map<string, any>();
    (tripsRes.data || []).forEach((item: any) => {
      if (item.is_hidden) return;
      itemMap.set(item.id, { ...item, type: "trip" });
    });
    (hotelsRes.data || []).forEach((item: any) => {
      if (item.is_hidden) return;
      itemMap.set(item.id, { ...item, type: "hotel" });
    });
    (adventuresRes.data || []).forEach((item: any) => {
      if (item.is_hidden) return;
      itemMap.set(item.id, { ...item, type: "adventure" });
    });

    const items = savedData
      .map(saved => itemMap.get(saved.item_id))
      .filter(Boolean);

    if (fetchOffset === 0) {
      setSavedListings(items);
      hasFetched.current = true;
    } else {
      setSavedListings(prev => [...prev, ...items]);
    }
    
    setOffset(fetchOffset + ITEMS_PER_PAGE);
    setHasMore(savedData.length >= ITEMS_PER_PAGE);
    setIsLoading(false);
    setLoadingMore(false);
    return items;
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const handleRemoveSelected = async () => {
    if (!userId || selectedItems.size === 0) return;
    const { error } = await supabase.from("saved_items").delete().in("item_id", Array.from(selectedItems)).eq("user_id", userId);
    if (!error) {
      setSavedListings(prev => prev.filter(item => !selectedItems.has(item.id)));
      setSelectedItems(new Set());
      setIsSelectionMode(false);
      toast({ title: "Updated", description: "Selected items removed." });
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-slate-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Saved places</h1>
            <p className="text-slate-500 text-sm">You have {savedListings.length} items in your collection.</p>
          </div>

          <div className="flex items-center gap-3">
            {savedListings.length > 0 && (
              <button 
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedItems(new Set());
                }}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {isSelectionMode ? "Cancel" : "Manage"}
              </button>
            )}
            {isSelectionMode && selectedItems.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="rounded-full px-4 h-9 text-xs font-bold"
                onClick={handleRemoveSelected}
              >
                Delete Selected ({selectedItems.size})
              </Button>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center border-b border-slate-50 pb-4">
                <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !user ? (
          <div className="text-center py-20">
            <div className="mb-6 flex justify-center text-slate-200">
                <Bookmark size={48} strokeWidth={1} />
            </div>
            <h2 className="text-xl font-medium mb-2">Sign in to save items</h2>
            <Link to="/auth">
              <Button className="mt-4 bg-slate-900 text-white hover:bg-slate-800 rounded-full px-8">
                Login / Register
              </Button>
            </Link>
          </div>
        ) : savedListings.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 mb-6">Your wishlist is looking a bit lonely.</p>
            <Link to="/">
              <Button variant="outline" className="rounded-full border-slate-200">
                Explore destinations
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {savedListings.map((item) => (
              <div
                key={item.id}
                className={`group flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-slate-50 border border-transparent ${
                  selectedItems.has(item.id) ? "bg-slate-50 border-slate-100" : ""
                }`}
              >
                {isSelectionMode && (
                  <div 
                    onClick={() => toggleItemSelection(item.id)}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center transition-colors ${
                      selectedItems.has(item.id) ? "bg-slate-900 border-slate-900" : "border-slate-200"
                    }`}
                  >
                    {selectedItems.has(item.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                )}

                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="h-full w-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {item.type}
                  </span>
                  <h3 className="font-semibold text-slate-900 truncate leading-tight mt-0.5">
                    {item.name}
                  </h3>
                  <div className="flex items-center text-slate-500 text-xs mt-1">
                    <MapPin className="h-3 w-3 mr-1 shrink-0" />
                    <span className="truncate">{item.location}, {item.country}</span>
                  </div>
                </div>

                {!isSelectionMode && (
                  <Link to={`/${item.type}s/${item.id}`} className="text-slate-300 hover:text-slate-900 transition-colors">
                    <ChevronRight size={20} />
                  </Link>
                )}
              </div>
            ))}

            {hasMore && (
              <div className="pt-10 flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => fetchSavedItems(userId!, offset)}
                  disabled={loadingMore}
                  className="text-slate-500 hover:text-slate-900 text-xs font-bold uppercase tracking-widest"
                >
                  {loadingMore ? <Loader2 className="animate-spin" /> : "Show More"}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Simplified Clear All logic - keeping it as a small link footer */}
      {savedListings.length > 0 && !isSelectionMode && (
        <div className="max-w-4xl mx-auto px-6 text-center">
          <button 
            onClick={() => setShowClearAllDialog(true)}
            className="text-[10px] text-slate-400 hover:text-red-500 uppercase tracking-widest font-bold"
          >
            Delete all saved items
          </button>
        </div>
      )}

      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent className="rounded-2xl border-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your entire saved collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearAll} 
              className="bg-red-500 hover:bg-red-600 rounded-full"
            >
              Delete everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default Saved;