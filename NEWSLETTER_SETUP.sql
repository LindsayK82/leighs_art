-- ===== NEWSLETTER STUDIO DATA =====
-- Run in Supabase SQL Editor. Admin accounts must already exist in public.site_admins.
create table if not exists public.studio_newsletters (
 id uuid primary key default gen_random_uuid(),
 subject text not null check (char_length(subject) <= 180),
 headline text, greeting text, message text not null,
 studio_news text, artwork_id uuid, artwork_caption text,
 image_url text, attachment_url text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.studio_newsletters enable row level security;
-- ===== NEWSLETTER EDITOR: EXISTING SITE ADMINS ONLY =====
drop policy if exists "Studio admins manage newsletters" on public.studio_newsletters;
create policy "Studio admins manage newsletters" on public.studio_newsletters for all to authenticated
 using (exists (select 1 from public.site_admins where user_id = (select auth.uid())))
 with check (exists (select 1 from public.site_admins where user_id = (select auth.uid())));
-- ===== NEWSLETTER ASSET STORAGE =====
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('newsletter-assets','newsletter-assets',true,8388608,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;
drop policy if exists "Studio admins upload newsletter assets" on storage.objects;
create policy "Studio admins upload newsletter assets" on storage.objects for insert to authenticated
 with check (bucket_id = 'newsletter-assets' and exists
   (select 1 from public.site_admins where user_id = (select auth.uid())));
-- ===== OPTIONAL: SUBSCRIBER DATA (PRIVATE; NO PUBLIC READ) =====
-- Sending is intentionally not implemented until consent, unsubscribe, and server email service are set up.
create table if not exists public.newsletter_subscribers (
 id uuid primary key default gen_random_uuid(),
 email text not null unique,
 consented_at timestamptz,
 confirmed_at timestamptz,
 unsubscribed_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
-- Never expose list publicly and do not let visitors insert confirmed contacts from a browser.
