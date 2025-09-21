-- Legg til prisfelter i wishlists tabellen
-- Kjør dette i Supabase SQL Editor

-- Legg til nye kolonner for prisoppfølging
ALTER TABLE public.wishlists 
ADD COLUMN current_price numeric(10,2),
ADD COLUMN previous_price numeric(10,2),
ADD COLUMN price_provider text,
ADD COLUMN last_price_check timestamp with time zone,
ADD COLUMN price_drop_notification_sent boolean default false;

-- Oppdater eksisterende price-kolonne til å være previous_price
UPDATE public.wishlists 
SET previous_price = price 
WHERE price IS NOT NULL;

-- Slett den gamle price-kolonnen (valgfritt - kan beholde den for bakoverkompatibilitet)
-- ALTER TABLE public.wishlists DROP COLUMN price;

-- Legg til indeks for effektiv prisoppfølging
CREATE INDEX idx_wishlists_price_check ON public.wishlists(last_price_check);
CREATE INDEX idx_wishlists_price_drop ON public.wishlists(price_drop_notification_sent) WHERE price_drop_notification_sent = false;

-- Kommentarer for kolonnene
COMMENT ON COLUMN public.wishlists.current_price IS 'Nåværende pris på produktet';
COMMENT ON COLUMN public.wishlists.previous_price IS 'Tidligere pris for å oppdage prisfall';
COMMENT ON COLUMN public.wishlists.price_provider IS 'Kilde for prisdata (f.eks. scraper, prisjakt)';
COMMENT ON COLUMN public.wishlists.last_price_check IS 'Når prisen sist ble sjekket';
COMMENT ON COLUMN public.wishlists.price_drop_notification_sent IS 'Om prisfall-varsel er sendt';
