 -- Create a table for Public Profiles
create table
  profiles (
    user_id uuid references auth.users (id) not null,
    modified_at timestamp with time zone default now(),
    avatar_url text,
    full_name text,
    primary key (user_id)
  );

alter table
  profiles enable row level security;

create policy
  "Users can manipulate only their own profiles" on profiles for insert
with
  check (auth.uid () = user_id);

-- Create a table for Public Journals
create table
  journals (
    user_id uuid references auth.users (id) not null,
    day date not null,
    created_at timestamp with time zone default now(),
    modified_at timestamp with time zone default now(),
    content bytea,
    iv bytea,
    primary key (user_id, day)
  )
partition by
  LIST (user_id);

alter table
  journals enable row level security;

create policy
  "Users can manipulate only their own journals" on journals for all using (auth.uid () = user_id);

create
or replace function create_user_partition () returns trigger as $create_user_partition$
  BEGIN
    EXECUTE 'CREATE TABLE public.journals_' || replace(new.id::text,'-','_') || ' PARTITION OF public.journals FOR VALUES IN (''' || new.id || ''')';
    RETURN NEW;
  END;
$create_user_partition$ language plpgsql security definer;

create trigger
  create_user_partition
after
  insert on auth.users for each row
execute
  function create_user_partition ();

-- Create partitions for existing users
create
or replace function create_user_partition_for_existing_users (arg uuid[]) returns void as $$
  DECLARE
    u uuid;
  BEGIN
    FOREACH u IN ARRAY arg LOOP
      EXECUTE 'CREATE TABLE public.journals_' || replace(u::text,'-','_') || ' PARTITION OF public.journals FOR VALUES IN (''' || u || ''')';
    END LOOP;
  END;
$$ language plpgsql;

select
  create_user_partition_for_existing_users (array_agg(id))
from
  auth.users;

-- Create a table for Public Website pages
create table
  website_pages (
    id serial unique not null,
    page varchar(100) not null,
    content text,
    primary key (page)
  );

alter table
  website_pages enable row level security;

create policy
  "Anyone can read content" on website_pages for
select
  using (true);

-- Create a table for Public Website changelog
create table
  releases (
    version varchar(50),
    pub_date timestamp with time zone not null,
    notes text,
    primary key (version)
  );

alter table
  releases enable row level security;

create policy
  "Anyone can read content" on releases for
select
  using (true);

-- Create a table for user feedback
create table
  feedback (
    id serial unique not null,
    user_id uuid references auth.users (id) not null,
    rating int,
    check (
      rating >= 1
      and rating <= 5
    ),
    feedback text,
    created_at timestamp with time zone default now(),
    email varchar(100),
    primary key (id)
  );

alter table
  feedback enable row level security;

create policy
  "Only Authenticated users can add feedback" on feedback for insert
with
  check (auth.uid () = user_id);