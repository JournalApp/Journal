-- Create a table for Users
create table if not exists users (
  id text,
  full_name text,

  PRIMARY KEY (id)
);

-- Create a table for Journals
create table if not exists journals (
  user_id text,
  day date,
  created_at datetime,
  modified_at datetime,
  content text,
  deleted boolean not null default false,
  needs_saving_to_server boolean not null default false,

  PRIMARY KEY (user_id, day),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create a table for user Preferences
create table if not exists preferences (
  user_id text,
  item text,
  value text,
  
  PRIMARY KEY (user_id, item),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create a table for app
create table if not exists app (
  key text not null,
  value text,

  PRIMARY KEY (key)
);