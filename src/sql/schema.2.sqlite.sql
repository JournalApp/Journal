-- Create a table for Users
create table
  users (
    id text,
    full_name text,
    secret_key blob,
    subscription text,
    primary key (id)
  );

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

-- Create a table for Journals
create table
  journals (
    user_id text,
    day date,
    journal_id int default 0,
    created_at datetime,
    modified_at datetime,
    content text,
    revision int not null default 0,
    sync_status text not null default 'synced',
    primary key (user_id, day, journal_id),
    foreign key (user_id) references users (id) on delete cascade on update no action,
    foreign key (user_id, journal_id) references journals_catalog (user_id, journal_id) on delete cascade on update no action
  );

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

-- Create a table for user Preferences
create table
  preferences (
    user_id text,
    item text,
    value text,
    primary key (user_id, item),
    foreign key (user_id) references users (id) on delete cascade on update no action
  );

-- Create a table for app
create table
  app (key text not null, value text, primary key (key));