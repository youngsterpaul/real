import { useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";

interface ConditionalFooterProps {
  className?: string;
}

/**
 * Footer shown on all pages EXCEPT:
 * - Admin pages (/admin/*)
 * - Host/hosting tool pages (/host/*, /my-listing, /create-*, /edit-listing/*, /host-bookings*, /host-verification, /verification-status, /qr-scanner)
 * - Auth page (/auth, /reset-password, /forgot-password, /verify-email)
 * - Profile pages (/profile, /profile/edit, /complete-profile)
 * - Booking/payment flow pages (/booking/*, /payment*, /book/*)
 */
export const ConditionalFooter = ({ className }: ConditionalFooterProps) => {
  const location = useLocation();
  const pathname = location.pathname;

  const hiddenExactPaths = [
    "/auth",
    "/reset-password",
    "/forgot-password",
    "/verify-email",
    "/profile",
    "/complete-profile",
    "/my-listing",
    "/become-host",
    "/host-verification",
    "/verification-status",
    "/qr-scanner",
  ];

  const hiddenPrefixes = [
    "/admin",
    "/host/",
    "/host-bookings",
    "/create-",
    "/edit-listing/",
    "/profile/",
    "/booking/",
    "/payment",
    "/book/",
  ];

  const shouldHide =
    hiddenExactPaths.includes(pathname) ||
    hiddenPrefixes.some(prefix => pathname.startsWith(prefix));

  if (shouldHide) {
    return null;
  }

  return <Footer className={className} />;
};