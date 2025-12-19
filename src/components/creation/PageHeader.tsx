import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Standardizing colors to match your theme
const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  SOFT_GRAY: "#F8F9FA"
};

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  backgroundImage?: string;
}

export const PageHeader = ({ 
  title, 
  showBackButton = true, 
  showHomeButton = true,
  backgroundImage
}: PageHeaderProps) => {
  const navigate = useNavigate();

  // STYLED WITH BACKGROUND IMAGE
  if (backgroundImage) {
    return (
      <div 
        className="relative h-56 md:h-72 rounded-[32px] overflow-hidden mb-8 shadow-xl"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/60" />
        
        <div className="relative h-full flex flex-col items-center justify-center text-white px-6">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-center drop-shadow-2xl">
            {title}
          </h1>
          <div className="h-1.5 w-20 bg-[#FF7F50] rounded-full mt-4 shadow-lg" />
        </div>

        {showBackButton && (
          <Button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 rounded-full bg-black/30 backdrop-blur-md text-white border-none hover:bg-black/50 transition-all active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </Button>
        )}

        {showHomeButton && (
          <Button
            onClick={() => navigate("/")}
            className="absolute top-6 right-6 rounded-full bg-white/20 backdrop-blur-md text-white border-none hover:bg-white/40 transition-all active:scale-95"
          >
            <Home className="h-5 w-5 mr-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
          </Button>
        )}
      </div>
    );
  }

  // STYLED MINIMAL (DESKTOP/STANDARD)
  return (
    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
      <div className="flex items-center gap-6">
        {showBackButton && (
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="group flex flex-col h-auto py-2 px-4 bg-[#008080]/5 text-[#008080] rounded-2xl hover:bg-[#008080]/10 transition-all"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span className="text-[9px] font-black uppercase tracking-tighter mt-1">Back</span>
          </Button>
        )}
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-800">
            {title}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
            Explore / {title}
          </p>
        </div>
      </div>

      {showHomeButton && (
        <Button
          onClick={() => navigate("/")}
          className="rounded-2xl px-6 py-6 h-auto text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 border-none"
          style={{ 
            background: `linear-gradient(135deg, #008080 0%, #006666 100%)`,
            color: 'white'
          }}
        >
          <Home className="h-4 w-4 mr-2" />
          Home Base
        </Button>
      )}
    </div>
  );
};