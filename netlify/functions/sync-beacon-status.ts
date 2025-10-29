import { schedule } from '@netlify/functions';
import { createClient } from '../../lib/supabase/serverless';
import type { BeaconMembershipEntity } from '../../lib/types/beacon';

interface Member {
  id: string;
  email: string;
  firstname?: string;
  lastname?: string;
  beacon_membership: string;
  beacon_membership_status?: string | null;
}

interface Company {
  id: string;
  name: string;
  beacon_membership_id: string;
  beacon_membership_status?: string | null;
}

interface SyncLog {
  entity_type: 'member' | 'company';
  member_id?: string | null;
  company_id?: string | null;
  old_status: string | null;
  new_status: string;
  beacon_membership_id: string;
}

/**
 * Fetches a membership entity from BeaconCRM API with retry logic for rate limits
 */
async function fetchBeaconMembership(membershipId: string, retries = 2): Promise<BeaconMembershipEntity | null> {
  const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
  const beaconApiUrl = process.env.BEACON_API_URL;

  if (!beaconAuthToken) {
    console.error('BEACON_AUTH_TOKEN not configured');
    return null;
  }

  if (!beaconApiUrl) {
    console.error('BEACON_API_URL not configured');
    return null;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${beaconApiUrl}/entity/membership/${membershipId}`, {
        headers: {
          'Authorization': `Bearer ${beaconAuthToken}`,
          'Beacon-Application': 'developer_api',
          'Content-Type': 'application/json'
        },
      });

      if (response.status === 429) {
        // Rate limited - wait and retry
        const waitTime = (attempt + 1) * 2000; // Exponential backoff: 2s, 4s
        console.warn(`Rate limited for membership ${membershipId}, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        console.error(`Failed to fetch Beacon membership ${membershipId} after ${retries} retries: 429 Rate Limited`);
        return null;
      }

      if (!response.ok) {
        console.error(`Failed to fetch Beacon membership ${membershipId}: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return data.entity as BeaconMembershipEntity;
    } catch (error) {
      if (attempt < retries) {
        const waitTime = (attempt + 1) * 1000;
        console.warn(`Error fetching Beacon membership ${membershipId}, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      console.error(`Error fetching Beacon membership ${membershipId}:`, error);
      return null;
    }
  }

  return null;
}

/**
 * Syncs a single member's membership status
 */
async function syncMemberStatus(member: Member): Promise<SyncLog | null> {
  const membershipEntity = await fetchBeaconMembership(member.beacon_membership);

  if (!membershipEntity) {
    console.warn(`Could not fetch Beacon membership ${member.beacon_membership} for member ${member.id}`);
    return null;
  }

  // Extract status from Beacon entity (status is an array, take first value)
  const beaconStatus = membershipEntity.status?.[0] || null;

  // Compare with current status in Supabase
  const currentStatus = member.beacon_membership_status || null;

  // Normalize for comparison (trim whitespace, handle null/undefined)
  const normalizedBeaconStatus = beaconStatus?.trim() || null;
  const normalizedCurrentStatus = currentStatus?.trim() || null;

  // Only update if status has changed
  if (normalizedBeaconStatus === normalizedCurrentStatus) {
    return null; // No change needed
  }

  // Update member status in Supabase
  const supabase = createClient();
  const { error: updateError } = await supabase
    .from('members')
    .update({ beacon_membership_status: normalizedBeaconStatus })
    .eq('id', member.id);

  if (updateError) {
    console.error(`Failed to update member ${member.id}:`, updateError);
    return null;
  }

  console.log(`Updated member ${member.id} (${member.email}): ${normalizedCurrentStatus} → ${normalizedBeaconStatus}`);

  // Return log entry
  return {
    entity_type: 'member',
    member_id: member.id,
    company_id: null,
    old_status: normalizedCurrentStatus,
    new_status: normalizedBeaconStatus || '',
    beacon_membership_id: member.beacon_membership,
  };
}

