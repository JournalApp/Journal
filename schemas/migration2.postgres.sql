--------------------------------------------
-- Fix RLS for journals and entries_tags
--------------------------------------------
-- Create RLS for existing users on journals
create
or replace function enable_rls_for_existing_users_on_journals (arg uuid[]) returns void as $$
  DECLARE
    u uuid;
  BEGIN
    FOREACH u IN ARRAY arg LOOP
      EXECUTE 'alter table public.journals_' || replace(u::text,'-','_') || ' enable row level security';
      EXECUTE 'drop policy if exists "User can manipulate only its own journal" on public.journals_' || replace(u::text,'-','_');
      EXECUTE 'create policy "User can manipulate only its own journal" on public.journals_' || replace(u::text,'-','_') || ' for all using (auth.uid () = user_id)';
    END LOOP;
  END;
$$ language plpgsql;

-- Run
select
  enable_rls_for_existing_users_on_journals (array_agg(id))
from
  auth.users;

-- Update trigger function to create RLS for new users on journals
create
or replace function create_user_partition () returns trigger as $create_user_partition$
  BEGIN
    EXECUTE 'create table public.journals_' || replace(new.id::text,'-','_') || ' partition of public.journals for values in (''' || new.id || ''')';
    EXECUTE 'alter table public.journals_' || replace(new.id::text,'-','_') || ' enable row level security';
    EXECUTE 'create policy "User can manipulate only its own journal" on public.journals_' || replace(new.id::text,'-','_') || ' for all using (auth.uid () = user_id)';
    RETURN NEW;
  END;
$create_user_partition$ language plpgsql security definer;

-- Create RLS for existing users on entries_tags
create
or replace function enable_rls_for_existing_users_on_entries_tags (arg uuid[]) returns void as $$
  DECLARE
    u uuid;
  BEGIN
    FOREACH u IN ARRAY arg LOOP
      EXECUTE 'alter table public.entries_tags_' || replace(u::text,'-','_') || ' enable row level security';
      EXECUTE 'drop policy if exists "User can manipulate only its own tags in journals" on public.entries_tags_' || replace(u::text,'-','_');
      EXECUTE 'create policy "User can manipulate only its own tags in journals" on public.entries_tags_' || replace(u::text,'-','_') || ' for all using (auth.uid () = user_id)';
    END LOOP;
  END;
$$ language plpgsql;

-- Run
select
  enable_rls_for_existing_users_on_entries_tags (array_agg(id))
from
  auth.users;

-- Update trigger function to create RLS for new users on entries_tags
create
or replace function create_user_partition_on_entries_tags () returns trigger as $create_user_partition_on_entries_tags$
  BEGIN
    EXECUTE 'create table public.entries_tags_' || replace(new.id::text,'-','_') || ' partition of public.entries_tags for values in (''' || new.id || ''')';
    EXECUTE 'alter table public.entries_tags_' || replace(new.id::text,'-','_') || ' enable row level security';
    EXECUTE 'create policy "User can manipulate only its own tags in journals" on public.entries_tags_' || replace(new.id::text,'-','_') || ' for all using (auth.uid () = user_id)';
    RETURN NEW;
  END;
$create_user_partition_on_entries_tags$ language plpgsql security definer;

--------------------------------------------
-- Enable Realtime
--------------------------------------------
begin;

drop publication if exists supabase_realtime;

create publication supabase_realtime;

commit;

-- add journals to the publication
alter publication supabase_realtime
add table journals;

-- add tags to the publication
alter publication supabase_realtime
add table tags;

-- add entries_tags to the publication
alter publication supabase_realtime
add table entries_tags;