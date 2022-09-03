-- Create a table for Public Tags

create table tags (
  id uuid not null,
  user_id uuid references auth.users(id) not null,
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
  tag uuid references tags(id) on delete cascade not null,
  order_no smallint not null default 0,
  created_at timestamp with time zone default now(),
  modified_at timestamp with time zone default now(),
  revision int not null default 0,

  primary key (user_id, day, tag),
  constraint fk_journals foreign key (user_id, day) references journals (user_id, day) on delete cascade
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

insert into tags values ('12345678-dbdc-45b1-ba77-7dcad9d612c3', '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3', 'Holiday', 'blue', now(), now());
insert into tags values ('123abc66-dbdc-45b1-ba77-7dcad9d612c3', '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3', 'Vacation', 'red', now(), now());
insert into tags values ('111222ab-dbdc-45b1-ba77-7dcad9d612c3', '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3', 'Health', 'yellow', now(), now());
insert into tags values ('431700ab-dbdc-45b1-ba77-7dcad9d612c3', '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3', '100daysofmarketing', 'pink', now(), now());
insert into tags values ('00aabbcc-dbdc-45b1-ba77-7dcad9d612c3', '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3', 'Family stuff', 'brown', now(), now());

insert into journals_tags values ('1a8368c9-dbdc-45b1-ba77-7dcad9d612c3', '2022-09-01', '12345678-dbdc-45b1-ba77-7dcad9d612c3', 0, now(), now(), 0);
insert into journals_tags values ('1a8368c9-dbdc-45b1-ba77-7dcad9d612c3', '2022-09-01', '123abc66-dbdc-45b1-ba77-7dcad9d612c3', 1, now(), now(), 0);

select * from journals
  inner join journals_tags_test
    on journals_tags_test.user_id = journals.user_id
  where journals.user_id = '1a8368c9-dbdc-45b1-ba77-7dcad9d612c3' and journals.day = '2022-08-29'