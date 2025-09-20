-- FIX RLS PROPERLY - Riktige policies for sikkerhet
-- Kjør dette i Supabase SQL Editor

-- Slett eksisterende policies først
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
DROP POLICY IF EXISTS "groups_policy" ON public.groups;
DROP POLICY IF EXISTS "group_members_policy" ON public.group_members;
DROP POLICY IF EXISTS "wishlists_policy" ON public.wishlists;
DROP POLICY IF EXISTS "invitations_policy" ON public.invitations;
DROP POLICY IF EXISTS "secret_santa_pairs_policy" ON public.secret_santa_pairs;

-- Aktiver RLS på alle tabeller
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_santa_pairs ENABLE ROW LEVEL SECURITY;

-- Profiles policies - brukere kan se og oppdatere sin egen profil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups policies - brukere kan se grupper de tilhører
CREATE POLICY "groups_select_member" ON public.groups
  FOR SELECT USING (
    auth.uid() = admin_id OR 
    auth.uid() IN (SELECT user_id FROM public.group_members WHERE group_id = id)
  );

CREATE POLICY "groups_insert_admin" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "groups_update_admin" ON public.groups
  FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "groups_delete_admin" ON public.groups
  FOR DELETE USING (auth.uid() = admin_id);

-- Group members policies - medlemmer kan se gruppemedlemskap
CREATE POLICY "group_members_select" ON public.group_members
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT admin_id FROM public.groups WHERE id = group_id)
  );

CREATE POLICY "group_members_insert_admin" ON public.group_members
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT admin_id FROM public.groups WHERE id = group_id)
  );

CREATE POLICY "group_members_delete_admin" ON public.group_members
  FOR DELETE USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT admin_id FROM public.groups WHERE id = group_id)
  );

-- Wishlists policies - eiere kan se sine egne ønsker
CREATE POLICY "wishlists_select_own" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id);

-- Gruppemedlemmer kan se gruppeønsker
CREATE POLICY "wishlists_select_group" ON public.wishlists
  FOR SELECT USING (
    group_id IS NOT NULL AND 
    auth.uid() IN (SELECT user_id FROM public.group_members WHERE group_id = wishlists.group_id)
  );

CREATE POLICY "wishlists_insert_own" ON public.wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlists_update_own" ON public.wishlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "wishlists_delete_own" ON public.wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- Invitations policies - admins kan se og opprette invitasjoner
CREATE POLICY "invitations_select_admin" ON public.invitations
  FOR SELECT USING (
    auth.uid() IN (SELECT admin_id FROM public.groups WHERE id = group_id)
  );

CREATE POLICY "invitations_insert_admin" ON public.invitations
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT admin_id FROM public.groups WHERE id = group_id)
  );

-- Secret Santa policies - medlemmer kan se sine egne par
CREATE POLICY "secret_santa_select_own" ON public.secret_santa_pairs
  FOR SELECT USING (auth.uid() = giver_id);

CREATE POLICY "secret_santa_insert_admin" ON public.secret_santa_pairs
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT admin_id FROM public.groups WHERE id = group_id)
  );
