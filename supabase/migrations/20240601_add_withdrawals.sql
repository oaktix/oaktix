-- Migration: add withdrawals table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  requested_at timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  processed_at timestamptz
);

-- Enable RLS and give super admin full access
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super Admin Full Access" ON public.withdrawals
  FOR ALL USING (true);
