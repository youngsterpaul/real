import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, AlertCircle } from "lucide-react";

interface ExternalBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
}

export const ExternalBookingDialog = ({ open, onOpenChange, url, title = "Reserve" }: ExternalBookingDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset states when dialog opens/closes
  useEffect(() => {
    if (open) {
      setLoading(true);
      setHasError(false);

      // Timeout: If iframe hasn't loaded in 5s, the provider likely blocks embedding
      const timer = setTimeout(() => {
        if (loading) setHasError(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleOpenExternal = () => {
    window.open(url, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden rounded-2xl flex flex-col">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="font-black uppercase tracking-tight text-sm">
            {title}
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleOpenExternal}
            className="text-[10px] font-bold text-muted-foreground hover:text-primary gap-1"
          >
            <ExternalLink className="h-3 w-3" /> Open in New Tab
          </Button>
        </DialogHeader>

        <div className="flex-1 relative w-full bg-white">
          {/* Loading Spinner */}
          {loading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-xs text-muted-foreground animate-pulse">Connecting to booking system...</p>
            </div>
          )}

          {/* Error / Blocked State */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 z-20 p-6 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <h3 className="font-bold text-lg">Connection Restricted</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-6">
                For your security, this booking provider prefers to open in a dedicated window.
              </p>
              <Button onClick={handleOpenExternal} className="font-bold">
                Continue to Booking
              </Button>
            </div>
          )}

          <iframe
            src={url}
            className={`w-full h-full border-none transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setLoading(false)}
            // Added allow-modals and allow-storage-access
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};