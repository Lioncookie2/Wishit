-- Tabell for å logge premium-transaksjoner
-- Dette må kjøres i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.premium_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_id TEXT NOT NULL,
  is_premium BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indeks for rask oppslag
CREATE INDEX IF NOT EXISTS idx_premium_transactions_user_id ON public.premium_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_transactions_transaction_id ON public.premium_transactions(transaction_id);

-- RLS policy
ALTER TABLE public.premium_transactions ENABLE ROW LEVEL SECURITY;

-- Brukere kan kun se sine egne transaksjoner
CREATE POLICY "Users can view own premium transactions" ON public.premium_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role kan gjøre alt
CREATE POLICY "Service role can manage premium transactions" ON public.premium_transactions
  FOR ALL USING (auth.role() = 'service_role');
