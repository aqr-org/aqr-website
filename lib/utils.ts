import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BeaconMembershipResult } from "./types";
import type { UserBeaconData } from "./types";
import { unstable_cache } from 'next/cache';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const profOrgsNameMap: {[key: string]: string} = {
  "MRS": "The Market Research Society",
  "ESOMAR": "The European Society for Opinion and Marketing Research",
  "ICG": "The Independent Consultants Group",
  "QRCA": "The Qualitative Research Consultants Association",
  "APG": "The Account Planning Group",
  "SRA": "The Social Research Association",
  "IQCS": "The Interviewer Quality Control Scheme",
  "VFA": "The Viewing Facilities Association",
  "AIMRI": "The Alliance of International Market Research Institutes"
};

export const getProfessionalOrgName = (abbreviation: string): string => {
  return profOrgsNameMap[abbreviation as keyof typeof profOrgsNameMap] || abbreviation;
};

/**
 * Directly calls the Beacon API to filter memberships by email
 * This avoids making HTTP requests to our own Next.js routes from server components
 */
async function fetchBeaconMembershipByEmail(email: string, field: string = 'member'): Promise<any> {
  const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
  const beaconApiUrl = process.env.BEACON_API_URL;

  if (!beaconAuthToken || !beaconApiUrl) {
    // Return null to indicate configuration error - will be handled gracefully by caller
    return { results: [] };
  }

  const bodyData = {
    filter_conditions: [
      {
        field: field,
        reference: {
          entity_type: 'person',
          field: 'emails.email',
          operator: '==',
          value: email
        }
      }
    ]
  };

  const response = await fetch(`${beaconApiUrl}/entities/membership/filter`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${beaconAuthToken}`,
      'Beacon-Application': 'developer_api',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyData)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from Beacon API: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetch Beacon person by email (to get personId).
 */
async function fetchBeaconPersonByEmail(email: string): Promise<any> {
  const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
  const beaconApiUrl = process.env.BEACON_API_URL;

  if (!beaconAuthToken || !beaconApiUrl) {
    return { results: [] };
  }

  const bodyData = {
    filter_conditions: [
      {
        field: 'emails.email',
        operator: '==',
        value: email
      }
    ]
  };

  try {
    const response = await fetch(`${beaconApiUrl}/entities/person/filter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${beaconAuthToken}`,
        'Beacon-Application': 'developer_api',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
      return { results: [] };
    }

    return await response.json();
  } catch {
    return { results: [] };
  }
}

/**
 * Fetch Business Directory memberships for orgs where org.primary_contact contains personId.
 *
 * Strategy (fast path):
 * - Filter organizations by primary_contact contains personId
 * - For each org id, filter memberships by member contains orgId
 * - Filter returned memberships in code for Active + Business Directory type
 */
async function fetchBeaconMembershipsByOrgPrimaryContact(personId: string): Promise<any> {
  const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
  const beaconApiUrl = process.env.BEACON_API_URL;

  if (!beaconAuthToken || !beaconApiUrl) {
    return { results: [] };
  }

  // 1) Find organizations for this primary contact
  const orgFilterBody = {
    filter_conditions: [
      {
        field: 'primary_contact',
        operator: 'contains',
        value: String(personId)
      }
    ]
  };

  const orgRes = await fetch(`${beaconApiUrl}/entities/organization/filter`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${beaconAuthToken}`,
      'Beacon-Application': 'developer_api',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orgFilterBody)
  });

  if (!orgRes.ok) {
    return { results: [] };
  }

  const orgJson = await orgRes.json();
  const orgIds: string[] = (orgJson?.results ?? [])
    .map((r: any) => r?.entity?.id)
    .filter((id: any) => id != null)
    .map((id: any) => String(id));

  if (orgIds.length === 0) {
    return { results: [] };
  }

  // 2) Fetch memberships for those org ids
  const membershipResults: any[] = [];
  for (const orgId of orgIds) {
    const membershipFilterBody = {
      filter_conditions: [
        {
          field: 'member',
          operator: 'contains',
          value: orgId
        }
      ]
    };

    const membershipRes = await fetch(`${beaconApiUrl}/entities/membership/filter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${beaconAuthToken}`,
        'Beacon-Application': 'developer_api',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(membershipFilterBody)
    });

    if (!membershipRes.ok) continue;

    const membershipJson = await membershipRes.json();
    const memberships = membershipJson?.results ?? [];

    const filtered = memberships.filter((m: any) => {
      const statuses: string[] = m?.entity?.status ?? [];
      const types: string[] = m?.entity?.type ?? [];
      const isActive = statuses.includes('Active') || statuses[0] === 'Active';
      const isBusinessDirectory = types.some((t) => String(t).includes('Business Directory'));
      return isActive && isBusinessDirectory;
    });

    membershipResults.push(...filtered);
  }

  return { results: membershipResults };
}

