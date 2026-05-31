-- Migration: Add FDA DUNS and FEI code columns to the services table
-- Fixes error: Could not find the 'fda_duns_code' column of 'services' in the schema cache
-- Safe to run multiple times (IF NOT EXISTS). Does not recreate the table or touch existing data.

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS fda_duns_code TEXT;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS fda_fei_code TEXT;
