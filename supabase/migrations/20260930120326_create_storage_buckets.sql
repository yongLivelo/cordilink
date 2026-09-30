insert into storage.buckets (id, name, public)
values ('report_images', 'report_images', true)
on conflict (id) do nothing;

create policy "users read"
on storage.objects for select
to public
using ( bucket_id = 'report_images' );

create policy "users upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'report_images' );

create policy "users update"
on storage.objects for update
to authenticated
using ( auth.uid() = owner );

create policy "users delete"
on storage.objects for delete
to authenticated
using ( auth.uid() = owner );

