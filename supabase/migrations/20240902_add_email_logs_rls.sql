-- Migration: 20240902_add_email_logs_rls.sql
-- Add RLS policies for email_logs table

-- 1. Organizers can view their own sent email logs
CREATE POLICY "Organizers can view own email logs" ON public.email_logs
  FOR SELECT USING (auth.uid() = sender_id);

-- 2. Organizers can insert their own email logs
CREATE POLICY "Organizers can insert own email logs" ON public.email_logs
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 3. Admins can manage all email logs
CREATE POLICY "Admins can manage all email logs" ON public.email_logs
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );
