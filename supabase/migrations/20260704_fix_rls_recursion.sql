-- Drop the policy that causes infinite recursion
DROP POLICY IF EXISTS "Staff can view assigned events" ON public.events;

-- Create security definer function to bypass RLS recursion when checking scanners
CREATE OR REPLACE FUNCTION public.is_event_scanner(event_uuid uuid, user_uuid uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.scanners
    WHERE event_id = event_uuid
    AND staff_id = user_uuid
  );
END;
$$;

-- Re-create the policy using the security definer helper function
CREATE POLICY "Staff can view assigned events" ON public.events
  FOR SELECT
  USING (
    public.is_event_scanner(id, auth.uid())
  );

-- Allow authenticated users to view profiles (resolves name/email lookup and joins on Team page)
CREATE POLICY "Enable read access to profiles for authenticated users" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
