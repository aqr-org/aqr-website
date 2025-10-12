import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BeaconMembershipResult } from "./types";
import type { UserBeaconData } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

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

export const beaconDataOf = async (email: string): Promise<object> => {
  
  const normalizedEmail = email.trim().toLowerCase();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3001';
  // This has as a result the entity that contains the email address:
  const beaconMembershipRes = await fetch(`${baseUrl}/auth/beacon/membership/filter/email?value=${encodeURIComponent(normalizedEmail)}`);
  // This second endpoint checks for memberships where the email is in the additional members field
  const beaconAdditionalMembershipRes = await fetch(`${baseUrl}/auth/beacon/membership/filter/email?value=${encodeURIComponent(normalizedEmail)}&field=additional_members`);

  if (!beaconMembershipRes.ok && !beaconAdditionalMembershipRes.ok) {
    return {error: "Failed to contact Beacon membership endpoint"};
  }

  const beaconMembershipJson = await beaconMembershipRes.json();
  const beaconAdditionalMembershipJson = await beaconAdditionalMembershipRes.json();

  const membershipResults: BeaconMembershipResult[] = []
    .concat(beaconMembershipJson?.results ?? [])
    .concat(beaconAdditionalMembershipJson?.results ?? []);

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

  membershipResults.forEach((membership) => {
    const references = membership.references;
    references.forEach((ref) => {

      if (normalizedEmail === ref.entity.emails?.[0]?.email.toString().toLowerCase()) {
        personId = ref.entity.id;
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
  
  const data = {
    id: membershipId,
    personId: personId,
    email: normalizedEmail,
    hasCurrentMembership: memberShipIsActive,
    hasOrg: uniqueOrgs.length > 0,
    allMemberships: extraMembershipRecords.map((rec) => rec.entity.type[0]),
    organizations: uniqueOrgs.map((org) => ({
      id: org.id,
      name: org.name,
    })),
  } 

  return data;
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
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
