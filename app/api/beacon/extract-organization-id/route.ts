import { NextRequest, NextResponse } from 'next/server';

/**
 * Extracts organization ID from Beacon membership response
 * The API might return:
 * - { entity: {...}, references: [...] } (single entity endpoint)
 * - { results: [{ entity: {...}, references: [...] }] } (filter endpoint)
 * Returns the organization ID if found, null otherwise
 */
function extractOrganizationId(membershipResponse: any): string | null {
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
 * API route to extract organization ID from a Beacon membership ID
 * GET /api/beacon/extract-organization-id?membershipId=...
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const membershipId = searchParams.get('membershipId');

  if (!membershipId) {
    return NextResponse.json(
      { error: 'membershipId query parameter is required' },
      { status: 400 }
    );
  }

  const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
  const beaconApiUrl = process.env.BEACON_API_URL;

  if (!beaconAuthToken) {
    return NextResponse.json(
      { error: 'BEACON_AUTH_TOKEN not configured' },
      { status: 500 }
    );
  }

  if (!beaconApiUrl) {
    return NextResponse.json(
      { error: 'BEACON_API_URL not configured' },
      { status: 500 }
    );
  }

  try {
    // Fetch membership from Beacon API
    const response = await fetch(`${beaconApiUrl}/entity/membership/${membershipId}`, {
      headers: {
        'Authorization': `Bearer ${beaconAuthToken}`,
        'Beacon-Application': 'developer_api',
        'Content-Type': 'application/json'
      },
    });

    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Rate limited by Beacon API' },
        { status: 429 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        { error: `Failed to fetch Beacon membership: ${response.status} ${response.statusText}`, details: errorText.substring(0, 500) },
        { status: response.status }
      );
    }

    const membershipData = await response.json();
    
    // Extract organization ID
    const organizationId = extractOrganizationId(membershipData);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'No organization ID found in membership references', membershipId },
        { status: 404 }
      );
    }

    return NextResponse.json({ organizationId });
  } catch (error) {
    console.error('Error extracting organization ID:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

