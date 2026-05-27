-- Phase 2.1: public profiles — bio column + case-insensitive username uniqueness
-- Run in Supabase SQL Editor before or with enable_rls_policies.sql updates.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text;

-- Case-insensitive unique usernames (allows multiple NULL usernames)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Fast lookup by username (case-insensitive queries should use lower(username) = lower($1))
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
