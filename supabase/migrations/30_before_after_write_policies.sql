-- supabase/migrations/30_before_after_write_policies.sql
-- Adds authenticated write policies for the before_after storage bucket
-- and admin-gated write policies for the before_after table. Required
-- because admin modal uses the browser (anon-key + session cookie) client,
-- not the service role.

-- Storage: follow the 'company-assets' pattern (see migration 03).
-- Middleware already gates /admin/* to authenticated users.
drop policy if exists "Auth upload before-after" on storage.objects;
create policy "Auth upload before-after"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'before-after');

drop policy if exists "Auth update before-after" on storage.objects;
create policy "Auth update before-after"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'before-after');

drop policy if exists "Auth delete before-after" on storage.objects;
create policy "Auth delete before-after"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'before-after');

-- Table: gate writes to admins via the existing public.is_admin() function
-- (see migration 22/23 for the admin-only pattern).
drop policy if exists "before_after admin write" on public.before_after;
create policy "before_after admin write"
  on public.before_after for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
