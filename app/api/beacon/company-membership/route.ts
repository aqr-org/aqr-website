import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to get Business Directory membership for a company by organization name
 * POST /api/beacon/company-membership
 * Body: { companyName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { companyName, beaconMembershipId } = await request.json();
    
    if (!companyName && !beaconMembershipId) {
      return NextResponse.json(
        { error: 'Company name or beaconMembershipId is required' },
        { status: 400 }
      );
    }

    const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
    const beaconApiUrl = process.env.BEACON_API_URL;

    if (!beaconAuthToken || !beaconApiUrl) {
      return NextResponse.json(
        { error: 'Beacon API not configured' },
        { status: 500 }
      );
    }

    // Fetch all memberships from Beacon API
    const response = await fetch(`${beaconApiUrl}/entities/membership`, {
      headers: {
        'Authorization': `Bearer ${beaconAuthToken}`,
        'Beacon-Application': 'developer_api',
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch from Beacon API: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const membershipResults = data.results || [];
    
    // If beaconMembershipId is provided, try to find membership directly by ID first
    if (beaconMembershipId) {
      const membershipById = membershipResults.find((m: any) => 
        m.entity?.id === parseInt(beaconMembershipId) || 
        String(m.entity?.id) === String(beaconMembershipId)
      );
      
      if (membershipById) {
        const membershipTypes = membershipById.entity?.type || [];
        const isBusinessDirectory = membershipTypes.some((type: string) => 
          type.includes("Business Directory")
        );
        
        if (isBusinessDirectory) {
          const membershipType = membershipTypes.find((type: string) => 
            type.includes("Business Directory")
          );
          if (membershipType) {
            return NextResponse.json({
              allMemberships: [membershipType],
              found: true
            });
          }
        }
      }
    }
    
    // Find Business Directory memberships for this company
    const businessDirectoryMemberships: string[] = [];
    
    membershipResults.forEach((membership: any) => {
      const references = membership.references || [];
      const membershipTypes = membership.entity?.type || [];
      
      // Check if this is a Business Directory membership
      const isBusinessDirectory = membershipTypes.some((type: string) => 
        type.includes("Business Directory")
      );
      
      if (isBusinessDirectory) {
        // Check if any reference matches the company name
        // Organizations have entity_type_id 268431
        const nameMatches = references.some((ref: any) => {
          const entity = ref.entity || ref;
          const entityTypeId = entity.entity_type_id;
          
          // Check if this is an organization (entity_type_id 268431)
          if (entityTypeId === 268431) {
            const refName = entity.name;
            if (typeof refName === 'string') {
              const normalizedRefName = refName.toLowerCase().trim();
              const normalizedCompanyName = companyName.toLowerCase().trim();
              
              // Try exact match first
              let matches = normalizedRefName === normalizedCompanyName;
              
              // If no exact match, try partial match (company name contained in org name or vice versa)
              // This handles cases where Beacon might have extra text like "(990283) - Business Directory Basic"
              if (!matches) {
                matches = normalizedRefName.includes(normalizedCompanyName) || 
                         normalizedCompanyName.includes(normalizedRefName);
              }
              
              return matches;
            }
          }
          return false;
        });
        
        if (nameMatches) {
          // Extract the membership type (Basic, Standard, or Enhanced)
          const membershipType = membershipTypes.find((type: string) => 
            type.includes("Business Directory")
          );
          if (membershipType) {
            businessDirectoryMemberships.push(membershipType);
          }
        }
      }
    });
    
    if (businessDirectoryMemberships.length > 0) {
      return NextResponse.json({
        allMemberships: businessDirectoryMemberships,
        found: true
      });
    } else {
      return NextResponse.json({
        allMemberships: [],
        found: false
      });
    }
  } catch (error) {
    console.error('Error in company membership API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company membership', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
