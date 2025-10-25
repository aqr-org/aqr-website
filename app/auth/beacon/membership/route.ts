import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;

  if (!beaconAuthToken) {
    return new Response('Beacon auth token not configured', { status: 500 });
  }

  // Example of calling an external API with the auth token
  const response = await fetch(`${process.env.BEACON_API_URL}/entities/membership?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${beaconAuthToken}`,
      'Beacon-Application': 'developer_api',
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    return new Response('Failed to fetch from Beacon API', { status: response.status });
  }

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}