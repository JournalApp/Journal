----------------------------------------------
--
-- Call m.journal.do to send welcome emails
--
----------------------------------------------
--
-- Enable pg_net extansion for making http requests
create extension if not exists pg_net;

-- Create trigger for creating default journal_catalog for new users
create
or replace function send_welcome_email () returns trigger as $send_welcome_email$
BEGIN
    perform net.http_post(
          url:=concat('https://m.journal.do/api/v1/send/welcome/', new.id) ,
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer J3zyLEePzC7zYP2o"}'::jsonb
      ) as request_id;
    return new;
EXCEPTION WHEN OTHERS THEN
    return new;
END;
$send_welcome_email$ language plpgsql security definer;

create
or replace trigger send_welcome_email
after insert on auth.users for each row
execute function send_welcome_email ();

----------------------------------------------
--
-- Add email addresses to public.users table
--
----------------------------------------------
--
-- Add email column to existing users table
alter table public.users
add column email text,
add column created_at timestamp with time zone;

-- Populate emails column with emails of existing users
update public.users
set
    email = auth.users.email,
    created_at = auth.users.created_at
from
    auth.users
where
    public.users.id = auth.users.id;

-- Update trigger function to also add emails
create
or replace function public.handle_new_user () returns trigger as $$
begin
  insert into public.users (id, full_name, avatar_url, email, created_at)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email, new.created_at);
  return new;
end;
$$ language plpgsql security definer;

----------------------------------------------
--
-- Create table with email preferences
--
----------------------------------------------
--
-- Create table
create table
    email_comms_preferences (
        user_id uuid references auth.users (id) on delete cascade not null primary key,
        week_on_journal boolean default true,
        product_updates boolean default true
    );

alter table email_comms_preferences enable row level security;

create policy "Can view own communications preferences." on email_comms_preferences for
select
    using (auth.uid () = user_id);

create policy "Can update own communications preferences." on email_comms_preferences for
update using (auth.uid () = user_id);

-- Populate public.email_comms_preferences with existing users
insert into
    public.email_comms_preferences (user_id)
select
    id
from
    auth.users
where
    true on conflict (user_id)
do nothing;

-- Update trigger function to also add new users to email_comms_preferences
create
or replace function public.handle_new_user () returns trigger as $$
begin
  insert into public.users (id, full_name, avatar_url, email, created_at)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email, new.created_at);
  insert into public.email_comms_preferences (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-----------------------------------------------
--
-- Create functions for getting users analytics
--
-----------------------------------------------
--
-- How many days user was active between two dates
create
or replace function analytics_get_active_days (userid uuid, date_from date, date_to date) returns int language plpgsql as $$
declare
    active_days int;
begin
    select COUNT(DISTINCT month) into active_days from analytics.events 
    where month between date_from and date_to and 
    type = 'event' and user_id = userid;
return active_days;
end;
$$;

-- How many entries user has created between two dates
create
or replace function analytics_get_entries_created_count (userid uuid, date_from date, date_to date) returns int language plpgsql as $$
declare
    entries_created int;
begin
    select count(*) into entries_created from journals where
    user_id = userid and created_at between date_from and date_to + interval '1 day';
return entries_created;
end;
$$;

-- How much time user spent between two dates
create
or replace function analytics_get_usage_time (userid uuid, date_from date, date_to date) returns int language plpgsql as $$
declare
    usage_time int;
begin
    select SUM ((properties->>'sessionTime')::int) into usage_time from analytics.events 
    where month between date_from and date_to and type = 'event' and event = 'session' and user_id = userid;
return usage_time;
end;
$$;

-- Get users who opted-in for a Week on Journal mailing list
create
or replace function mailing_get_users_for_week_on_journal () returns table (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamp with time zone
) language sql as $$
    select users.id, users.full_name, users.email, users.avatar_url, users.created_at
    from users
    join email_comms_preferences on users.id = email_comms_preferences.user_id
    where email_comms_preferences.week_on_journal = true
    and users.email not like '%@privaterelay.appleid.com';
$$;

-- Get both users who opted-in for a Week on Journal mailing list and its analytics data
create
or replace function mailing_get_all_for_week_on_journal (
    date_from_1 date,
    date_to_1 date,
    date_from_2 date,
    date_to_2 date
) returns table (
    id uuid,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamp with time zone,
    active_days_1 int,
    usage_time_1 int,
    entries_created_count_1 int,
    active_days_2 int,
    usage_time_2 int,
    entries_created_count_2 int
) language sql as $$
    select id, full_name, email, avatar_url, created_at, active_days_1, usage_time_1, entries_created_count_1, active_days_2, usage_time_2, entries_created_count_2 from users
    join email_comms_preferences on users.id = email_comms_preferences.user_id,
    lateral analytics_get_active_days(users.id,date_from_1,date_to_1) active_days_1,
    lateral analytics_get_usage_time(users.id,date_from_1,date_to_1) usage_time_1,
    lateral analytics_get_entries_created_count(users.id,date_from_1,date_to_1) entries_created_count_1,
    lateral analytics_get_active_days(users.id,date_from_2,date_to_2) active_days_2,
    lateral analytics_get_usage_time(users.id,date_from_2,date_to_2) usage_time_2,
    lateral analytics_get_entries_created_count(users.id,date_from_2,date_to_2) entries_created_count_2
    where email_comms_preferences.week_on_journal = true and users.email not like '%@privaterelay.appleid.com';
$$;

----------------------------------------------
--
-- Send Week on Journal mailing
--
----------------------------------------------
-- Create cron job to call m.journal.do at 18:00 on Monday
select
    cron.schedule (
        'send-week-on-journal',
        '0 18 * * 1',
        $$
    select net.http_post(
          url:='https://m.journal.do/api/v1/send/week-on-journal' ,
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer J3zyLEePzC7zYP2o"}'::jsonb
      ) as request_id;
    $$
    );