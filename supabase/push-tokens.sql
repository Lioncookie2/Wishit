-- Tabell for å lagre push tokens
-- Dette må kjøres i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, platform)
);

-- Indeks for rask oppslag
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);

-- RLS policy
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Brukere kan kun se sine egne tokens
CREATE POLICY "Users can view own push tokens" ON public.push_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Brukere kan oppdatere sine egne tokens
CREATE POLICY "Users can update own push tokens" ON public.push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Brukere kan sette inn sine egne tokens
CREATE POLICY "Users can insert own push tokens" ON public.push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role kan gjøre alt
CREATE POLICY "Service role can manage push tokens" ON public.push_tokens
  FOR ALL USING (auth.role() = 'service_role');
