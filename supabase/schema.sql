-- Julegaveapp Database Schema - Komplett reset
-- Kjør dette i Supabase SQL Editor

-- Slett ALT først
drop table if exists public.invitations cascade;
drop table if exists public.wishlists cascade;
drop table if exists public.group_members cascade;
drop table if exists public.groups cascade;
drop table if exists public.profiles cascade;

-- Slett funksjoner
drop function if exists public.handle_new_user() cascade;

-- Opprett profiles tabell
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  is_premium boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Opprett groups tabell
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  admin_id uuid references public.profiles(id) on delete cascade not null,
  budget numeric(10,2),
  budget_per_member numeric(10,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Opprett group_members tabell
create table public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- Opprett wishlists tabell
create table public.wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade,
  title text not null,
  description text,
  url text not null,
  price numeric(10,2),
  image_url text,
  store_name text,
  is_purchased boolean default false,
  purchased_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Opprett invitations tabell
create table public.invitations (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  email text not null,
  invited_by uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '7 days') not null,
  unique(group_id, email)
);

-- Opprett secret_santa_pairs tabell
create table public.secret_santa_pairs (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  giver_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, giver_id)
);

-- Funksjon for å opprette profil automatisk
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for automatisk profiloppretting
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();