// Internal function to fetch Beacon data (not cached)
async function fetchBeaconDataInternal(email: string): Promise<object> {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Call Beacon API directly instead of making HTTP requests to our own routes
  let beaconMembershipJson: any = { results: [] };
  let beaconAdditionalMembershipJson: any = { results: [] };
  
  try {
    // This has as a result the entity that contains the email address:
    beaconMembershipJson = await fetchBeaconMembershipByEmail(normalizedEmail, 'member');
  } catch (error) {
    console.error('Failed to fetch beacon membership:', error);
    // Continue to try the additional members check
  }
  
  // This second endpoint checks for memberships where the email is in the additional members field.
  // Note: Even though additional_members appears as an array of numeric IDs in the raw data,
  // the Beacon API filter (using the 'reference' object) resolves those IDs to person entities
  // and checks their emails. This is important for company memberships where users are listed
  // as additional members rather than the primary member.
  try {
    beaconAdditionalMembershipJson = await fetchBeaconMembershipByEmail(normalizedEmail, 'additional_members');
  } catch (error) {
    console.error('Failed to fetch beacon additional membership:', error);
    // Continue processing with whatever we got from the first call
  }

  // Efficiency: only do the org.primary_contact lookup if the first two checks found nothing.
  // This still satisfies the "OR" requirements:
  // - additional_members match => access granted
  // - org.primary_contact match => access granted
  // - both => access granted
  let fetchedPersonEntity: any = null;
  let beaconOrgPrimaryContactJson: any = { results: [] };
  if (!beaconMembershipJson?.results?.length && !beaconAdditionalMembershipJson?.results?.length) {
    try {
      const personResult = await fetchBeaconPersonByEmail(normalizedEmail);
      fetchedPersonEntity = personResult?.results?.[0]?.entity ?? null;
      if (fetchedPersonEntity?.id) {
        beaconOrgPrimaryContactJson = await fetchBeaconMembershipsByOrgPrimaryContact(String(fetchedPersonEntity.id));
      }
    } catch (error) {
      console.error('Failed to fetch beacon org primary contact membership:', error);
    }
  }

  const membershipResults: BeaconMembershipResult[] = []
    .concat(beaconMembershipJson?.results ?? [])
    .concat(beaconAdditionalMembershipJson?.results ?? [])
    .concat(beaconOrgPrimaryContactJson?.results ?? []);

  const membershipRecord = membershipResults.length > 0 ? membershipResults[0] : null;
  const extraMembershipRecords = membershipResults.length > 0 ? membershipResults : [];

  if (!membershipRecord) {
    console.log("Email does not exist in Beacon membership records:", membershipResults);
    return {error: "beacon-not-found"};
  }

  const membershipId = membershipRecord.entity.id;

  if (!membershipId) {
    console.error("Membership record found but missing ID:", membershipRecord);
    return {error: "Membership record found but missing ID"};
  }

  const memberShipIsActive = membershipResults.some((membership) => {
      return membership.entity?.status[0] === "Active";
  })

  const orgsFromMemberships = [] as { id: string; name: string }[];
  let personId = '';
  let personEntity: any = null;

  membershipResults.forEach((membership) => {
    const references = membership.references;
    references.forEach((ref) => {

      if (normalizedEmail === ref.entity.emails?.[0]?.email.toString().toLowerCase()) {
        personId = ref.entity.id;
        personEntity = ref.entity;
      }

      // Entity type ID 268431 corresponds to "Organization" in our Beacon API
      // Maybe it would be safer to fetch from /auth/beacon/organization and cross-check IDs, but this is simpler
      // This is saving one API call too, which is good bcs Beacon API is a bit slow
      if (ref.entity.entity_type_id === 268431) {
        orgsFromMemberships.push({
          id: ref.entity.id,
          name: ref.entity.name as string,
        });
      }
    });
  });

  // Deduplicate organizations by ID
  const uniqueOrgsMap: { [key: string]: { id: string; name: string } } = {};
  orgsFromMemberships.forEach((org) => {
    uniqueOrgsMap[org.id] = org;
  });
  const uniqueOrgs = Object.values(uniqueOrgsMap);
  
  // Use the person entity that matches the logged-in user's email for firstname/lastname
  // This ensures we get the correct person's name even for group memberships
  const firstName = personEntity?.name?.first || (membershipRecord.references[0]?.entity?.name as { first: string })?.first || '';
  const lastName = personEntity?.name?.last || (membershipRecord.references[0]?.entity?.name as { last: string })?.last || '';
  
  const data = {
    id: membershipId,
    personId: personId,
    // membershipRecord: membershipRecord,
    firstname: firstName,
    lastname: lastName,
    email: normalizedEmail,
    hasCurrentMembership: memberShipIsActive,
    joined: membershipRecord.entity.start_date,
    hasOrg: uniqueOrgs.length > 0,
    allMemberships: extraMembershipRecords.map((rec) => rec.entity.type[0]),
    organizations: uniqueOrgs.map((org) => ({
      id: org.id,
      name: org.name,
    })),
  } 
  
  return data;
}

