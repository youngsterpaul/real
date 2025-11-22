-- Add type column to trips table to distinguish between trips and events
ALTER TABLE trips ADD COLUMN IF NOT EXISTS type text DEFAULT 'trip';

-- Add check constraint to ensure type is either 'trip' or 'event'
ALTER TABLE trips ADD CONSTRAINT trips_type_check CHECK (type IN ('trip', 'event'));

-- Add comment for clarity
COMMENT ON COLUMN trips.type IS 'Type of listing: trip (flexible dates) or event (fixed dates)';

-- Update all existing records to be 'trip' type
UPDATE trips SET type = 'trip' WHERE type IS NULL;