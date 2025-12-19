import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

// Using the project color palette for consistency
const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  SOFT_GRAY: "#F8F9FA"
};

interface AutoVerifyEmailProps {
  email: string;
  onEmailChange: (email: string) => void;
  isVerified: boolean;
  onVerificationChange: (verified: boolean) => void;
  required?: boolean;
}

export const AutoVerifyEmail = ({
  email,
  onEmailChange,
  isVerified,
  onVerificationChange,
  required = false
}: AutoVerifyEmailProps) => {
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailRegex.test(email);
    setIsValid(valid);
    
    if (valid && !isVerified) {
      onVerificationChange(true);
    } else if (!valid && isVerified) {
      onVerificationChange(false);
    }
  }, [email, isVerified, onVerificationChange]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end px-1">
        <Label 
          htmlFor="email" 
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
        >
          Contact Email {required && <span style={{ color: COLORS.CORAL }}>*</span>}
        </Label>
        
        {isVerified && (
          <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: COLORS.TEAL }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: COLORS.TEAL }}>
              Verified
            </span>
          </div>
        )}
      </div>

      <div className="relative group">
        <div 
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10
            ${isVerified ? "text-[#008080]" : "text-slate-400 group-focus-within:text-[#FF7F50]"}`}
        >
          <Mail className="h-4.5 w-4.5" />
        </div>

        <Input
          id="email"
          type="email"
          required={required}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="e.g. hello@adventure.com"
          className={`
            h-14 pl-12 pr-4 rounded-[20px] border-2 transition-all duration-200
            font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium
            bg-white shadow-sm
            ${isVerified 
              ? "border-[#008080]/20 bg-[#008080]/5 focus-visible:ring-0 focus-visible:border-[#008080]" 
              : "border-slate-100 focus-visible:ring-0 focus-visible:border-[#FF7F50] focus-visible:shadow-md"
            }
          `}
        />
      </div>

      {email && !isValid && (
        <div className="flex items-center gap-2 px-2 animate-in zoom-in-95 duration-200">
          <AlertCircle className="h-3 w-3 text-red-500" />
          <p className="text-[9px] font-black uppercase tracking-tighter text-red-500">
            Please enter a valid email address
          </p>
        </div>
      )}
    </div>
  );
};