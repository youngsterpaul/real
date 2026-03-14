import { useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Capacitor } from '@capacitor/core';

interface ConditionalFooterProps {
  className?: string;
}

/**
 * Footer hidden on Capacitor native apps entirely.
 * Also hidden on admin, auth, profile, booking/payment, and host pages.
 */
export const ConditionalFooter = ({ className }: ConditionalFooterProps) => {
  const location = useLocation();
  const pathname = location.pathname;

  // Hide footer entirely in Capacitor native apps
  if (Capacitor.isNativePlatform()) {
    return null;
  }

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