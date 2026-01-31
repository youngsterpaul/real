import React, { useState } from "react";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const COLORS = {
  TEAL: "#008080", // Exact color from the image
};

export const FilterBar = () => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  return (
    <div className="w-full max-w-6xl mx-auto p-4 flex justify-center">
      {/* Main Pill Container */}
      <div className="flex flex-col md:flex-row items-center bg-white border border-slate-200 rounded-[40px] md:rounded-full shadow-sm p-2 w-full md:w-fit overflow-hidden">
        
        {/* WHERE SECTION */}
        <div className="flex flex-col flex-1 px-8 py-2 min-w-[280px]">
          <label className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
            Where
          </label>
          <input 
            type="text" 
            placeholder="Destinations" 
            className="bg-transparent border-none p-0 text-base focus:ring-0 placeholder:text-slate-400 font-medium outline-none h-6"
          />
        </div>

        {/* Vertical Divider 1 */}
        <div className="hidden md:block w-[1px] h-8 bg-slate-200 self-center" />

        {/* FROM SECTION */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col flex-1 px-8 py-2 cursor-pointer hover:bg-slate-50 transition-colors min-w-[140px]">
              <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                From
              </span>
              <span className={cn("text-base font-medium leading-6", !dateFrom ? "text-slate-400" : "text-slate-700")}>
                {dateFrom ? format(dateFrom, "MMM dd") : "Add"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="start">
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
        <div className="hidden md:block w-[1px] h-8 bg-slate-200 self-center" />

        {/* TO SECTION */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col flex-1 px-8 py-2 cursor-pointer hover:bg-slate-50 transition-colors min-w-[140px]">
              <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                To
              </span>
              <span className={cn("text-base font-medium leading-6", !dateTo ? "text-slate-400" : "text-slate-700")}>
                {dateTo ? format(dateTo, "MMM dd") : "Add"}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              disabled={(date) => (dateFrom ? date <= dateFrom : date < new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* SEARCH BUTTON SECTION */}
        <div className="p-1 pl-4 md:pl-2 w-full md:w-auto">
          <button
            className="flex items-center justify-center gap-2 text-white font-bold h-12 md:h-14 px-8 rounded-full transition-transform active:scale-95 w-full md:w-auto"
            style={{ backgroundColor: COLORS.TEAL }}
          >
            <Search className="w-5 h-5 stroke-[3px]" />
            <span className="text-lg">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};