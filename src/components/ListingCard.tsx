import { Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  id: string;
  type: "TRIP" | "EVENT" | "HOTEL" | "ADVENTURE PLACE";
  name: string;
  imageUrl: string;
  location: string;
  country: string;
  price?: number;
  date?: string;
  onSave?: (id: string, type: string) => void;
  isSaved?: boolean;
}

export const ListingCard = ({
  id,
  type,
  name,
  imageUrl,
  location,
  country,
  price,
  date,
  onSave,
  isSaved = false,
}: ListingCardProps) => {
  const [saved, setSaved] = useState(isSaved);

  const handleSave = () => {
    setSaved(!saved);
    onSave?.(id, type.toLowerCase().replace(" ", "_"));
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-primary/90 text-primary-foreground backdrop-blur">
            {type}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          className={cn(
            "absolute top-3 right-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-all",
            saved && "bg-primary/20 hover:bg-primary/30"
          )}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-all",
              saved ? "fill-primary text-primary" : "text-muted-foreground"
            )}
          />
        </Button>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-1">{name}</h3>
        
        <div className="space-y-1 text-sm text-muted-foreground mb-3">
          <p className="line-clamp-1">{location}</p>
          <p className="font-medium text-foreground">{country}</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          {price !== undefined && (
            <p className="font-bold text-lg text-primary">${price}</p>
          )}
          {date && (
            <p className="text-sm text-muted-foreground">{new Date(date).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
