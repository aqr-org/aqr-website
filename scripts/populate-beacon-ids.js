#!/usr/bin/env node

/**
 * Script to populate beacon_id values for companies from Beacon API
 * 
 * This script:
 * 1. Fetches all companies from Supabase that have a beacon_membership_id
 * 2. For each company, fetches the membership from Beacon API
 * 3. Extracts organization ID from membership references (entity_type_id 268431)
 * 4. Updates the company's beacon_id field in Supabase
 * 
 * Usage:
 *   node scripts/populate-beacon-ids.js
 * 
 * Environment variables can be set in .env.local or passed directly:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... BEACON_AUTH_TOKEN=... BEACON_API_URL=... node scripts/populate-beacon-ids.js
 */

// Load environment variables from .env.local if it exists
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envFile = fs.readFileSync(envLocalPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

/**
 * Creates a Supabase client for serverless environments
 */
function createClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseKey) {
    throw new Error('Missing Supabase key. Set SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY');
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

/**
 * Fetches a membership from Beacon API with references
 * Uses the single entity endpoint, then fetches references separately if needed
 */
async function fetchBeaconMembershipWithReferences(membershipId, retries = 2) {
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
      // Use single entity endpoint - it should include references
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
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          // Ignore error reading error response
        }
        console.error(`Failed to fetch Beacon membership ${membershipId}: ${response.status} ${response.statusText}`);
        if (errorText && attempt === 0) {
          console.error(`Error details: ${errorText.substring(0, 500)}`);
        }
        return null;
      }

      const data = await response.json();
      
      // Single endpoint might return { entity: {...}, references: [...] } or just { entity: {...} }
      // Debug: log structure for first few memberships
      if (attempt === 0) {
        const hasReferences = data.references && Array.isArray(data.references);
        if (!hasReferences && updatedCount + skippedCount + errorCount < 3) {
          console.log(`[DEBUG] Membership ${membershipId} response structure:`, {
            hasEntity: !!data.entity,
            hasReferences: hasReferences,
            referencesCount: data.references?.length || 0,
            entityId: data.entity?.id,
            keys: Object.keys(data)
          });
        }
      }
      
      return data;
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
 * Extracts organization ID from Beacon membership response
 * The API might return:
 * - { entity: {...}, references: [...] } (single entity endpoint)
 * - { results: [{ entity: {...}, references: [...] }] } (filter endpoint)
 * Returns the organization ID if found, null otherwise
 */
function extractOrganizationId(membershipResponse) {
  let references = null;
  
  // Handle different response formats
  if (membershipResponse.references && Array.isArray(membershipResponse.references)) {
    // Single entity endpoint format: { entity: {...}, references: [...] }
    references = membershipResponse.references;
  } else if (membershipResponse.entity && membershipResponse.entity.references) {
    // Alternative format: references nested in entity
    references = membershipResponse.entity.references;
  } else if (membershipResponse.results && membershipResponse.results[0]?.references) {
    // Filter endpoint format: { results: [{ entity: {...}, references: [...] }] }
    references = membershipResponse.results[0].references;
  }

  if (references && Array.isArray(references)) {
    // Look for organization entity (entity_type_id 268431)
    for (const ref of references) {
      const entity = ref.entity || ref; // Handle both { entity: {...} } and direct entity
      if (entity?.entity_type_id === 268431 && entity.id) {
        return String(entity.id);
      }
    }
  }

  // If no references found, check if membership entity has organization field directly
  const entity = membershipResponse.entity || membershipResponse.results?.[0]?.entity;
  if (entity?.organization && Array.isArray(entity.organization) && entity.organization.length > 0) {
    // Organization field might contain organization IDs
    return String(entity.organization[0]);
  }

  return null;
}

/**
 * Main function to populate beacon_id values
 */
async function populateBeaconIds() {
  console.log('=== Starting beacon_id population script ===');
  const startTime = Date.now();

  try {
    const supabase = createClient();

    // Step 1: Fetch all companies with beacon_membership_id
    console.log('Fetching companies with beacon_membership_id...');
    const { data: companies, error: fetchError } = await supabase
      .from('companies')
      .select('id, name, beacon_membership_id, beacon_id')
      .not('beacon_membership_id', 'is', null);

    if (fetchError) {
      console.error('Failed to fetch companies:', fetchError);
      process.exit(1);
    }

    if (!companies || companies.length === 0) {
      console.log('No companies found with beacon_membership_id');
      return;
    }

    console.log(`Found ${companies.length} companies with beacon_membership_id`);

    // Step 2: Process companies in batches
    const BATCH_SIZE = 10; // Process 10 at a time to avoid rate limits
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < companies.length; i += BATCH_SIZE) {
      const batch = companies.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(companies.length / BATCH_SIZE)} (${i + 1}-${Math.min(i + BATCH_SIZE, companies.length)} of ${companies.length})`);

      const updatePromises = batch.map(async (company) => {
        try {
          // Skip if beacon_id already exists
          if (company.beacon_id) {
            console.log(`  ✓ Skipping ${company.name} - beacon_id already set: ${company.beacon_id}`);
            skippedCount++;
            return;
          }

          // Fetch membership from Beacon
          const membership = await fetchBeaconMembershipWithReferences(company.beacon_membership_id);
          
          if (!membership) {
            console.warn(`  ✗ Failed to fetch membership ${company.beacon_membership_id} for ${company.name}`);
            errorCount++;
            return;
          }

          // Debug: log membership structure for first few
          if (updatedCount + skippedCount + errorCount < 3) {
            console.log(`[DEBUG] Membership structure for ${company.name}:`, {
              hasEntity: !!membership.entity,
              hasReferences: !!membership.references,
              referencesCount: membership.references?.length || 0,
              referenceTypes: membership.references?.map(r => r.entity?.entity_type_id) || []
            });
          }

          // Extract organization ID
          const organizationId = extractOrganizationId(membership);

          if (!organizationId) {
            // More detailed error message
            const hasReferences = membership.references && Array.isArray(membership.references);
            const refTypes = hasReferences ? membership.references.map(r => r.entity?.entity_type_id).filter(Boolean) : [];
            console.warn(`  ⚠ No organization ID found in membership ${company.beacon_membership_id} for ${company.name}`);
            console.warn(`     Has references: ${hasReferences}, Reference entity types: [${refTypes.join(', ')}]`);
            errorCount++;
            return;
          }

          // Update company in Supabase
          const { error: updateError } = await supabase
            .from('companies')
            .update({ beacon_id: organizationId })
            .eq('id', company.id);

          if (updateError) {
            console.error(`  ✗ Failed to update ${company.name}:`, updateError);
            errorCount++;
            return;
          }

          console.log(`  ✓ Updated ${company.name}: beacon_id = ${organizationId}`);
          updatedCount++;
        } catch (error) {
          console.error(`  ✗ Error processing ${company.name}:`, error);
          errorCount++;
        }
      });

      await Promise.all(updatePromises);

      // Add a small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < companies.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const duration = Date.now() - startTime;
    console.log('\n=== Script completed ===');
    console.log(`Total companies processed: ${companies.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped (already had beacon_id): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Duration: ${duration}ms`);
  } catch (error) {
    console.error('=== Unexpected error ===');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
populateBeaconIds()
  .then(() => {
    console.log('\nScript finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });






