-- ===== HOMEPAGE PROMOTION: RUN ONCE IN SUPABASE SQL EDITOR =====
-- Only authorized site admins may write. Public visitors may read published rows.
create table if not exists public.homepage_promotions (
 id integer primary key default 1 check (id=1),
 headline text not null check (char_length(headline) between 1 and 100),
 description text not null default '' check (char_length(description)<=350),
 start_date date not null,
 end_date date not null,
 destination_url text not null,
 button_label text not null default 'Learn more' check (char_length(button_label) between 1 and 45),
 image_url text,
 status text not null default 'draft' check (status in ('draft','published')),
 updated_at timestamptz not null default now(),
 constraint promotion_date_order check (end_date>=start_date)
);
alter table public.homepage_promotions enable row level security;
grant select on public.homepage_promotions to anon,authenticated;
grant insert,update,delete on public.homepage_promotions to authenticated;
create policy "Public can view published promotion" on public.homepage_promotions for select to anon using (status='published');
create policy "Admins can view promotions" on public.homepage_promotions for select to authenticated using (exists(select 1 from public.site_admins where user_id=(select auth.uid())));
create policy "Admins can insert promotions" on public.homepage_promotions for insert to authenticated with check (exists(select 1 from public.site_admins where user_id=(select auth.uid())));
create policy "Admins can update promotions" on public.homepage_promotions for update to authenticated using (exists(select 1 from public.site_admins where user_id=(select auth.uid()))) with check (exists(select 1 from public.site_admins where user_id=(select auth.uid())));
-- Keep updated_at current on edits (optional audit convenience).
