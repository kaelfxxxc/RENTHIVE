-- Run in the Supabase SQL editor for existing projects.
-- Photos are immutable evidence; only rental participants and admins can read.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rental-condition-photos', 'rental-condition-photos', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Rental participants read condition photos" on storage.objects;
create policy "Rental participants read condition photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'rental-condition-photos'
  and exists (
    select 1 from public.rental_requests r
    where r.id::text = (storage.foldername(name))[1]
      and (auth.uid() in (r.renter_id, r.lessor_id)
           or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  )
);

drop policy if exists "Rental participants upload condition photos" on storage.objects;
create policy "Rental participants upload condition photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'rental-condition-photos'
  and array_length(storage.foldername(name), 1) = 3
  and (storage.foldername(name))[3] = auth.uid()::text
  and exists (
    select 1 from public.rental_requests r
    where r.id::text = (storage.foldername(name))[1]
      and (
        ((storage.foldername(name))[2] = 'before-shipping'
          and r.lessor_id = auth.uid() and r.status = 'confirmed')
        or ((storage.foldername(name))[2] = 'after-receiving'
          and r.renter_id = auth.uid() and r.status in ('confirmed', 'active'))
      )
  )
);
