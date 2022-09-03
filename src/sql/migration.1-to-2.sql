
-- Create a table for Tags
create table tags (
  id text,
  user_id text,
  name text,
  color text,
  created_at datetime,
  modified_at datetime,
  revision int,
  sync_status text default 'synced',

  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE NO ACTION
);