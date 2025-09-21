-- QUICK RLS FIX - Kjør dette i Supabase SQL Editor
-- Dette deaktiverer RLS midlertidig for testing

-- 1. Deaktiver RLS på alle tabeller
ALTER TABLE public.wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_santa_pairs DISABLE ROW LEVEL SECURITY;

-- 2. Legg til nye felter
ALTER TABLE public.wishlists 
ADD COLUMN IF NOT EXISTS current_price numeric(10,2),
ADD COLUMN IF NOT EXISTS previous_price numeric(10,2),
ADD COLUMN IF NOT EXISTS price_provider text,
ADD COLUMN IF NOT EXISTS last_price_check timestamp with time zone,
ADD COLUMN IF NOT EXISTS price_drop_notification_sent boolean default false,
ADD COLUMN IF NOT EXISTS contributions jsonb default '[]',
ADD COLUMN IF NOT EXISTS total_contributed numeric(10,2) default 0,
ADD COLUMN IF NOT EXISTS is_fully_funded boolean default false;

ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS mystery_gift_enabled boolean default false,
ADD COLUMN IF NOT EXISTS mystery_gift_budget numeric(10,2) default 200;

-- 3. Test at RLS er deaktivert
SELECT 'RLS deaktivert for testing' as status, 
       CASE WHEN NOT EXISTS (
         SELECT 1 FROM pg_class WHERE relname = 'groups' AND relrowsecurity = true
       ) THEN 'SUCCESS' ELSE 'FAILED' END as result;
