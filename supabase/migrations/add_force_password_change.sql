-- Add force_password_change column to profiles table
-- This flag is set when admin creates a temporary password for a user
-- User must change password on next login when this flag is true

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;

-- Add index for quick lookup
CREATE INDEX IF NOT EXISTS idx_profiles_force_password_change 
ON profiles (force_password_change) 
WHERE force_password_change = TRUE;

COMMENT ON COLUMN profiles.force_password_change IS 'When true, user must change password on next login';
