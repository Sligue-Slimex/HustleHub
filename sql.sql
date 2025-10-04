-- Supabase SQL: create tables for HustleHub
-- Run this in Supabase SQL editor (or via psql) to create required tables.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  price numeric,
  image_url text,
  kind text check (kind in ('item','job')) default 'item',
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  sender_id uuid references auth.users(id),
  receiver_id uuid references auth.users(id),
  content text,
  created_at timestamptz default now()
);

create table saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  listing_id uuid references listings(id),
  created_at timestamptz default now()
);

-- Storage: create a bucket named 'public' and set it public for image hosting.
-- In Supabase UI: Storage -> Create new bucket -> name: public -> Public: enabled
