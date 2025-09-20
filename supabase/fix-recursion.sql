-- FIX INFINITE RECURSION - Forenkle policies
-- Kjør dette i Supabase SQL Editor

-- Slett alle eksisterende policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "groups_select_member" ON public.groups;
DROP POLICY IF EXISTS "groups_insert_admin" ON public.groups;
DROP POLICY IF EXISTS "groups_update_admin" ON public.groups;
DROP POLICY IF EXISTS "groups_delete_admin" ON public.groups;
DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
DROP POLICY IF EXISTS "group_members_insert_admin" ON public.group_members;
DROP POLICY IF EXISTS "group_members_delete_admin" ON public.group_members;
DROP POLICY IF EXISTS "wishlists_select_own" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_select_group" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_insert_own" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_update_own" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_delete_own" ON public.wishlists;
DROP POLICY IF EXISTS "invitations_select_admin" ON public.invitations;
DROP POLICY IF EXISTS "invitations_insert_admin" ON public.invitations;
DROP POLICY IF EXISTS "secret_santa_select_own" ON public.secret_santa_pairs;
DROP POLICY IF EXISTS "secret_santa_insert_admin" ON public.secret_santa_pairs;

-- Enkle policies uten nested queries
CREATE POLICY "profiles_all" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "groups_all" ON public.groups
  FOR ALL USING (auth.uid() = admin_id);

CREATE POLICY "group_members_all" ON public.group_members
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "wishlists_all" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "invitations_all" ON public.invitations
  FOR ALL USING (auth.uid() = invited_by);

CREATE POLICY "secret_santa_all" ON public.secret_santa_pairs
  FOR ALL USING (auth.uid() = giver_id);
