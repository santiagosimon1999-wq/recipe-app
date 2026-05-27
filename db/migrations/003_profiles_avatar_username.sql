-- Add avatar_url, display_name, and username columns to profiles table if they don't exist
-- Run in Supabase SQL editor or psql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

-- Optionally create index on username for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
