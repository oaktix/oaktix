-- ============================================================
-- PROFESSIONALS MARKETPLACE MIGRATION
-- OakTix Event Professionals Marketplace
-- Created: 2026-06-19
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PROFESSIONAL CATEGORIES
-- ─────────────────────────────────────────────────────────────
create table if not exists professional_categories (
  id           uuid default uuid_generate_v4() primary key,
  name         text not null,
  slug         text unique not null,
  description  text,
  icon         text,  -- emoji or icon name
  display_order integer default 0,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- Seed default categories
insert into professional_categories (name, slug, description, icon, display_order) values
  ('MCs',                    'mcs',                    'Masters of Ceremony for events of all sizes',            '🎤', 1),
  ('DJs',                    'djs',                    'Professional DJs for parties, weddings, and events',     '🎧', 2),
  ('Photographers',          'photographers',          'Professional event and portrait photographers',           '📸', 3),
  ('Videographers',          'videographers',          'Event videographers and cinematographers',                '🎬', 4),
  ('Caterers',               'caterers',               'Professional catering services for events',              '🍽️', 5),
  ('Event Planners',         'event-planners',         'Full-service event planning and coordination',           '📋', 6),
  ('Event Decorators',       'event-decorators',       'Creative event decoration and design',                   '🌸', 7),
  ('Makeup Artists',         'makeup-artists',         'Professional makeup and beauty artists',                 '💄', 8),
  ('Live Bands',             'live-bands',             'Live music bands for all occasions',                     '🎸', 9),
  ('Musicians',              'musicians',              'Solo musicians and instrumentalists',                    '🎵', 10),
  ('Comedians',              'comedians',              'Stand-up comedians and entertainment acts',              '😂', 11),
  ('Hypemen',                'hypemen',                'High-energy hype artists and crowd entertainers',        '🔥', 12),
  ('Ushers',                 'ushers',                 'Professional ushering services for events',             '🎩', 13),
  ('Sound Engineers',        'sound-engineers',        'Professional audio and sound system engineers',          '🔊', 14),
  ('Lighting Engineers',     'lighting-engineers',     'Event lighting design and technical engineers',          '💡', 15),
  ('Event Venues',           'event-venues',           'Halls, gardens, and unique event spaces',               '🏛️', 16),
  ('Security Services',      'security-services',      'Event security and crowd management professionals',      '🛡️', 17),
  ('Rental Services',        'rental-services',        'Chair, table, tent, and equipment rentals',             '🪑', 18),
  ('Wedding Coordinators',   'wedding-coordinators',   'Specialist wedding planners and day-of coordinators',    '💍', 19),
  ('Production Companies',   'production-companies',   'Full-service event production and AV companies',        '🎭', 20),
  ('Content Creators',       'content-creators',       'Social media content creators and influencers',         '📱', 21),
  ('Event Hosts',            'event-hosts',            'Experienced event hosts and compères',                  '🎙️', 22)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 2. PROFESSIONALS
-- ─────────────────────────────────────────────────────────────
create table if not exists professionals (
  id                  uuid default uuid_generate_v4() primary key,
  user_id             uuid references profiles(id) on delete cascade,
  category_id         uuid references professional_categories(id) on delete set null,

  -- Identity
  business_name       text,
  professional_name   text not null,
  slug                text unique not null,
  headline            text,
  bio                 text,
  years_of_experience integer default 0,

  -- Media
  profile_photo       text,
  cover_image         text,

  -- Contact
  phone               text,
  email               text,
  whatsapp            text,

  -- Social / Web
  website             text,
  instagram           text,
  facebook            text,
  twitter             text,
  linkedin            text,
  tiktok              text,
  youtube             text,

  -- Location
  city                text,
  state               text,
  country             text default 'Nigeria',

  -- Pricing
  pricing_type        text check (pricing_type in ('fixed', 'hourly', 'per_event', 'negotiable')) default 'negotiable',
  starting_price      numeric(12,2),
  currency            text default 'NGN',

  -- Trust Signals
  verified            boolean default false,
  featured            boolean default false,
  top_rated           boolean default false,
  most_booked         boolean default false,
  fast_responder      boolean default false,
  new_professional    boolean default true,

  -- Stats (denormalised for performance)
  average_rating      numeric(3,2) default 0.00,
  total_reviews       integer default 0,
  total_bookings      integer default 0,
  profile_views       integer default 0,
  inquiry_count       integer default 0,

  -- Status
  status              text check (status in ('pending', 'approved', 'rejected', 'suspended')) default 'pending',
  rejection_reason    text,
  approved_at         timestamptz,
  approved_by         uuid references profiles(id) on delete set null,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_professionals_status       on professionals(status);
create index if not exists idx_professionals_category_id  on professionals(category_id);
create index if not exists idx_professionals_user_id      on professionals(user_id);
create index if not exists idx_professionals_featured     on professionals(featured) where featured = true;
create index if not exists idx_professionals_verified     on professionals(verified) where verified = true;
create index if not exists idx_professionals_city         on professionals(city);
create index if not exists idx_professionals_slug         on professionals(slug);
create index if not exists idx_professionals_avg_rating   on professionals(average_rating desc);

-- Full-text search index
create index if not exists idx_professionals_fts on professionals
  using gin(to_tsvector('english', coalesce(professional_name,'') || ' ' || coalesce(business_name,'') || ' ' || coalesce(headline,'') || ' ' || coalesce(bio,'')));

-- ─────────────────────────────────────────────────────────────
-- 3. PROFESSIONAL PORTFOLIO
-- ─────────────────────────────────────────────────────────────
create table if not exists professional_portfolio (
  id               uuid default uuid_generate_v4() primary key,
  professional_id  uuid references professionals(id) on delete cascade not null,
  title            text,
  description      text,
  media_type       text check (media_type in ('image', 'video')) default 'image',
  image_url        text,
  video_url        text,
  thumbnail_url    text,
  display_order    integer default 0,
  created_at       timestamptz default now()
);

create index if not exists idx_portfolio_professional_id on professional_portfolio(professional_id);

-- ─────────────────────────────────────────────────────────────
-- 4. PROFESSIONAL REVIEWS
-- ─────────────────────────────────────────────────────────────
create table if not exists professional_reviews (
  id               uuid default uuid_generate_v4() primary key,
  professional_id  uuid references professionals(id) on delete cascade not null,
  reviewer_id      uuid references profiles(id) on delete set null,
  reviewer_name    text,   -- for guest reviews
  reviewer_email   text,   -- for guest reviews
  rating           integer check (rating >= 1 and rating <= 5) not null,
  review           text,
  is_verified      boolean default false,  -- verified client
  is_flagged       boolean default false,
  created_at       timestamptz default now()
);

create index if not exists idx_reviews_professional_id on professional_reviews(professional_id);

-- ─────────────────────────────────────────────────────────────
-- 5. PROFESSIONAL INQUIRIES
-- ─────────────────────────────────────────────────────────────
create table if not exists professional_inquiries (
  id               uuid default uuid_generate_v4() primary key,
  professional_id  uuid references professionals(id) on delete cascade not null,
  sender_id        uuid references profiles(id) on delete set null,

  -- Sender info (for guest inquiries)
  name             text not null,
  email            text not null,
  phone            text,
  whatsapp         text,

  -- Event details
  event_type       text,
  event_date       date,
  event_location   text,
  guest_count      integer,
  budget           numeric(12,2),
  currency         text default 'NGN',

  message          text,

  -- Status
  status           text check (status in ('new', 'read', 'contacted', 'quoted', 'booked', 'closed', 'spam')) default 'new',
  professional_reply text,
  replied_at       timestamptz,

  created_at       timestamptz default now()
);

create index if not exists idx_inquiries_professional_id on professional_inquiries(professional_id);
create index if not exists idx_inquiries_status          on professional_inquiries(status);
create index if not exists idx_inquiries_sender_id       on professional_inquiries(sender_id);

-- ─────────────────────────────────────────────────────────────
-- 6. PROFESSIONAL BOOKINGS
-- ─────────────────────────────────────────────────────────────
create table if not exists professional_bookings (
  id               uuid default uuid_generate_v4() primary key,
  professional_id  uuid references professionals(id) on delete cascade not null,
  client_id        uuid references profiles(id) on delete set null,
  inquiry_id       uuid references professional_inquiries(id) on delete set null,

  -- Booking details
  client_name      text not null,
  client_email     text not null,
  client_phone     text,

  event_type       text,
  event_date       date,
  event_location   text,

  agreed_amount    numeric(12,2),
  currency         text default 'NGN',

  status           text check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'disputed')) default 'pending',
  notes            text,

  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_bookings_professional_id on professional_bookings(professional_id);
create index if not exists idx_bookings_client_id       on professional_bookings(client_id);

-- ─────────────────────────────────────────────────────────────
-- 7. EVENT TEAM REQUESTS (Event Team Builder)
-- ─────────────────────────────────────────────────────────────
create table if not exists event_team_requests (
  id               uuid default uuid_generate_v4() primary key,
  requester_id     uuid references profiles(id) on delete set null,

  -- Requester info (for guests)
  requester_name   text not null,
  requester_email  text not null,
  requester_phone  text,

  -- Event details
  event_type       text not null,
  event_date       date,
  event_location   text,
  city             text,
  state            text,
  guest_count      integer,
  total_budget     numeric(12,2),
  currency         text default 'NGN',
  additional_notes text,

  -- Status
  status           text check (status in ('draft', 'submitted', 'in_progress', 'completed', 'cancelled')) default 'submitted',

  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_team_requests_requester_id on event_team_requests(requester_id);
create index if not exists idx_team_requests_status       on event_team_requests(status);

-- ─────────────────────────────────────────────────────────────
-- 8. EVENT TEAM MEMBERS
-- ─────────────────────────────────────────────────────────────
create table if not exists event_team_members (
  id               uuid default uuid_generate_v4() primary key,
  request_id       uuid references event_team_requests(id) on delete cascade not null,
  professional_id  uuid references professionals(id) on delete cascade not null,
  category_id      uuid references professional_categories(id) on delete set null,

  -- Response from professional
  status           text check (status in ('pending', 'accepted', 'declined', 'no_response')) default 'pending',
  quoted_amount    numeric(12,2),
  professional_message text,
  responded_at     timestamptz,

  created_at       timestamptz default now()
);

create index if not exists idx_team_members_request_id      on event_team_members(request_id);
create index if not exists idx_team_members_professional_id on event_team_members(professional_id);

-- ─────────────────────────────────────────────────────────────
-- 9. PROFESSIONAL ANALYTICS (daily snapshots)
-- ─────────────────────────────────────────────────────────────
create table if not exists professional_analytics (
  id               uuid default uuid_generate_v4() primary key,
  professional_id  uuid references professionals(id) on delete cascade not null,
  date             date not null,
  profile_views    integer default 0,
  portfolio_views  integer default 0,
  contact_clicks   integer default 0,   -- whatsapp/call/email
  inquiry_count    integer default 0,
  booking_count    integer default 0,

  unique (professional_id, date)
);

create index if not exists idx_analytics_professional_id on professional_analytics(professional_id);
create index if not exists idx_analytics_date            on professional_analytics(date);

-- ─────────────────────────────────────────────────────────────
-- 10. TRIGGERS: Updated_at + auto-update stats
-- ─────────────────────────────────────────────────────────────

-- Updated_at trigger function (reuse if exists)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger professionals_updated_at
  before update on professionals
  for each row execute function update_updated_at_column();

create trigger professional_bookings_updated_at
  before update on professional_bookings
  for each row execute function update_updated_at_column();

create trigger event_team_requests_updated_at
  before update on event_team_requests
  for each row execute function update_updated_at_column();

-- Auto-update average_rating and total_reviews on professionals when a review is inserted/deleted
create or replace function sync_professional_review_stats()
returns trigger as $$
declare
  prof_id uuid;
  avg_r   numeric;
  total_r integer;
begin
  if TG_OP = 'DELETE' then
    prof_id := old.professional_id;
  else
    prof_id := new.professional_id;
  end if;

  select
    coalesce(avg(rating), 0),
    count(*)
  into avg_r, total_r
  from professional_reviews
  where professional_id = prof_id;

  update professionals
  set
    average_rating = round(avg_r, 2),
    total_reviews  = total_r
  where id = prof_id;

  return null;
end;
$$ language plpgsql;

create trigger sync_review_stats_on_insert
  after insert or update or delete on professional_reviews
  for each row execute function sync_professional_review_stats();

-- Auto-increment inquiry_count when a new inquiry is inserted
create or replace function increment_inquiry_count()
returns trigger as $$
begin
  update professionals
  set inquiry_count = inquiry_count + 1
  where id = new.professional_id;
  return null;
end;
$$ language plpgsql;

create trigger auto_increment_inquiry_count
  after insert on professional_inquiries
  for each row execute function increment_inquiry_count();

-- Auto-increment total_bookings when booking is confirmed
create or replace function increment_booking_count()
returns trigger as $$
begin
  if new.status = 'confirmed' and (old.status is null or old.status <> 'confirmed') then
    update professionals
    set total_bookings = total_bookings + 1
    where id = new.professional_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger auto_increment_booking_count
  after insert or update on professional_bookings
  for each row execute function increment_booking_count();

-- ─────────────────────────────────────────────────────────────
-- 11. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

alter table professional_categories  enable row level security;
alter table professionals            enable row level security;
alter table professional_portfolio   enable row level security;
alter table professional_reviews     enable row level security;
alter table professional_inquiries   enable row level security;
alter table professional_bookings    enable row level security;
alter table event_team_requests      enable row level security;
alter table event_team_members       enable row level security;
alter table professional_analytics   enable row level security;

-- ── professional_categories (public read, admin write) ──────
create policy "Anyone can view categories"
  on professional_categories for select using (true);

create policy "Admins manage categories"
  on professional_categories for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );

-- ── professionals (public read approved, owner + admin write) ─
create policy "Anyone can view approved professionals"
  on professionals for select using (status = 'approved');

create policy "Admins can view all professionals"
  on professionals for select using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );

