import { useState, useEffect } from "react";
import { Menu, Heart, Ticket, Shield, Home, FolderOpen, User, Search, Bell } from "lucide-react";
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
import { Link, useNavigate, useLocation } from "react-router-dom"; // <-- Added useLocation
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell"; // <-- Component needs update to accept props

interface HeaderProps {
  onSearchClick?: () => void;
  showSearchIcon?: boolean;
}

export const Header = ({ onSearchClick, showSearchIcon = true }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook to get current path
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // 1. State for scroll position
  const [scrollPosition, setScrollPosition] = useState(0);

  // 2. Check if current page is the index page ('/')
  const isIndexPage = location.pathname === "/";
  
  // 3. Define the scroll handler
  const handleScroll = () => {
    setScrollPosition(window.pageYOffset);
  };
  
  // 4. Attach and cleanup scroll listener
  useEffect(() => {
    if (isIndexPage) {
      // Only listen for scroll on the index page
      window.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      // Ensure non-index pages always show the solid background
      setScrollPosition(1); 
    }
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isIndexPage]);

  // Determine header background color
  const isScrolled = scrollPosition > 50; // Scroll threshold
  
  // **Header Background Logic**
  // On Index Page & Not Scrolled -> bg-transparent
  // Otherwise (Scrolled or Not Index Page) -> bg-[#008080] (Teal)
  const headerBgClass = isIndexPage && !isScrolled && window.innerWidth < 768
    ? "bg-transparent border-b-transparent" // Transparent on mobile index page at top
    : "bg-[#008080] border-b-border dark:bg-[#008080]"; // Teal when scrolled or on other pages

  // **Icon Button Background Logic (Mobile Only)**
  // On Index Page & Not Scrolled -> rgba darker color (bg-black/30)
  // Otherwise -> Standard semi-transparent white (bg-white/10)
  const iconBgClass = isIndexPage && !isScrolled && window.innerWidth < 768
    ? "bg-black/30 hover:bg-black/40" // rgba darker color for visibility on transparent header
    : "bg-white/10 hover:bg-white/20"; // Standard background

  /* --- User Data Fetching (Kept for completeness) --- */
  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setUserRole(null);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (data && data.length > 0) {
        const roles = data.map(r => r.role);
        if (roles.includes("admin")) setUserRole("admin");
        else setUserRole("user");
      }
    };

    checkRole();
  }, [user]);

  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.name) {
          setUserName(profile.name);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const getUserInitials = () => {
    if (userName) {
      const names = userName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return userName.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const [showMobileAccountDialog, setShowMobileAccountDialog] = useState(false);

  const handleMobileAccountTap = () => {
    if (!user) {
      window.location.href = "/auth";
    } else {
      setShowMobileAccountDialog(!showMobileAccountDialog);
    }
  };
  /* ------------------------------------------------ */

  return (
    // Applied dynamic header background class and transition
    <header className={`sticky top-0 z-50 w-full text-white h-16 transition-colors duration-300 ${headerBgClass}`}>
      <div className="container flex h-full items-center justify-between px-4">
        
        {/* Logo and Drawer Trigger (Left Side) */}
        <div className="flex items-center gap-3">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              {/* Menu Icon: Apply conditional background */}
              <button 
                className={`inline-flex items-center justify-center h-10 w-10 rounded-md text-white transition-colors lg:bg-white/10 lg:hover:bg-[#006666] ${iconBgClass}`} 
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 h-screen">
              <NavigationDrawer onClose={() => setIsDrawerOpen(false)} />
            </SheetContent>
          </Sheet>
          
          {/* Logo and Name/Description: HIDDEN on small screens (md:flex) */}
          <Link to="/" className="hidden md:flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-[#0066cc] font-bold text-lg">
              T
            </div>
            <div>
              <span className="font-bold text-base md:text-lg text-white block">
                TripTrac
              </span>
              <p className="text-xs text-white/90 block">Your journey starts now.</p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation (Centered) */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold hover:text-muted-foreground transition-colors">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link to="/bookings" className="flex items-center gap-2 font-bold hover:text-muted-foreground transition-colors">
            <Ticket className="h-4 w-4" />
            <span>My Bookings</span>
          </Link>
          <Link to="/saved" className="flex items-center gap-2 font-bold hover:text-muted-foreground transition-colors">
            <Heart className="h-4 w-4" />
            <span>Wishlist</span>
          </Link>
          <button 
            onClick={() => user ? navigate('/become-host') : navigate('/auth')} 
            className="flex items-center gap-2 font-bold hover:text-muted-foreground transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Become a Host</span>
          </button>
        </nav>

        {/* Account Controls (Right Side) */}
        <div className="flex items-center gap-2">
          
          {/* Search Icon Button: Apply conditional background */}
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
              // Applies iconBgClass (transparent/darker on mobile index top)
              className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors group lg:bg-white/10 lg:hover:bg-white ${iconBgClass}`}
              aria-label="Search"
            >
              {/* Icon color logic remains for hover */}
              <Search className="h-5 w-5 text-white group-hover:text-[#008080]" />
            </button>
          )}
          
          {/* Mobile: Notification Bell: Pass the conditional background class */}
          <div className="flex items-center gap-2"> 
            <NotificationBell buttonClassName={iconBgClass} />
          </div>

          {/* Desktop Auth Actions (Right Side) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Desktop Notification Bell (using standard background) */}
            <NotificationBell buttonClassName="bg-white/10 hover:bg-white/20" /> 
            
            <ThemeToggle />
            
            {/* Account Button */}
            <button 
              onClick={() => user ? navigate('/account') : navigate('/auth')}
              className="rounded-full h-10 w-10 flex items-center justify-center transition-colors 
                                   bg-white/10 hover:bg-white group" 
              aria-label="Account"
            >
              <User className="h-5 w-5 text-white group-hover:text-[#008080]" /> 
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};1