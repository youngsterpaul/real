import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewSectionProps {
  itemId: string;
  itemType: "trip" | "event" | "hotel" | "adventure_place" | "attraction";
}

export function ReviewSection({ itemId, itemType }: ReviewSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    fetchRatings();
  }, [itemId, itemType]);

  const fetchRatings = async () => {
    try {
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("rating, user_id")
        .eq("item_id", itemId)
        .eq("item_type", itemType);

      if (error) throw error;
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        setAverageRating(avg);
        setTotalReviews(reviews.length);

        if (user) {
          const userReview = reviews.find((r) => r.user_id === user.id);
          if (userReview) {
            setUserRating(userReview.rating);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to rate this item",
        variant: "destructive",
      });
      return;
    }
    try {
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .eq("item_type", itemType)
        .single();

      if (existingReview) {
        const { error } = await supabase
          .from("reviews")
          .update({ rating })
          .eq("id", existingReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reviews").insert({
          user_id: user.id,
          item_id: itemId,
          item_type: itemType,
          rating,
        });
        if (error) throw error;
      }
      setUserRating(rating);
      fetchRatings();
      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden border-none bg-background shadow-lg rounded-xl">
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* LEFT SIDE: Database Summary Statistics */}
          <div className="flex flex-col items-center md:items-start p-6 bg-secondary/30 rounded-2xl border border-secondary">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Average Rating
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-foreground">
                {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
              </span>
              <span className="text-xl text-muted-foreground font-semibold">/ 5</span>
            </div>
            
            <div className="flex items-center gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* RIGHT SIDE: User Rating Input Section */}
          <div className="flex flex-col justify-center space-y-4 px-2">
            <div>
              <h3 className="text-lg font-semibold">
                {userRating > 0 ? "Your Rating" : "Rate your experience"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Help others find this by rating your experience {itemType.replace("_", " ")}
              </p>
            </div>

            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-all duration-200 hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`h-10 w-10 cursor-pointer transition-colors ${
                          star <= (hoveredStar || userRating)
                            ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                            : "text-muted border-muted"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {userRating > 0 && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide">
                    You rated this {userRating} {userRating === 1 ? "star" : "stars"}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-4 text-center border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Please <span className="font-semibold text-primary underline cursor-pointer">log in</span> to provide a rating.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}