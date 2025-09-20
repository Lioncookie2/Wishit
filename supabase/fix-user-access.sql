-- FIX USER ACCESS - Gi spesifikk bruker full tilgang
-- Kjør dette i Supabase SQL Editor

-- Slett alle eksisterende policies
DROP POLICY IF EXISTS "profiles_all" ON public.profiles;
DROP POLICY IF EXISTS "groups_all" ON public.groups;
DROP POLICY IF EXISTS "group_members_all" ON public.group_members;
DROP POLICY IF EXISTS "wishlists_all" ON public.wishlists;
DROP POLICY IF EXISTS "invitations_all" ON public.invitations;
DROP POLICY IF EXISTS "secret_santa_all" ON public.secret_santa_pairs;

-- Policies som gir full tilgang til autentiserte brukere
CREATE POLICY "profiles_authenticated" ON public.profiles
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "groups_authenticated" ON public.groups
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "group_members_authenticated" ON public.group_members
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "wishlists_authenticated" ON public.wishlists
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "invitations_authenticated" ON public.invitations
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "secret_santa_authenticated" ON public.secret_santa_pairs
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Oppdater profil for din bruker hvis den eksisterer
UPDATE public.profiles 
SET email = 'sebastian@fjellstua.net', 
    full_name = 'Sebastian',
    updated_at = now()
WHERE email = 'sebastian@fjellstua.net';

-- Opprett profil for din bruker hvis den ikke eksisterer
INSERT INTO public.profiles (id, email, full_name, is_premium)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'sebastian@fjellstua.net' LIMIT 1),
  'sebastian@fjellstua.net',
  'Sebastian',
  true
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'sebastian@fjellstua.net')
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'sebastian@fjellstua.net');
