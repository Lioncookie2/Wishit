-- FIX WISHLISTS RLS - Inkluderer nye prisfelter
-- Kjør dette i Supabase SQL Editor

-- Slett eksisterende wishlists policies
DROP POLICY IF EXISTS "wishlists_select_own_personal" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_select_visible_to_group" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_insert_own_personal" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_insert_own_in_group" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_update_own" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_delete_own" ON public.wishlists;

-- Legg til nye prisfelter hvis de ikke eksisterer
ALTER TABLE public.wishlists 
ADD COLUMN IF NOT EXISTS current_price numeric(10,2),
ADD COLUMN IF NOT EXISTS previous_price numeric(10,2),
ADD COLUMN IF NOT EXISTS price_provider text,
ADD COLUMN IF NOT EXISTS last_price_check timestamp with time zone,
ADD COLUMN IF NOT EXISTS price_drop_notification_sent boolean default false;

-- Opprett indekser for effektiv prisoppfølging
CREATE INDEX IF NOT EXISTS idx_wishlists_price_check ON public.wishlists(last_price_check);
CREATE INDEX IF NOT EXISTS idx_wishlists_price_drop ON public.wishlists(price_drop_notification_sent) WHERE price_drop_notification_sent = false;

-- WISHLISTS policies - oppdatert med nye prisfelter

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

-- Policy for å oppdatere priser (for systemet/API)
CREATE POLICY "wishlists_update_prices" ON public.wishlists
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Kommentarer for de nye kolonnene
COMMENT ON COLUMN public.wishlists.current_price IS 'Nåværende pris på produktet';
COMMENT ON COLUMN public.wishlists.previous_price IS 'Tidligere pris for å oppdage prisfall';
COMMENT ON COLUMN public.wishlists.price_provider IS 'Kilde for prisdata (f.eks. scraper, manual)';
COMMENT ON COLUMN public.wishlists.last_price_check IS 'Når prisen sist ble sjekket';
COMMENT ON COLUMN public.wishlists.price_drop_notification_sent IS 'Om prisfall-varsel er sendt';
