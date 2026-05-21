-- Migration: 20240603_update_rls_policies.sql
-- 1. Withdrawals Table Policies
DROP POLICY IF EXISTS "Super Admin Full Access" ON public.withdrawals;

CREATE POLICY "Vendors can view own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can insert own withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawals
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );

-- 2. Tickets Table Update Policy
-- Allow event organizers (vendors) and assigned scanner staff to update tickets (e.g. marking them as used)
CREATE POLICY "Vendors and scanners can update tickets" ON public.tickets
  FOR UPDATE
  USING (
    exists (
      select 1 from events 
      where events.id = tickets.event_id 
      and events.organizer_id = auth.uid()
    ) or exists (
      select 1 from scanners 
      where scanners.event_id = tickets.event_id 
      and scanners.staff_id = auth.uid()
    )
  );
