import { NextRequest } from 'next/server';

async function handleFilter(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const value = searchParams.get('value') || '';
  const field = searchParams.get('field') || 'member';

  try {
    const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
    const beaconApiUrl = process.env.BEACON_API_URL;

    if (!beaconAuthToken) {
      return new Response('Beacon auth token not configured', { status: 500 });
    }

    if (!beaconApiUrl) {
      return new Response('Beacon API URL not configured', { status: 500 });
    }

    const bodyData = {
      filter_conditions: [
        {
          field: field,
          reference: {
            entity_type: 'person',
            field: 'emails.email',
            operator: '==',
            value: value
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
      return new Response('Failed to fetch from Beacon API', { status: response.status });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in handleFilter:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleFilter(request);
}

export async function GET(request: NextRequest) {
  return handleFilter(request);
}