import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetailNavBarProps {
  scrolled: boolean;
  itemName: string;
  isSaved: boolean;
  onSave: () => void;
  onBack: () => void;
}

export const DetailNavBar = ({ scrolled, itemName, isSaved, onSave, onBack }: DetailNavBarProps) => {
  return (
    <div
      className="fixed top-0 left-0 right-0 w-full z-[100] flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border shadow-sm transition-all duration-300"
      style={{
        transform: scrolled ? "translateY(0)" : "translateY(-100%)",
        opacity: scrolled ? 1 : 0,
        pointerEvents: scrolled ? "auto" : "none",
      }}
    >
      <Button onClick={onBack} className="rounded-full w-9 h-9 p-0 border-none bg-muted text-foreground hover:bg-muted/80 shadow-none transition-all flex-shrink-0">
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm font-black uppercase tracking-tight text-foreground truncate mx-3 flex-1 text-center">
        {itemName}
      </span>

      <Button
        onClick={onSave}
        className={`rounded-full w-9 h-9 p-0 border-none shadow-none transition-all flex-shrink-0 ${
          isSaved ? "bg-red-500 hover:bg-red-600" : "bg-muted text-foreground hover:bg-muted/80"
        }`}
      >
        <Heart className={`h-4 w-4 ${isSaved ? "fill-white text-white" : ""}`} />
      </Button>
    </div>
  );
};
