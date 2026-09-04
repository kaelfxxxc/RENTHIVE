create table if not exists platform_settings (
  -- boolean PK with a truth check == at most one row, ever
  id                      boolean primary key default true check (id),
  site_name               text    not null default 'RentHive',
  support_email           text    not null default 'support@renthive.ph',
  platform_fee_percent    numeric not null default 10 check (platform_fee_percent between 0 and 50),
  reservation_fee_percent numeric not null default 10 check (reservation_fee_percent between 0 and 100),
  max_rental_days         integer not null default 90 check (max_rental_days between 1 and 3650),
  require_verification    boolean not null default true,
  allow_guest_browse      boolean not null default true,
  updated_at              timestamptz not null default now(),
  updated_by              uuid references profiles(id)
);

alter table platform_settings enable row level security;

drop policy if exists "Public read platform settings"  on platform_settings;
drop policy if exists "Admin insert platform settings" on platform_settings;
drop policy if exists "Admin update platform settings" on platform_settings;

-- Anon must be able to read allow_guest_browse before signing in.
create policy "Public read platform settings" on platform_settings
  for select using (true);
create policy "Admin insert platform settings" on platform_settings
  for insert with check (is_admin());
create policy "Admin update platform settings" on platform_settings
  for update using (is_admin());

drop trigger if exists trg_platform_settings_updated_at on platform_settings;
create trigger trg_platform_settings_updated_at
  before update on platform_settings
  for each row execute function update_updated_at();

-- NOTE: deliberately no INSERT here. The app reads with maybeSingle() and
-- falls back to DEFAULT_SETTINGS in src/contexts/SettingsContext.tsx; the
-- first admin save upserts the row.

-- Read the effective platform fee as a multiplier (0.10 for 10%).
-- Falls back to the same default as the column / the TS constant.
create or replace function platform_fee_rate()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select platform_fee_percent from platform_settings where id), 10) / 100.0;
$$;


-- 2. DENORMALIZED COLUMN MAINTENANCE
--    listings.average_rating / total_rentals / views were read by the
--    UI but never written. These keep them true.
--    security definer: a renter posting a review has no UPDATE right
--    on the lessor's listing.

