-- FIX PERMISSIONS - Legg til enkle RLS policies
-- Kjør dette i Supabase SQL Editor

-- Aktiver RLS på alle tabeller
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_santa_pairs ENABLE ROW LEVEL SECURITY;

-- Enkle policies som tillater alt for autentiserte brukere
CREATE POLICY "profiles_policy" ON public.profiles
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "groups_policy" ON public.groups
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "group_members_policy" ON public.group_members
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "wishlists_policy" ON public.wishlists
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "invitations_policy" ON public.invitations
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "secret_santa_pairs_policy" ON public.secret_santa_pairs
  FOR ALL USING (auth.uid() IS NOT NULL);
