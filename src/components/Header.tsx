import { useState, useEffect } from "react";
import { Menu, Heart, Ticket, Shield, Home, FolderOpen, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavigationDrawer } from "./NavigationDrawer";
// Import useLocation
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle"; 
import { NotificationBell } from "./NotificationBell"; 

// Setting the deeper RGBA background color as a constant for clarity
const MOBILE_ICON_BG = 'rgba(0, 0, 0, 0.5)'; // Deeper semi-transparent black

interface HeaderProps {
  onSearchClick?: () => void;
  showSearchIcon?: boolean;
}

export const Header = ({ onSearchClick, showSearchIcon = true }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isIndexPage = location.pathname === '/';

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  // --- Functional code (omitted for brevity) ---
  useEffect(() => {
    // ... role checking logic
  }, [user]);

  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    // ... user profile fetching logic
  }, [user]);

  const getUserInitials = () => {
    // ... initials logic
    return "U";
  };
  // --- End of functional code ---

  // Conditional classes for the main header element
  const mobileHeaderClasses = isIndexPage 
    ? "fixed top-0 left-0 right-0" 
    : "sticky top-0 left-0 right-0 border-b border-border bg-[#008080] dark:bg-[#008080] text-white dark:text-white";

  // *NEW*: Standard desktop/non-index icon styling.
  const STANDARD_ICON_CLASSES = "bg-white/10 hover:bg-white group";
  const STANDARD_ICON_INNER_CLASSES = "text-white group-hover:text-[#008080]";
  
  // Logic for index page (fixed, transparent background, RGBA buttons)
  // Non-index page (sticky, solid background, STANDARD_ICON_CLASSES buttons)

  return (
    <header className={`z-[100] text-black dark:text-white md:sticky md:h-16 md:text-white dark:md:text-white ${mobileHeaderClasses}`}>
      
      <div className={`container md:flex md:h-full md:items-center md:justify-between md:px-4 
                      ${!isIndexPage ? 'flex items-center justify-between h-16' : ''}`}>
        
        {/* 3. Mobile Left Icons (Menu) */}
        <div className={`flex items-center gap-3 
                        ${isIndexPage ? 'absolute top-4 left-4' : 'relative'} 
                        md:relative md:top-auto md:left-auto`}>
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <button 
                // *** CHANGE 1: APPLY STANDARD_ICON_CLASSES WHEN NOT ON INDEX PAGE ***
                className={`inline-flex items-center justify-center h-10 w-10 rounded-full transition-colors 
                            ${isIndexPage 
                                ? 'text-white hover:bg-white/20' // Index page: RGBA + simple hover
                                : STANDARD_ICON_CLASSES // Non-Index page (mobile & desktop): White/10 + detailed hover
                            }`}
                aria-label="Open navigation menu"
                // Apply mobile background style only on the fixed index page
                style={isIndexPage ? { backgroundColor: MOBILE_ICON_BG } : {}}
              >
                <Menu 
                    // *** CHANGE 2: Apply group hover to the Menu icon ***
                    className={`h-5 w-5 ${isIndexPage ? 'text-white' : STANDARD_ICON_INNER_CLASSES}`} 
                />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 h-screen">
              <NavigationDrawer onClose={() => setIsDrawerOpen(false)} />
            </SheetContent>
          </Sheet>
          
          {/* Logo/Description - Unchanged */}
          <Link to="/" className="hidden md:flex items-center gap-3">
            {/* ... logo code ... */}
          </Link>
        </div>

        {/* Desktop Navigation (Centered) - Unchanged */}
        <nav className="hidden lg:flex items-center gap-6">
          {/* ... navigation links ... */}
        </nav>

        {/* 4. Mobile Right Icons (Search, Notification, Theme Toggle, Account) */}
        <div className={`flex items-center gap-2 md:relative md:top-auto md:right-auto md:flex 
                        ${isIndexPage ? 'absolute top-4 right-4' : 'relative'}`}>
          
          {/* Search Icon Button - Unchanged */}
          {showSearchIcon && (
            <button 
              onClick={() => {
                if (onSearchClick) {
                  onSearchClick();
                } else {
                  navigate('/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors md:hover:bg-white/20 hover:bg-white/20`}
              aria-label="Search"
              style={isIndexPage ? { backgroundColor: MOBILE_ICON_BG } : {}}
            >
              <Search className={`h-5 w-5 text-white`} />
            </button>
          )}
          
          {/* Notification Bell */}
          <div className="flex items-center gap-2">
            <div 
                // *** CHANGE 3: APPLY STANDARD_ICON_CLASSES WHEN NOT ON INDEX PAGE ***
                className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors 
                            ${isIndexPage 
                                ? 'hover:bg-white/20' 
                                : STANDARD_ICON_CLASSES // Non-Index page (mobile & desktop): White/10 + detailed hover
                            }`}
                style={isIndexPage ? { backgroundColor: MOBILE_ICON_BG } : {}}
            >
              <NotificationBell 
                  mobileIconClasses="text-white"
                  // *** CHANGE 4: Use STANDARD_ICON_INNER_CLASSES for consistent icon color and hover ***
                  desktopIconClasses={STANDARD_ICON_INNER_CLASSES}
              />
            </div>
          </div>

          {/* Theme Toggle and Account */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Wrapper */}
            <div
                // *** CHANGE 5: ENSURE ThemeToggle uses STANDARD_ICON_CLASSES for consistent background ***
                className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors ${STANDARD_ICON_CLASSES}`}
            >
                {/* ThemeToggle itself handles the sun/moon icon and colors */}
                <ThemeToggle className={STANDARD_ICON_INNER_CLASSES} />
            </div>

            {/* Account Button (Used as the reference point) */}
            <button 
              onClick={() => user ? navigate('/account') : navigate('/auth')}
              className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors 
                          ${STANDARD_ICON_CLASSES}`} 
              aria-label="Account"
            >
              <User className={`h-5 w-5 ${STANDARD_ICON_INNER_CLASSES}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};