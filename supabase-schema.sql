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

do $$
begin
    if exists (
        select 1
        from pg_publication
        where pubname = 'supabase_realtime'
    ) and not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'map_state'
    ) then
        alter publication supabase_realtime add table public.map_state;
    end if;
end;
$$;

create table if not exists public.map_branches (
    id text primary key,
    name text not null,
    sort_order integer not null unique check (sort_order > 0),
    created_at timestamptz not null default now()
);

alter table public.map_branches
    drop constraint if exists map_branches_sort_order_check;
alter table public.map_branches
    add constraint map_branches_sort_order_check check (sort_order > 0);

create table if not exists public.map_branch_users (
    user_id uuid primary key references auth.users(id) on delete cascade,
    branch_id text not null unique references public.map_branches(id) on delete cascade,
    created_at timestamptz not null default now()
);

create table if not exists public.map_branch_state (
    branch_id text primary key references public.map_branches(id) on delete cascade,
    data jsonb not null default '{"type":"FeatureCollection","features":[]}'::jsonb,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id)
);

insert into public.map_branches (id, name, sort_order)
select
    'branch-' || lpad(branch_number::text, 2, '0'),
    'لق ' || translate(branch_number::text, '0123456789', '٠١٢٣٤٥٦٧٨٩'),
    branch_number
from generate_series(1, 25) as branches(branch_number)
on conflict (id) do nothing;

create unique index if not exists map_branches_name_unique
    on public.map_branches (lower(name));

alter table public.map_branches enable row level security;
alter table public.map_branch_users enable row level security;
alter table public.map_branch_state enable row level security;

revoke all on public.map_branches from public, anon, authenticated;
revoke all on public.map_branch_users from public, anon, authenticated;
revoke all on public.map_branch_state from public, anon, authenticated;
grant select, update on public.map_branches to authenticated;
grant select on public.map_branch_users to authenticated;
grant select, insert, update, delete on public.map_branch_state to authenticated;

create or replace function public.can_access_map_branch(target_branch_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select public.is_map_admin() or exists (
        select 1
        from public.map_branch_users
        where user_id = auth.uid()
          and branch_id = target_branch_id
    );
$$;

revoke all on function public.can_access_map_branch(text) from public;
grant execute on function public.can_access_map_branch(text) to authenticated;

create or replace function public.get_my_map_branch_id()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
    select branch_id
    from public.map_branch_users
    where user_id = auth.uid()
    limit 1;
$$;

revoke all on function public.get_my_map_branch_id() from public;
grant execute on function public.get_my_map_branch_id() to authenticated;

create or replace function public.create_map_branch(branch_name text)
returns table (id text, name text, sort_order integer)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    normalized_name text := btrim(branch_name);
    new_branch_id text := 'branch-' || gen_random_uuid()::text;
    next_order integer;
begin
    if not public.is_map_admin() then
        raise exception 'Only the main map administrator can create branches.'
            using errcode = '42501';
    end if;

    if normalized_name is null or normalized_name = '' or char_length(normalized_name) > 80 then
        raise exception 'Branch names must contain 1 to 80 characters.'
            using errcode = '22023';
    end if;

    perform pg_advisory_xact_lock(hashtextextended('public.map_branches.sort_order', 0));

    select coalesce(max(branch.sort_order), 0) + 1
    into next_order
    from public.map_branches as branch;

    insert into public.map_branches as inserted_branch (id, name, sort_order)
    values (new_branch_id, normalized_name, next_order)
    returning inserted_branch.id into new_branch_id;

    insert into public.map_branch_state (branch_id)
    values (new_branch_id);

    return query
    select branch.id, branch.name, branch.sort_order
    from public.map_branches as branch
    where branch.id = new_branch_id;
end;
$$;

revoke all on function public.create_map_branch(text) from public;
grant execute on function public.create_map_branch(text) to authenticated;

drop policy if exists "Authenticated users can read map branches" on public.map_branches;
create policy "Authenticated users can read map branches"
    on public.map_branches
    for select
    to authenticated
    using (public.can_access_map_branch(id));

drop policy if exists "Admins can rename map branches" on public.map_branches;
create policy "Admins can rename map branches"
    on public.map_branches
    for update
    to authenticated
    using (public.is_map_admin())
    with check (public.is_map_admin());

drop policy if exists "Users can read their own branch assignment" on public.map_branch_users;
create policy "Users can read their own branch assignment"
    on public.map_branch_users
    for select
    to authenticated
    using (user_id = auth.uid() or public.is_map_admin());

drop policy if exists "Users can read accessible branch map data" on public.map_branch_state;
create policy "Users can read accessible branch map data"
    on public.map_branch_state
    for select
    to authenticated
    using (public.can_access_map_branch(branch_id));

drop policy if exists "Branch editors can create branch map data" on public.map_branch_state;
drop policy if exists "Admins can create branch map data" on public.map_branch_state;
create policy "Admins can create branch map data"
    on public.map_branch_state
    for insert
    to authenticated
    with check (
        public.is_map_admin()
        and updated_by = auth.uid()
    );

drop policy if exists "Branch editors can update branch map data" on public.map_branch_state;
drop policy if exists "Admins can update branch map data" on public.map_branch_state;
create policy "Admins can update branch map data"
    on public.map_branch_state
    for update
    to authenticated
    using (public.is_map_admin())
    with check (
        public.is_map_admin()
        and updated_by = auth.uid()
    );

drop policy if exists "Branch editors can delete branch map data" on public.map_branch_state;
drop policy if exists "Admins can delete branch map data" on public.map_branch_state;
create policy "Admins can delete branch map data"
    on public.map_branch_state
    for delete
    to authenticated
    using (public.is_map_admin());

insert into public.map_branch_state (branch_id, data, updated_at, updated_by)
select 'branch-04', data, updated_at, updated_by
from public.map_state
where id = 'sulaymaniyah'
on conflict (branch_id) do nothing;

revoke all on public.map_state from public, anon, authenticated;

do $$
begin
    if exists (
        select 1
        from pg_publication
        where pubname = 'supabase_realtime'
    ) and not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'map_branch_state'
    ) then
        alter publication supabase_realtime add table public.map_branch_state;
    end if;
end;
$$;
