-- Create a table for Public Profiles
create table profiles (
  user_id uuid references auth.users(id) not null,
  modified_at timestamp with time zone default now(),
  avatar_url text,
  full_name text,

  primary key (user_id)
);

alter table profiles
  enable row level security;

create policy "Users can manipulate only their own profiles" on profiles
  for insert with check (auth.uid() = user_id);


-- Create a table for Public Journals
  create table journals (
  id uuid DEFAULT extensions.uuid_generate_v4() unique,
  user_id uuid references auth.users(id) not null,
  day int default 0,
  created_at timestamp with time zone default now(),
  modified_at timestamp with time zone default now(),
  content json[],

  primary key (user_id, day)
);

alter table journals
  enable row level security;

create policy "Users can manipulate only their own journals" on journals
  for all using (auth.uid() = user_id);


-- Create a table for Public Website pages
create table website_pages (
  id serial unique not null,
  page varchar(100) not null,
  content text,

  primary key (page)
);

alter table website_pages
  enable row level security;

create policy "Anyone can read content" on website_pages
  for select using (true);


  -- Create a table for user feedback
create table feedback (
  id serial unique not null,
  user_id uuid references auth.users(id) not null,
  rating int,
  check(rating >=1 and rating <= 5),
  feedback text,
  created_at timestamp with time zone default now(),

  primary key (id)
);

alter table feedback
  enable row level security;

create policy "Only Authenticated users can add feedback" on feedback
  for insert with check (auth.uid() = user_id);