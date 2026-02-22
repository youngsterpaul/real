import { useState, lazy, Suspense } from "react";
import { Home, Ticket, Heart, User, ChevronLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AccountSheet } from "@/components/AccountSheet";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TealLoader } from "@/components/ui/teal-loader";

const Bookings = lazy(() => import("@/pages/Bookings"));
const Saved = lazy(() => import("@/pages/Saved"));

const COLORS = {
  TEAL: "#008080",
  SOFT_GRAY: "#F8F9FA",
  CORAL: "#FF7F50",
};

export const MobileBottomBar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    if (path === "/bookings") {
      e.preventDefault();
      setBookingsOpen(true);
      setSavedOpen(false);
    } else if (path === "/saved") {
      e.preventDefault();
      setSavedOpen(true);
      setBookingsOpen(false);
    }
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Ticket, label: "Bookings", path: "/bookings" },
    { icon: Heart, label: "Saved", path: "/saved" },
  ];

  return (
    <>
      {/* Bottom Navigation Bar — z-[110] stays above sheets at z-[100] */}
      <div className="fixed bottom-0 left-0 right-0 z-[110] flex items-center justify-around bg-white border-t border-gray-200 shadow-md px-2 pt-2 pb-4">
        {navItems.map((item) => {
          const isSheetPath =
            item.path === "/bookings" || item.path === "/saved";

          const isActive =
            (location.pathname === item.path && !bookingsOpen && !savedOpen) ||
            (item.path === "/bookings" && bookingsOpen) ||
            (item.path === "/saved" && savedOpen);

          const iconColor = isActive ? COLORS.TEAL : "#9CA3AF";

          const NavContent = (
            <>
              <item.icon
                size={22}
                style={{ color: iconColor }}
                className="transition-colors duration-200"
              />
              <span
                className="mt-0.5 text-[10px] font-medium transition-colors duration-200"
                style={{ color: iconColor }}
              >
                {item.label}
              </span>
            </>
          );

          if (isSheetPath) {
            return (
              <button
                key={item.path}
                onClick={(e) => handleNavClick(item.path, e)}
                className="flex flex-col items-center justify-center px-4 py-1 group"
              >
                {NavContent}
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                setBookingsOpen(false);
                setSavedOpen(false);
              }}
              className="flex flex-col items-center justify-center px-4 py-1 group"
            >
              {NavContent}
            </Link>
          );
        })}

        {/* Profile Button */}
        {user ? (
          <button
            onClick={() => setAccountOpen(true)}
            className="flex flex-col items-center justify-center px-4 py-1 group"
          >
            <User
              size={22}
              style={{ color: accountOpen ? COLORS.TEAL : "#9CA3AF" }}
              className="transition-colors duration-200"
            />
            <span
              className="mt-0.5 text-[10px] font-medium transition-colors duration-200"
              style={{ color: accountOpen ? COLORS.TEAL : "#9CA3AF" }}
            >
              Profile
            </span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex flex-col items-center justify-center px-4 py-1 group"
          >
            <User size={22} className="text-gray-400" />
            <span className="mt-0.5 text-[10px] font-medium text-gray-400">
              Profile
            </span>
          </Link>
        )}
      </div>

      {/* Account Sheet */}
      {user && (
        <AccountSheet open={accountOpen} onOpenChange={setAccountOpen} />
      )}

      {/* ── Bookings Full-Page Sheet ── */}
      <Sheet open={bookingsOpen} onOpenChange={setBookingsOpen}>
        <SheetContent
          side="bottom"
          className="h-[100dvh] w-full p-0 z-[100] flex flex-col rounded-none"
          style={{ maxHeight: "100dvh" }}
        >
          {/* Sticky Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
            <button
              onClick={() => setBookingsOpen(false)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close bookings"
            >
              <ChevronLeft size={22} />
            </button>
            <h2 className="text-lg font-semibold">My Bookings</h2>
          </div>

          {/* Scrollable Content — pb-24 clears the bottom nav bar */}
          <div className="flex-1 overflow-y-auto pb-24">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full py-20">
                  <TealLoader />
                </div>
              }
            >
              <Bookings />
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Saved Full-Page Sheet ── */}
      <Sheet open={savedOpen} onOpenChange={setSavedOpen}>
        <SheetContent
          side="bottom"
          className="h-[100dvh] w-full p-0 z-[100] flex flex-col rounded-none"
          style={{ maxHeight: "100dvh" }}
        >
          {/* Sticky Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
            <button
              onClick={() => setSavedOpen(false)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close saved"
            >
              <ChevronLeft size={22} />
            </button>
            <h2 className="text-lg font-semibold">Saved Items</h2>
          </div>

          {/* Scrollable Content — pb-24 clears the bottom nav bar */}
          <div className="flex-1 overflow-y-auto pb-24">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full py-20">
                  <TealLoader />
                </div>
              }
            >
              <Saved />
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};