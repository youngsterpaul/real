-- Fix RLS policies to explicitly allow anonymous (public) access
-- These policies will allow unauthenticated users to see approved items

-- Hotels: Allow anonymous users to read approved hotels
DROP POLICY IF EXISTS "Allow public read access to approved hotels" ON public.hotels;

CREATE POLICY "Allow public read access to approved hotels" 
ON public.hotels
FOR SELECT
TO public
USING (
  -- Public/anonymous can see approved and visible items
  (approval_status = 'approved' AND is_hidden = false)
  OR
  -- Authenticated creators can see their own items  
  (auth.uid() = created_by)
  OR
  -- Admins can see everything
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Allowed admins can see items
  ((SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text = ANY (allowed_admin_emails))
);

-- Adventure Places (Campsites): Allow anonymous users to read approved items
DROP POLICY IF EXISTS "Allow public read access to approved adventure_places" ON public.adventure_places;

CREATE POLICY "Allow public read access to approved adventure_places" 
ON public.adventure_places
FOR SELECT
TO public
USING (
  -- Public/anonymous can see approved and visible items
  (approval_status = 'approved' AND is_hidden = false)
  OR
  -- Authenticated creators can see their own items
  (auth.uid() = created_by)
  OR
  -- Admins can see everything
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Allowed admins can see items
  ((SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text = ANY (allowed_admin_emails))
);

-- Attractions: Allow anonymous users to read approved attractions
DROP POLICY IF EXISTS "Public can view approved attractions" ON public.attractions;

CREATE POLICY "Public can view approved attractions" 
ON public.attractions
FOR SELECT
TO public
USING (
  -- Public/anonymous can see approved and visible items
  (approval_status = 'approved' AND is_hidden = false)
  OR
  -- Authenticated creators can see their own items
  (auth.uid() = created_by)
  OR
  -- Admins can see everything
  has_role(auth.uid(), 'admin'::app_role)
);

-- Trips: Allow anonymous users to read approved trips
DROP POLICY IF EXISTS "Allow public read access to approved trips" ON public.trips;

CREATE POLICY "Allow public read access to approved trips" 
ON public.trips
FOR SELECT
TO public
USING (
  -- Public/anonymous can see approved and visible items
  (approval_status = 'approved' AND is_hidden = false)
  OR
  -- Authenticated creators can see their own items
  (auth.uid() = created_by)
  OR
  -- Admins can see everything
  has_role(auth.uid(), 'admin'::app_role)
);