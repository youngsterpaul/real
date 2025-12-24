-- Remove restrictive check constraints to allow null values for manual entries
-- If a value doesn't match database expectations, it should be null

-- Drop existing check constraints
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_method_check;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

-- Add more permissive constraints that allow null
-- payment_method can be null or specific values
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_method_check 
  CHECK (payment_method IS NULL OR payment_method IN ('mpesa', 'airtel', 'card', 'manual_entry', 'cash', 'bank_transfer'));

-- booking_type allows all known types including adventure
ALTER TABLE public.bookings ADD CONSTRAINT bookings_booking_type_check 
  CHECK (booking_type IN ('trip', 'event', 'hotel', 'adventure_place', 'adventure', 'attraction'));