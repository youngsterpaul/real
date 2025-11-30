import { Home, Ticket, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export const MobileBottomBar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Ticket, label: "Bookings", path: "/bookings" },
    { icon: Heart, label: "Wishlist", path: "/saved" },
    { icon: User, label: "Account", path: user ? "/account" : "/auth" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 **bg-white** border-t border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
      <nav className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          // Define the teal color using arbitrary value notation: text-[#008080]
          const tealColor = "#008080";

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all duration-200",
                isActive
                  ? `text-[${tealColor}]` // Active: Teal color
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" // Default/Hover: Light/Dark Gray
              )}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5", 
                  isActive && "scale-110",
                  // Apply teal only to the icon when active
                  isActive ? `text-[${tealColor}]` : "text-gray-500 dark:text-gray-400"
                )} 
              />
              <span 
                className={cn(
                  "text-xs font-medium",
                  // Apply teal to the label when active
                  isActive ? `text-[${tealColor}]` : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};