-- Fix RLS policies to use profiles table instead of auth.users

-- Drop existing problematic policies for hotels
DROP POLICY IF EXISTS "Allowed admins can update hotels" ON public.hotels;

-- Drop existing problematic policies for adventure_places
DROP POLICY IF EXISTS "Allowed admins can update adventure places" ON public.adventure_places;

-- Recreate policies using profiles table for email lookup
CREATE POLICY "Allowed admins can update hotels"
ON public.hotels
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = created_by) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR ((SELECT email FROM public.profiles WHERE id = auth.uid())::text = ANY (allowed_admin_emails))
)
WITH CHECK (
  (auth.uid() = created_by) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR ((SELECT email FROM public.profiles WHERE id = auth.uid())::text = ANY (allowed_admin_emails))
);

CREATE POLICY "Allowed admins can update adventure places"
ON public.adventure_places
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = created_by) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR ((SELECT email FROM public.profiles WHERE id = auth.uid())::text = ANY (allowed_admin_emails))
)
WITH CHECK (
  (auth.uid() = created_by) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR ((SELECT email FROM public.profiles WHERE id = auth.uid())::text = ANY (allowed_admin_emails))
);