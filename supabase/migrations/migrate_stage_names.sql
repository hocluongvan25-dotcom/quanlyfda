-- Migration: Rename 'us_agent_assignment' stage to 'expert_review'
-- This script updates all existing services and documents with the old stage name

-- Update services table
UPDATE services
SET current_stage = 'expert_review'
WHERE current_stage = 'us_agent_assignment';

-- Update documents table (if stage is stored there)
UPDATE documents
SET stage = 'expert_review'
WHERE stage = 'us_agent_assignment';

-- Update activity logs to reflect the old stage name was changed
-- (optional - for historical records, you may want to keep the old names in activity logs)
-- UPDATE activity_logs
-- SET details = jsonb_set(details, '{new_stage}', '"expert_review"')
-- WHERE action = 'stage_updated' AND details->>'new_stage' = 'us_agent_assignment';
