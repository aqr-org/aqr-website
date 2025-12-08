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
  beacon_id?: string | null; // Organization ID from Beacon (optional)
}

interface ChangedMembership {
  id: string;
  status: string[];
  type: string[];
  updated_at: string;
  memberEmails: string[]; // Emails of referenced persons (for Individual/Group memberships)
  organizationIds: string[]; // IDs of referenced organizations (for Business Directory memberships)
  organizationNames: string[]; // Names of referenced organizations (for Business Directory memberships)
}

/**
 * Fetches changed memberships from BeaconCRM API
 * Returns memberships with status != 'Active' that were updated in the last 7 days
 */
async function fetchChangedBeaconMemberships(retries = 2): Promise<ChangedMembership[]> {
  const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
  const beaconApiUrl = process.env.BEACON_API_URL;

  if (!beaconAuthToken) {
    console.error('BEACON_AUTH_TOKEN not configured');
    return [];
  }

  if (!beaconApiUrl) {
    console.error('BEACON_API_URL not configured');
    return [];
  }

  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  // Note: Beacon API doesn't support date operators (>=, >, etc.) in filters
  // So we'll fetch memberships without date filtering and filter in code
  // Build empty filter body (or we could filter by other fields if needed)
  const filterBody = {
    filter_conditions: []
  };

  const allChangedMemberships: ChangedMembership[] = [];
  let page = 1;
  const perPage = 100; // Reasonable page size
  let hasMorePages = true;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Reset pagination on retry
      if (attempt > 0) {
        page = 1;
        allChangedMemberships.length = 0;
        hasMorePages = true;
      }

      // Fetch pages until no more results
      // Note: Beacon API might not support pagination via query params, so we'll try without them first
      while (hasMorePages) {
        // Try with pagination params, but Beacon might ignore them
        const filterUrl = `${beaconApiUrl}/entities/membership/filter`;
        const response = await fetch(filterUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${beaconAuthToken}`,
            'Beacon-Application': 'developer_api',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(filterBody)
        });

        if (response.status === 429) {
          // Rate limited - wait and retry
          const waitTime = (attempt + 1) * 2000; // Exponential backoff: 2s, 4s
          console.warn(`Rate limited for membership filter, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            break; // Break out of pagination loop to retry
          }
          console.error(`Failed to fetch changed memberships after ${retries} retries: 429 Rate Limited`);
          return allChangedMemberships; // Return what we have so far
        }

        if (!response.ok) {
          console.error(`Failed to fetch changed memberships page ${page}: ${response.status} ${response.statusText}`);
          // Try to get error details
          try {
            const errorData = await response.text();
            console.error(`Error details: ${errorData}`);
          } catch (e) {
            // Ignore error reading error response
          }
          // If it's a client error (4xx), don't retry
          if (response.status >= 400 && response.status < 500) {
            return allChangedMemberships; // Return what we have so far
          }
          // For server errors, break to retry outer loop
          break;
        }

        const data = await response.json();
        
        // Extract membership entities from results
        // The API returns { results: [{ entity: {...}, references: [...] }] }
        const results = data.results || [];
        
        console.log(`[DEBUG] Beacon filter API returned ${results.length} result(s) on page ${page}`);
        
        if (results.length === 0) {
          hasMorePages = false;
          break;
        }

        // Filter memberships that don't have 'Active' status AND were updated in last 7 days
        const pageMemberships: ChangedMembership[] = results
          .map((result: any) => {
            const entity = result.entity;
            if (!entity) return null;
            
            // Filter by date: only include memberships updated in last 7 days
            const updatedAt = entity.updated_at || entity.updatedAt;
            if (!updatedAt) {
              return null; // Skip memberships without updated_at
            }
            
            const updatedDate = new Date(updatedAt);
            if (isNaN(updatedDate.getTime()) || updatedDate < sevenDaysAgo) {
              return null; // Skip memberships older than 7 days
            }
            
            // Log first few memberships for debugging
            if (allChangedMemberships.length < 3) {
              console.log(`[DEBUG] Membership ${entity.id}: status=${JSON.stringify(entity.status)}, updated_at=${updatedAt}`);
            }
            
            // Filter out memberships that have 'Active' in status array
            const statusArray = entity.status || [];
            if (statusArray.includes('Active')) {
              return null;
            }
            
            // Extract member emails and organization IDs/names from references
            const references = result.references || [];
            const memberEmails: string[] = [];
            const organizationIds: string[] = [];
            const organizationNames: string[] = [];
            
            references.forEach((ref: any) => {
              const refEntity = ref.entity;
              if (!refEntity) return;
              
              // Use entity_type_id to distinguish entity types precisely
              // 268434 = person (member)
              // 268431 = organization (company)
              if (refEntity.entity_type_id === 268434) {
                // Person entity - extract emails
                if (refEntity.emails && Array.isArray(refEntity.emails)) {
                  refEntity.emails.forEach((emailObj: any) => {
                    if (emailObj.email) {
                      memberEmails.push(emailObj.email.toLowerCase().trim());
                    }
                  });
                }
              } else if (refEntity.entity_type_id === 268431) {
                // Organization entity - extract organization ID
                if (refEntity.id) {
                  organizationIds.push(String(refEntity.id));
                }
                // Also extract organization name for logging/debugging
                if (refEntity.name) {
                  const orgName = typeof refEntity.name === 'string' 
                    ? refEntity.name 
                    : refEntity.name.full || refEntity.name;
                  if (orgName) {
                    organizationNames.push(orgName.trim());
                  }
                }
              }
            });
            
            return {
              id: String(entity.id),
              status: statusArray,
              type: entity.type || [],
              updated_at: entity.updated_at || entity.updatedAt || '',
              memberEmails,
              organizationIds,
              organizationNames
            };
          })
          .filter((membership: ChangedMembership | null) => membership !== null);

        console.log(`[DEBUG] After filtering out 'Active' statuses: ${pageMemberships.length} membership(s)`);
        allChangedMemberships.push(...pageMemberships);

        // Since Beacon API might not support pagination, we'll only fetch once
        // If we got results, assume we got them all (or Beacon will return all in one call)
        hasMorePages = false;
      }

      // Successfully fetched all pages
      console.log(`Found ${allChangedMemberships.length} changed membership(s) in Beacon (status != 'Active', updated in last 7 days)`);
      return allChangedMemberships;
    } catch (error) {
      if (attempt < retries) {
        const waitTime = (attempt + 1) * 1000;
        console.warn(`Error fetching changed memberships, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      console.error(`Error fetching changed memberships:`, error);
      // Return what we have so far instead of empty array
      return allChangedMemberships;
    }
  }

  // Return what we have if we exhausted retries
  return allChangedMemberships;
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
      
      // Debug logging for API response structure (only log first 500 chars to avoid spam)
      if (membershipId === '8996') {
        console.log(`[DEBUG] API response for membership ${membershipId}:`, {
          hasEntity: !!data.entity,
          entityStatus: data.entity?.status,
          entityId: data.entity?.id,
          responsePreview: JSON.stringify(data).substring(0, 500)
        });
      }
      
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
 * Updates a member's status in Supabase
 * Returns update details object if an update was made, null otherwise
 */
async function updateMemberStatus(
  member: Member,
  newStatus: string | null,
  supabaseClient: ReturnType<typeof createClient>
): Promise<{
  entity_type: 'member';
  member_id: string;
  company_id: null;
  member_email: string;
  old_status: string | null;
  new_status: string;
  beacon_membership_id: string;
} | null> {
  const currentStatus = member.beacon_membership_status || null;
  const normalizedNewStatus = newStatus?.trim() || null;
  const normalizedCurrentStatus = currentStatus?.trim() || null;

  // Only update if status has changed
  if (normalizedNewStatus === normalizedCurrentStatus) {
    return null; // No change needed
  }

  // Update member status in Supabase
  const { error: updateError } = await supabaseClient
    .from('members')
    .update({ beacon_membership_status: normalizedNewStatus })
    .eq('id', member.id);

  if (updateError) {
    console.error(`Failed to update member ${member.id}:`, updateError);
    return null;
  }

  const updateDetail = {
    entity_type: 'member' as const,
    member_id: member.id,
    company_id: null,
    member_email: member.email,
    old_status: normalizedCurrentStatus,
    new_status: normalizedNewStatus || '',
    beacon_membership_id: member.beacon_membership,
  };

  console.log(`[STATUS_UPDATE] ${JSON.stringify(updateDetail)}`);
  console.log(`Updated member ${member.id} (${member.email}): ${normalizedCurrentStatus} → ${normalizedNewStatus}`);
  
  return updateDetail;
}

/**
 * Updates a company's status in Supabase
 * Returns update details object if an update was made, null otherwise
 */
async function updateCompanyStatus(
  company: Company,
  newStatus: string | null,
  supabaseClient: ReturnType<typeof createClient>
): Promise<{
  entity_type: 'company';
  member_id: null;
  company_id: string;
  company_name: string;
  old_status: string | null;
  new_status: string;
  beacon_membership_id: string;
} | null> {
  const currentStatus = company.beacon_membership_status || null;
  const normalizedNewStatus = newStatus?.trim() || null;
  const normalizedCurrentStatus = currentStatus?.trim() || null;

  // Only update if status has changed
  if (normalizedNewStatus === normalizedCurrentStatus) {
    return null; // No change needed
  }

  // Update company status in Supabase
  const { error: updateError } = await supabaseClient
    .from('companies')
    .update({ beacon_membership_status: normalizedNewStatus })
    .eq('id', company.id);

  if (updateError) {
    console.error(`Failed to update company ${company.id}:`, updateError);
    return null;
  }

  const updateDetail = {
    entity_type: 'company' as const,
    member_id: null,
    company_id: company.id,
    company_name: company.name,
    old_status: normalizedCurrentStatus,
    new_status: normalizedNewStatus || '',
    beacon_membership_id: company.beacon_membership_id,
  };

  console.log(`[STATUS_UPDATE] ${JSON.stringify(updateDetail)}`);
  console.log(`Updated company ${company.id} (${company.name}): ${normalizedCurrentStatus} → ${normalizedNewStatus}`);
  
  return updateDetail;
}

/**
 * Main sync handler - Optimized version
 * Queries Beacon API for changed memberships instead of checking all Supabase members
 */
async function syncBeaconStatuses(
  event?: any,
  context?: any
): Promise<{ statusCode: number; body: string }> {
  console.log('=== Starting Beacon membership status sync (optimized) ===');
  const startTime = Date.now();

  try {
    const supabase = createClient();

    // Step 1: Fetch changed memberships from Beacon API
    const changedMemberships = await fetchChangedBeaconMemberships();

    console.log(`[DEBUG] Total changed memberships found: ${changedMemberships.length}`);
    if (changedMemberships.length > 0) {
      console.log(`[DEBUG] First few membership IDs: ${changedMemberships.slice(0, 5).map(m => m.id).join(', ')}`);
    }

    if (changedMemberships.length === 0) {
      console.log('No changed memberships found in Beacon (status != "Active", updated in last 7 days)');
      console.log('=== Function ran successfully: No changes to sync ===');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No changed memberships found', 
          changedMemberships: 0,
          updated: 0 
        }),
      };
    }

    console.log(`Found ${changedMemberships.length} changed membership(s) in Beacon`);

    // Step 2: Separate memberships by type
    // Business Directory types should only update companies
    // Individual/Group Membership types should only update members
    const BUSINESS_DIRECTORY_TYPES = [
      'Business Directory',
      'Business Directory Basic',
      'Business Directory Standard',
      'Business Directory Enhanced'
    ];

    const businessDirectoryMemberships = changedMemberships.filter(membership => {
      const membershipTypes = membership.type || [];
      return membershipTypes.some(type => BUSINESS_DIRECTORY_TYPES.includes(type));
    });

    const individualGroupMemberships = changedMemberships.filter(membership => {
      const membershipTypes = membership.type || [];
      return !membershipTypes.some(type => BUSINESS_DIRECTORY_TYPES.includes(type));
    });

    console.log(`Split memberships: ${businessDirectoryMemberships.length} Business Directory, ${individualGroupMemberships.length} Individual/Group`);

    // Step 3: Extract membership IDs by type
    const businessDirectoryIds = businessDirectoryMemberships.map(m => m.id);
    const individualGroupIds = individualGroupMemberships.map(m => m.id);

    // Step 4: Extract emails and organization names/IDs from membership references
    // For Individual/Group memberships: collect all member emails
    // For Business Directory memberships: collect all organization names and IDs
    const memberEmailsToUpdate = new Set<string>();
    const organizationNamesToUpdate = new Set<string>();
    const organizationIdsToUpdate = new Set<string>();
    
    // Map membership ID to the membership object for status lookup
    const membershipMap = new Map<string, ChangedMembership>();
    
    individualGroupMemberships.forEach(membership => {
      membershipMap.set(membership.id, membership);
      membership.memberEmails.forEach(email => memberEmailsToUpdate.add(email));
    });
    
    businessDirectoryMemberships.forEach(membership => {
      membershipMap.set(membership.id, membership);
      membership.organizationIds.forEach(orgId => organizationIdsToUpdate.add(orgId));
      membership.organizationNames.forEach(orgName => organizationNamesToUpdate.add(orgName.toLowerCase().trim()));
    });
    
    console.log(`[DEBUG] Found ${memberEmailsToUpdate.size} unique member email(s) from Individual/Group memberships`);
    console.log(`[DEBUG] Found ${organizationIdsToUpdate.size} unique organization ID(s) and ${organizationNamesToUpdate.size} unique organization name(s) from Business Directory memberships`);

    // Step 5: Query Supabase for matching entities by email/organization ID
    let allMembers: Member[] = [];
    let allCompanies: Company[] = [];
    
    // Create a map to track which membership(s) each member/company should be updated with
    // A member might be referenced in multiple Individual/Group memberships - use the most recent non-Active one
    const memberEmailToMembershipMap = new Map<string, ChangedMembership>();
    // Map membership ID to membership (for companies matched by beacon_membership_id)
    const membershipIdToMembershipMap = new Map<string, ChangedMembership>();
    // Map organization ID (beacon_id) to membership (for companies matched by beacon_id)
    const organizationIdToMembershipMap = new Map<string, ChangedMembership>();

    // Query members by email for Individual/Group memberships
    if (memberEmailsToUpdate.size > 0) {
      const emailArray = Array.from(memberEmailsToUpdate);
      const BATCH_SIZE = 100;
      
      for (let i = 0; i < emailArray.length; i += BATCH_SIZE) {
        const batch = emailArray.slice(i, i + BATCH_SIZE);
        
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('id, email, firstname, lastname, beacon_membership, beacon_membership_status')
          .in('email', batch);

        if (membersError) {
          console.error(`Failed to fetch members batch:`, membersError);
        } else {
          // For each member found, determine which membership to use for status update
          (members || []).forEach(member => {
            const normalizedEmail = member.email.toLowerCase().trim();
            
            // Find all Individual/Group memberships that reference this member
            const matchingMemberships = individualGroupMemberships.filter(m =>
              m.memberEmails.includes(normalizedEmail)
            );
            
            if (matchingMemberships.length > 0) {
              // Use the membership with the most recent updated_at
              const mostRecent = matchingMemberships.reduce((latest, current) => {
                const latestDate = new Date(latest.updated_at);
                const currentDate = new Date(current.updated_at);
                return currentDate > latestDate ? current : latest;
              });
              
              memberEmailToMembershipMap.set(normalizedEmail, mostRecent);
              allMembers.push(member);
            }
          });
        }
      }
    }

    // Query companies for Business Directory memberships
    // Match by beacon_membership_id first, then by organization ID (beacon_id field) if available
    if (businessDirectoryIds.length > 0) {
      const BATCH_SIZE = 100;
      
      // First, try matching by beacon_membership_id
      for (let i = 0; i < businessDirectoryIds.length; i += BATCH_SIZE) {
        const batch = businessDirectoryIds.slice(i, i + BATCH_SIZE);
        
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, beacon_membership_id, beacon_membership_status, beacon_id')
          .in('beacon_membership_id', batch);

        if (companiesError) {
          console.error(`Failed to fetch companies batch:`, companiesError);
        } else {
          // For each company found, use the membership that matches its beacon_membership_id
          (companies || []).forEach(company => {
            const membershipId = company.beacon_membership_id;
            const membership = businessDirectoryMemberships.find(m => m.id === membershipId);
            
            if (membership) {
              // Store mapping by membership ID
              membershipIdToMembershipMap.set(membershipId, membership);
              allCompanies.push(company);
            }
          });
        }
      }
      
      // Also try matching by organization ID (beacon_id field) if companies have it
      // This handles cases where beacon_membership_id might not be set correctly
      if (organizationIdsToUpdate.size > 0) {
        const orgIdArray = Array.from(organizationIdsToUpdate);
        
        for (let i = 0; i < orgIdArray.length; i += BATCH_SIZE) {
          const batch = orgIdArray.slice(i, i + BATCH_SIZE);
          
          // Query companies by beacon_id (organization ID from Beacon)
          const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('id, name, beacon_membership_id, beacon_membership_status, beacon_id')
            .in('beacon_id', batch);

          if (companiesError) {
            // beacon_id field might not exist, that's okay - we'll skip this matching method
            console.log(`[DEBUG] Companies table might not have beacon_id field, skipping organization ID matching`);
          } else {
            // For each company found, find the Business Directory membership that references this organization
            (companies || []).forEach(company => {
              // Skip if already matched
              if (allCompanies.some(c => c.id === company.id)) {
                return;
              }
              
              const orgId = String(company.beacon_id);
              const matchingMemberships = businessDirectoryMemberships.filter(m =>
                m.organizationIds.includes(orgId)
              );
              
              if (matchingMemberships.length > 0) {
                // Use the membership with the most recent updated_at
                const mostRecent = matchingMemberships.reduce((latest, current) => {
                  const latestDate = new Date(latest.updated_at);
                  const currentDate = new Date(current.updated_at);
                  return currentDate > latestDate ? current : latest;
                });
                
                // Store mapping by organization ID (beacon_id) for direct lookup
                organizationIdToMembershipMap.set(orgId, mostRecent);
                // Also store by membership ID for consistency
                membershipIdToMembershipMap.set(mostRecent.id, mostRecent);
                allCompanies.push(company);
                console.log(`[DEBUG] Matched company "${company.name}" (beacon_id: ${orgId}) to Business Directory membership ${mostRecent.id} by organization ID`);
              }
            });
          }
        }
      }
    }

    console.log(`Matched ${allMembers.length} member(s) for Individual/Group memberships and ${allCompanies.length} company(ies) for Business Directory memberships`);

    // Step 6: Process updates in parallel batches
    const updateBatchSize = 10; // Process 10 updates in parallel
    let updatedMemberCount = 0;
    let updatedCompanyCount = 0;
    let errorCount = 0;
    const updateDetails: Array<{
      entity_type: 'member' | 'company';
      member_id?: string | null;
      company_id?: string | null;
      member_email?: string;
      company_name?: string;
      old_status: string | null;
      new_status: string;
      beacon_membership_id: string;
    }> = [];

    // Process members in batches
    for (let i = 0; i < allMembers.length; i += updateBatchSize) {
      const batch = allMembers.slice(i, i + updateBatchSize);
      const updatePromises = batch.map(async (member) => {
        try {
          const normalizedEmail = member.email.toLowerCase().trim();
          const membership = memberEmailToMembershipMap.get(normalizedEmail);
          
          if (membership) {
            const newStatus = membership.status?.[0] || null;
            const updateDetail = await updateMemberStatus(member, newStatus, supabase);
            if (updateDetail) {
              updatedMemberCount++;
              updateDetails.push({
                ...updateDetail,
                beacon_membership_id: membership.id
              });
            }
          }
        } catch (error) {
          console.error(`Error updating member ${member.id}:`, error);
          errorCount++;
        }
      });
      await Promise.all(updatePromises);
    }

    // Process companies in batches
    for (let i = 0; i < allCompanies.length; i += updateBatchSize) {
      const batch = allCompanies.slice(i, i + updateBatchSize);
      const updatePromises = batch.map(async (company) => {
        try {
          let membership: ChangedMembership | undefined;
          
          // Try matching by beacon_membership_id first (most reliable)
          const membershipId = company.beacon_membership_id;
          if (membershipId) {
            membership = membershipIdToMembershipMap.get(membershipId);
          }
          
          // Fallback to matching by organization ID (beacon_id) - now that all companies have beacon_id
          if (!membership && company.beacon_id) {
            const orgId = String(company.beacon_id);
            membership = organizationIdToMembershipMap.get(orgId);
            
            // If still not found, search through all Business Directory memberships
            // This handles edge cases where company wasn't matched in the initial query
            if (!membership) {
              const matchingMemberships = businessDirectoryMemberships.filter(m =>
                m.organizationIds.includes(orgId)
              );
              if (matchingMemberships.length > 0) {
                // Use the membership with the most recent updated_at
                membership = matchingMemberships.reduce((latest, current) => {
                  const latestDate = new Date(latest.updated_at);
                  const currentDate = new Date(current.updated_at);
                  return currentDate > latestDate ? current : latest;
                });
                // Cache it for future lookups
                organizationIdToMembershipMap.set(orgId, membership);
              }
            }
          }
          
          if (membership) {
            const newStatus = membership.status?.[0] || null;
            const updateDetail = await updateCompanyStatus(company, newStatus, supabase);
            if (updateDetail) {
              updatedCompanyCount++;
              updateDetails.push({
                ...updateDetail,
                beacon_membership_id: membership.id
              });
            }
          } else {
            console.warn(`[DEBUG] Could not find matching membership for company "${company.name}" (beacon_membership_id: ${company.beacon_membership_id || 'none'}, beacon_id: ${company.beacon_id || 'none'})`);
          }
        } catch (error) {
          console.error(`Error updating company ${company.id}:`, error);
          errorCount++;
        }
      });
      await Promise.all(updatePromises);
    }

    const duration = Date.now() - startTime;
    const updatedCount = updatedMemberCount + updatedCompanyCount;

    // Logging
    if (updatedCount === 0) {
      console.log(`=== Function ran successfully: No changes to Supabase required ===`);
      console.log(`Found ${changedMemberships.length} changed membership(s) in Beacon`);
      console.log(`  - ${businessDirectoryMemberships.length} Business Directory memberships`);
      console.log(`  - ${individualGroupMemberships.length} Individual/Group memberships`);
      console.log(`Matched ${allMembers.length} member(s) and ${allCompanies.length} company(ies) in Supabase`);
      console.log(`All statuses are up to date. Duration: ${duration}ms`);
    } else {
      console.log(`=== Function ran successfully: Made ${updatedCount} change(s) to Supabase ===`);
      console.log(`Found ${changedMemberships.length} changed membership(s) in Beacon`);
      console.log(`  - ${businessDirectoryMemberships.length} Business Directory memberships`);
      console.log(`  - ${individualGroupMemberships.length} Individual/Group memberships`);
      console.log(`Matched ${allMembers.length} member(s) and ${allCompanies.length} company(ies) in Supabase`);
      console.log(`Updated ${updatedMemberCount} member(s) and ${updatedCompanyCount} company(ies)`);
      console.log(`Duration: ${duration}ms`);
      
      // Log all updates in a structured format
      console.log(`=== All Status Updates (${updateDetails.length} total) ===`);
      updateDetails.forEach((update, index) => {
        console.log(`[UPDATE ${index + 1}/${updateDetails.length}] ${JSON.stringify(update)}`);
      });
    }

    const summary = {
      message: 'Sync completed',
      changedMemberships: {
        total: changedMemberships.length,
        businessDirectory: businessDirectoryMemberships.length,
        individualGroup: individualGroupMemberships.length,
      },
      matched: {
        members: allMembers.length,
        companies: allCompanies.length,
        total: allMembers.length + allCompanies.length,
      },
      updated: {
        members: updatedMemberCount,
        companies: updatedCompanyCount,
        total: updatedCount,
      },
      errors: errorCount,
      durationMs: duration,
    };

    console.log(`Sync summary: ${JSON.stringify(summary, null, 2)}`);
    console.log('=== Beacon sync completed ===');

    return {
      statusCode: 200,
      body: JSON.stringify(summary),
    };
  } catch (error) {
    console.error('=== Unexpected error during sync ===');
    console.error('Error details:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
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
  console.log('=== Netlify scheduled function triggered ===');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const result = await syncBeaconStatuses(event, context);
    
    console.log('=== Handler completed successfully ===');
    console.log(`Status: ${result.statusCode}`);
    
    // schedule() wrapper handles both formats - return HandlerResponse
    // For manual HTTP invocations, Netlify will show a warning but still return the body
    return {
      statusCode: result.statusCode,
      body: result.body,
    };
  } catch (error) {
    console.error('=== Handler error ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
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

