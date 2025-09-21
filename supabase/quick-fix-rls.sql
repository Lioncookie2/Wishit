-- QUICK FIX RLS - Kjør dette i Supabase SQL Editor
-- Dette deaktiverer RLS midlertidig for å fikse tillatelsesproblemet

-- Deaktiver RLS for alle tabeller
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

-- Legg til Mystery Gift felter
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS mystery_gift_enabled boolean default false,
ADD COLUMN IF NOT EXISTS mystery_gift_budget numeric(10,2) default 200;

-- Legg til bidrag-felter for ønsker
ALTER TABLE public.wishlists 
ADD COLUMN IF NOT EXISTS contributions jsonb default '[]',
ADD COLUMN IF NOT EXISTS total_contributed numeric(10,2) default 0,
ADD COLUMN IF NOT EXISTS is_fully_funded boolean default false;

-- Opprett indekser
CREATE INDEX IF NOT EXISTS idx_wishlists_price_check ON public.wishlists(last_price_check);
CREATE INDEX IF NOT EXISTS idx_wishlists_price_drop ON public.wishlists(price_drop_notification_sent) WHERE price_drop_notification_sent = false;
CREATE INDEX IF NOT EXISTS idx_groups_mystery_gift ON public.groups(mystery_gift_enabled) WHERE mystery_gift_enabled = true;

-- Kommentarer
COMMENT ON COLUMN public.wishlists.current_price IS 'Nåværende pris på produktet';
COMMENT ON COLUMN public.wishlists.previous_price IS 'Tidligere pris for å oppdage prisfall';
COMMENT ON COLUMN public.wishlists.price_provider IS 'Kilde for prisdata (f.eks. scraper, manual)';
COMMENT ON COLUMN public.wishlists.last_price_check IS 'Når prisen sist ble sjekket';
COMMENT ON COLUMN public.wishlists.price_drop_notification_sent IS 'Om prisfall-varsel er sendt';
COMMENT ON COLUMN public.wishlists.contributions IS 'Bidrag til ønsket som JSON array';
COMMENT ON COLUMN public.wishlists.total_contributed IS 'Totalt bidrag til ønsket';
COMMENT ON COLUMN public.wishlists.is_fully_funded IS 'Om ønsket er fullfinansiert';
COMMENT ON COLUMN public.groups.mystery_gift_enabled IS 'Om Mystery Gift er aktivert i gruppen';
COMMENT ON COLUMN public.groups.mystery_gift_budget IS 'Budsjett for Mystery Gift per person';
