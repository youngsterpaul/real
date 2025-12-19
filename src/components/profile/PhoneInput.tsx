import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  SOFT_GRAY: "#F8F9FA",
  KHAKI_DARK: "#857F3E",
};

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  country: string;
  className?: string;
  id?: string;
  label?: string; // Added label prop for consistent styling
}

const COUNTRY_CODES: Record<string, { code: string; flag: string }> = {
  Kenya: { code: "+254", flag: "🇰🇪" },
  Uganda: { code: "+256", flag: "🇺🇬" },
  Tanzania: { code: "+255", flag: "🇹🇿" },
  Rwanda: { code: "+250", flag: "🇷🇼" },
  Burundi: { code: "+257", flag: "🇧🇮" },
  "South Sudan": { code: "+211", flag: "🇸🇸" },
  Ethiopia: { code: "+251", flag: "🇪🇹" },
  Somalia: { code: "+252", flag: "🇸🇴" },
  Nigeria: { code: "+234", flag: "🇳🇬" },
  Ghana: { code: "+233", flag: "🇬🇭" },
  "South Africa": { code: "+27", flag: "🇿🇦" },
  Egypt: { code: "+20", flag: "🇪🇬" },
  Morocco: { code: "+212", flag: "🇲🇦" },
  Algeria: { code: "+213", flag: "🇩🇿" },
  Tunisia: { code: "+216", flag: "🇹🇳" },
  Zimbabwe: { code: "+263", flag: "🇿🇼" },
  Zambia: { code: "+260", flag: "🇿🇲" },
  Botswana: { code: "+267", flag: "🇧🇼" },
  Mozambique: { code: "+258", flag: "🇲🇿" },
  Malawi: { code: "+265", flag: "🇲🇼" },
};

export const PhoneInput = ({ value, onChange, country, className, id, label }: PhoneInputProps) => {
  const countryInfo = COUNTRY_CODES[country] || { code: "", flag: "🌍" };
  
  const getNumberWithoutCode = (fullNumber: string) => {
    if (!fullNumber) return "";
    if (countryInfo.code && fullNumber.startsWith(countryInfo.code)) {
      return fullNumber.slice(countryInfo.code.length);
    }
    if (fullNumber.startsWith("+")) {
      const possibleCode = Object.values(COUNTRY_CODES).find(c => fullNumber.startsWith(c.code));
      if (possibleCode) {
        return fullNumber.slice(possibleCode.code.length);
      }
    }
    return fullNumber.replace(/^\+/, "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^\d]/g, ""); 
    const fullNumber = countryInfo.code ? `${countryInfo.code}${input}` : `+${input}`;
    onChange(fullNumber);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label 
          htmlFor={id} 
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
        >
          {label}
        </Label>
      )}
      
      <div className="relative flex items-center gap-0 group">
        {country && (
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-l-2xl border-y border-l border-slate-100 h-14 transition-all duration-300 group-within:border-[#008080]"
            style={{ backgroundColor: `${COLORS.TEAL}08` }}
          >
            <span className="text-xl leading-none filter drop-shadow-sm">{countryInfo.flag}</span>
            <span className="text-xs font-black text-[#008080] uppercase tracking-tighter">
              {countryInfo.code}
            </span>
          </div>
        )}
        
        <Input
          id={id}
          type="tel"
          value={getNumberWithoutCode(value)}
          onChange={handleChange}
          placeholder={country ? "712 345 678" : "+254 712 345 678"}
          className={`
            h-14 
            border-slate-100 
            bg-white 
            text-sm 
            font-bold 
            tracking-tight
            focus-visible:ring-0 
            focus-visible:border-[#008080] 
            transition-all 
            ${country ? 'rounded-l-none rounded-r-2xl border-l-0' : 'rounded-2xl'}
            ${className}
          `}
        />
        
        {/* Subtle decorative focus bar */}
        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#008080] transition-all duration-500 group-within:w-full rounded-full" />
      </div>
    </div>
  );
};