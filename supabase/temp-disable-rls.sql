-- MIDLERTIDIG DEAKTIVER RLS FOR TESTING
-- Kjør dette i Supabase SQL Editor

-- Deaktiver RLS midlertidig for testing
ALTER TABLE public.wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_santa_pairs DISABLE ROW LEVEL SECURITY;

-- Legg til nye prisfelter
ALTER TABLE public.wishlists 
ADD COLUMN IF NOT EXISTS current_price numeric(10,2),
ADD COLUMN IF NOT EXISTS previous_price numeric(10,2),
ADD COLUMN IF NOT EXISTS price_provider text,
ADD COLUMN IF NOT EXISTS last_price_check timestamp with time zone,
ADD COLUMN IF NOT EXISTS price_drop_notification_sent boolean default false;

-- Opprett indekser
CREATE INDEX IF NOT EXISTS idx_wishlists_price_check ON public.wishlists(last_price_check);
CREATE INDEX IF NOT EXISTS idx_wishlists_price_drop ON public.wishlists(price_drop_notification_sent) WHERE price_drop_notification_sent = false;

-- Kommentarer
COMMENT ON COLUMN public.wishlists.current_price IS 'Nåværende pris på produktet';
COMMENT ON COLUMN public.wishlists.previous_price IS 'Tidligere pris for å oppdage prisfall';
COMMENT ON COLUMN public.wishlists.price_provider IS 'Kilde for prisdata (f.eks. scraper, manual)';
COMMENT ON COLUMN public.wishlists.last_price_check IS 'Når prisen sist ble sjekket';
COMMENT ON COLUMN public.wishlists.price_drop_notification_sent IS 'Om prisfall-varsel er sendt';
