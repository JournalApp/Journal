 -- Create a table for journals_catalog
create table
  journals_catalog (
    user_id text,
    journal_id int default 0,
    name text not null default 'Default',
    color text,
    icon_name text,
    icon_url text,
    primary key (user_id, journal_id),
    foreign key (user_id) references users (id) on delete cascade on update no action
  );

-- Create default journal catalog (journal_id=0) for existing users
insert into
  journals_catalog (user_id)
select
  id
from
  users
where
  true on conflict (user_id, journal_id)
do
  nothing;

-- update table journals to enable multiple journals per user
-- In SQLite, you can not use the ALTER TABLE statement to drop a primary key.
-- Instead, you must create a new table with the primary key removed and copy the data into this new table.
pragma foreign_keys = off;

begin
  transaction;

alter table
  journals
rename to
  old_journals;

create table
  journals (
    user_id text,
    day date,
    journal_id int default 0,
    created_at datetime,
    modified_at datetime,
    content text,
    deleted boolean not null default false,
    needs_saving_to_server boolean not null default false,
    primary key (user_id, day, journal_id),
    foreign key (user_id) references users (id) on delete cascade on update no action,
    foreign key (user_id, journal_id) references journals_catalog (user_id, journal_id) on delete cascade on update no action
  );

insert into
  journals (
    user_id,
    day,
    created_at,
    modified_at,
    content,
    deleted,
    needs_saving_to_server
  )
select
  *
from
  old_journals;

commit;

pragma foreign_keys = on;

-- Create a table for Tags
create table
  tags (
    user_id text,
    journal_id int default 0,
    id text unique,
    name text,
    color text,
    created_at datetime,
    modified_at datetime,
    revision int,
    sync_status text default 'synced',
    primary key (user_id, journal_id, id),
    foreign key (user_id, journal_id) references journals_catalog (user_id, journal_id) on delete cascade on update no action
  );

-- Create a table for Public Journal Tags
create table
  entries_tags (
    user_id text,
    day date,
    journal_id int default 0,
    tag_id text,
    order_no int not null default 0,
    created_at datetime,
    modified_at datetime,
    revision int,
    sync_status text default 'synced',
    primary key (user_id, day, journal_id, tag_id),
    foreign key (tag_id) references tags (id) on delete cascade on update no action
    -- foreign key (user_id, day, journal_id) references journals (user_id, day, journal_id) on delete cascade on update no action
  );