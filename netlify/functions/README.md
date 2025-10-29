# Netlify Functions

This directory contains Netlify serverless functions.

## sync-beacon-status

Scheduled function that syncs Beacon CRM membership statuses with Supabase members and companies daily.

### Setup

1. **Environment Variables** (set in Netlify Dashboard > Site settings > Environment variables):
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon/public key (or `SUPABASE_SERVICE_ROLE_KEY` for bypassing RLS)
   - `BEACON_AUTH_TOKEN` - Your BeaconCRM API authentication token
   - `BEACON_API_URL` - Your BeaconCRM API URL (e.g., `https://api.beaconcrm.org/v1/account/30435`)

2. **Database Migrations**: 
   - Run the SQL migrations in order on your Supabase database:
     1. `supabase/migrations/create_beacon_sync_logs.sql` - Creates the `beacon_sync_logs` table
     2. `supabase/migrations/update_beacon_sync_logs_for_companies.sql` - Updates the table to support both members and companies
   - These create and configure the `beacon_sync_logs` table for tracking status updates

### Schedule

- Runs daily at midnight UTC (`@daily` cron expression)

### Functionality

- Fetches all members from Supabase with a `beacon_membership` field
- Fetches all companies from Supabase with a `beacon_membership_id` field
- For each member and company, queries BeaconCRM API to get current membership status
- Updates `beacon_membership_status` in Supabase only if the status has changed
- Logs all status updates to `beacon_sync_logs` table (with entity type: member or company)
- Automatically cleans up logs older than 7 days
- Processes both members and companies within the same scheduled run

### Rotation System

To stay within the 30-second function timeout and handle large datasets:

- **If ≤300 entities of a type**: Processes all entities every day
- **If >300 entities of a type**: Uses day-of-year rotation to process different chunks each day
  - Day 1: Processes entities 0-299
  - Day 2: Processes entities 300-599
  - Day 3: Processes entities 600-899
  - Continues rotating through all entities
  - Wraps around after reaching the end (if day 365 processes 100-399 with wrap-around)

This ensures all entities get synced over time, even with thousands of members/companies. Example: With 1,000 members, each member is synced approximately every 3-4 days.

### Testing Locally

**Important**: You must start the Netlify dev server first before invoking functions.

```bash
# Install Netlify CLI if you haven't already
npm install -g netlify-cli

# Option 1: Start Netlify Dev and keep it running (recommended)
# In terminal 1:
netlify dev

# In terminal 2 (while netlify dev is running):
netlify functions:invoke sync-beacon-status

# Option 2: Use netlify dev in one command with --live flag
netlify dev --live

# Option 3: Test via HTTP once dev server is running
# Start netlify dev first, then in another terminal:
curl http://localhost:8888/.netlify/functions/sync-beacon-status
```

**Note**: Make sure you have a `.env` file or environment variables set locally:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
- `BEACON_AUTH_TOKEN`
- `BEACON_API_URL`

You can create a `.env` file in the project root with these variables for local testing.

### Monitoring

- View function logs in Netlify Dashboard > Functions > sync-beacon-status
- Check `beacon_sync_logs` table in Supabase for sync history
- Monitor function execution time (30 second limit on Netlify)

