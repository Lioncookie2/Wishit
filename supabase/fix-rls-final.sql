-- FIX RLS FINAL - Riktige policies basert på ChatGPT 5's analyse
-- Kjør dette i Supabase SQL Editor

-- Rydd opp gamle policies
DROP POLICY IF EXISTS "profiles_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "groups_authenticated" ON public.groups;
DROP POLICY IF EXISTS "group_members_authenticated" ON public.group_members;
DROP POLICY IF EXISTS "wishlists_authenticated" ON public.wishlists;
DROP POLICY IF EXISTS "invitations_authenticated" ON public.invitations;
DROP POLICY IF EXISTS "secret_santa_authenticated" ON public.secret_santa_pairs;

-- Legg til join_code felt i groups tabellen
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS join_code text;

-- Generer join_code for eksisterende grupper som ikke har det
UPDATE public.groups 
SET join_code = LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0')
WHERE join_code IS NULL;

-- Legg til nye felter i wishlists tabellen for julegave-logikk
ALTER TABLE public.wishlists ADD COLUMN IF NOT EXISTS purchased_at timestamp with time zone;
ALTER TABLE public.wishlists ADD COLUMN IF NOT EXISTS purchase_comment text;
ALTER TABLE public.wishlists ADD COLUMN IF NOT EXISTS thank_you_message text;

-- PROFILES policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Opprett view for å unngå infinite recursion
CREATE OR REPLACE VIEW public.user_group_ids AS
SELECT 
  gm.group_id,
  gm.user_id
FROM public.group_members gm;

-- GROUPS policies - forenklet for å unngå infinite recursion
CREATE POLICY "groups_select_member" ON public.groups
  FOR SELECT TO authenticated
  USING (
    admin_id = auth.uid() OR
    id IN (
      SELECT group_id FROM public.user_group_ids 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "groups_insert_admin" ON public.groups
  FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "groups_update_admin" ON public.groups
  FOR UPDATE TO authenticated
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "groups_delete_admin" ON public.groups
  FOR DELETE TO authenticated
  USING (admin_id = auth.uid());

-- GROUP_MEMBERS policies - forenklet for å unngå infinite recursion
CREATE POLICY "group_members_select" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    group_id IN (
      SELECT id FROM public.groups 
      WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "group_members_insert_admin" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT id FROM public.groups 
      WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "group_members_delete_admin" ON public.group_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR
    group_id IN (
      SELECT id FROM public.groups 
      WHERE admin_id = auth.uid()
    )
  );

-- WISHLISTS policies
-- Policy for å se egne personlige ønsker (uten gruppe)
CREATE POLICY "wishlists_select_own_personal" ON public.wishlists
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() AND group_id IS NULL
  );

-- Policy for å se ønsker i grupper hvor brukeren er medlem
CREATE POLICY "wishlists_select_visible_to_group" ON public.wishlists
  FOR SELECT TO authenticated
  USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = wishlists.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- Policy for å legge til personlige ønsker (uten gruppe)
CREATE POLICY "wishlists_insert_own_personal" ON public.wishlists
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND group_id IS NULL
  );

-- Policy for å legge til ønsker i grupper
CREATE POLICY "wishlists_insert_own_in_group" ON public.wishlists
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND group_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = wishlists.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- Policy for å oppdatere egne ønsker (både personlige og i grupper)
CREATE POLICY "wishlists_update_own" ON public.wishlists
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy for å slette egne ønsker (både personlige og i grupper)
CREATE POLICY "wishlists_delete_own" ON public.wishlists
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- INVITATIONS policies - forenklet for å unngå infinite recursion
CREATE POLICY "invitations_select_admin" ON public.invitations
  FOR SELECT TO authenticated
  USING (
    group_id IN (
      SELECT id FROM public.groups 
      WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "invitations_insert_admin" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT id FROM public.groups 
      WHERE admin_id = auth.uid()
    )
  );

-- SECRET_SANTA_PAIRS policies - forenklet for å unngå infinite recursion
CREATE POLICY "secret_santa_select_own" ON public.secret_santa_pairs
  FOR SELECT TO authenticated
  USING (giver_id = auth.uid());

CREATE POLICY "secret_santa_insert_admin" ON public.secret_santa_pairs
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT id FROM public.groups 
      WHERE admin_id = auth.uid()
    )
  );
