import { Link } from "react-router-dom";
import {
  Compass,
  Download,
  Mail,
  Youtube, // Retaining Youtube from lucide-react as it's a good generic icon
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

// --- START: Import real social media icons from react-icons ---
import { FaWhatsapp, FaFacebookF, FaInstagram, FaTiktok, FaXTwitter } from 'react-icons/fa6'; // Using Font Awesome 6 for modern icons
// --- END: Import real social media icons from react-icons ---

// --- START: Define Social Media Links (Customize these URLs) ---
const socialLinks = {
  whatsapp: "https://wa.me/YOUR_WHATSAPP_NUMBER", // Replace with your WhatsApp number
  facebook: "https://facebook.com/YOUR_PAGE",
  instagram: "https://instagram.com/YOUR_ACCOUNT",
  tiktok: "https://tiktok.com/@YOUR_ACCOUNT",
  x: "https://x.com/YOUR_ACCOUNT", // Formerly Twitter
  youtube: "https://youtube.com/YOUR_CHANNEL", // Replace with your YouTube channel
  email: "mailto:YOUR_EMAIL@example.com", // Replace with your email address
};
// --- END: Define Social Media Links ---

export const Footer = ({
  className = ""
}: {
  className?: string;
}) => {
  const [isInstalled, setIsInstalled] = useState(false);
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  // Detect if running in webview/in-app context
  const isInApp = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('inApp') === 'true' || urlParams.get('forceHideBadge') === 'true' || /webview|wv|inapp/i.test(navigator.userAgent);
  };

  // Don't render footer on small screens when in-app
  if (typeof window !== 'undefined' && window.innerWidth < 768 && isInApp()) {
    return null;
  }
  
  return (
    <footer className={`hidden md:block bg-white border-t mt-12 text-gray-900 ${className}`}>
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* TripTrac Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">TripTrac</span>
            </div>
            <p className="text-sm text-gray-600"> 
              Discover amazing destinations and create unforgettable memories.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</Link></li>
              <li><Link to="/become-host" className="text-gray-600 hover:text-blue-600 transition-colors">Become a Host</Link></li>
              <li><Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">About</Link></li>
              <li><Link to="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="font-bold mb-3">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/category/trips" className="text-gray-600 hover:text-blue-600 transition-colors">Trips</Link></li>
              <li><Link to="/category/events" className="text-gray-600 hover:text-blue-600 transition-colors">Events</Link></li>
              <li><Link to="/category/hotels" className="text-gray-600 hover:text-blue-600 transition-colors">Hotels</Link></li>
              <li><Link to="/category/adventure" className="text-gray-600 hover:text-blue-600 transition-colors">Adventure Place</Link></li>
            </ul>
          </div>
          
          {/* My Account */}
          <div>
            <h3 className="font-bold mb-3">My Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/become-host" className="text-gray-600 hover:text-blue-600 transition-colors">Become a Host</Link></li>
              <li><Link to="/bookings" className="text-gray-600 hover:text-blue-600 transition-colors">My Bookings</Link></li>
              <li><Link to="/saved" className="text-gray-600 hover:text-blue-600 transition-colors">Wishlist</Link></li>
              <li><Link to="/profile" className="text-gray-600 hover:text-blue-600 transition-colors">Profile</Link></li>
            </ul>
            {!isInstalled && <Link to="/install">
                
              </Link>}
          </div>

          {/* Social Media and Email - UPDATED SECTION with real icons and colors */}
          <div>
            <h3 className="font-bold mb-3">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              
              {/* WhatsApp */}
              <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <FaWhatsapp className="h-6 w-6 text-[#25D366] hover:opacity-80 transition-opacity" /> {/* WhatsApp Green */}
              </a>
              
              {/* Instagram */}
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FaInstagram className="h-6 w-6 text-[#E4405F] hover:opacity-80 transition-opacity" /> {/* Instagram Pink/Red */}
              </a>

              {/* TikTok */}
              <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <FaTiktok className="h-6 w-6 text-[#000000] hover:opacity-80 transition-opacity" /> {/* TikTok Black */}
              </a>
              
              {/* YouTube */}
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <Youtube className="h-6 w-6 text-[#FF0000] hover:opacity-80 transition-opacity" /> {/* YouTube Red (from lucide-react) */}
              </a>

              {/* Facebook */}
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FaFacebookF className="h-6 w-6 text-[#1877F2] hover:opacity-80 transition-opacity" /> {/* Facebook Blue */}
              </a>

              {/* X (Twitter) */}
              <a href={socialLinks.x} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                <FaXTwitter className="h-6 w-6 text-[#000000] hover:opacity-80 transition-opacity" /> {/* X Black */}
              </a>
            </div>
            
            {/* Email Link */}
            <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-5 w-5 text-gray-600" />
                <a href={socialLinks.email} className="text-gray-600 hover:text-blue-600 transition-colors">
                  Send us an email
                </a>
            </div>
          </div>
          
        </div>
        
        <div className="border-t border-gray-300 mt-8 pt-6 text-center text-sm text-gray-600">
          <p>© 2025 TripTrac. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};