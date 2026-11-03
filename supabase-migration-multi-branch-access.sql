alter table public.map_branch_users
    drop constraint if exists map_branch_users_pkey;
alter table public.map_branch_users
    drop constraint if exists map_branch_users_branch_id_key;
alter table public.map_branch_users
    add constraint map_branch_users_pkey primary key (user_id, branch_id);

create index if not exists map_branch_users_branch_id_idx
    on public.map_branch_users (branch_id);

create or replace function public.get_my_map_branch_id()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
    select assignment.branch_id
    from public.map_branch_users as assignment
    join public.map_branches as branch
      on branch.id = assignment.branch_id
    where assignment.user_id = auth.uid()
    order by branch.sort_order
    limit 1;
$$;

create or replace function public.set_map_branch_access(
    target_user_id uuid,
    target_branch_ids text[]
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    requested_branch_count integer;
begin
    if not public.is_map_admin() then
        raise exception 'Only the main map administrator can assign branch access.'
            using errcode = '42501';
    end if;

    if target_user_id is null
       or target_branch_ids is null
       or cardinality(target_branch_ids) = 0
       or array_position(target_branch_ids, null) is not null then
        raise exception 'Choose at least one valid branch.'
            using errcode = '22023';
    end if;

    if exists (
        select 1
        from public.map_admins as admin
        where admin.user_id = target_user_id
    ) then
        raise exception 'A main administrator cannot be assigned as a branch viewer.'
            using errcode = '22023';
    end if;

    select count(distinct requested.branch_id)
    into requested_branch_count
    from unnest(target_branch_ids) as requested(branch_id)
    join public.map_branches as branch
      on branch.id = requested.branch_id;

    if requested_branch_count <> cardinality(target_branch_ids) then
        raise exception 'One or more selected branches do not exist or are duplicated.'
            using errcode = '22023';
    end if;

    delete from public.map_branch_users as assignment
    where assignment.user_id = target_user_id;

    insert into public.map_branch_users (user_id, branch_id)
    select target_user_id, requested.branch_id
    from unnest(target_branch_ids) as requested(branch_id);
end;
$$;

revoke all on function public.set_map_branch_access(uuid, text[]) from public;
grant execute on function public.set_map_branch_access(uuid, text[]) to authenticated;

create or replace function public.delete_map_branch(target_branch_id text)
returns table (id text, name text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    deleted_name text;
begin
    if not public.is_map_admin() then
        raise exception 'Only the main map administrator can delete branches.'
            using errcode = '42501';
    end if;

    perform pg_advisory_xact_lock(hashtextextended('public.map_branches.sort_order', 0));

    select branch.name
    into deleted_name
    from public.map_branches as branch
    where branch.id = target_branch_id
    for update;

    if not found then
        raise exception 'The selected branch does not exist.'
            using errcode = '22023';
    end if;

    if (select count(*) from public.map_branches) <= 1 then
        raise exception 'The last remaining branch cannot be deleted.'
            using errcode = '22023';
    end if;

    delete from public.map_branches as branch
    where branch.id = target_branch_id;

    return query select target_branch_id, deleted_name;
end;
$$;

revoke all on function public.delete_map_branch(text) from public;
grant execute on function public.delete_map_branch(text) to authenticated;