create policy "Users can view their own profile"
  on professionals for select using (user_id = auth.uid());

create policy "Authenticated users can create professional profile"
  on professionals for insert with check (auth.uid() = user_id);

create policy "Professionals can update their own profile"
  on professionals for update using (user_id = auth.uid());

create policy "Admins can manage all professionals"
  on professionals for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );

-- ── professional_portfolio ───────────────────────────────────
create policy "Anyone can view portfolio of approved professionals"
  on professional_portfolio for select using (
    exists (
      select 1 from professionals p
      where p.id = professional_portfolio.professional_id
      and p.status = 'approved'
    )
  );

create policy "Professionals can manage their own portfolio"
  on professional_portfolio for all using (
    exists (
      select 1 from professionals p
      where p.id = professional_portfolio.professional_id
      and p.user_id = auth.uid()
    )
  );

create policy "Admins can manage all portfolios"
  on professional_portfolio for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );

-- ── professional_reviews ─────────────────────────────────────
create policy "Anyone can view reviews"
  on professional_reviews for select using (is_flagged = false);

create policy "Authenticated users can post reviews"
  on professional_reviews for insert with check (
    auth.uid() is not null and auth.uid() = reviewer_id
  );

create policy "Admins manage reviews"
  on professional_reviews for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );

-- ── professional_inquiries ───────────────────────────────────
create policy "Professionals can view their own inquiries"
  on professional_inquiries for select using (
    exists (
      select 1 from professionals p
      where p.id = professional_inquiries.professional_id
      and p.user_id = auth.uid()
    )
  );

