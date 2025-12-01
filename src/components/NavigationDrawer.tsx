import { Home, Ticket, Heart, Phone, Info, Video, Plus, Edit, Package, LogIn, LogOut, Sun, Moon, User, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NavigationDrawerProps {
  onClose: () => void;
}

const MobileThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <li className="pt-2 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={toggleTheme}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-black dark:text-white group-hover:text-yellow-600 transition-colors" />
        ) : (
          <Moon className="h-5 w-5 text-black dark:text-white group-hover:text-blue-600 transition-colors" />
        )}
        <span className="font-medium text-black dark:text-white">
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </span>
      </button>
    </li>
  );
};

export const NavigationDrawer = ({ onClose }: NavigationDrawerProps) => {
  const { user, signOut } = useAuth();
  const [userName, setUserName] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      // Fetch only user profile name (not email)
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (profile && profile.name) {
        setUserName(profile.name);
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Removed handleInstallClick logic as it's not used in the final button
  // Re-instating it to handle the PWA install prompt logic
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const handleProtectedNavigation = async (path: string) => {
    if (!user) {
      window.location.href = "/auth";
      onClose();
      return;
    }

    // Direct navigation for protected routes other than the removed Host Verification
    window.location.href = path;
    onClose();
  };


  const bottomNavItems = [
    { icon: Video, label: "Vlog", path: "/vlog", protected: false },
    { icon: Phone, label: "Contact", path: "/contact", protected: false },
    { icon: Info, label: "About", path: "/about", protected: false },
  ];

  const appNavItems = [
    { icon: Download, label: "Install App", path: "/install", protected: false, onClick: handleInstallClick },
  ];

  const topContentItems = [
    { icon: Home, label: "Home", path: "/", protected: false },
    { icon: Ticket, label: "My Bookings", path: "/bookings", protected: true },
    { icon: Heart, label: "Wishlist", path: "/saved", protected: true },
    // Removed Host Verification item
  ];


  const handleLogout = () => {
    signOut();
    onClose();
  };

  // Reworked Auth Display to be a list item
  const AuthDisplay = user ? (
    <li className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
      <p className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Account</p>
      {/* Removed Admin Dashboard Link */}
      <Link
        to="/profile"
        onClick={onClose}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group mb-2"
      >
        <User className="h-5 w-5 text-black dark:text-white" />
        <span className="font-medium truncate text-black dark:text-white">
          {userName || "My Profile"}
        </span>
      </Link>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 group"
      >
        <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
        <span className="font-medium text-red-600 dark:text-red-400">Logout</span>
      </button>
    </li>
  ) : (
    <li className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
      <Link
        to="/auth"
        onClick={onClose}
        // Updated to a blue login button (bg-blue-600, hover:bg-blue-700)
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-800 text-white hover:bg-blue-700 dark:hover:bg-blue-700 transition-all duration-200 group"
      >
        <LogIn className="h-5 w-5 text-white" />
        <span className="font-medium text-white">Login / Register</span>
      </Link>
    </li>
  );


  return (
    <div className="flex flex-col h-full">
      {/* Header section with logo, name, and paragraph - Now Teal */}
      <div className="p-4 border-b bg-[#008080] text-white border-[#006666]">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-8 rounded-lg bg-[#006666] flex items-center justify-center font-bold text-lg text-white">
            T
          </div>
          <div>
            <span className="font-bold text-base block text-white">
              TripTrac
            </span>
            <p className="text-xs text-[#80c0c0]">Your journey starts now.</p>
          </div>
        </div>
      </div>

      {/* Navigation links section with white bg and dark mode support */}
      <nav
        className="flex-1 p-4 pt-6 overflow-y-auto bg-white dark:bg-gray-950
                  [&::-webkit-scrollbar]:hidden
                  [-ms-overflow-style:none]
                  [scrollbar-width:none]"
      >
        <ul className="space-y-2">

          {/* 1. HOME, MY BOOKINGS, WISHLIST (TOP SECTION) */}
          <li className="mb-4 pt-2">
            <p className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Navigation</p>
            <ul className="space-y-1">
              {topContentItems.map((item, index) => {
                return (
                  <li key={item.path}>
                    {/* Home is a link, others are buttons for protected navigation */}
                    {item.label === "Home" ? (
                      <Link
                        to={item.path}
                        onClick={onClose}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                      >
                        <item.icon className="h-5 w-5 text-black dark:text-white" />
                        <span className="font-medium text-black dark:text-white">
                          {item.label}
                        </span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleProtectedNavigation(item.path)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                      >
                        <item.icon className="h-5 w-5 text-black dark:text-white" />
                        <span className="font-medium text-black dark:text-white">
                          {item.label}
                        </span>
                      </button>
                    )}
                    {/* ADD DARK MODE TOGGLE */}
                    {item.label === "Wishlist" && (
                      <>
                        {/* Dark/Light Mode Toggle */}
                        <MobileThemeToggle />
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>

          {/* 2. VLOG, CONTACT, ABOUT (COMPANY SECTION) */}
          <li className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Company</p>
            <ul className="space-y-1">
              {bottomNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                  >
                    <item.icon className="h-5 w-5 text-black dark:text-white" />
                    <span className="font-medium text-black dark:text-white">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          {/* 3. INSTALL APP SECTION */}
          {!isInstalled && (
            <li className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">App</p>
              <ul className="space-y-1">
                {appNavItems.map((item) => (
                  <li key={item.path}>
                    <button
                      onClick={item.onClick}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                    >
                      <item.icon className="h-5 w-5 text-black dark:text-white" />
                      <span className="font-medium text-black dark:text-white">
                        {item.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          )}

          {/* LOGIN/LOGOUT ICON AND NAME (Moved to inside the UL) */}
          {AuthDisplay}

        </ul>
      </nav>

      {/* Install App Bottom Banner - Only shows if browser supports it */}
      {!isInstalled && deferredPrompt && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-[#008080] text-white hover:bg-[#006666] transition-all duration-200"
          >
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center font-bold text-lg text-[#008080]">
              T
            </div>
            <div className="flex-1 text-left">
              <span className="font-semibold block">Install TripTrac App</span>
              <span className="text-xs text-white/80">Quick access on your device</span>
            </div>
            <Download className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
   );
};