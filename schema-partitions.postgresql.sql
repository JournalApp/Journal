-- Create a table for Public Journals

create table journals (
  user_id uuid references auth.users(id) not null,
  day date not null,
  created_at timestamp with time zone default now(),
  modified_at timestamp with time zone default now(),
  content json[],

  primary key (user_id, day)
) PARTITION BY LIST(user_id);

alter table journals
  enable row level security;

create policy "Users can manipulate only their own journals" on journals
  for all using (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION create_user_partition() RETURNS trigger AS $create_user_partition$
  BEGIN
    EXECUTE 'CREATE TABLE public.journals_' || replace(new.id::text,'-','_') || ' PARTITION OF public.journals FOR VALUES IN (''' || new.id || ''')';
    RETURN NEW;
  END;
$create_user_partition$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_partition
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_partition();