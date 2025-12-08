-- Add beacon_id column to companies table to store Beacon organization ID
-- This allows matching companies by organization ID from membership references
-- The organization ID comes from Beacon entity references with entity_type_id 268431

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS beacon_id TEXT;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_companies_beacon_id ON companies(beacon_id);

-- Add comment
COMMENT ON COLUMN companies.beacon_id IS 'Beacon organization ID (entity_type_id 268431). Used to match companies to Business Directory membership references.';

