import { useState, useEffect } from "react";
import { 
  Home, Ticket, Heart, Phone, Info, LogIn, LogOut, User, 
  FileText, Shield, ChevronRight, Trophy, Map, Mountain, Bed, Building2, Globe 
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Capacitor } from '@capacitor/core';

interface NavigationDrawerProps {
  onClose: () => void;
}

const Separator = () => (
  <hr className="my-1 border-slate-100 dark:border-gray-800/50" />
);

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "de", name: "Deutsch" },
  { code: "zh", name: "中文" },
  { code: "ar", name: "العربية" },
  { code: "he", name: "עברית" },
];

export const NavigationDrawer = ({ onClose }: NavigationDrawerProps) => {
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const { currency, setCurrency, rate, loading: rateLoading } = useCurrency();
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [language, setLanguage] = useState(i18n.language || "en");
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("name, profile_picture_url").eq("id", user.id).single();
      if (profile) {
        setUserName(profile.name || "");
        setUserAvatar(profile.profile_picture_url || null);
      }
    };
    fetchUserData();
  }, [user]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    document.documentElement.dir = (lang === "ar" || lang === "he") ? "rtl" : "ltr";
  };

  const handleProtectedNavigation = (path: string) => {
    window.location.href = user ? path : "/auth";
    onClose();
  };

  const NavItem = ({ icon: Icon, label, path, isProtected = false }: any) => (
    <li>
      <button
        onClick={() => isProtected ? handleProtectedNavigation(path) : (window.location.href = path, onClose())}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-[#008080] transition-colors">
            <Icon className="h-4 w-4 text-slate-600 group-hover:text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 group-hover:text-slate-900">
            {label}
          </span>
        </div>
        <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-[#008080] transition-transform group-hover:translate-x-1" />
      </button>
      <Separator />
    </li>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Header */}
      <div className="p-6 bg-white border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div>
            <span 
              className="font-bold text-2xl tracking-tight leading-none block italic"
              style={{
                background: "linear-gradient(to right, #1a365d, #2b6cb0, #4fd1c5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.1))"
              }}
            >
              RealTravo
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto scrollbar-hide">
        {/* User Account Section */}
        <div className="mb-6">
          {user ? (
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 overflow-hidden">
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 truncate max-w-[140px]">
                      {userName || t('drawer.traveler')}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {t('nav.account')}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => { signOut(); onClose(); }}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/auth" onClick={onClose}
              className="flex items-center justify-center w-full py-3 rounded-xl border-2 border-[#008080] text-[#008080] hover:bg-[#008080] hover:text-white transition-all"
            >
              <LogIn className="h-4 w-4 mr-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">{t('nav.loginRegister')}</span>
            </Link>
          )}
        </div>

        <ul className="space-y-1">
          <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{t('drawer.mainMenu')}</p>
          <NavItem icon={Home} label={t('nav.home')} path="/" />
          <NavItem icon={Ticket} label={t('nav.myBookings')} path="/bookings" isProtected />
          <NavItem icon={Heart} label={t('nav.wishlist')} path="/saved" isProtected />
          
          <div className="h-4" />
          <p className="px-4 text-[9px] font-black text-[#008080] uppercase tracking-[0.2em] mb-2">{t('drawer.exploreCategories')}</p>
          <NavItem icon={Trophy} label={t('drawer.eventsAndSports')} path="/category/events" />
          <NavItem icon={Map} label={t('drawer.tripsAndTours')} path="/category/trips" />
          <NavItem icon={Mountain} label={t('drawer.adventurePlaces')} path="/category/campsite" />
          <NavItem icon={Building2} label={t('drawer.accommodationOnly')} path="/category/accommodation" />
          <NavItem icon={Bed} label={t('drawer.hotel')} path="/category/hotels" />

          <div className="h-4" />
          <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{t('drawer.supportLegal')}</p>
          <NavItem icon={Phone} label={t('drawer.contact')} path="/contact" />
          <NavItem icon={Info} label={t('drawer.about')} path="/about" />
          <NavItem icon={FileText} label={t('drawer.terms')} path="/terms-of-service" />
          <NavItem icon={Shield} label={t('drawer.privacy')} path="/privacy-policy" />
          
        </ul>

        {/* Currency & Language - shown in Capacitor (no footer) */}
        {isNative && (
          <div className="mt-4 space-y-4 px-4">
            <div className="h-px bg-slate-100" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('footer.currency', 'Currency')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrency("KES")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  currency === "KES"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                KSh (KES)
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  currency === "USD"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                $ (USD)
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground">
              {rateLoading ? "Fetching rate..." : `1 USD = ${rate.toFixed(2)} KES`}
            </p>

            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('footer.language', 'Language')}</p>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>
        )}
      </nav>
      
      {/* Footer & Transparency Note */}
      <div className="p-6 border-t border-slate-50 bg-slate-50/30">
        <p className="text-[10px] leading-relaxed text-slate-400 mb-4 text-center">
          <span className="font-black text-slate-500">{t('drawer.transparency')}</span> {t('drawer.transparencyText')} <span className="text-[#008080] font-bold">{t('drawer.transparencyHighlight')}</span>.
        </p>
        <div className="text-center">
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            RealTravo v1.0
          </span>
        </div>
      </div>
    </div>
  );
};