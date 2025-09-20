-- DISABLE RLS - Deaktiver Row Level Security
-- Kjør dette i Supabase SQL Editor

-- Deaktiver RLS på alle tabeller
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_santa_pairs DISABLE ROW LEVEL SECURITY;

-- Slett eksisterende policies
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
DROP POLICY IF EXISTS "groups_policy" ON public.groups;
DROP POLICY IF EXISTS "group_members_policy" ON public.group_members;
DROP POLICY IF EXISTS "wishlists_policy" ON public.wishlists;
DROP POLICY IF EXISTS "invitations_policy" ON public.invitations;
DROP POLICY IF EXISTS "secret_santa_pairs_policy" ON public.secret_santa_pairs;
