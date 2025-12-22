import { useState, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Ticket } from "lucide-react";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  CORAL_LIGHT: "#FF9E7A",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  RED: "#FF0000",
  SOFT_GRAY: "#F8F9FA"
};

interface AvailabilityData {
  date: Date;
  status: 'available' | 'partially_booked' | 'fully_booked';
  availableSlots: number;
  totalCapacity: number;
}

interface AvailabilityCalendarProps {
  itemId: string;
  itemType: 'trip' | 'hotel' | 'adventure' | 'event';
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  totalCapacity?: number;
}

export function AvailabilityCalendar({ 
  itemId, 
  itemType, 
  onDateSelect,
  selectedDate,
  totalCapacity: propCapacity
}: AvailabilityCalendarProps) {
  const [availability, setAvailability] = useState<Map<string, AvailabilityData>>(new Map());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [totalCapacity, setTotalCapacity] = useState(propCapacity || 0);

  // Fetch total capacity if not provided
  useEffect(() => {
    if (propCapacity) {
      setTotalCapacity(propCapacity);
      return;
    }

    const fetchCapacity = async () => {
      const tableMap: Record<string, { table: string, field: string }> = {
        trip: { table: 'trips', field: 'available_tickets' },
        event: { table: 'trips', field: 'available_tickets' },
        hotel: { table: 'hotels', field: 'available_rooms' },
        adventure: { table: 'adventure_places', field: 'available_slots' }
      };

      const config = tableMap[itemType];
      if (config) {
        const { data } = await supabase
          .from(config.table as any)
          .select(config.field)
          .eq('id', itemId)
          .single();
        setTotalCapacity(data?.[config.field] || 0);
      }
    };

    fetchCapacity();
  }, [itemId, itemType, propCapacity]);

  const loadAvailability = useCallback(async () => {
    if (!totalCapacity) return;
    
    setIsLoading(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const availabilityMap = new Map<string, AvailabilityData>();

    // Use the new public availability table
    const { data: dateAvailability, error } = await supabase
      .from('item_availability_by_date')
      .select('visit_date, booked_slots')
      .eq('item_id', itemId)
      .gte('visit_date', format(start, 'yyyy-MM-dd'))
      .lte('visit_date', format(end, 'yyyy-MM-dd'));

    if (error) {
      console.error('Error fetching availability:', error);
    }

    const bookingsByDate = new Map<string, number>();
    dateAvailability?.forEach(row => {
      bookingsByDate.set(row.visit_date, row.booked_slots || 0);
    });

    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const booked = bookingsByDate.get(dateKey) || 0;
      const left = Math.max(0, totalCapacity - booked);
      
      let status: 'available' | 'partially_booked' | 'fully_booked' = 'available';
      if (left <= 0) status = 'fully_booked';
      else if (totalCapacity > 0 && booked / totalCapacity > 0.7) status = 'partially_booked';

      availabilityMap.set(dateKey, { date: day, status, availableSlots: left, totalCapacity });
    });

    setAvailability(availabilityMap);
    setIsLoading(false);
  }, [itemId, currentMonth, totalCapacity]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`calendar-availability-${itemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_availability_by_date',
          filter: `item_id=eq.${itemId}`
        },
        (payload) => {
          const newRecord = payload.new as { visit_date: string; booked_slots: number } | null;
          
          if (newRecord) {
            const booked = newRecord.booked_slots || 0;
            const left = Math.max(0, totalCapacity - booked);
            
            let status: 'available' | 'partially_booked' | 'fully_booked' = 'available';
            if (left <= 0) status = 'fully_booked';
            else if (totalCapacity > 0 && booked / totalCapacity > 0.7) status = 'partially_booked';

            setAvailability(prev => {
              const updated = new Map(prev);
              const existingDay = prev.get(newRecord.visit_date);
              if (existingDay) {
                updated.set(newRecord.visit_date, {
                  ...existingDay,
                  availableSlots: left,
                  status
                });
              }
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId, totalCapacity]);

  const getDateAvailability = (date: Date) => availability.get(format(date, 'yyyy-MM-dd'));

  const modifiers = {
    available: (date: Date) => getDateAvailability(date)?.status === 'available',
    partiallyBooked: (date: Date) => getDateAvailability(date)?.status === 'partially_booked',
    fullyBooked: (date: Date) => getDateAvailability(date)?.status === 'fully_booked'
  };

  const modifiersStyles = {
    available: { color: COLORS.TEAL, fontWeight: '900' },
    partiallyBooked: { color: COLORS.CORAL, fontWeight: '900' },
    fullyBooked: { color: '#cbd5e1', textDecoration: 'line-through' }
  };

  return (
    <Card className="p-8 rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden relative">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon className="h-4 w-4" style={{ color: COLORS.TEAL }} />
              <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>
                Select Dates
              </h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Check Real-time availability</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <LegendItem color={COLORS.TEAL} label="Open" />
            <LegendItem color={COLORS.CORAL} label="Limited" />
            <LegendItem color="#cbd5e1" label="Full" />
          </div>
        </div>
        
        <div className={cn(
          "rounded-3xl p-4 border border-slate-50 bg-[#F8F9FA] transition-opacity duration-500",
          isLoading ? "opacity-50" : "opacity-100"
        )}>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date && getDateAvailability(date)?.status !== 'fully_booked') {
                onDateSelect?.(date);
              }
            }}
            onMonthChange={setCurrentMonth}
            disabled={(date) => {
              const avail = getDateAvailability(date);
              return date < new Date() || avail?.status === 'fully_booked';
            }}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="w-full pointer-events-auto font-black"
            classNames={{
              day_selected: "bg-[#008080] text-white hover:bg-[#008080] hover:text-white focus:bg-[#008080] focus:text-white rounded-xl",
              day_today: "bg-slate-200 text-slate-900 rounded-xl"
            }}
          />
        </div>

        {selectedDate && (
          <div className="p-5 rounded-2xl border border-[#F0E68C]/50 bg-[#F0E68C]/10 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <Ticket className="h-5 w-5" style={{ color: COLORS.KHAKI_DARK }} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#857F3E] uppercase tracking-widest">Your Selection</p>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  {format(selectedDate, 'dd MMMM yyyy')}
                </p>
              </div>
            </div>
            <div className="text-right">
              {(() => {
                const avail = getDateAvailability(selectedDate);
                return (
                  <>
                    <p className="text-lg font-black" style={{ color: COLORS.TEAL }}>
                      {avail?.availableSlots ?? totalCapacity}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Slots Left</p>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
  </div>
);
