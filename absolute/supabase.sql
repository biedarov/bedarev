create table if not exists public.absolute_state (
    user_id uuid primary key references auth.users (id) on delete cascade,
    email text not null,
    tasks jsonb not null default '[]'::jsonb,
    projects jsonb not null default '[]'::jsonb,
    settings jsonb not null default '{}'::jsonb,
    activity jsonb not null default '[]'::jsonb,
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.absolute_state enable row level security;

create policy "absolute_state_select_own"
on public.absolute_state
for select
using (auth.uid() = user_id);

create policy "absolute_state_insert_own"
on public.absolute_state
for insert
with check (
    auth.uid() = user_id
    and lower(email) = any(array['me@bedarev.com','ser.biedarov@gmail.com','zakharbiedarov@gmail.com'])
);

create policy "absolute_state_update_own"
on public.absolute_state
for update
using (auth.uid() = user_id)
with check (
    auth.uid() = user_id
    and lower(email) = any(array['me@bedarev.com','ser.biedarov@gmail.com','zakharbiedarov@gmail.com'])
);

create policy "absolute_state_delete_own"
on public.absolute_state
for delete
using (auth.uid() = user_id);
