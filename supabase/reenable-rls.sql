-- REAKTIVER RLS MED RIKTIGE POLICYER
-- Kjør dette i Supabase SQL Editor etter testing

-- Reaktiver RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_santa_pairs ENABLE ROW LEVEL SECURITY;

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

-- GROUPS policies
CREATE POLICY "groups_select_member" ON public.groups
  FOR SELECT TO authenticated
  USING (
    admin_id = auth.uid() OR
    id IN (
      SELECT group_id FROM public.group_members 
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

-- GROUP_MEMBERS policies
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
CREATE POLICY "wishlists_select_own_personal" ON public.wishlists
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() AND group_id IS NULL
  );

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

CREATE POLICY "wishlists_insert_own_personal" ON public.wishlists
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND group_id IS NULL
  );

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

CREATE POLICY "wishlists_update_own" ON public.wishlists
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "wishlists_delete_own" ON public.wishlists
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- INVITATIONS policies
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

-- SECRET_SANTA_PAIRS policies
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