create policy "Senders can view their own inquiries"
  on professional_inquiries for select using (sender_id = auth.uid());

create policy "Anyone can submit inquiries"
  on professional_inquiries for insert with check (true);

create policy "Professionals can reply to inquiries"
  on professional_inquiries for update using (
    exists (
      select 1 from professionals p
      where p.id = professional_inquiries.professional_id
      and p.user_id = auth.uid()
    )
  );

create policy "Admins manage all inquiries"
  on professional_inquiries for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );

-- ── professional_bookings ────────────────────────────────────
create policy "Professionals can view their own bookings"
  on professional_bookings for select using (
    exists (
      select 1 from professionals p
      where p.id = professional_bookings.professional_id
      and p.user_id = auth.uid()
    )
  );

create policy "Clients can view their own bookings"
  on professional_bookings for select using (client_id = auth.uid());

create policy "Anyone can create bookings"
  on professional_bookings for insert with check (true);

create policy "Admins manage all bookings"
  on professional_bookings for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );

-- ── event_team_requests ──────────────────────────────────────
create policy "Anyone can submit team requests"
  on event_team_requests for insert with check (true);

create policy "Requesters can view their own team requests"
  on event_team_requests for select using (requester_id = auth.uid());

create policy "Admins manage all team requests"
  on event_team_requests for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );

