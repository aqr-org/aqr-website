-- Create beacon_sync_logs table to track membership status updates
-- Logs are automatically cleaned up after 7 days by the sync function

CREATE TABLE IF NOT EXISTS beacon_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  beacon_membership_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on created_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_beacon_sync_logs_created_at ON beacon_sync_logs(created_at);

-- Create index on member_id for potential queries by member
CREATE INDEX IF NOT EXISTS idx_beacon_sync_logs_member_id ON beacon_sync_logs(member_id);

-- Add comment to table
COMMENT ON TABLE beacon_sync_logs IS 'Logs of Beacon membership status updates from daily sync. Logs are automatically cleaned up after 7 days.';

