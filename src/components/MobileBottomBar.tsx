import { Home, Ticket, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const MobileBottomBar = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Ticket, label: "Bookings", path: "/bookings" },
    { icon: Heart, label: "Saved", path: "/saved" },
  ];

  return (
    // 1. Changed background to orange-500 and removed background blur classes
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-orange-500 border-t border-orange-400">
      <nav className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all duration-200",
                // 2. Updated active and inactive link colors
                isActive
                  ? "text-white" // Active color is white
                  : "text-orange-200 hover:text-white" // Inactive is light orange, turns white on hover
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
