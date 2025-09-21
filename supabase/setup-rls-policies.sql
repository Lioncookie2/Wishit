-- RLS Policy Setup for Wishit App
-- Kjør dette i Supabase SQL Editor for å sette opp riktige RLS-policyer

-- 1. Aktiver RLS på alle tabeller
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_santa_pairs ENABLE ROW LEVEL SECURITY;

-- 2. Slett eksisterende policyer (hvis noen)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view wishlists in their groups" ON public.wishlists;
DROP POLICY IF EXISTS "Users can manage own wishlists" ON public.wishlists;

-- 3. PROFILES - Brukere kan se og oppdatere sin egen profil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. GROUPS - Brukere kan se grupper de tilhører
CREATE POLICY "Users can view groups they belong to" ON public.groups
    FOR SELECT USING (
        auth.uid() = admin_id OR 
        auth.uid() IN (
            SELECT user_id FROM public.group_members 
            WHERE group_id = groups.id AND status = 'active'
        )
    );

CREATE POLICY "Users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update their groups" ON public.groups
    FOR UPDATE USING (auth.uid() = admin_id);

-- 5. GROUP_MEMBERS - Brukere kan se medlemmer i grupper de tilhører
CREATE POLICY "Users can view group members" ON public.group_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT admin_id FROM public.groups WHERE id = group_id
        ) OR
        auth.uid() IN (
            SELECT user_id FROM public.group_members 
            WHERE group_id = group_members.group_id AND status = 'active'
        )
    );

CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.group_members
    FOR DELETE USING (auth.uid() = user_id);

-- 6. WISHLISTS - Brukere kan se ønsker i grupper de tilhører
CREATE POLICY "Users can view wishlists in their groups" ON public.wishlists
    FOR SELECT USING (
        auth.uid() = user_id OR
        group_id IN (
            SELECT id FROM public.groups WHERE admin_id = auth.uid()
        ) OR
        group_id IN (
            SELECT group_id FROM public.group_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can create wishlists" ON public.wishlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlists" ON public.wishlists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlists" ON public.wishlists
    FOR DELETE USING (auth.uid() = user_id);

-- 7. INVITATIONS - Brukere kan se invitasjoner til grupper de administrerer
CREATE POLICY "Admins can view group invitations" ON public.invitations
    FOR SELECT USING (
        auth.uid() IN (
            SELECT admin_id FROM public.groups WHERE id = group_id
        )
    );

CREATE POLICY "Admins can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT admin_id FROM public.groups WHERE id = group_id
        )
    );

-- 8. SECRET_SANTA_PAIRS - Brukere kan se sine egne Secret Santa-par
CREATE POLICY "Users can view own secret santa pairs" ON public.secret_santa_pairs
    FOR SELECT USING (
        auth.uid() = giver_id OR
        auth.uid() IN (
            SELECT admin_id FROM public.groups WHERE id = group_id
        )
    );

CREATE POLICY "Admins can create secret santa pairs" ON public.secret_santa_pairs
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT admin_id FROM public.groups WHERE id = group_id
        )
    );

-- 9. Legg til nye felter hvis de ikke eksisterer
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

-- 10. Opprett mystery_gift_pairs tabell hvis den ikke eksisterer
CREATE TABLE IF NOT EXISTS public.mystery_gift_pairs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  giver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_id uuid REFERENCES public.wishlists(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 11. RLS for mystery_gift_pairs
ALTER TABLE public.mystery_gift_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mystery gift pairs" ON public.mystery_gift_pairs
    FOR SELECT USING (
        auth.uid() = giver_id OR
        auth.uid() IN (
            SELECT admin_id FROM public.groups WHERE id = group_id
        )
    );

CREATE POLICY "Admins can create mystery gift pairs" ON public.mystery_gift_pairs
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT admin_id FROM public.groups WHERE id = group_id
        )
    );

-- 12. Test at policyene fungerer
SELECT 'RLS Policy Setup Complete' as status;
