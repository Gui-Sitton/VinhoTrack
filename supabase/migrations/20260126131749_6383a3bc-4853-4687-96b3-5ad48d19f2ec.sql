-- Fix produtos table: Remove overly permissive write policies
-- Products should only be readable by all users, not writable

-- Drop the overly permissive policies that allow any user to modify products
DROP POLICY IF EXISTS "produtos_all" ON public.produtos;
DROP POLICY IF EXISTS "produtos_authenticated_full" ON public.produtos;

-- Keep only the read-only policies
-- The existing "Public read produtos" and "produtos_read_only" are fine for SELECT
-- No additional policies needed as we want products to be read-only for end users