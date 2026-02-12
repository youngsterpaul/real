import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";

interface FacilityAmenitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityName: string;
  amenities: string[];
}

export const FacilityAmenitiesDialog = ({ open, onOpenChange, facilityName, amenities }: FacilityAmenitiesDialogProps) => {
  if (!amenities || amenities.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-tight text-sm">
            {facilityName} — Amenities
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 pt-2">
          {amenities.map((amenity, idx) => (
            <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm font-medium">{amenity}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};