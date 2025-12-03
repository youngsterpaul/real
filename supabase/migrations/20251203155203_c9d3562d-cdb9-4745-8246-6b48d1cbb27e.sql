-- Enable REPLICA IDENTITY FULL for real-time updates on pending_payments
ALTER TABLE public.pending_payments REPLICA IDENTITY FULL;