// Cache Beacon API calls to reduce bandwidth usage
// We need to create a cached wrapper for each email, so we use a helper function
export async function beaconDataOf(email: string): Promise<object> {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Create a cached version for this specific email
  const getCachedBeaconData = unstable_cache(
    async () => {
      return await fetchBeaconDataInternal(email);
    },
    [`beacon-data-${normalizedEmail}`],
    {
      revalidate: 600, // Cache for 10 minutes (membership status doesn't change frequently)
      tags: ['beacon', 'membership'],
    }
  );
  
  return await getCachedBeaconData();
}

// Helper to verify that an email belongs to a Beacon person with an active membership
export const checkActiveBeaconMembership = async (email: string): Promise<{ ok: boolean; reason?: string; data?: UserBeaconData | null }> => {
  try {
    const data = await beaconDataOf(email) as unknown as UserBeaconData | null;

    if (!data || 'error' in data) {
      return { ok: false, reason: 'beacon-not-found' };
    }

    if (!data.hasCurrentMembership) {
      return { ok: false, reason: 'no-active-membership', data };
    }

    return { ok: true, data };
  } catch (err) {
    console.error('Error checking Beacon membership:', err);
    return { ok: false, reason: 'error' };
  }
}


export const sbCompanyHasActiveBeaconSub = async (companyName: string): Promise<boolean> => {
  const baseUrl = process.env.URL || 'https://localhost:3001';
  const beaconMembershipRes = await fetch(`${baseUrl}/auth/beacon/membership`);

  if (!beaconMembershipRes.ok) {
    console.error("Failed to contact Beacon membership endpoint");
    return false;
  }

  const beaconMembershipJson = await beaconMembershipRes.json();
  const membershipResults: BeaconMembershipResult[] = beaconMembershipJson?.results ?? [];
  
  console.log("Checking active Beacon subscriptions for company:", companyName);
  // Check if any membership is associated with the given company name and is active
  const hasActiveSub = membershipResults.some((membership) => {
    const references = membership.references;
    const isActive = membership.entity?.status[0] === "Active";
    const isBusinessDirectory = membership.entity?.type.includes("Business Directory");
    const nameMatches = references.some(
      (ref) => ref.entity.name.toString().toLowerCase() === companyName.toLowerCase()
    );
    // console.log(`Membership ID: ${membership.entity.id}, isActive: ${isActive}, nameMatches: ${nameMatches}, isBusinessDirectory: ${isBusinessDirectory}`);
    return isActive && nameMatches && isBusinessDirectory;
  });

  return hasActiveSub;
}
