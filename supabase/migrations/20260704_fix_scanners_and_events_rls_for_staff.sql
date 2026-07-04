-- Migration: Allow staff scanners to view their assignments and the events they are assigned to scan.

-- 1. Allow staff scanners to read their own rows in scanners table
CREATE POLICY "Staff can view own scanner assignments" ON public.scanners
  FOR SELECT
  USING (auth.uid() = staff_id);

-- 2. Allow staff scanners to read events they are assigned to
CREATE POLICY "Staff can view assigned events" ON public.events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scanners
      WHERE scanners.event_id = events.id
      AND scanners.staff_id = auth.uid()
    )
  );
