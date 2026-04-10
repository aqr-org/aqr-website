import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface BeaconMembership {
  entity?: {
    id?: string | number;
    type?: string[];
    status?: string[];
  };
  references?: Array<{
    entity?: {
      id?: string | number;
      name?: string;
      entity_type_id?: number;
    };
  }>;
}

interface ActiveDirectoryCompany {
  organizationId: string;
  organizationName: string;
  membershipId: string;
  membershipType: string | null;
  membershipStatus: string;
}

const getCachedBeaconDirectoryCompanies = unstable_cache(
  async (): Promise<ActiveDirectoryCompany[]> => {
    const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
    const beaconApiUrl = process.env.BEACON_API_URL;
    if (!beaconAuthToken || !beaconApiUrl) {
      throw new Error("Beacon API not configured");
    }

    const response = await fetch(`${beaconApiUrl}/entities/membership`, {
      headers: {
        Authorization: `Bearer ${beaconAuthToken}`,
        "Beacon-Application": "developer_api",
        "Content-Type": "application/json",
      },
      // Keep this cacheable to reduce Beacon rate-limit pressure.
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Beacon API: ${response.status}`);
    }

    const json = await response.json();
    const memberships: BeaconMembership[] = json?.results ?? [];
    const companyMap = new Map<string, ActiveDirectoryCompany>();

    for (const membership of memberships) {
      const types = membership.entity?.type ?? [];
      const statuses = membership.entity?.status ?? [];
      const isBusinessDirectory = types.some((t) =>
        String(t).includes("Business Directory"),
      );
      if (!isBusinessDirectory) continue;

      const orgRef = (membership.references ?? []).find(
        (ref) => ref.entity?.entity_type_id === 268431,
      );
      const orgId = orgRef?.entity?.id ? String(orgRef.entity.id) : null;
      const orgName = orgRef?.entity?.name?.trim();
      if (!orgId || !orgName) continue;

      if (!companyMap.has(orgId)) {
        companyMap.set(orgId, {
          organizationId: orgId,
          organizationName: orgName,
          membershipId: membership.entity?.id
            ? String(membership.entity.id)
            : "",
          membershipType:
            types.find((t) => String(t).includes("Business Directory")) ?? null,
          membershipStatus: statuses[0] ? String(statuses[0]) : "Unknown",
        });
      }
    }

    return Array.from(companyMap.values()).sort((a, b) =>
      a.organizationName.localeCompare(b.organizationName),
    );
  },
  ["beacon-directory-companies"],
  { revalidate: 300, tags: ["beacon", "superadmin-companies"] },
);

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = data.claims.email?.trim().toLowerCase();
    const allowedEmails = [
      process.env.SUPERADMIN_EMAIL?.trim().toLowerCase(),
      process.env.SUPERADMIN_EMAIL2?.trim().toLowerCase(),
    ].filter(Boolean);

    if (!userEmail || !allowedEmails.includes(userEmail)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companies = await getCachedBeaconDirectoryCompanies();
    return NextResponse.json({
      companies,
    });
  } catch (error) {
    console.error("Error fetching active Beacon directory companies:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch active Beacon directory companies",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
