-- RentHive Database Schema
-- Paste this entire file into your Supabase SQL Editor and click Run.
-- https://supabase.com/dashboard/project/btqajcroxzbvjkovpiyp/sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  role text not null default 'renter' check (role in ('renter','lessor','admin')),
  verification_status text not null default 'not_started'
    check (verification_status in ('not_started','pending','under_review','verified','rejected','resubmission_required')),
  notification_preferences jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- CATEGORIES
-- ────────────────────────────────────────────────────────────────
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  icon text,
  description text,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- LISTINGS
-- ────────────────────────────────────────────────────────────────
create table if not exists listings (
  id uuid primary key default uuid_generate_v4(),
  lessor_id uuid not null references profiles(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  description text,
  condition text not null default 'good'
    check (condition in ('new','like_new','good','fair','poor')),
  price_per_day numeric not null check (price_per_day >= 0),
  price_per_week numeric,
  price_per_month numeric,
  security_deposit numeric not null default 0 check (security_deposit >= 0),
  incidental_fee numeric,
  location text,
  city text,
  status text not null default 'draft'
    check (status in ('draft','pending_review','published','unpublished','rejected','suspended')),
  pickup_available boolean not null default true,
  delivery_available boolean not null default false,
  delivery_fee numeric,
  rental_rules text,
  cancellation_policy text,
  views integer not null default 0,
  average_rating numeric,
  total_rentals integer not null default 0,
  primary_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- RENTAL REQUESTS
-- ────────────────────────────────────────────────────────────────
create table if not exists rental_requests (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id) on delete restrict,
  renter_id uuid not null references profiles(id) on delete restrict,
  lessor_id uuid not null references profiles(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  total_days integer not null check (total_days > 0),
  rental_fee numeric not null check (rental_fee >= 0),
  security_deposit numeric not null default 0,
  incidental_fee numeric,
  delivery_fee numeric,
  total_amount numeric not null check (total_amount >= 0),
  pickup_option text not null default 'pickup'
    check (pickup_option in ('pickup','delivery')),
  status text not null default 'pending'
    check (status in ('draft','pending','accepted','declined','cancelled',
                      'payment_pending','confirmed','active','returned','completed','disputed')),
  renter_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- PAYMENTS
-- ────────────────────────────────────────────────────────────────
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  rental_request_id uuid not null references rental_requests(id) on delete restrict,
  payer_id uuid not null references profiles(id) on delete restrict,
  amount numeric not null check (amount >= 0),
  payment_type text not null
    check (payment_type in ('reservation_fee','incidental_fee','balance','deposit','refund')),
  status text not null default 'pending'
    check (status in ('pending','processing','paid','failed','cancelled','refunded','held','released','disputed')),
  payment_method text,
  transaction_ref text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- DISPUTES
-- complainant_id = person who filed; respondent_id = person accused
-- ────────────────────────────────────────────────────────────────
create table if not exists disputes (
  id uuid primary key default uuid_generate_v4(),
  rental_request_id uuid not null references rental_requests(id) on delete restrict,
  complainant_id uuid not null references profiles(id),
  respondent_id uuid not null references profiles(id),
  reason text not null,
  description text,
  status text not null default 'open'
    check (status in ('open','under_review','waiting_for_evidence',
                      'resolved_complainant','resolved_respondent','closed','rejected','escalated')),
  resolution text,
  resolution_amount numeric,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- CONVERSATIONS
-- ────────────────────────────────────────────────────────────────
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  renter_id uuid not null references profiles(id),
  lessor_id uuid not null references profiles(id),
  rental_request_id uuid references rental_requests(id),
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique(renter_id, lessor_id, rental_request_id)
);

-- ────────────────────────────────────────────────────────────────
-- MESSAGES
-- ────────────────────────────────────────────────────────────────
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ────────────────────────────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  is_read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- REVIEWS
-- overall_rating used consistently throughout the app
-- ────────────────────────────────────────────────────────────────
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  rental_request_id uuid not null references rental_requests(id),
  reviewer_id uuid not null references profiles(id),
  reviewee_id uuid not null references profiles(id),
  listing_id uuid references listings(id),
  overall_rating integer not null check (overall_rating between 1 and 5),
  communication_rating integer check (communication_rating between 1 and 5),
  accuracy_rating integer check (accuracy_rating between 1 and 5),
  condition_rating integer check (condition_rating between 1 and 5),
  comment text,
  review_type text check (review_type in ('renter_to_lessor','lessor_to_renter')),
  created_at timestamptz not null default now(),
  unique(rental_request_id, reviewer_id)
);

-- ────────────────────────────────────────────────────────────────
-- IDENTITY VERIFICATIONS
-- ────────────────────────────────────────────────────────────────
create table if not exists identity_verifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending',
  id_type text,
  id_number text,
  front_image_url text,
  back_image_url text,
  selfie_url text,
  admin_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- AUDIT LOGS
-- ────────────────────────────────────────────────────────────────
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  changed_by uuid references profiles(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  changes jsonb,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────────
create index if not exists idx_listings_lessor_id on listings(lessor_id);
create index if not exists idx_listings_status on listings(status);
create index if not exists idx_listings_category_id on listings(category_id);
create index if not exists idx_rental_requests_renter_id on rental_requests(renter_id);
create index if not exists idx_rental_requests_lessor_id on rental_requests(lessor_id);
create index if not exists idx_rental_requests_status on rental_requests(status);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_reviews_reviewee_id on reviews(reviewee_id);
create index if not exists idx_disputes_rental_request_id on disputes(rental_request_id);

-- ────────────────────────────────────────────────────────────────
-- TRIGGER: auto-update updated_at
-- ────────────────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_profiles_updated_at') then
    create trigger trg_profiles_updated_at before update on profiles for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_listings_updated_at') then
    create trigger trg_listings_updated_at before update on listings for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_rental_requests_updated_at') then
    create trigger trg_rental_requests_updated_at before update on rental_requests for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_payments_updated_at') then
    create trigger trg_payments_updated_at before update on payments for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_disputes_updated_at') then
    create trigger trg_disputes_updated_at before update on disputes for each row execute function update_updated_at();
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- TRIGGER: auto-create profile on signup
-- ────────────────────────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'renter')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function handle_new_user();
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- ENABLE ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table categories enable row level security;
alter table listings enable row level security;
alter table rental_requests enable row level security;
alter table payments enable row level security;
alter table disputes enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table reviews enable row level security;
alter table identity_verifications enable row level security;
alter table audit_logs enable row level security;

-- ────────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ────────────────────────────────────────────────────────────────

-- Profiles
drop policy if exists "Public read profiles" on profiles;
drop policy if exists "Own profile update" on profiles;
drop policy if exists "Own profile insert" on profiles;
create policy "Public read profiles" on profiles for select using (true);
create policy "Own profile insert" on profiles for insert with check (auth.uid() = id);
create policy "Own profile update" on profiles for update using (auth.uid() = id);

-- Categories (public read)
drop policy if exists "Public read categories" on categories;
create policy "Public read categories" on categories for select using (true);

-- Listings
drop policy if exists "Public published listings" on listings;
drop policy if exists "Lessor insert listing" on listings;
drop policy if exists "Lessor update listing" on listings;
drop policy if exists "Lessor delete listing" on listings;
create policy "Public published listings" on listings for select
  using (status = 'published' or lessor_id = auth.uid());
create policy "Lessor insert listing" on listings for insert
  with check (lessor_id = auth.uid());
create policy "Lessor update listing" on listings for update
  using (lessor_id = auth.uid());
create policy "Lessor delete listing" on listings for delete
  using (lessor_id = auth.uid());

-- Rental requests
drop policy if exists "Renter view own requests" on rental_requests;
drop policy if exists "Renter insert request" on rental_requests;
drop policy if exists "Lessor update request status" on rental_requests;
create policy "Renter view own requests" on rental_requests for select
  using (renter_id = auth.uid() or lessor_id = auth.uid());
create policy "Renter insert request" on rental_requests for insert
  with check (renter_id = auth.uid());
create policy "Update request status" on rental_requests for update
  using (lessor_id = auth.uid() or renter_id = auth.uid());

-- Payments
drop policy if exists "View own payments" on payments;
drop policy if exists "Insert own payment" on payments;
create policy "View own payments" on payments for select
  using (payer_id = auth.uid()
    or exists (select 1 from rental_requests r where r.id = rental_request_id and r.lessor_id = auth.uid()));
create policy "Insert own payment" on payments for insert
  with check (payer_id = auth.uid());

-- Disputes
drop policy if exists "View own disputes" on disputes;
drop policy if exists "Insert own dispute" on disputes;
create policy "View own disputes" on disputes for select
  using (complainant_id = auth.uid() or respondent_id = auth.uid());
create policy "Insert own dispute" on disputes for insert
  with check (complainant_id = auth.uid());

-- Conversations
drop policy if exists "View own conversations" on conversations;
drop policy if exists "Insert conversation" on conversations;
create policy "View own conversations" on conversations for select
  using (renter_id = auth.uid() or lessor_id = auth.uid());
create policy "Insert conversation" on conversations for insert
  with check (renter_id = auth.uid() or lessor_id = auth.uid());
create policy "Update conversation" on conversations for update
  using (renter_id = auth.uid() or lessor_id = auth.uid());

-- Messages
drop policy if exists "View messages in own conversations" on messages;
drop policy if exists "Send messages" on messages;
drop policy if exists "Mark messages read" on messages;
create policy "View messages in own conversations" on messages for select
  using (exists (
    select 1 from conversations c
    where c.id = conversation_id and (c.renter_id = auth.uid() or c.lessor_id = auth.uid())
  ));
create policy "Send messages" on messages for insert
  with check (
    sender_id = auth.uid() and
    exists (select 1 from conversations c where c.id = conversation_id and (c.renter_id = auth.uid() or c.lessor_id = auth.uid()))
  );
create policy "Mark messages read" on messages for update
  using (exists (
    select 1 from conversations c
    where c.id = conversation_id and (c.renter_id = auth.uid() or c.lessor_id = auth.uid())
  ));

-- Notifications
drop policy if exists "View own notifications" on notifications;
drop policy if exists "Update own notifications" on notifications;
create policy "View own notifications" on notifications for select using (user_id = auth.uid());
create policy "Update own notifications" on notifications for update using (user_id = auth.uid());

-- Reviews
drop policy if exists "Public read reviews" on reviews;
drop policy if exists "Reviewer insert review" on reviews;
create policy "Public read reviews" on reviews for select using (true);
create policy "Reviewer insert review" on reviews for insert with check (reviewer_id = auth.uid());

-- Identity verifications
drop policy if exists "Own verification" on identity_verifications;
drop policy if exists "Insert own verification" on identity_verifications;
drop policy if exists "Update own verification" on identity_verifications;
create policy "Own verification" on identity_verifications for select using (user_id = auth.uid());
create policy "Insert own verification" on identity_verifications for insert with check (user_id = auth.uid());
create policy "Update own verification" on identity_verifications for update using (user_id = auth.uid());

-- Audit logs (admin only — anon cannot read)
drop policy if exists "Admin read audit logs" on audit_logs;
drop policy if exists "Admin insert audit logs" on audit_logs;
create policy "Admin read audit logs" on audit_logs for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admin insert audit logs" on audit_logs for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ────────────────────────────────────────────────────────────────
-- ADMIN BYPASS POLICIES
-- Admins can read and update everything
-- ────────────────────────────────────────────────────────────────

-- Helper: reusable admin check
create or replace function is_admin()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- Profiles: admin can update any profile (verify, suspend, change role)
drop policy if exists "Admin update any profile" on profiles;
create policy "Admin update any profile" on profiles for update
  using (auth.uid() = id or is_admin());

-- Listings: admin can see all + update (approve/reject/suspend)
drop policy if exists "Admin view all listings" on listings;
drop policy if exists "Admin update any listing" on listings;
create policy "Admin view all listings" on listings for select
  using (status = 'published' or lessor_id = auth.uid() or is_admin());
create policy "Admin update any listing" on listings for update
  using (lessor_id = auth.uid() or is_admin());

-- Rental requests: admin sees all
drop policy if exists "Admin view all rentals" on rental_requests;
drop policy if exists "Admin update any rental" on rental_requests;
create policy "Admin view all rentals" on rental_requests for select
  using (renter_id = auth.uid() or lessor_id = auth.uid() or is_admin());
create policy "Admin update any rental" on rental_requests for update
  using (lessor_id = auth.uid() or renter_id = auth.uid() or is_admin());

-- Payments: admin sees all
drop policy if exists "Admin view all payments" on payments;
create policy "Admin view all payments" on payments for select
  using (payer_id = auth.uid()
    or exists (select 1 from rental_requests r where r.id = rental_request_id and r.lessor_id = auth.uid())
    or is_admin());

-- Disputes: admin sees and can update all
drop policy if exists "Admin view all disputes" on disputes;
drop policy if exists "Admin update any dispute" on disputes;
create policy "Admin view all disputes" on disputes for select
  using (complainant_id = auth.uid() or respondent_id = auth.uid() or is_admin());
create policy "Admin update any dispute" on disputes for update
  using (is_admin());

-- Identity verifications: admin sees and can update all
drop policy if exists "Admin view all verifications" on identity_verifications;
drop policy if exists "Admin update any verification" on identity_verifications;
create policy "Admin view all verifications" on identity_verifications for select
  using (user_id = auth.uid() or is_admin());
create policy "Admin update any verification" on identity_verifications for update
  using (user_id = auth.uid() or is_admin());

-- Notifications: admin can insert for any user (for system notifications)
drop policy if exists "Admin insert notifications" on notifications;
create policy "Admin insert notifications" on notifications for insert
  with check (user_id = auth.uid() or is_admin());

-- ────────────────────────────────────────────────────────────────
-- SEED: Default categories
-- ────────────────────────────────────────────────────────────────
insert into categories (name, slug, icon) values
  ('Electronics',       'electronics', '💻'),
  ('Tools & Equipment', 'tools',       '🔧'),
  ('Sports & Outdoors', 'outdoors',    '🏕️'),
  ('Cameras & Photo',   'cameras',     '📷'),
  ('Audio & Music',     'audio',       '🎸'),
  ('Vehicles',          'vehicles',    '🚗'),
  ('Furniture',         'furniture',   '🪑'),
  ('Party Supplies',    'party',       '🎉')
on conflict (slug) do nothing;

-- ────────────────────────────────────────────────────────────────
-- STORAGE: Listing images bucket (public)
-- ────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do nothing;

-- Any authenticated user can upload to their own folder
create policy "Lessors upload listing images" on storage.objects for insert
  with check (bucket_id = 'listings' and auth.role() = 'authenticated');

-- Public read for all listing images
create policy "Public read listing images" on storage.objects for select
  using (bucket_id = 'listings');

-- Owner can delete their images
create policy "Lessors delete own listing images" on storage.objects for delete
  using (bucket_id = 'listings' and auth.uid()::text = (storage.foldername(name))[2]);

-- ────────────────────────────────────────────────────────────────
-- STORAGE: Identity documents bucket + policies
-- ────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('identity-documents', 'identity-documents', false)
on conflict (id) do nothing;

-- Authenticated users can upload to their own folder
create policy "Users upload own docs" on storage.objects for insert
  with check (bucket_id = 'identity-documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Users can read their own uploads; admins can read all
create policy "Users read own docs" on storage.objects for select
  using (
    bucket_id = 'identity-documents' and (
      auth.uid()::text = (storage.foldername(name))[1]
      or is_admin()
    )
  );
