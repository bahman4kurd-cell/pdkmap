create table if not exists public.map_admins (
    user_id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

create table if not exists public.map_state (
    id text primary key check (id = 'sulaymaniyah'),
    data jsonb not null default '{"type":"FeatureCollection","features":[]}'::jsonb,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id)
);

alter table public.map_admins enable row level security;
alter table public.map_state enable row level security;

revoke all on public.map_admins from public, anon, authenticated;
revoke all on public.map_state from public, anon, authenticated;
grant select on public.map_state to authenticated;
grant insert, update, delete on public.map_state to authenticated;

create or replace function public.is_map_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select exists (
        select 1
        from public.map_admins
        where user_id = auth.uid()
    );
$$;

revoke all on function public.is_map_admin() from public;
grant execute on function public.is_map_admin() to authenticated;

drop policy if exists "Anyone can read map state" on public.map_state;
drop policy if exists "Authenticated users can read map state" on public.map_state;
create policy "Authenticated users can read map state"
    on public.map_state
    for select
    to authenticated
    using (true);

drop policy if exists "Admins can create map state" on public.map_state;
create policy "Admins can create map state"
    on public.map_state
    for insert
    to authenticated
    with check (public.is_map_admin());

drop policy if exists "Admins can update map state" on public.map_state;
create policy "Admins can update map state"
    on public.map_state
    for update
    to authenticated
    using (public.is_map_admin())
    with check (public.is_map_admin());

drop policy if exists "Admins can delete map state" on public.map_state;
create policy "Admins can delete map state"
    on public.map_state
    for delete
    to authenticated
    using (public.is_map_admin());

insert into public.map_state (id)
values ('sulaymaniyah')
on conflict (id) do nothing;
