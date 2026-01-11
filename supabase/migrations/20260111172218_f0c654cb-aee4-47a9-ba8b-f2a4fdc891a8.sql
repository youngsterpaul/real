-- Add slot_limit_type to trips table to distinguish between inventory-based and per-booking limits
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS slot_limit_type TEXT NOT NULL DEFAULT 'inventory'
CHECK (slot_limit_type IN ('inventory', 'per_booking'));

-- Add host confirmation field to bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS host_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS host_confirmed_at TIMESTAMPTZ;

-- Create function to auto-delete old listings (Events, Trips, Tours 5 days after due date)
CREATE OR REPLACE FUNCTION public.cleanup_expired_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete trips/events that are 5+ days past their date (exclude flexible dates)
  DELETE FROM public.trips
  WHERE is_flexible_date = false 
    AND date < (CURRENT_DATE - INTERVAL '5 days')::date;
END;
$$;

-- Create function to auto-delete old notifications (40 days past creation)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '40 days');
END;
$$;

-- Create function to auto-delete old bookings (40 days past visit date)
CREATE OR REPLACE FUNCTION public.cleanup_old_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.bookings
  WHERE visit_date IS NOT NULL 
    AND visit_date::date < (CURRENT_DATE - INTERVAL '40 days')::date;
END;
$$;

-- Create a combined cleanup function that can be called by a scheduled job
CREATE OR REPLACE FUNCTION public.run_scheduled_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.cleanup_expired_listings();
  PERFORM public.cleanup_old_notifications();
  PERFORM public.cleanup_old_bookings();
END;
$$;

-- Update is_flexible_date to true when slot_limit_type is per_booking
-- This ensures consistency
CREATE OR REPLACE FUNCTION public.sync_slot_limit_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slot_limit_type = 'per_booking' THEN
    NEW.is_flexible_date := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for syncing
DROP TRIGGER IF EXISTS sync_slot_limit_type_trigger ON public.trips;
CREATE TRIGGER sync_slot_limit_type_trigger
  BEFORE INSERT OR UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_slot_limit_type();