-- ── event_team_members ───────────────────────────────────────
create policy "Professionals can view team requests sent to them"
  on event_team_members for select using (
    exists (
      select 1 from professionals p
      where p.id = event_team_members.professional_id
      and p.user_id = auth.uid()
    )
  );

create policy "Anyone can view team member records for their request"
  on event_team_members for select using (
    exists (
      select 1 from event_team_requests r
      where r.id = event_team_members.request_id
      and r.requester_id = auth.uid()
    )
  );

create policy "Admins manage all team members"
  on event_team_members for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );

-- ── professional_analytics ───────────────────────────────────
create policy "Professionals can view their own analytics"
  on professional_analytics for select using (
    exists (
      select 1 from professionals p
      where p.id = professional_analytics.professional_id
      and p.user_id = auth.uid()
    )
  );

create policy "Admins view all analytics"
  on professional_analytics for select using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'super_admin')
  );

-- Service role can insert/upsert analytics (for server-side tracking)
create policy "Service role manages analytics"
  on professional_analytics for all using (
    auth.role() = 'service_role'
  );

-- ─────────────────────────────────────────────────────────────
-- 12. STORAGE BUCKET (run separately if needed)
-- ─────────────────────────────────────────────────────────────
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values ('professionals', 'professionals', true, 10485760,
--         '{image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm}')
-- on conflict (id) do nothing;
--
-- create policy "Public access to professional media"
--   on storage.objects for select using (bucket_id = 'professionals');
-- create policy "Authenticated users can upload professional media"
--   on storage.objects for insert with check (bucket_id = 'professionals' and auth.uid() is not null);
-- create policy "Users can delete their own professional media"
--   on storage.objects for delete using (bucket_id = 'professionals' and auth.uid()::text = (storage.foldername(name))[1]);
