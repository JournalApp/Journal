-- Create a table for journals_catalog to enable multiple journals per user

create table journals_catalog (
  user_id uuid references auth.users(id) ON DELETE CASCADE,
  journal_id smallint default 0,
  name varchar(50) not null default 'Default',
  color varchar(50),
  icon_name varchar(50),
  icon_url text,

  primary key (user_id, journal_id)
);

alter table journals_catalog
  enable row level security;

create policy "Users can manipulate only their own journals catalogs" on journals_catalog
  for all using (auth.uid() = user_id);


-- Create default journal catalog (journal_id=0) for existing users

CREATE OR REPLACE FUNCTION create_default_journals_catalog_for_existing_users(arg uuid[]) RETURNS void AS $$
  DECLARE
    u uuid;
  BEGIN
    FOREACH u IN ARRAY arg LOOP
      insert into journals_catalog (user_id) values (u);
    END LOOP;
  END;
$$ LANGUAGE plpgsql;

SELECT create_default_journals_catalog_for_existing_users(array_agg(id)) FROM auth.users;


-- Create trigger for creating default journal_catalog for new users

CREATE OR REPLACE FUNCTION create_default_journals_catalog() RETURNS trigger AS $create_default_journals_catalog$
  BEGIN
    insert into public.journals_catalog (user_id) values (new.id);
    RETURN NEW;
  END;
$create_default_journals_catalog$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_default_journals_catalog
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_journals_catalog();


-- update table journals to enable multiple journals per user

ALTER TABLE journals ADD COLUMN journal_id smallint default 0;
ALTER TABLE journals ADD constraint fk_journals_catalog foreign key (user_id, journal_id) references journals_catalog (user_id, journal_id);
ALTER TABLE journals DROP CONSTRAINT journals_pkey;
ALTER TABLE journals ADD PRIMARY KEY(user_id, day, journal_id);


-- Create a table for Public Tags

create table tags (
  id uuid not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name varchar(100) not null,
  color varchar(50),
  created_at timestamp with time zone default now(),
  modified_at timestamp with time zone default now(),
  revision int not null default 0,

  primary key (id)
);

alter table tags
  enable row level security;

create policy "Users can manipulate only their own tags" on tags
  for all using (auth.uid() = user_id);


-- Create a table for Public Journal Tags

create table journals_tags (
  user_id uuid not null,
  day date not null,
  journal_id smallint default 0,
  tag uuid references tags(id) on delete cascade not null,
  order_no smallint not null default 0,
  created_at timestamp with time zone default now(),
  modified_at timestamp with time zone default now(),
  revision int not null default 0,

  primary key (user_id, day, journal_id, tag),
  constraint fk_journals foreign key (user_id, day, journal_id) references journals (user_id, day, journal_id) on delete cascade
) PARTITION BY LIST(user_id);

alter table journals_tags
  enable row level security;

create policy "Users can manipulate only their own tags in journals" on journals_tags
  for all using (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION create_user_partition_on_journals_tags() RETURNS trigger AS $create_user_partition_on_journals_tags$
  BEGIN
    EXECUTE 'CREATE TABLE public.journals_tags_' || replace(new.id::text,'-','_') || ' PARTITION OF public.journals_tags FOR VALUES IN (''' || new.id || ''')';
    RETURN NEW;
  END;
$create_user_partition_on_journals_tags$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE TRIGGER create_user_partition_on_journals_tags
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_partition_on_journals_tags();


-- Create partitions for existing users

CREATE OR REPLACE FUNCTION create_existing_user_partition_on_journals_tags(arg uuid[]) RETURNS void AS $$
  DECLARE
    u uuid;
  BEGIN
    FOREACH u IN ARRAY arg LOOP
      EXECUTE 'CREATE TABLE public.journals_tags_' || replace(u::text,'-','_') || ' PARTITION OF public.journals_tags FOR VALUES IN (''' || u || ''')';
    END LOOP;
  END;
$$ LANGUAGE plpgsql;

SELECT create_existing_user_partition_on_journals_tags(array_agg(id)) FROM auth.users;






-- SCRATCH PAD -- SCRATCH PAD -- SCRATCH PAD -- SCRATCH PAD -- SCRATCH PAD -- SCRATCH PAD -- SCRATCH PAD --

insert into tags values ('12345678-dbdc-45b1-ba77-7dcad9d612c3', 'd63b7267-07bc-497f-b70c-191aab211f47', 'Holiday', 'blue', now(), now());
insert into tags values ('123abc66-dbdc-45b1-ba77-7dcad9d612c3', 'd63b7267-07bc-497f-b70c-191aab211f47', 'Vacation', 'red', now(), now());
insert into tags values ('111222ab-dbdc-45b1-ba77-7dcad9d612c3', 'd63b7267-07bc-497f-b70c-191aab211f47', 'Health', 'yellow', now(), now());
insert into tags values ('431700ab-dbdc-45b1-ba77-7dcad9d612c3', '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3', '100daysofmarketing', 'pink', now(), now());
insert into tags values ('00aabbcc-dbdc-45b1-ba77-7dcad9d612c3', '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3', 'Family stuff', 'brown', now(), now());

insert into journals_tags values ('1a8368c9-dbdc-45b1-ba77-7dcad9d612c3', '2022-09-01', '12345678-dbdc-45b1-ba77-7dcad9d612c3', 0, now(), now(), 0);
insert into journals_tags values ('1a8368c9-dbdc-45b1-ba77-7dcad9d612c3', '2022-09-01', '123abc66-dbdc-45b1-ba77-7dcad9d612c3', 1, now(), now(), 0);

select * from journals
  inner join journals_tags_test
    on journals_tags_test.user_id = journals.user_id
  where journals.user_id = '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3' and journals.day = '2022-08-29'