-- ============================================================================
-- Migration: Add `category` column to documents
-- ----------------------------------------------------------------------------
-- Adds an optional category to classify uploaded files (FDA certificate,
-- Form 3537, login account, other forms...). Safe to run multiple times.
-- This does NOT recreate the table or touch existing data.
-- ============================================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT;
