-- GIFT LOGIC UPDATES - Nye funksjoner for julegave-logikk
-- Kjør dette i Supabase SQL Editor etter å ha spurt ChatGPT om det er trygt

-- 1. Legg til join_code felt i groups tabellen
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS join_code text;

-- 2. Generer join_code for eksisterende grupper som ikke har det
UPDATE public.groups 
SET join_code = LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0')
WHERE join_code IS NULL;

-- 3. Legg til nye felter i wishlists tabellen for julegave-logikk
ALTER TABLE public.wishlists ADD COLUMN IF NOT EXISTS purchased_at timestamp with time zone;
ALTER TABLE public.wishlists ADD COLUMN IF NOT EXISTS purchase_comment text;
ALTER TABLE public.wishlists ADD COLUMN IF NOT EXISTS thank_you_message text;

-- 4. Legg til avatar_url felt i profiles tabellen (hvis det ikke finnes)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 5. Sørg for at full_name feltet eksisterer i profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

-- 5.1. Legg til nye profil-felter for arbeidsgiver/adresse
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workplace text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- 5.2. Legg til medlemsstatus for godkjenning
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS requested_at timestamp with time zone DEFAULT timezone('utc'::text, now());
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id);

-- 5.3. Legg til constraint for status etter at kolonnen er opprettet
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_status_check;
ALTER TABLE public.group_members ADD CONSTRAINT group_members_status_check 
CHECK (status IN ('pending', 'active', 'kicked'));

-- 6. Oppdater RLS policies for de nye feltene
-- (Eksisterende policies dekker allerede de nye feltene siden de bruker SELECT *)

-- 6.1. Legg til policy for offentlig tilgang til groups via join_code
DROP POLICY IF EXISTS "groups_select_by_join_code" ON public.groups;
CREATE POLICY "groups_select_by_join_code" ON public.groups
  FOR SELECT TO anon, authenticated
  USING (join_code IS NOT NULL);

-- 6.2. Legg til policy for å bli med i gruppe via join_code (pending status)
DROP POLICY IF EXISTS "group_members_insert_by_join_code" ON public.group_members;
CREATE POLICY "group_members_insert_by_join_code" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id
        AND g.join_code IS NOT NULL
    )
    AND status = 'pending'
  );

-- 6.3. Legg til policy for admin å fjerne medlemmer
DROP POLICY IF EXISTS "group_members_delete_admin" ON public.group_members;
CREATE POLICY "group_members_delete_admin" ON public.group_members
  FOR DELETE TO authenticated
  USING (
    group_id IN (
      SELECT id FROM public.groups 
      WHERE admin_id = auth.uid()
    )
  );

-- 6.4. Legg til policy for å oppdatere medlemsstatus (godkjenning)
DROP POLICY IF EXISTS "group_members_update_admin" ON public.group_members;
CREATE POLICY "group_members_update_admin" ON public.group_members
  FOR UPDATE TO authenticated
  USING (
    group_id IN (
      SELECT id FROM public.groups 
      WHERE admin_id = auth.uid()
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id FROM public.groups 
      WHERE admin_id = auth.uid()
    )
  );

-- 7. Legg til indexer for bedre ytelse
CREATE INDEX IF NOT EXISTS idx_groups_join_code ON public.groups(join_code);
CREATE INDEX IF NOT EXISTS idx_wishlists_purchased_at ON public.wishlists(purchased_at);
CREATE INDEX IF NOT EXISTS idx_wishlists_purchased_by ON public.wishlists(purchased_by);

-- 8. Legg til kommentarer for dokumentasjon
COMMENT ON COLUMN public.groups.join_code IS 'Firesifret kode for å bli med i gruppen';
COMMENT ON COLUMN public.wishlists.purchased_at IS 'Når gaven ble kjøpt';
COMMENT ON COLUMN public.wishlists.purchase_comment IS 'Kommentar fra giveren ved kjøp';
COMMENT ON COLUMN public.wishlists.thank_you_message IS 'Takk-melding fra mottakeren';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Base64-kodet profilbilde';
COMMENT ON COLUMN public.profiles.full_name IS 'Brukerens fulle navn';
COMMENT ON COLUMN public.profiles.workplace IS 'Arbeidsgiver eller arbeidssted';
COMMENT ON COLUMN public.profiles.address IS 'Brukerens adresse';
COMMENT ON COLUMN public.profiles.phone IS 'Telefonnummer';
COMMENT ON COLUMN public.profiles.bio IS 'Kort beskrivelse av brukeren';
COMMENT ON COLUMN public.group_members.status IS 'Medlemsstatus: pending, active, kicked';
COMMENT ON COLUMN public.group_members.requested_at IS 'Når medlemskap ble forespurt';
COMMENT ON COLUMN public.group_members.approved_at IS 'Når medlemskap ble godkjent';
COMMENT ON COLUMN public.group_members.approved_by IS 'Hvem som godkjente medlemskapet';

