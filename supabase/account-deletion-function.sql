-- Funksjon for å slette all brukerdata
-- Dette må kjøres i Supabase SQL Editor

CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Slett alle tilhørende data i riktig rekkefølge (på grunn av foreign key constraints)
  
  -- 1. Slett secret santa pairs
  DELETE FROM public.secret_santa_pairs 
  WHERE giver_id = user_id OR receiver_id = user_id;
  
  -- 2. Slett invitations hvor brukeren er inviter
  DELETE FROM public.invitations 
  WHERE invited_by = user_id;
  
  -- 3. Slett wishlists
  DELETE FROM public.wishlists 
  WHERE user_id = user_id;
  
  -- 4. Slett group memberships
  DELETE FROM public.group_members 
  WHERE user_id = user_id;
  
  -- 5. Slett grupper hvor brukeren er admin
  -- Først slett alle medlemmer i gruppene
  DELETE FROM public.group_members 
  WHERE group_id IN (
    SELECT id FROM public.groups WHERE admin_id = user_id
  );
  
  -- Slett gruppene
  DELETE FROM public.groups 
  WHERE admin_id = user_id;
  
  -- 6. Til slutt slett profilen
  DELETE FROM public.profiles 
  WHERE id = user_id;
  
  -- Log slettingen
  INSERT INTO public.audit_log (action, user_id, details, created_at)
  VALUES ('account_deleted', user_id, 'User account and all associated data deleted', NOW());
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log feil og re-raise
    INSERT INTO public.audit_log (action, user_id, details, created_at)
    VALUES ('account_deletion_error', user_id, 'Error: ' || SQLERRM, NOW());
    RAISE;
END;
$$;

-- Opprett audit_log tabell hvis den ikke finnes
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  user_id UUID,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gi tillatelse til å kjøre funksjonen
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO service_role;
