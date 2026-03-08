import { useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Header } from "@/components/Header";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { createContext, useContext, useState, useCallback } from "react";

interface SearchFocusContextType {
  isSearchFocused: boolean;
  setSearchFocused: (v: boolean) => void;
}

const SearchFocusContext = createContext<SearchFocusContextType>({
  isSearchFocused: false,
  setSearchFocused: () => {},
});

export const useSearchFocus = () => useContext(SearchFocusContext);

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout = ({ children }: PageLayoutProps) => {
  const location = useLocation();
  const pathname = location.pathname;
  const [isSearchFocused, setSearchFocused] = useState(false);

  const shouldShowFooter =
    pathname === "/" || pathname === "/contact" || pathname === "/about" || pathname.startsWith("/category/");

  const shouldHideMobileBar =
    pathname === "/host-verification" || pathname.startsWith("/booking/");

  // Auth page renders its own header
  const shouldHideHeader =
    pathname === "/auth" || pathname === "/reset-password" || pathname === "/forgot-password" ||
    pathname === "/verify-email" || pathname === "/complete-profile" || pathname.startsWith("/booking/");

  const shouldHideHeaderOnMobile =
    pathname.startsWith("/hotel/") ||
    pathname.startsWith("/adventure/") ||
    pathname.startsWith("/attraction/") ||
    pathname.startsWith("/trip/") ||
    pathname.startsWith("/event/");

  // Hide header completely when search is focused
  const hideHeaderForSearch = isSearchFocused;

  return (
    <SearchFocusContext.Provider value={{ isSearchFocused, setSearchFocused }}>
      <div className="w-full min-h-screen flex flex-col">
        <OfflineIndicator />
        {!shouldHideHeader && !hideHeaderForSearch && (
          <div className={shouldHideHeaderOnMobile ? "hidden md:block" : ""}>
            <Header __fromLayout />
          </div>
        )}
        {/* pt-14 ensures body content starts below the fixed header */}
        {/* On mobile detail pages where header is hidden, remove top padding to avoid empty space */}
        <div className={`flex-1 w-full pb-20 md:pb-0 ${!shouldHideHeader && !hideHeaderForSearch ? (shouldHideHeaderOnMobile ? 'pt-0 md:pt-14' : 'pt-14') : ''}`}>{children}</div>
        {shouldShowFooter && <Footer />}
        {!shouldHideMobileBar && <MobileBottomBar />}
      </div>
    </SearchFocusContext.Provider>
  );
};
