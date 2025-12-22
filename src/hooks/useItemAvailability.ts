import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OverallAvailability {
  itemId: string;
  bookedSlots: number;
  totalCapacity: number;
  remainingSlots: number;
  isSoldOut: boolean;
}

interface DateAvailability {
  visitDate: string;
  bookedSlots: number;
  remainingSlots: number;
  isSoldOut: boolean;
}

// Hook for overall item availability (for listing cards)
export function useItemOverallAvailability(itemIds: string[]) {
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchAvailability = useCallback(async () => {
    if (!itemIds.length) {
      setAvailabilityMap({});
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('item_availability_overall')
        .select('item_id, booked_slots')
        .in('item_id', itemIds);

      if (error) {
        console.error('Error fetching overall availability:', error);
        return;
      }

      const map: Record<string, number> = {};
      itemIds.forEach(id => {
        map[id] = 0; // Default to 0 booked
      });
      data?.forEach(row => {
        map[row.item_id] = row.booked_slots;
      });
      setAvailabilityMap(map);
    } catch (err) {
      console.error('Error in fetchAvailability:', err);
    } finally {
      setLoading(false);
    }
  }, [itemIds.join(',')]);

  useEffect(() => {
    fetchAvailability();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('item-availability-overall')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_availability_overall',
        },
        (payload) => {
          const newRecord = payload.new as { item_id: string; booked_slots: number } | null;
          const oldRecord = payload.old as { item_id: string } | null;
          
          if (payload.eventType === 'DELETE' && oldRecord) {
            setAvailabilityMap(prev => {
              const updated = { ...prev };
              if (itemIds.includes(oldRecord.item_id)) {
                updated[oldRecord.item_id] = 0;
              }
              return updated;
            });
          } else if (newRecord && itemIds.includes(newRecord.item_id)) {
            setAvailabilityMap(prev => ({
              ...prev,
              [newRecord.item_id]: newRecord.booked_slots,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAvailability, itemIds.join(',')]);

  return { availabilityMap, loading, refetch: fetchAvailability };
}

// Hook for single item overall availability
export function useSingleItemAvailability(itemId: string | undefined, totalCapacity: number) {
  const [bookedSlots, setBookedSlots] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAvailability = useCallback(async () => {
    if (!itemId) {
      setBookedSlots(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('item_availability_overall')
        .select('booked_slots')
        .eq('item_id', itemId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching single item availability:', error);
        return;
      }

      setBookedSlots(data?.booked_slots ?? 0);
    } catch (err) {
      console.error('Error in fetchAvailability:', err);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchAvailability();

    if (!itemId) return;

    // Subscribe to realtime changes for this specific item
    const channel = supabase
      .channel(`item-availability-${itemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_availability_overall',
          filter: `item_id=eq.${itemId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setBookedSlots(0);
          } else {
            const newRecord = payload.new as { booked_slots: number };
            setBookedSlots(newRecord.booked_slots);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAvailability, itemId]);

  const remainingSlots = Math.max(0, totalCapacity - bookedSlots);
  const isSoldOut = totalCapacity > 0 && remainingSlots <= 0;

  return { bookedSlots, remainingSlots, isSoldOut, loading, refetch: fetchAvailability };
}

// Hook for date-specific availability (for calendars and booking flow)
export function useDateAvailability(itemId: string | undefined, visitDate: string | undefined, totalCapacity: number) {
  const [bookedSlots, setBookedSlots] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAvailability = useCallback(async () => {
    if (!itemId || !visitDate) {
      setBookedSlots(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('item_availability_by_date')
        .select('booked_slots')
        .eq('item_id', itemId)
        .eq('visit_date', visitDate)
        .maybeSingle();

      if (error) {
        console.error('Error fetching date availability:', error);
        return;
      }

      setBookedSlots(data?.booked_slots ?? 0);
    } catch (err) {
      console.error('Error in fetchAvailability:', err);
    } finally {
      setLoading(false);
    }
  }, [itemId, visitDate]);

  useEffect(() => {
    fetchAvailability();

    if (!itemId) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`date-availability-${itemId}-${visitDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_availability_by_date',
          filter: `item_id=eq.${itemId}`,
        },
        (payload) => {
          const newRecord = payload.new as { visit_date: string; booked_slots: number } | null;
          if (newRecord && newRecord.visit_date === visitDate) {
            setBookedSlots(newRecord.booked_slots);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAvailability, itemId, visitDate]);

  const remainingSlots = Math.max(0, totalCapacity - bookedSlots);
  const isSoldOut = totalCapacity > 0 && remainingSlots <= 0;

  return { bookedSlots, remainingSlots, isSoldOut, loading, refetch: fetchAvailability };
}

// Hook for fetching all dates availability for a month (for calendars)
export function useMonthAvailability(itemId: string | undefined, year: number, month: number, totalCapacity: number) {
  const [dateMap, setDateMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchAvailability = useCallback(async () => {
    if (!itemId) {
      setDateMap({});
      setLoading(false);
      return;
    }

    // Calculate date range for the month
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('item_availability_by_date')
        .select('visit_date, booked_slots')
        .eq('item_id', itemId)
        .gte('visit_date', startDate)
        .lte('visit_date', endDate);

      if (error) {
        console.error('Error fetching month availability:', error);
        return;
      }

      const map: Record<string, number> = {};
      data?.forEach(row => {
        map[row.visit_date] = row.booked_slots;
      });
      setDateMap(map);
    } catch (err) {
      console.error('Error in fetchAvailability:', err);
    } finally {
      setLoading(false);
    }
  }, [itemId, year, month]);

  useEffect(() => {
    fetchAvailability();

    if (!itemId) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`month-availability-${itemId}-${year}-${month}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_availability_by_date',
          filter: `item_id=eq.${itemId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldRecord = payload.old as { visit_date: string };
            setDateMap(prev => {
              const updated = { ...prev };
              delete updated[oldRecord.visit_date];
              return updated;
            });
          } else {
            const newRecord = payload.new as { visit_date: string; booked_slots: number };
            setDateMap(prev => ({
              ...prev,
              [newRecord.visit_date]: newRecord.booked_slots,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAvailability, itemId, year, month]);

  const getDateAvailability = (date: string): DateAvailability => {
    const booked = dateMap[date] ?? 0;
    const remaining = Math.max(0, totalCapacity - booked);
    return {
      visitDate: date,
      bookedSlots: booked,
      remainingSlots: remaining,
      isSoldOut: totalCapacity > 0 && remaining <= 0,
    };
  };

  return { dateMap, getDateAvailability, loading, refetch: fetchAvailability, totalCapacity };
}
