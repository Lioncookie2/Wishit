# 🚨 QUICK FIX GUIDE - Fikse RLS-problem

## Problem
Appen får "permission denied" feil fordi RLS (Row Level Security) er aktivert i Supabase.

## Løsning (5 minutter)

### Steg 1: Åpne Supabase Dashboard
1. Gå til [supabase.com/dashboard](https://supabase.com/dashboard)
2. Logg inn og velg ditt prosjekt
3. Klikk på **SQL Editor** i venstre meny

### Steg 2: Kopier og lim inn dette scriptet
Kopier hele innholdet fra `supabase/EMERGENCY-RLS-FIX.sql` og lim det inn i SQL Editor:

```sql
-- EMERGENCY RLS FIX - Kjør dette i Supabase SQL Editor
-- Dette deaktiverer RLS helt og legger til alle nye felter

-- Deaktiver RLS for alle tabeller
ALTER TABLE public.wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_santa_pairs DISABLE ROW LEVEL SECURITY;

-- Legg til alle nye felter i wishlists
ALTER TABLE public.wishlists 
ADD COLUMN IF NOT EXISTS current_price numeric(10,2),
ADD COLUMN IF NOT EXISTS previous_price numeric(10,2),
ADD COLUMN IF NOT EXISTS price_provider text,
ADD COLUMN IF NOT EXISTS last_price_check timestamp with time zone,
ADD COLUMN IF NOT EXISTS price_drop_notification_sent boolean default false,
ADD COLUMN IF NOT EXISTS contributions jsonb default '[]',
ADD COLUMN IF NOT EXISTS total_contributed numeric(10,2) default 0,
ADD COLUMN IF NOT EXISTS is_fully_funded boolean default false;

-- Legg til alle nye felter i groups
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS mystery_gift_enabled boolean default false,
ADD COLUMN IF NOT EXISTS mystery_gift_budget numeric(10,2) default 200;

-- Opprett mystery_gift_pairs tabell hvis den ikke eksisterer
CREATE TABLE IF NOT EXISTS public.mystery_gift_pairs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  giver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_id uuid REFERENCES public.wishlists(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Opprett indekser
CREATE INDEX IF NOT EXISTS idx_wishlists_price_check ON public.wishlists(last_price_check);
CREATE INDEX IF NOT EXISTS idx_wishlists_price_drop ON public.wishlists(price_drop_notification_sent) WHERE price_drop_notification_sent = false;
CREATE INDEX IF NOT EXISTS idx_groups_mystery_gift ON public.groups(mystery_gift_enabled) WHERE mystery_gift_enabled = true;

-- Test at RLS er deaktivert
SELECT 'RLS deaktivert for wishlists' as status, 
       CASE WHEN NOT EXISTS (
         SELECT 1 FROM pg_class WHERE relname = 'wishlists' AND relrowsecurity = true
       ) THEN 'SUCCESS' ELSE 'FAILED' END as result;
```

### Steg 3: Kjør scriptet
1. Klikk **Run** i SQL Editor
2. Vent til scriptet er ferdig (skal ta 10-30 sekunder)
3. Du skal se "SUCCESS" i resultatet

### Steg 4: Test appen
1. Gå tilbake til appen i nettleseren
2. Refresh siden (F5)
3. Appen skal nå fungere uten feil!

## Hvis det ikke fungerer

### Sjekkliste:
- [ ] Er du logget inn i Supabase?
- [ ] Har du valgt riktig prosjekt?
- [ ] Viste scriptet "SUCCESS" i resultatet?
- [ ] Er appen kjører på localhost:3000?

### Feilsøking:
1. **"Permission denied"** → RLS er fortsatt aktivert, kjør scriptet igjen
2. **"Invalid UUID"** → Appen er fikset, men RLS må deaktiveres
3. **"Connection failed"** → Sjekk at Supabase-prosjektet er aktivt

## Etter at det fungerer

### Test alle funksjoner:
1. **Ønskeliste** - Legg til og vis ønsker
2. **Grupper** - Opprett og vis grupper  
3. **Premium** - Skriv inn `Premium2025` for å aktivere Premium
4. **Notifikasjoner** - Se simulert notifikasjonsfeed

### Alle julefunksjoner er tilgjengelige:
- 🎁 Mystery Gift
- 🎅 Secret Santa Pro  
- 💰 Prisoversikt
- 🤝 Bidrag på gaver
- 📉 Prisfall-varsler

## Sikkerhet
⚠️ **Viktig**: Dette deaktiverer RLS midlertidig for testing. I produksjon bør du:
1. Reaktivere RLS med riktige policyer
2. Teste alle funksjoner grundig
3. Sette opp riktige tillatelser

Appen skal nå fungere perfekt! 🎉
