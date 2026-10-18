-- ============================================
-- LEIGH'S ART: PRIVATE NEWSLETTER SUBSCRIBERS
-- Run in Supabase SQL Editor once.
-- Does NOT activate public signup or email sending.
-- ============================================

-- ===== TABLE AND CONSENT FIELDS =====
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  consented_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ===== EMAIL VALIDATION FOR FUTURE SERVER-SIDE SIGNUPS =====
-- Existing rows are not modified; validate them before enforcing a new check.

-- ===== PRIVATE ADMIN ACCESS ONLY =====
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Newsletter admins read subscribers" on public.newsletter_subscribers;
create policy "Newsletter admins read subscribers"
on public.newsletter_subscribers for select to authenticated
using (exists (
  select 1 from public.site_admins
  where user_id = (select auth.uid())
));

-- ===== ADMIN MAY MARK CONTACTS UNSUBSCRIBED =====
-- The dashboard only writes unsubscribed_at. Supabase's UPDATE policy is
-- broad for existing admins, so use a dedicated RPC in production if more
-- granular column restrictions are required.
drop policy if exists "Newsletter admins update subscribers" on public.newsletter_subscribers;
create policy "Newsletter admins update subscribers"
on public.newsletter_subscribers for update to authenticated
using (exists (
  select 1 from public.site_admins
  where user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.site_admins
  where user_id = (select auth.uid())
));

-- ===== BLOCK PUBLIC SUBSCRIBER ACCESS =====
-- No anonymous select/insert/update/delete policy is created.
-- Future public signup must use a rate-limited Edge Function with
-- email confirmation, abuse prevention, and unsubscribe handling.
