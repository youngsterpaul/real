import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, CalendarCheck2, AlertCircle } from "lucide-react";

interface ExternalBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
}

export const ExternalBookingDialog = ({
  open,
  onOpenChange,
  url,
  title = "Reserve Your Spot",
}: ExternalBookingDialogProps) => {
  const [isBlocked, setIsBlocked] = useState(false);

  const openSecurePopup = () => {
    // 1. Define popup dimensions
    const width = 500;
    const height = 750;

    // 2. Calculate center position relative to the current screen
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    // 3. Window features (hides toolbars to look like a "dialog")
    const features = `
      width=${width},
      height=${height},
      top=${top},
      left=${left},
      menubar=no,
      toolbar=no,
      location=no,
      status=no,
      resizable=yes,
      scrollbars=yes
    `;

    // 4. Attempt to open
    const newWindow = window.open(url, "BookingPopup", features);

    // 5. Check if browser blocked the popup
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
      setIsBlocked(true);
    } else {
      setIsBlocked(false);
      onOpenChange(false); // Close the dialog if the window opened successfully
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-8 rounded-3xl border-none shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-5 rounded-full ring-8 ring-primary/5">
            <CalendarCheck2 className="h-10 w-10 text-primary" />
          </div>
        </div>

        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-black text-center uppercase tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-balance text-muted-foreground">
            We are opening a secure connection to the booking provider. 
            This ensures your payment data stays encrypted and private.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-8 space-y-4">
          <Button
            size="lg"
            onClick={openSecurePopup}
            className="w-full font-bold h-14 text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Go to Checkout <ExternalLink className="ml-2 h-5 w-5" />
          </Button>

          {isBlocked && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4" />
              <span>Pop-up blocked! Please allow pop-ups for this site.</span>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground font-semibold hover:bg-transparent hover:text-foreground"
          >
            Cancel
          </Button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 opacity-50">
          <div className="h-px w-8 bg-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            Secure Portal
          </span>
          <div className="h-px w-8 bg-muted-foreground" />
        </div>
      </DialogContent>
    </Dialog>
  );
};