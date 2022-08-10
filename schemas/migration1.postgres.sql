-- Create a table for Public Tags

create table tags (
  id uuid not null,
  user_id uuid references auth.users(id) not null,
  name varchar(100) not null,
  color varchar(50),
  created_at timestamp with time zone default now(),
  modified_at timestamp with time zone default now(),

  primary key (id)
);

alter table tags
  enable row level security;

create policy "Users can manipulate only their own tags" on tags
  for all using (auth.uid() = user_id);


-- Create a table for Public Journal Tags

create table journals_tags (
  user_id uuid references auth.users(id) not null,
  day date not null,
  tag uuid references tags(id) not null,
  created_at timestamp with time zone default now(),

  primary key (user_id, day, tag)
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