-- listings.average_rating ← avg(reviews.overall_rating)
create or replace function refresh_listing_rating(p_listing uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update listings l
     set average_rating = (
           select round(avg(r.overall_rating)::numeric, 2)
             from reviews r
            where r.listing_id = l.id
         )
   where l.id = p_listing;
$$;

create or replace function trg_reviews_refresh_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Recompute (not increment) so the trigger is idempotent and self-heals.
  if tg_op in ('UPDATE', 'DELETE') and old.listing_id is not null then
    perform refresh_listing_rating(old.listing_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.listing_id is not null then
    perform refresh_listing_rating(new.listing_id);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_reviews_rating on reviews;
create trigger trg_reviews_rating
  after insert or update or delete on reviews
  for each row execute function trg_reviews_refresh_rating();

-- listings.total_rentals ← count of completed rentals
create or replace function refresh_listing_rental_count(p_listing uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update listings l
     set total_rentals = (
           select count(*)
             from rental_requests r
            where r.listing_id = l.id
              and r.status = 'completed'
         )
   where l.id = p_listing;
$$;

create or replace function trg_rentals_refresh_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.listing_id is not null then
    perform refresh_listing_rental_count(new.listing_id);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_rental_requests_count on rental_requests;
create trigger trg_rental_requests_count
  after insert or update of status on rental_requests
  for each row execute function trg_rentals_refresh_count();

-- listings.views — a plain UPDATE from the client is blocked by the
-- "Lessor update listing" policy, so every visitor's view was silently
-- dropped. Definer function, restricted to published listings so it
-- can't be used to probe drafts.
create or replace function increment_listing_views(p_listing uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update listings
     set views = views + 1
   where id = p_listing
     and status = 'published';
$$;

grant execute on function increment_listing_views(uuid) to anon, authenticated;

-- One-time backfill of values that were never maintained before.
-- Derived entirely from existing rows — invents nothing.
update listings l set average_rating = (
  select round(avg(r.overall_rating)::numeric, 2) from reviews r where r.listing_id = l.id
) where exists (select 1 from reviews r where r.listing_id = l.id);

update listings l set total_rentals = (
  select count(*) from rental_requests r where r.listing_id = l.id and r.status = 'completed'
);


-- ────────────────────────────────────────────────────────────────
-- 3. NOTIFICATIONS
--    The notifications table + realtime subscription already existed,
--    but nothing ever inserted a row, so the page was always empty.
--    `type` values match the emoji map in src/pages/NotificationsPage.tsx
--    and `link` uses only routes that exist in src/App.tsx.
-- ────────────────────────────────────────────────────────────────

create or replace function role_of(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = p_user;
$$;

create or replace function notify_user(
  p_user    uuid,
  p_title   text,
  p_message text,
  p_type    text,
  p_link    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user is null then
    return;
  end if;
  insert into notifications (user_id, title, message, type, link)
  values (p_user, p_title, p_message, p_type, p_link);
end;
$$;

-- Rental requests: new request → lessor; status change → the counterparty.
create or replace function trg_notify_rental_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_type  text;
  v_listing text;
begin
  select title into v_listing from listings where id = new.listing_id;
  v_listing := coalesce(v_listing, 'a listing');

  if tg_op = 'INSERT' then
    perform notify_user(
      new.lessor_id,
      'New rental request',
      'You have a new request for "' || v_listing || '".',
      'rental_request',
      '/lessor/requests'
    );
    return null;
  end if;

  if new.status is not distinct from old.status then
    return null;
  end if;

  -- Map status → the copy and the icon key the UI already knows.
  case new.status
    when 'accepted'         then v_title := 'Request accepted';   v_type := 'request_accepted';
    when 'declined'         then v_title := 'Request declined';   v_type := 'request_declined';
    when 'cancelled'        then v_title := 'Rental cancelled';   v_type := 'request_declined';
    when 'payment_pending'  then v_title := 'Payment required';   v_type := 'payment';
    when 'confirmed'        then v_title := 'Rental confirmed';   v_type := 'request_accepted';
    when 'active'           then v_title := 'Rental started';     v_type := 'handover';
    when 'returned'         then v_title := 'Item returned';      v_type := 'return';
    when 'completed'        then v_title := 'Rental completed';   v_type := 'review';
    when 'disputed'         then v_title := 'Rental disputed';    v_type := 'dispute';
    else                         v_title := 'Rental updated';     v_type := 'rental_request';
  end case;

  -- Notify the party who did NOT trigger the change; if we can't tell
  -- (no auth context, e.g. a SQL-side update), notify both.
  if auth.uid() is distinct from new.renter_id then
    perform notify_user(new.renter_id, v_title,
      '"' || v_listing || '" — status is now ' || replace(new.status, '_', ' ') || '.',
      v_type, '/renter/rentals/' || new.id);
  end if;

  if auth.uid() is distinct from new.lessor_id then
    perform notify_user(new.lessor_id, v_title,
      '"' || v_listing || '" — status is now ' || replace(new.status, '_', ' ') || '.',
      v_type, '/lessor/rentals');
  end if;

  return null;
end;
$$;

drop trigger if exists trg_rental_requests_notify on rental_requests;
create trigger trg_rental_requests_notify
  after insert or update of status on rental_requests
  for each row execute function trg_notify_rental_request();

-- Payments: a completed payment → the lessor on that rental.
create or replace function trg_notify_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lessor uuid;
begin
  if new.status <> 'paid' then
    return null;
  end if;

  select lessor_id into v_lessor from rental_requests where id = new.rental_request_id;

  if v_lessor is distinct from new.payer_id then
    perform notify_user(
      v_lessor,
      'Payment received',
      '₱' || trim(to_char(new.amount, 'FM999999999D00')) || ' ' ||
        replace(new.payment_type, '_', ' ') || ' has been paid.',
      'payment',
      '/lessor/rentals'
    );
  end if;
  return null;
end;
$$;

drop trigger if exists trg_payments_notify on payments;
create trigger trg_payments_notify
  after insert or update of status on payments
  for each row execute function trg_notify_payment();

-- Messages: notify the other participant, but collapse a burst of
-- messages into one unread notification per conversation.
create or replace function trg_notify_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_sender    text;
  v_link      text;
begin
  select case when c.renter_id = new.sender_id then c.lessor_id else c.renter_id end
    into v_recipient
    from conversations c
   where c.id = new.conversation_id;

  if v_recipient is null then
    return null;
  end if;

  v_link := case when role_of(v_recipient) = 'lessor'
                 then '/lessor/messages' else '/renter/messages' end;

  -- Already an unread message notification pending? Don't pile on.
  if exists (
    select 1 from notifications
     where user_id = v_recipient
       and type = 'message'
       and is_read = false
  ) then
    return null;
  end if;

  select coalesce(full_name, 'Someone') into v_sender from profiles where id = new.sender_id;

  perform notify_user(v_recipient, 'New message',
    v_sender || ' sent you a message.', 'message', v_link);
  return null;
end;
$$;

drop trigger if exists trg_messages_notify on messages;
create trigger trg_messages_notify
  after insert on messages
  for each row execute function trg_notify_message();

-- Disputes: filed → respondent; resolved → both parties.
create or replace function trg_notify_dispute()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link_for text;
begin
  if tg_op = 'INSERT' then
    v_link_for := case when role_of(new.respondent_id) = 'lessor'
                       then '/lessor/rentals' else '/renter/rentals/' || new.rental_request_id end;
    perform notify_user(new.respondent_id, 'Dispute filed',
      'A dispute was filed regarding one of your rentals: ' || new.reason,
      'dispute', v_link_for);
    return null;
  end if;

  if new.status is not distinct from old.status then
    return null;
  end if;

  perform notify_user(new.complainant_id, 'Dispute updated',
    'Your dispute is now ' || replace(new.status, '_', ' ') || '.', 'dispute',
    case when role_of(new.complainant_id) = 'lessor'
         then '/lessor/rentals' else '/renter/rentals/' || new.rental_request_id end);

  perform notify_user(new.respondent_id, 'Dispute updated',
    'A dispute involving you is now ' || replace(new.status, '_', ' ') || '.', 'dispute',
    case when role_of(new.respondent_id) = 'lessor'
         then '/lessor/rentals' else '/renter/rentals/' || new.rental_request_id end);
  return null;
end;
$$;

drop trigger if exists trg_disputes_notify on disputes;
create trigger trg_disputes_notify
  after insert or update of status on disputes
  for each row execute function trg_notify_dispute();

-- Identity verification decisions → the user.
create or replace function trg_notify_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return null;
  end if;

  perform notify_user(
    new.user_id,
    case new.status
      when 'verified' then 'Identity verified'
      when 'rejected' then 'Verification rejected'
      when 'resubmission_required' then 'Resubmission required'
      else 'Verification updated'
    end,
    coalesce(new.admin_notes,
      'Your identity verification is now ' || replace(new.status, '_', ' ') || '.'),
    'verification',
    '/verify-identity'
  );
  return null;
end;
$$;

drop trigger if exists trg_identity_verifications_notify on identity_verifications;
create trigger trg_identity_verifications_notify
  after update of status on identity_verifications
  for each row execute function trg_notify_verification();

-- Listing moderation decisions → the lessor.
create or replace function trg_notify_listing_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return null;
  end if;

  -- Only tell them about decisions made by someone else (i.e. an admin).
  if auth.uid() is not distinct from new.lessor_id then
    return null;
  end if;

  perform notify_user(
    new.lessor_id,
    case new.status
      when 'published'  then 'Listing approved'
      when 'rejected'   then 'Listing rejected'
      when 'suspended'  then 'Listing suspended'
      else 'Listing updated'
    end,
    '"' || new.title || '" is now ' || replace(new.status, '_', ' ') || '.',
    'rental_request',
    '/lessor/listings/' || new.id
  );
  return null;
end;
$$;

drop trigger if exists trg_listings_notify on listings;
create trigger trg_listings_notify
  after update of status on listings
  for each row execute function trg_notify_listing_status();

-- New review → the person reviewed.
create or replace function trg_notify_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform notify_user(
    new.reviewee_id,
    'New review',
    'You received a ' || new.overall_rating || '-star review.',
    'review',
    case when role_of(new.reviewee_id) = 'lessor'
         then '/lessor/reviews' else '/renter/rentals' end
  );
  return null;
end;
$$;

drop trigger if exists trg_reviews_notify on reviews;
create trigger trg_reviews_notify
  after insert on reviews
  for each row execute function trg_notify_review();


-- ────────────────────────────────────────────────────────────────
-- 4. AUDIT LOGS
--    The admin audit page read this table; nothing ever wrote it.
--    One generic trigger records only the fields that actually
--    changed, and redacts identity-document values.
-- ────────────────────────────────────────────────────────────────
create or replace function log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old      jsonb;
  v_new      jsonb;
  v_changes  jsonb := '{}'::jsonb;
  v_id       uuid;
  k          text;
  -- never copy PII / document URLs into the audit trail
  redacted   text[] := array['id_number', 'front_image_url', 'back_image_url', 'selfie_url'];
  -- pure bookkeeping, not worth an audit row
  ignored    text[] := array['updated_at', 'created_at'];
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    foreach k in array ignored loop v_new := v_new - k; end loop;
    foreach k in array redacted loop
      if v_new ? k then v_new := jsonb_set(v_new, array[k], '"[redacted]"'::jsonb); end if;
    end loop;
    v_changes := v_new;
    v_id := new.id;

  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    for k in select jsonb_object_keys(v_new) loop
      if not (k = any (ignored)) and (v_old -> k) is distinct from (v_new -> k) then
        if k = any (redacted) then
          v_changes := v_changes || jsonb_build_object(k, '"[redacted]"'::jsonb);
        else
          v_changes := v_changes || jsonb_build_object(
            k, jsonb_build_object('old', v_old -> k, 'new', v_new -> k));
        end if;
      end if;
    end loop;
    if v_changes = '{}'::jsonb then
      return null;  -- nothing meaningful changed
    end if;
    v_id := new.id;

  else -- DELETE
    v_old := to_jsonb(old);
    foreach k in array ignored loop v_old := v_old - k; end loop;
    foreach k in array redacted loop
      if v_old ? k then v_old := jsonb_set(v_old, array[k], '"[redacted]"'::jsonb); end if;
    end loop;
    v_changes := v_old;
    v_id := old.id;
  end if;

  insert into audit_logs (changed_by, action, table_name, record_id, changes)
  values (auth.uid(), tg_op, tg_table_name, v_id, v_changes);

  return null;
end;
$$;

drop trigger if exists trg_audit_profiles               on profiles;
drop trigger if exists trg_audit_listings               on listings;
drop trigger if exists trg_audit_rental_requests        on rental_requests;
drop trigger if exists trg_audit_payments               on payments;
drop trigger if exists trg_audit_disputes               on disputes;
drop trigger if exists trg_audit_identity_verifications on identity_verifications;

create trigger trg_audit_profiles
  after insert or update or delete on profiles
  for each row execute function log_audit();
create trigger trg_audit_listings
  after insert or update or delete on listings
  for each row execute function log_audit();
create trigger trg_audit_rental_requests
  after insert or update or delete on rental_requests
  for each row execute function log_audit();
create trigger trg_audit_payments
  after insert or update or delete on payments
  for each row execute function log_audit();
create trigger trg_audit_disputes
  after insert or update or delete on disputes
  for each row execute function log_audit();
create trigger trg_audit_identity_verifications
  after insert or update or delete on identity_verifications
  for each row execute function log_audit();


-- ────────────────────────────────────────────────────────────────
-- 5. ANALYTICS
--    Replaces the hardcoded chart constants and the aggregates that
--    were being computed from .limit(5) query pages.
--    Revenue is defined ONCE here so every admin page agrees:
--      gross_volume    = money actually processed (paid/released payments)
--      platform_revenue = the platform's cut of completed rentals
-- ────────────────────────────────────────────────────────────────

create or replace function admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_month_start timestamptz := date_trunc('month', now());
  v_prev_start  timestamptz := date_trunc('month', now()) - interval '1 month';
  v_fee         numeric := platform_fee_rate();
begin
  if not is_admin() then
    raise exception 'admin_dashboard_stats: admin role required';
  end if;

  return jsonb_build_object(
    'total_users',           (select count(*) from profiles),
    'renters',               (select count(*) from profiles where role = 'renter'),
    'lessors',               (select count(*) from profiles where role = 'lessor'),
    'admins',                (select count(*) from profiles where role = 'admin'),
    'total_listings',        (select count(*) from listings),
    'published_listings',    (select count(*) from listings where status = 'published'),
    'active_rentals',        (select count(*) from rental_requests where status = 'active'),
    'completed_rentals',     (select count(*) from rental_requests where status = 'completed'),
    'pending_verifications', (select count(*) from profiles
                               where verification_status in ('pending', 'under_review')),
    'open_disputes',         (select count(*) from disputes
                               where status in ('open', 'under_review',
                                                'waiting_for_evidence', 'escalated')),
    'gross_volume',          (select coalesce(sum(amount), 0) from payments
                               where status in ('paid', 'released')),
    'platform_revenue',      (select coalesce(sum(rental_fee), 0) * v_fee
                               from rental_requests where status in ('completed', 'returned')),

    -- this month vs last month, so the UI can show a REAL growth badge
    'users_this_month',      (select count(*) from profiles where created_at >= v_month_start),
    'users_prev_month',      (select count(*) from profiles
                               where created_at >= v_prev_start and created_at < v_month_start),
    'rentals_this_month',    (select count(*) from rental_requests where created_at >= v_month_start),
    'rentals_prev_month',    (select count(*) from rental_requests
                               where created_at >= v_prev_start and created_at < v_month_start),
    'revenue_this_month',    (select coalesce(sum(rental_fee), 0) * v_fee from rental_requests
                               where status in ('completed', 'returned')
                                 and created_at >= v_month_start),
    'revenue_prev_month',    (select coalesce(sum(rental_fee), 0) * v_fee from rental_requests
                               where status in ('completed', 'returned')
                                 and created_at >= v_prev_start and created_at < v_month_start)
  );
end;
$$;

-- Uses generate_series so months with no activity still return a zero
-- row — charts keep a stable x-axis instead of collapsing.
create or replace function admin_monthly_series(p_months integer default 6)
returns table (
  month            text,
  month_start      date,
  gross_volume     numeric,
  platform_revenue numeric,
  rentals          integer,
  renters          integer,
  lessors          integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_fee numeric := platform_fee_rate();
begin
  if not is_admin() then
    raise exception 'admin_monthly_series: admin role required';
  end if;

  return query
  with months as (
    select generate_series(
             date_trunc('month', now()) - make_interval(months => greatest(p_months, 1) - 1),
             date_trunc('month', now()),
             interval '1 month'
           ) as m
  ),
  rentals_by_month as (
    select date_trunc('month', created_at) as m,
           count(*) as n,
           coalesce(sum(case when status in ('completed', 'returned')
                             then rental_fee else 0 end), 0) as fees
      from rental_requests
     group by 1
  ),
  payments_by_month as (
    select date_trunc('month', created_at) as m,
           coalesce(sum(amount), 0) as gross
      from payments
     where status in ('paid', 'released')
     group by 1
  ),
  users_by_month as (
    select date_trunc('month', created_at) as m,
           count(*) filter (where role = 'renter') as renters,
           count(*) filter (where role = 'lessor') as lessors
      from profiles
     group by 1
  )
  select to_char(mo.m, 'Mon')                  as month,
         mo.m::date                            as month_start,
         coalesce(p.gross, 0)                  as gross_volume,
         coalesce(r.fees, 0) * v_fee           as platform_revenue,
         coalesce(r.n, 0)::integer             as rentals,
         coalesce(u.renters, 0)::integer       as renters,
         coalesce(u.lessors, 0)::integer       as lessors
    from months mo
    left join rentals_by_month  r on r.m = mo.m
    left join payments_by_month p on p.m = mo.m
    left join users_by_month    u on u.m = mo.m
   order by mo.m;
end;
$$;

create or replace function admin_category_breakdown()
returns table (name text, value integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'admin_category_breakdown: admin role required';
  end if;

  return query
  select coalesce(c.name, 'Uncategorized')::text, count(l.id)::integer
    from listings l
    left join categories c on c.id = l.category_id
   where l.status = 'published'
   group by 1
   having count(l.id) > 0
   order by 2 desc;
end;
$$;

-- Total processed, computed over ALL payments rather than the 200-row
-- page the transactions table displays.
create or replace function admin_payment_totals()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'admin_payment_totals: admin role required';
  end if;

  return jsonb_build_object(
    'processed', (select coalesce(sum(amount), 0) from payments where status in ('paid', 'released')),
    'held',      (select coalesce(sum(amount), 0) from payments where status in ('held', 'pending')),
    'refunded',  (select coalesce(sum(amount), 0) from payments where status = 'refunded'),
    'count',     (select count(*) from payments)
  );
end;
$$;


-- ── Lessor-scoped analytics (self or admin only) ────────────────
create or replace function lessor_dashboard_stats(p_lessor uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_month_start timestamptz := date_trunc('month', now());
  v_fee         numeric := platform_fee_rate();
begin
  if auth.uid() is distinct from p_lessor and not is_admin() then
    raise exception 'lessor_dashboard_stats: not permitted';
  end if;

  return jsonb_build_object(
    'total_listings',     (select count(*) from listings where lessor_id = p_lessor),
    'published_listings', (select count(*) from listings
                            where lessor_id = p_lessor and status = 'published'),
    'active_rentals',     (select count(*) from rental_requests
                            where lessor_id = p_lessor and status = 'active'),
    'pending_requests',   (select count(*) from rental_requests
                            where lessor_id = p_lessor and status = 'pending'),
    'completed_rentals',  (select count(*) from rental_requests
                            where lessor_id = p_lessor and status = 'completed'),
    -- net of the platform fee: what the lessor actually keeps
    'total_earnings',     (select coalesce(sum(rental_fee), 0) * (1 - v_fee)
                            from rental_requests
                           where lessor_id = p_lessor
                             and status in ('completed', 'returned')),
    'month_earnings',     (select coalesce(sum(rental_fee), 0) * (1 - v_fee)
                            from rental_requests
                           where lessor_id = p_lessor
                             and status in ('completed', 'returned')
                             and created_at >= v_month_start),
    'avg_rating',         (select round(avg(overall_rating)::numeric, 2)
                            from reviews where reviewee_id = p_lessor),
    'review_count',       (select count(*) from reviews where reviewee_id = p_lessor),
    'open_disputes',      (select count(*) from disputes
                            where (complainant_id = p_lessor or respondent_id = p_lessor)
                              and status in ('open', 'under_review',
                                             'waiting_for_evidence', 'escalated')),
    'total_views',        (select coalesce(sum(views), 0) from listings where lessor_id = p_lessor)
  );
end;
$$;

create or replace function lessor_monthly_series(p_lessor uuid, p_months integer default 6)
returns table (
  month     text,
  earnings  numeric,
  rentals   integer,
  accepted  integer,
  declined  integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_fee numeric := platform_fee_rate();
begin
  if auth.uid() is distinct from p_lessor and not is_admin() then
    raise exception 'lessor_monthly_series: not permitted';
  end if;

  return query
  with months as (
    select generate_series(
             date_trunc('month', now()) - make_interval(months => greatest(p_months, 1) - 1),
             date_trunc('month', now()),
             interval '1 month'
           ) as m
  ),
  by_month as (
    select date_trunc('month', created_at) as m,
           count(*) as n,
           coalesce(sum(case when status in ('completed', 'returned')
                             then rental_fee else 0 end), 0) as fees,
           count(*) filter (where status in ('accepted', 'payment_pending', 'confirmed',
                                             'active', 'returned', 'completed')) as accepted,
           count(*) filter (where status in ('declined', 'cancelled')) as declined
      from rental_requests
     where lessor_id = p_lessor
     group by 1
  )
  select to_char(mo.m, 'Mon')            as month,
         coalesce(b.fees, 0) * (1 - v_fee) as earnings,
         coalesce(b.n, 0)::integer       as rentals,
         coalesce(b.accepted, 0)::integer as accepted,
         coalesce(b.declined, 0)::integer as declined
    from months mo
    left join by_month b on b.m = mo.m
   order by mo.m;
end;
$$;

-- Real released/pending figures from the payments table, replacing the
-- invented `total * 0.9` / `total * 0.1` split on the earnings page.
create or replace function lessor_earnings_summary(p_lessor uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_month_start timestamptz := date_trunc('month', now());
  v_fee         numeric := platform_fee_rate();
begin
  if auth.uid() is distinct from p_lessor and not is_admin() then
    raise exception 'lessor_earnings_summary: not permitted';
  end if;

  return jsonb_build_object(
    'gross',      (select coalesce(sum(rental_fee), 0) from rental_requests
                    where lessor_id = p_lessor and status in ('completed', 'returned')),
    'net',        (select coalesce(sum(rental_fee), 0) * (1 - v_fee) from rental_requests
                    where lessor_id = p_lessor and status in ('completed', 'returned')),
    'this_month', (select coalesce(sum(rental_fee), 0) * (1 - v_fee) from rental_requests
                    where lessor_id = p_lessor and status in ('completed', 'returned')
                      and created_at >= v_month_start),
    'released',   (select coalesce(sum(p.amount), 0) from payments p
                     join rental_requests r on r.id = p.rental_request_id
                    where r.lessor_id = p_lessor and p.status = 'released'),
    'pending',    (select coalesce(sum(p.amount), 0) from payments p
                     join rental_requests r on r.id = p.rental_request_id
                    where r.lessor_id = p_lessor and p.status in ('paid', 'held', 'pending')),
    'fee_percent', v_fee * 100
  );
end;
$$;


-- ── Public: real category counts for the landing + renter home ──
create or replace function public_category_counts()
returns table (
  id            uuid,
  name          text,
  slug          text,
  icon          text,
  listing_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name, c.slug, c.icon,
         (select count(*) from listings l
           where l.category_id = c.id and l.status = 'published')::integer
    from categories c
   order by c.name;
$$;

grant execute on function public_category_counts() to anon, authenticated;


-- ── Own-profile stats (replaces the hardcoded 0 / — tiles) ──────
create or replace function profile_stats(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from p_user and not is_admin() then
    raise exception 'profile_stats: not permitted';
  end if;

  return jsonb_build_object(
    'avg_rating',        (select round(avg(overall_rating)::numeric, 2)
                            from reviews where reviewee_id = p_user),
    'review_count',      (select count(*) from reviews where reviewee_id = p_user),
    'completed_rentals', (select count(*) from rental_requests
                           where status = 'completed'
                             and (renter_id = p_user or lessor_id = p_user))
  );
end;
$$;


-- ────────────────────────────────────────────────────────────────
-- 6. REALTIME
--    NotificationsPage and MessagesPage already subscribe to
--    postgres_changes, which delivers nothing unless the table is in
--    the publication.
-- ────────────────────────────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;


-- ════════════════════════════════════════════════════════════════
-- Done. Nothing above inserted demo data — dashboards will read zero
-- until real users register, list, rent, pay and review.
-- ════════════════════════════════════════════════════════════════
