export async function GET() {

  const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
  const beaconApiUrl = process.env.BEACON_API_URL;

  if (!beaconAuthToken) {
    return new Response('Beacon auth token not configured', { status: 500 });
  }

  if (!beaconApiUrl) {
    return new Response('Beacon API URL not configured', { status: 500 });
  }

  // Example of calling an external API with the auth token
  const response = await fetch(`${beaconApiUrl}/entities/person/`, {
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