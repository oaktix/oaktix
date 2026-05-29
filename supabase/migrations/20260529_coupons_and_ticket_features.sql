-- Migration: Create coupons table and update transactions
-- Path: supabase/migrations/20260529_coupons_and_ticket_features.sql

create table if not exists coupons (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  discount_type text check (discount_type in ('percentage', 'fixed')) default 'percentage',
  discount_value numeric(10,2) not null check (discount_value > 0),
  max_uses integer,
  used_count integer default 0 check (used_count >= 0),
  event_id uuid references events(id) on delete cascade, -- null means all events of the creator
  creator_id uuid references profiles(id) on delete cascade not null,
  valid_from timestamptz default now(),
  valid_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast lookup by code
create index if not exists coupons_code_idx on coupons(code);

-- Alter transactions table to keep track of coupons and discounts
alter table transactions add column if not exists coupon_code text;
alter table transactions add column if0206_1 exists discount_amount numeric(10,2) default 0.00;

-- Wait, fix syntax error in alter table
alter table transactions add column if not exists coupon_code text;
alter table transactions add column if not exists discount_amount numeric(10,2) default 0.00;

-- RLS policies for coupons
alter table coupons enable row level security;

-- 1. Vendors can view their own coupons
create policy "Vendors view own coupons" on coupons 
  for select using (creator_id = auth.uid());

-- 2. Vendors can insert their own coupons
create policy "Vendors create own coupons" on coupons 
  for insert with check (creator_id = auth.uid());

-- 3. Vendors can update their own coupons
create policy "Vendors update own coupons" on coupons 
  for update using (creator_id = auth.uid()) with check (creator_id = auth.uid());

-- 4. Vendors can delete their own coupons
create policy "Vendors delete own coupons" on coupons 
  for delete using (creator_id = auth.uid());

-- 5. Admins/Super Admins can manage all coupons
create policy "Admins manage all coupons" on coupons 
  for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );

-- RPC to increment coupon usage safely (prevents race conditions)
create or replace function increment_coupon_usage(coupon_code_param text)
returns void as $$
begin
  update coupons
  set used_count = used_count + 1
  where code = coupon_code_param;
end;
$$ language plpgsql security definer;
