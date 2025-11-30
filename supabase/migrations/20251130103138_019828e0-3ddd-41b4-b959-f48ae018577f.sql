-- Remove host commission fields from referral_settings table
ALTER TABLE public.referral_settings 
DROP COLUMN IF EXISTS host_commission_rate,
DROP COLUMN IF EXISTS host_commission_duration_days;