-- 9. Validering for join_code (valgfritt) - fjern eksisterende først
ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS check_join_code_format;
ALTER TABLE public.groups ADD CONSTRAINT check_join_code_format 
CHECK (join_code ~ '^[0-9]{4}$' OR join_code IS NULL);

-- 10. Validering for purchased_at (valgfritt) - fjern eksisterende først
ALTER TABLE public.wishlists DROP CONSTRAINT IF EXISTS check_purchased_at_consistency;
ALTER TABLE public.wishlists ADD CONSTRAINT check_purchased_at_consistency
CHECK (
  (is_purchased = true AND purchased_at IS NOT NULL AND purchased_by IS NOT NULL) OR
  (is_purchased = false AND purchased_at IS NULL AND purchased_by IS NULL)
);

-- 11. Opprett automatisk profil-opprettelse når bruker registrerer seg
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Opprett trigger for automatisk profil-opprettelse
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Legg til felt for å huske invitasjonslenke
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS invite_token text;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS invite_url text;

-- 14. Generer invite_token for eksisterende invitasjoner
UPDATE public.invitations 
SET invite_token = gen_random_uuid()::text
WHERE invite_token IS NULL;

-- 15. Oppdater invite_url for eksisterende invitasjoner
UPDATE public.invitations 
SET invite_url = 'https://your-app.com/invite/' || invite_token
WHERE invite_url IS NULL;

-- 16. Legg til policy for å oppdatere wishlists (for kjøp-funksjonalitet)
DROP POLICY IF EXISTS "wishlists_update_group_members" ON public.wishlists;
CREATE POLICY "wishlists_update_group_members" ON public.wishlists
  FOR UPDATE TO authenticated
  USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = wishlists.group_id
        AND gm.user_id = auth.uid()
        AND gm.status = 'active'
    )
  )
  WITH CHECK (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = wishlists.group_id
        AND gm.user_id = auth.uid()
        AND gm.status = 'active'
    )
  );

-- 17. Legg til nye felter for avansert kjøp-funksjonalitet
ALTER TABLE public.wishlists ADD COLUMN IF NOT EXISTS purchase_contributions jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.wishlists ADD COLUMN IF NOT EXISTS purchase_total_contributed numeric(10,2) DEFAULT 0;
ALTER TABLE public.wishlists ADD COLUMN IF NOT EXISTS purchase_remaining_amount numeric(10,2);

-- 18. Oppdater remaining_amount når total_contributed endres
CREATE OR REPLACE FUNCTION update_purchase_remaining_amount()
RETURNS trigger AS $$
BEGIN
  IF NEW.purchase_total_contributed IS NOT NULL AND NEW.price IS NOT NULL THEN
    NEW.purchase_remaining_amount = NEW.price - NEW.purchase_total_contributed;
  ELSE
    NEW.purchase_remaining_amount = NEW.price;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 19. Opprett trigger for å oppdatere remaining_amount
DROP TRIGGER IF EXISTS update_remaining_amount_trigger ON public.wishlists;
CREATE TRIGGER update_remaining_amount_trigger
  BEFORE UPDATE ON public.wishlists
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_remaining_amount();

-- 20. Legg til RLS policies for secret_santa_pairs
DROP POLICY IF EXISTS "secret_santa_select_own" ON public.secret_santa_pairs;
CREATE POLICY "secret_santa_select_own" ON public.secret_santa_pairs
  FOR SELECT TO authenticated
  USING (giver_id = auth.uid());

DROP POLICY IF EXISTS "secret_santa_insert_admin" ON public.secret_santa_pairs;
CREATE POLICY "secret_santa_insert_admin" ON public.secret_santa_pairs
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT id FROM public.groups 
      WHERE admin_id = auth.uid()
    )
  );

-- 21. Legg til kommentarer for nye felter
COMMENT ON COLUMN public.wishlists.purchase_contributions IS 'JSON array med bidrag fra medlemmer';
COMMENT ON COLUMN public.wishlists.purchase_total_contributed IS 'Total sum av alle bidrag';
COMMENT ON COLUMN public.wishlists.purchase_remaining_amount IS 'Gjenstående beløp som må betales';