/**
 * Syncs a single company's membership status
 */
async function syncCompanyStatus(company: Company): Promise<SyncLog | null> {
  const membershipEntity = await fetchBeaconMembership(company.beacon_membership_id);

  if (!membershipEntity) {
    console.warn(`Could not fetch Beacon membership ${company.beacon_membership_id} for company ${company.id}`);
    return null;
  }

  // Extract status from Beacon entity (status is an array, take first value)
  const beaconStatus = membershipEntity.status?.[0] || null;

  // Compare with current status in Supabase
  const currentStatus = company.beacon_membership_status || null;

  // Normalize for comparison (trim whitespace, handle null/undefined)
  const normalizedBeaconStatus = beaconStatus?.trim() || null;
  const normalizedCurrentStatus = currentStatus?.trim() || null;

  // Only update if status has changed
  if (normalizedBeaconStatus === normalizedCurrentStatus) {
    return null; // No change needed
  }

  // Update company status in Supabase
  const supabase = createClient();
  const { error: updateError } = await supabase
    .from('companies')
    .update({ beacon_membership_status: normalizedBeaconStatus })
    .eq('id', company.id);

  if (updateError) {
    console.error(`Failed to update company ${company.id}:`, updateError);
    return null;
  }

  console.log(`Updated company ${company.id} (${company.name}): ${normalizedCurrentStatus} → ${normalizedBeaconStatus}`);

  // Return log entry
  return {
    entity_type: 'company',
    member_id: null,
    company_id: company.id,
    old_status: normalizedCurrentStatus,
    new_status: normalizedBeaconStatus || '',
    beacon_membership_id: company.beacon_membership_id,
  };
}

/**
 * Logs sync operations to beacon_sync_logs table
 */
