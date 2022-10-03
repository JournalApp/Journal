 -- Create a table for journals_catalog to enable multiple journals per user
create table
  journals_catalog (
    user_id uuid references auth.users (id) on delete cascade,
    journal_id smallint default 0,
    name varchar(50) not null default 'Default',
    color varchar(50),
    icon_name varchar(50),
    icon_url text,
    primary key (user_id, journal_id)
  );

alter table
  journals_catalog enable row level security;

create policy
  "Users can manipulate only their own journals catalogs" on journals_catalog for all using (auth.uid () = user_id);

-- Create default journal catalog (journal_id=0) for existing users
insert into
  public.journals_catalog (user_id)
select
  id
from
  auth.users
where
  true on conflict (user_id, journal_id)
do
  nothing;

-- Create trigger for creating default journal_catalog for new users
create
or replace function create_default_journals_catalog () returns trigger as $create_default_journals_catalog$
  BEGIN
    insert into public.journals_catalog (user_id) values (new.id);
    RETURN NEW;
  END;
$create_default_journals_catalog$ language plpgsql security definer;

create trigger
  create_default_journals_catalog
after
  insert on auth.users for each row
execute
  function create_default_journals_catalog ();

-- update table journals to add revision number
alter table
  journals
add column
  revision int not null default 0;

-- update table journals to enable multiple journals per user
alter table
  journals
add column
  journal_id smallint default 0;

alter table
  journals
add
  constraint fk_journals_catalog foreign key (user_id, journal_id) references journals_catalog (user_id, journal_id);

alter table
  journals
drop
  constraint journals_pkey;

alter table
  journals
add
  primary key (user_id, day, journal_id);

-- Create a table for Public Tags
create table
  tags (
    user_id uuid references auth.users (id) on delete cascade not null,
    journal_id smallint default 0,
    id uuid unique not null,
    name varchar(100) not null,
    color varchar(50),
    created_at timestamp with time zone default now(),
    modified_at timestamp with time zone default now(),
    revision int not null default 0,
    primary key (user_id, journal_id, id),
    constraint fk_journals_catalog foreign key (user_id, journal_id) references journals_catalog (user_id, journal_id) on delete cascade
  );

alter table
  tags enable row level security;

create policy
  "Users can manipulate only their own tags" on tags for all using (auth.uid () = user_id);

-- Create a table for Public Journal Tags
create table
  entries_tags (
    user_id uuid not null,
    day date not null,
    journal_id smallint default 0,
    tag_id uuid references tags (id) on delete cascade not null,
    order_no smallint not null default 0,
    created_at timestamp with time zone default now(),
    modified_at timestamp with time zone default now(),
    revision int not null default 0,
    primary key (user_id, day, journal_id, tag_id),
    constraint fk_journals foreign key (user_id, day, journal_id) references journals (user_id, day, journal_id) on delete cascade
  )
partition by
  LIST (user_id);

alter table
  entries_tags enable row level security;

create policy
  "Users can manipulate only their own tags in journals" on entries_tags for all using (auth.uid () = user_id);

create
or replace function create_user_partition_on_entries_tags () returns trigger as $create_user_partition_on_entries_tags$
  BEGIN
    EXECUTE 'CREATE TABLE public.entries_tags_' || replace(new.id::text,'-','_') || ' PARTITION OF public.entries_tags FOR VALUES IN (''' || new.id || ''')';
    RETURN NEW;
  END;
$create_user_partition_on_entries_tags$ language plpgsql security definer;

create trigger
  create_user_partition_on_entries_tags
after
  insert on auth.users for each row
execute
  function create_user_partition_on_entries_tags ();

-- Create partitions for existing users
create
or replace function create_existing_user_partition_on_entries_tags (arg uuid[]) returns void as $$
  DECLARE
    u uuid;
  BEGIN
    FOREACH u IN ARRAY arg LOOP
      EXECUTE 'CREATE TABLE public.entries_tags_' || replace(u::text,'-','_') || ' PARTITION OF public.entries_tags FOR VALUES IN (''' || u || ''')';
    END LOOP;
  END;
$$ language plpgsql;

select
  create_existing_user_partition_on_entries_tags (array_agg(id))
from
  auth.users;

-- SCRATCH PAD -- SCRATCH PAD -- SCRATCH PAD -- SCRATCH PAD -- SCRATCH PAD -- SCRATCH PAD -- SCRATCH PAD --
insert into
  tags
values
  (
    '12345678-dbdc-45b1-ba77-7dcad9d612c3',
    'd63b7267-07bc-497f-b70c-191aab211f47',
    'Holiday',
    'blue',
    now(),
    now()
  );

insert into
  tags
values
  (
    '123abc66-dbdc-45b1-ba77-7dcad9d612c3',
    'd63b7267-07bc-497f-b70c-191aab211f47',
    'Vacation',
    'red',
    now(),
    now()
  );

insert into
  tags
values
  (
    '111222ab-dbdc-45b1-ba77-7dcad9d612c3',
    'd63b7267-07bc-497f-b70c-191aab211f47',
    'Health',
    'yellow',
    now(),
    now()
  );

insert into
  tags
values
  (
    '431700ab-dbdc-45b1-ba77-7dcad9d612c3',
    '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3',
    '100daysofmarketing',
    'pink',
    now(),
    now()
  );

insert into
  tags
values
  (
    '00aabbcc-dbdc-45b1-ba77-7dcad9d612c3',
    '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3',
    'Family stuff',
    'brown',
    now(),
    now()
  );

insert into
  entries_tags
values
  (
    '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3',
    '2022-09-01',
    '12345678-dbdc-45b1-ba77-7dcad9d612c3',
    0,
    now(),
    now(),
    0
  );

insert into
  entries_tags
values
  (
    '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3',
    '2022-09-01',
    '123abc66-dbdc-45b1-ba77-7dcad9d612c3',
    1,
    now(),
    now(),
    0
  );

select
  *
from
  journals
  inner join entries_tags_test on entries_tags_test.user_id = journals.user_id
where
  journals.user_id = '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3'
  and journals.day = '2022-08-29'