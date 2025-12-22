import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BookingStats {
  [itemId: string]: number;
}

// Hook for multiple items - uses the new item_availability_overall table (publicly readable)
export const useRealtimeBookings = (itemIds: string[]) => {
  const [bookingStats, setBookingStats] = useState<BookingStats>({});

  const fetchBookingStats = useCallback(async () => {
    if (itemIds.length === 0) return;

    // Use the new public availability table
    const { data: availabilityData, error } = await supabase
      .from('item_availability_overall')
      .select('item_id, booked_slots')
      .in('item_id', itemIds);

    if (error) {
      console.error('Error fetching availability:', error);
      return;
    }

    const stats: BookingStats = {};
    // Initialize all items to 0
    itemIds.forEach(id => {
      stats[id] = 0;
    });
    // Set actual booked values
    availabilityData?.forEach(row => {
      stats[row.item_id] = row.booked_slots || 0;
    });
    setBookingStats(stats);
  }, [itemIds.join(',')]);

  useEffect(() => {
    fetchBookingStats();

    // Subscribe to real-time changes on the availability table
    const channel = supabase
      .channel('availability-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_availability_overall'
        },
        (payload) => {
          const newRecord = payload.new as { item_id: string; booked_slots: number } | null;
          const oldRecord = payload.old as { item_id: string } | null;

          if (payload.eventType === 'DELETE' && oldRecord && itemIds.includes(oldRecord.item_id)) {
            setBookingStats(prev => ({ ...prev, [oldRecord.item_id]: 0 }));
          } else if (newRecord && itemIds.includes(newRecord.item_id)) {
            setBookingStats(prev => ({ ...prev, [newRecord.item_id]: newRecord.booked_slots || 0 }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookingStats, itemIds.join(',')]);

  return { bookingStats, refetch: fetchBookingStats };
};

// Hook for a single item's real-time availability - uses the new public table
export const useRealtimeItemAvailability = (itemId: string | undefined, totalCapacity: number) => {
  const [bookedSlots, setBookedSlots] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBookedSlots = useCallback(async () => {
    if (!itemId) {
      setBookedSlots(0);
      setLoading(false);
      return;
    }

    // Use the new public availability table
    const { data, error } = await supabase
      .from('item_availability_overall')
      .select('booked_slots')
      .eq('item_id', itemId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching item availability:', error);
    }
    
    setBookedSlots(data?.booked_slots || 0);
    setLoading(false);
  }, [itemId]);

  useEffect(() => {
    fetchBookedSlots();

    if (!itemId) return;

    // Subscribe to real-time changes for this specific item
    const channel = supabase
      .channel(`availability-${itemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_availability_overall',
          filter: `item_id=eq.${itemId}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setBookedSlots(0);
          } else {
            const newRecord = payload.new as { booked_slots: number };
            setBookedSlots(newRecord.booked_slots || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId, fetchBookedSlots]);

  const remainingSlots = Math.max(0, totalCapacity - bookedSlots);
  const isSoldOut = totalCapacity > 0 && remainingSlots <= 0;

  return { bookedSlots, remainingSlots, isSoldOut, loading, refetch: fetchBookedSlots };
};

// Hook for date-specific availability (for calendars and booking flow)
export const useRealtimeDateAvailability = (itemId: string | undefined, visitDate: string | undefined, totalCapacity: number) => {
  const [bookedSlots, setBookedSlots] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBookedSlots = useCallback(async () => {
    if (!itemId || !visitDate) {
      setBookedSlots(0);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('item_availability_by_date')
      .select('booked_slots')
      .eq('item_id', itemId)
      .eq('visit_date', visitDate)
      .maybeSingle();

    if (error) {
      console.error('Error fetching date availability:', error);
    }

    setBookedSlots(data?.booked_slots || 0);
    setLoading(false);
  }, [itemId, visitDate]);

  useEffect(() => {
    fetchBookedSlots();

    if (!itemId) return;

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`date-availability-${itemId}-${visitDate}`)
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
          if (newRecord && newRecord.visit_date === visitDate) {
            setBookedSlots(newRecord.booked_slots || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId, visitDate, fetchBookedSlots]);

  const remainingSlots = Math.max(0, totalCapacity - bookedSlots);
  const isSoldOut = totalCapacity > 0 && remainingSlots <= 0;

  return { bookedSlots, remainingSlots, isSoldOut, loading, refetch: fetchBookedSlots };
};
