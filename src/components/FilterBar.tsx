import React, { useState } from "react";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const COLORS = {
  TEAL: "#008080",
};

export const FilterBar = () => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  return (
    <div className="w-full max-w-6xl mx-auto p-4 flex justify-center">
      {/* Main Rectangular Container - now flex-row by default */}
      <div className="flex flex-row items-center bg-white border border-slate-200 rounded-lg shadow-sm w-full md:w-fit overflow-hidden h-14">
        
        {/* WHERE SECTION - Reduced padding and min-width */}
        <div className="flex flex-col flex-1 px-4 py-1 min-w-[120px] md:min-w-[200px]">
          <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
            Where
          </label>
          <input 
            type="text" 
            placeholder="Destinations" 
            className="bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-slate-400 font-medium outline-none"
          />
        </div>

        {/* Vertical Divider 1 */}
        <div className="w-[1px] h-8 bg-slate-200 self-center" />

        {/* FROM SECTION */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col px-4 py-1 cursor-pointer hover:bg-slate-50 transition-colors min-w-[80px] md:min-w-[110px]">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                From
              </span>
              <span className={cn("text-sm font-medium", !dateFrom ? "text-slate-400" : "text-slate-700")}>
                {dateFrom ? format(dateFrom, "MMM dd") : "Add"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Vertical Divider 2 */}
        <div className="w-[1px] h-8 bg-slate-200 self-center" />

        {/* TO SECTION */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col px-4 py-1 cursor-pointer hover:bg-slate-50 transition-colors min-w-[80px] md:min-w-[110px]">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                To
              </span>
              <span className={cn("text-sm font-medium", !dateTo ? "text-slate-400" : "text-slate-700")}>
                {dateTo ? format(dateTo, "MMM dd") : "Add"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              disabled={(date) => (dateFrom ? date <= dateFrom : date < new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* SEARCH BUTTON SECTION - Slimmer and rectangular */}
        <div className="h-full">
          <button
            className="flex items-center justify-center gap-2 text-white font-bold h-full px-4 md:px-6 transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: COLORS.TEAL }}
          >
            <Search className="w-4 h-4 stroke-[3px]" />
            <span className="text-sm hidden sm:inline">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};