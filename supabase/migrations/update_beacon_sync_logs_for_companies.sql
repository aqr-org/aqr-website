-- Update beacon_sync_logs table to support both members and companies
-- This migration adds entity_type and company_id fields, and makes member_id nullable

-- Add entity_type column to distinguish between member and company logs
ALTER TABLE beacon_sync_logs 
ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'member' 
CHECK (entity_type IN ('member', 'company'));

-- Add company_id column for company logs
ALTER TABLE beacon_sync_logs 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Make member_id nullable (since we now support companies too)
ALTER TABLE beacon_sync_logs 
ALTER COLUMN member_id DROP NOT NULL;

-- Add index on company_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_beacon_sync_logs_company_id ON beacon_sync_logs(company_id);

-- Add index on entity_type for filtering
CREATE INDEX IF NOT EXISTS idx_beacon_sync_logs_entity_type ON beacon_sync_logs(entity_type);

-- Add constraint: either member_id or company_id must be set
ALTER TABLE beacon_sync_logs 
ADD CONSTRAINT check_member_or_company 
CHECK ((member_id IS NOT NULL AND company_id IS NULL) OR (member_id IS NULL AND company_id IS NOT NULL));

-- Update existing records to have entity_type = 'member' (if any exist)
UPDATE beacon_sync_logs 
SET entity_type = 'member' 
WHERE entity_type IS NULL OR entity_type = '';

-- Update comment
COMMENT ON TABLE beacon_sync_logs IS 'Logs of Beacon membership status updates from daily sync for both members and companies. Logs are automatically cleaned up after 7 days.';

