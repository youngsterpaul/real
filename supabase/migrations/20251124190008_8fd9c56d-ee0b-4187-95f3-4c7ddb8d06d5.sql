-- TRIPS TABLE
-- Drop existing admin update policy and recreate with both USING and WITH CHECK
DROP POLICY IF EXISTS "Admins can update all trips" ON trips;

CREATE POLICY "Admins can update all trips"
ON trips
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update the read policy to ensure admins can see all items
DROP POLICY IF EXISTS "Allow public read access to approved trips" ON trips;

CREATE POLICY "Allow public read access to approved trips"
ON trips
FOR SELECT
TO authenticated
USING (
  (approval_status = 'approved' AND is_hidden = false) 
  OR auth.uid() = created_by 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Allow public (unauthenticated) to view approved trips
CREATE POLICY "Public can view approved trips"
ON trips
FOR SELECT
TO anon
USING (approval_status = 'approved' AND is_hidden = false);

-- HOTELS TABLE
-- Drop existing admin update policy and recreate with both USING and WITH CHECK
DROP POLICY IF EXISTS "Admins can update all hotels" ON hotels;

CREATE POLICY "Admins can update all hotels"
ON hotels
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update the read policy to ensure admins can see all items
DROP POLICY IF EXISTS "Public hotels read" ON hotels;

CREATE POLICY "Public hotels read"
ON hotels
FOR SELECT
TO authenticated
USING (
  (approval_status = 'approved' AND is_hidden = false) 
  OR auth.uid() = created_by 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Allow public (unauthenticated) to view approved hotels
CREATE POLICY "Public can view approved hotels"
ON hotels
FOR SELECT
TO anon
USING (approval_status = 'approved' AND is_hidden = false);

-- ATTRACTIONS TABLE
-- Drop existing admin update policy and recreate with both USING and WITH CHECK
DROP POLICY IF EXISTS "Admins can update all attractions" ON attractions;

CREATE POLICY "Admins can update all attractions"
ON attractions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update the read policy to ensure admins can see all items
DROP POLICY IF EXISTS "Public can view approved attractions" ON attractions;

CREATE POLICY "Public can view approved attractions"
ON attractions
FOR SELECT
TO authenticated
USING (
  (approval_status = 'approved' AND is_hidden = false) 
  OR auth.uid() = created_by 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Allow public (unauthenticated) to view approved attractions
CREATE POLICY "Public can view approved attractions anon"
ON attractions
FOR SELECT
TO anon
USING (approval_status = 'approved' AND is_hidden = false);