async function logSyncOperations(logs: SyncLog[]): Promise<void> {
  if (logs.length === 0) {
    return;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('beacon_sync_logs')
    .insert(logs);

  if (error) {
    // Don't fail the sync if logging fails - table might not exist yet
    if (error.code === 'PGRST205') {
      console.warn('beacon_sync_logs table not found. Please run the migrations: supabase/migrations/create_beacon_sync_logs.sql and supabase/migrations/update_beacon_sync_logs_for_companies.sql');
    } else {
      console.error('Failed to insert sync logs:', error);
    }
  } else {
    const memberLogs = logs.filter(log => log.entity_type === 'member').length;
    const companyLogs = logs.filter(log => log.entity_type === 'company').length;
    console.log(`Logged ${logs.length} status update(s) (${memberLogs} members, ${companyLogs} companies)`);
  }
}

/**
 * Cleans up logs older than 7 days
 */
async function cleanupOldLogs(): Promise<void> {
  const supabase = createClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // First get count of records to delete
  const { count: countBefore } = await supabase
    .from('beacon_sync_logs')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', sevenDaysAgo.toISOString());

  // Delete old logs
  const { error } = await supabase
    .from('beacon_sync_logs')
    .delete()
    .lt('created_at', sevenDaysAgo.toISOString());

  if (error) {
    // Don't fail if table doesn't exist yet
    if (error.code === 'PGRST205') {
      console.warn('beacon_sync_logs table not found. Skipping cleanup.');
    } else {
      console.error('Failed to cleanup old logs:', error);
    }
  } else {
    console.log(`Cleaned up ${countBefore || 0} log entries older than 7 days`);
  }
}

/**
 * Main sync handler
 * Accepts event and context for Netlify Functions compatibility
 */
async function syncBeaconStatuses(
  event?: any,
  context?: any
): Promise<{ statusCode: number; body: string }> {
  console.log('Starting Beacon membership status sync...');
  const startTime = Date.now();

  try {
    const supabase = createClient();

    // Fetch all members with a beacon_membership
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, email, firstname, lastname, beacon_membership, beacon_membership_status')
      .not('beacon_membership', 'is', null)
      .not('beacon_membership', 'eq', '');

    if (membersError) {
      console.error('Failed to fetch members:', membersError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch members', details: membersError.message }),
      };
    }

    // Fetch all companies with a beacon_membership_id
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, beacon_membership_id, beacon_membership_status')
      .not('beacon_membership_id', 'is', null)
      .not('beacon_membership_id', 'eq', '');

    if (companiesError) {
      console.error('Failed to fetch companies:', companiesError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch companies', details: companiesError.message }),
      };
    }

    const memberCount = members?.length || 0;
    const companyCount = companies?.length || 0;
    const totalEntities = memberCount + companyCount;

    if (totalEntities === 0) {
      console.log('No members or companies with beacon_membership found');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No entities to sync', synced: 0, updated: 0 }),
      };
    }

    console.log(`Found ${memberCount} member(s) and ${companyCount} company(ies) to sync`);

    // Process entities with timeout protection
    // Limit processing to stay within 30s Netlify function timeout
    const maxProcessingTime = 25000; // 25 seconds, leave 5s buffer
    const startProcessingTime = Date.now();
    const syncLogs: SyncLog[] = [];
    let updatedMemberCount = 0;
    let updatedCompanyCount = 0;
    let errorCount = 0;
    let processedMemberCount = 0;
    let processedCompanyCount = 0;

    // Process in smaller batches with rate limiting protection
    const batchSize = 3; // Reduced to avoid 429 rate limits
    const delayBetweenBatches = 1000; // 1 second delay between batches to respect rate limits
    const delayBetweenItems = 200; // Small delay between each item

    // Calculate rotation offset based on day of year (1-365/366)
    // This ensures we rotate through all entities over time
    const getDayOfYear = () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const dayOfYear = getDayOfYear();
    const ENTITIES_PER_TYPE_PER_DAY = 300;

    // Determine which entities to process based on rotation
    // Fallback: if total <= limit, check all daily; otherwise rotate
    let membersToProcess: Member[];
    let companiesToProcess: Company[];

    if (memberCount <= ENTITIES_PER_TYPE_PER_DAY) {
      // Less than 300 members: check all every day
      membersToProcess = members || [];
      console.log(`Processing all ${memberCount} member(s) (below daily limit)`);
    } else {
      // More than 300 members: rotate through chunks
      const memberOffset = (dayOfYear * ENTITIES_PER_TYPE_PER_DAY) % memberCount;
      const memberEnd = memberOffset + ENTITIES_PER_TYPE_PER_DAY;
      // Handle wrap-around: if offset + limit > total, take from start
      if (memberEnd > memberCount) {
        const remainder = memberEnd - memberCount;
        membersToProcess = (members || [])
          .slice(memberOffset)
          .concat((members || []).slice(0, remainder));
      } else {
        membersToProcess = (members || []).slice(memberOffset, memberEnd);
      }
      console.log(`Rotating members: processing ${membersToProcess.length} (offset ${memberOffset}) of ${memberCount} total`);
    }

    if (companyCount <= ENTITIES_PER_TYPE_PER_DAY) {
      // Less than 300 companies: check all every day
      companiesToProcess = companies || [];
      console.log(`Processing all ${companyCount} company(ies) (below daily limit)`);
    } else {
      // More than 300 companies: rotate through chunks
      const companyOffset = (dayOfYear * ENTITIES_PER_TYPE_PER_DAY) % companyCount;
      const companyEnd = companyOffset + ENTITIES_PER_TYPE_PER_DAY;
      // Handle wrap-around: if offset + limit > total, take from start
      if (companyEnd > companyCount) {
        const remainder = companyEnd - companyCount;
        companiesToProcess = (companies || [])
          .slice(companyOffset)
          .concat((companies || []).slice(0, remainder));
      } else {
        companiesToProcess = (companies || []).slice(companyOffset, companyEnd);
      }
      console.log(`Rotating companies: processing ${companiesToProcess.length} (offset ${companyOffset}) of ${companyCount} total`);
    }

    // Process members first
    for (let i = 0; i < membersToProcess.length; i += batchSize) {
      // Check if we're running out of time
      const elapsed = Date.now() - startProcessingTime;
      if (elapsed > maxProcessingTime) {
        console.warn(`Timeout approaching. Processed ${processedMemberCount + processedCompanyCount} of ${totalEntities} entities. Will continue in next run.`);
        break;
      }

      // Process batch sequentially (to avoid rate limits)
      const batch = membersToProcess.slice(i, i + batchSize);
      for (const member of batch) {
        try {
          const log = await syncMemberStatus(member);
          processedMemberCount++;
          if (log) {
            syncLogs.push(log);
            updatedMemberCount++;
          }
        } catch (error) {
          processedMemberCount++;
          console.error(`Error syncing member ${member.id}:`, error);
          errorCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, delayBetweenItems));
      }

      // Delay between batches
      if (i + batchSize < membersToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    // Then process companies
    for (let i = 0; i < companiesToProcess.length; i += batchSize) {
      // Check if we're running out of time
      const elapsed = Date.now() - startProcessingTime;
      if (elapsed > maxProcessingTime) {
        console.warn(`Timeout approaching. Processed ${processedMemberCount + processedCompanyCount} of ${totalEntities} entities. Will continue in next run.`);
        break;
      }

      // Process batch sequentially (to avoid rate limits)
      const batch = companiesToProcess.slice(i, i + batchSize);
      for (const company of batch) {
        try {
          const log = await syncCompanyStatus(company);
          processedCompanyCount++;
          if (log) {
            syncLogs.push(log);
            updatedCompanyCount++;
          }
        } catch (error) {
          processedCompanyCount++;
          console.error(`Error syncing company ${company.id}:`, error);
          errorCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, delayBetweenItems));
      }

      // Delay between batches
      if (i + batchSize < companiesToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    const processedCount = processedMemberCount + processedCompanyCount;
    const updatedCount = updatedMemberCount + updatedCompanyCount;

    // Log all updates
    await logSyncOperations(syncLogs);

    // Cleanup old logs
    await cleanupOldLogs();

    const duration = Date.now() - startTime;
    const summary = {
      message: processedCount < (membersToProcess.length + companiesToProcess.length) ? 'Sync partially completed (timeout protection)' : 'Sync completed',
      rotation: {
        dayOfYear,
        membersProcessed: membersToProcess.length,
        companiesProcessed: companiesToProcess.length,
      },
      total: {
        members: memberCount,
        companies: companyCount,
        total: totalEntities,
      },
      processed: {
        members: processedMemberCount,
        companies: processedCompanyCount,
        total: processedCount,
      },
      updated: {
        members: updatedMemberCount,
        companies: updatedCompanyCount,
        total: updatedCount,
      },
      synced: syncLogs.length,
      errors: errorCount,
      durationMs: duration,
    };

    console.log(`Sync completed: ${JSON.stringify(summary)}`);

    return {
      statusCode: 200,
      body: JSON.stringify(summary),
    };
  } catch (error) {
    console.error('Unexpected error during sync:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Unexpected error', 
        details: error instanceof Error ? error.message : String(error) 
      }),
    };
  }
}

// Export the scheduled function handler
// Runs daily at midnight UTC
export const handler = schedule('@daily', async (event, context) => {
  try {
    const result = await syncBeaconStatuses(event, context);
    
    // schedule() wrapper handles both formats - return HandlerResponse
    // For manual HTTP invocations, Netlify will show a warning but still return the body
    return {
      statusCode: result.statusCode,
      body: result.body,
    };
  } catch (error) {
    console.error('Handler error:', error);
    const errorBody = JSON.stringify({
      error: 'Function execution failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      statusCode: 500,
      body: errorBody,
    };
  }
});

