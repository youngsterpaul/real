-- Create attractions table
CREATE TABLE public.attractions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  registration_type text NOT NULL,
  registration_number text NOT NULL,
  location_name text NOT NULL,
  local_name text,
  country text NOT NULL,
  description text,
  email text,
  phone_number text,
  location_link text,
  latitude numeric,
  longitude numeric,
  opening_hours text,
  closing_hours text,
  days_opened text[] DEFAULT ARRAY[]::text[],
  entrance_type text NOT NULL DEFAULT 'free',
  price_child numeric DEFAULT 0,
  price_adult numeric DEFAULT 0,
  photo_urls text[] DEFAULT ARRAY[]::text[],
  gallery_images text[] DEFAULT ARRAY[]::text[],
  approval_status text NOT NULL DEFAULT 'pending',
  rejection_note text,
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES public.profiles(id),
  is_hidden boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attractions
CREATE POLICY "Public can view approved attractions"
ON public.attractions
FOR SELECT
USING (
  (approval_status = 'approved' AND is_hidden = false) 
  OR auth.uid() = created_by 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users can create attractions"
ON public.attractions
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their own attractions"
ON public.attractions
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Admins can update all attractions"
ON public.attractions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update bookings table to support attraction bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS visit_date date;

-- Create index for better performance
CREATE INDEX idx_attractions_approval_status ON public.attractions(approval_status);
CREATE INDEX idx_attractions_created_by ON public.attractions(created_by);

-- Trigger for updated_at
CREATE TRIGGER update_attractions_updated_at
BEFORE UPDATE ON public.attractions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();