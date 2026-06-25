-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('user', 'vendor', 'staff', 'admin', 'super_admin')) default 'user',
  full_name text,
  avatar_url text,
  phone text,
  vendor_details jsonb default '{}'::jsonb, -- {business_name, verified, tax_id, bio}
  email_notifications jsonb default '{"purchase_confirmations": true, "event_reminders": true, "recommendations": true, "vendor_promotions": true, "price_drops": true}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- EVENTS TABLE
create table if not exists events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text unique not null,
  description text,
  type text check (type in ('physical', 'virtual', 'hybrid')),
  venue_details jsonb default '{}'::jsonb, -- {name, address, lat, lng, capacity, accessibility}
  virtual_details jsonb default '{}'::jsonb, -- {platform, link, password}
  start_date timestamptz not null,
  end_date timestamptz not null,
  timezone text default 'Africa/Lagos',
  pricing_type text check (pricing_type in ('free', 'paid', 'donation')),
  ticket_types jsonb default '[]'::jsonb, -- [{name, description, price, quantity, sale_start, sale_end, perks}]
  promo_codes jsonb default '[]'::jsonb, -- [{code, discount_type, value, usage_limit, used_count, valid_from, valid_until}]
  max_attendees integer,
  requires_approval boolean default false,
  enable_waitlist boolean default false,
  featured_image text,
  gallery_images jsonb default '[]'::jsonb,
  video_url text,
  category text,
  tags jsonb default '[]'::jsonb,
  status text check (status in ('draft', 'published', 'sold_out', 'completed', 'cancelled')) default 'draft',
  organizer_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TICKETS TABLE
create table if not exists tickets (
  id uuid default uuid_generate_v4() primary key,
  qr_code_url text not null,
  unique_code text unique not null,
  event_id uuid references events(id) on delete cascade not null,
  buyer_id uuid references profiles(id) on delete cascade not null,
  ticket_type jsonb not null, -- {name, price}
  price_paid numeric(10,2) not null,
  status text check (status in ('active', 'used', 'refunded', 'cancelled')) default 'active',
  registration_status text check (registration_status in ('approved', 'pending', 'waitlist', 'rejected')) default 'approved',
  scanned_at timestamptz,
  scanned_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- TRANSACTIONS TABLE
create table if not exists transactions (
  id uuid default uuid_generate_v4() primary key,
  reference text unique not null,
  buyer_id uuid references profiles(id) on delete set null,
  ticket_id uuid references tickets(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  amount numeric(10,2) not null,
  platform_fee numeric(10,2) default 0.00,
  vendor_net numeric(10,2) default 0.00,
  status text check (status in ('pending', 'success', 'failed', 'refunded')) default 'pending',
  payment_channel text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- SCANNERS TABLE
create table if not exists scanners (
  id uuid default uuid_generate_v4() primary key,
  staff_id uuid references profiles(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  permissions jsonb default '["scan"]'::jsonb, -- ['scan','view_guest_list','manage_event']
  assigned_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- EMAIL LOGS TABLE
create table if not exists email_logs (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references profiles(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  recipient_type text,
  recipient_count integer,
  subject text,
  body_html text,
  status text,
  sent_at timestamptz default now()
);

-- REVIEWS TABLE
create table if not exists reviews (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table events enable row level security;
alter table tickets enable row level security;
alter table transactions enable row level security;
alter table scanners enable row level security;
alter table email_logs enable row level security;
alter table reviews enable row level security;

-- PROFILES Policies
-- Users can read their own profile
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
-- Users can update their own profile
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
-- Admins can read all profiles
create policy "Admins read all profiles" on profiles for select using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
);

-- EVENTS Policies
-- Everyone can view published events
create policy "Public view published events" on events for select using (status = 'published');
-- Vendors can CRUD their own events
create policy "Vendors manage own events" on events for all using (organizer_id = auth.uid());
-- Admins can manage all events
create policy "Admins manage all events" on events for all using (
  (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
);

-- TICKETS Policies
-- Users can view their own tickets
create policy "Users view own tickets" on tickets for select using (buyer_id = auth.uid());
-- Vendors can view tickets for their events
create policy "Vendors view event tickets" on tickets for select using (
  exists (
    select 1 from events 
    where events.id = tickets.event_id 
    and events.organizer_id = auth.uid()
  )
);
-- Staff can view tickets for assigned events
create policy "Staff view assigned tickets" on tickets for select using (
  exists (
    select 1 from scanners 
    where scanners.event_id = tickets.event_id 
    and scanners.staff_id = auth.uid()
  )
);

-- TRANSACTIONS Policies
create policy "Users view own transactions" on transactions for select using (buyer_id = auth.uid());
create policy "Vendors view own revenue" on transactions for select using (
  exists (
    select 1 from events 
    where events.id = transactions.event_id 
    and events.organizer_id = auth.uid()
  )
);

-- SCANNERS Policies
create policy "Vendors manage scanners" on scanners for all using (
  exists (
    select 1 from events 
    where events.id = scanners.event_id 
    and events.organizer_id = auth.uid()
  )
);

-- REVIEWS Policies
create policy "Everyone can view reviews" on reviews for select using (true);
create policy "Users can post reviews" on reviews for insert with check (auth.uid() = user_id);

-- TRIGGER for updating profiles on user signup (handled by Supabase usually, but good to have)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

-- STORAGE BUCKETS
-- (Note: Run these via Supabase Dashboard if the extension is not active)
-- insert into storage.buckets (id, name, public) values ('qr-codes', 'qr-codes', true);

-- Storage Policies for qr-codes bucket
-- create policy "Public Access to QR Codes" on storage.objects for select using (bucket_id = 'qr-codes');
-- create policy "Service Role can manage QR Codes" on storage.objects for all using (bucket_id = 'qr-codes');
