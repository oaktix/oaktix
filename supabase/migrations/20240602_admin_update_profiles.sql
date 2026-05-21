-- 20240602_admin_update_profiles.sql
-- Allow admins and super_admins to update ONLY the `role` column on any profile.
create policy "Admin can update role on any profile"
  on profiles
  for update
  using ((auth.jwt()->'user_metadata'->>'role') in ('admin', 'super_admin'))
  with check (
    new.role is not null
  );