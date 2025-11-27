-- Update notification function to include booking ID
CREATE OR REPLACE FUNCTION public.notify_on_booking_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item_name text;
  v_item_creator uuid;
BEGIN
  -- Get item creator based on booking type
  IF NEW.booking_type = 'trip' THEN
    SELECT name, created_by INTO v_item_name, v_item_creator
    FROM trips WHERE id = NEW.item_id;
  ELSIF NEW.booking_type = 'hotel' THEN
    SELECT name, created_by INTO v_item_name, v_item_creator
    FROM hotels WHERE id = NEW.item_id;
  ELSIF NEW.booking_type IN ('adventure', 'adventure_place') THEN
    SELECT name, created_by INTO v_item_name, v_item_creator
    FROM adventure_places WHERE id = NEW.item_id;
  ELSIF NEW.booking_type = 'attraction' THEN
    SELECT local_name, created_by INTO v_item_name, v_item_creator
    FROM attractions WHERE id = NEW.item_id;
  END IF;

  -- Create notification for item creator
  IF v_item_creator IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      v_item_creator,
      'new_booking',
      'New Booking Received',
      'You have received a new booking for ' || COALESCE(v_item_name, 'your listing'),
      jsonb_build_object(
        'booking_id', NEW.id,
        'item_id', NEW.item_id,
        'booking_type', NEW.booking_type,
        'total_amount', NEW.total_amount,
        'guest_name', COALESCE(NEW.guest_name, ''),
        'visit_date', NEW.visit_date
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;