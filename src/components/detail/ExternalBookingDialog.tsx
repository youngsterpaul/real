import { useCallback } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExternalBookingButtonProps {
  url: string;
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ExternalBookingButton = ({ url, title = "Reserve Now", className, children }: ExternalBookingButtonProps) => {

  const handleClick = useCallback(() => {
    // Open instantly - no delay to avoid white blank page
    window.open(url, "_blank", "noopener,noreferrer");
  }, [url]);

  return (
    <Button
      onClick={handleClick}
      className={className}
    >
      {children || (
        <>
          <ExternalLink className="h-4 w-4 mr-2" />
          {title}
        </>
      )}
    </Button>
  );
};

// Keep backward compatibility - but now it's just a loading button that opens a new tab
export const ExternalBookingDialog = ExternalBookingButton;
