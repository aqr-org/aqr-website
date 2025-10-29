import { NextRequest } from 'next/server';

/**
 * Server-side API route to check if an email should skip Beacon membership verification.
 * Returns whether to bypass Beacon check without revealing the superadmin email.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return Response.json(
        { skipBeaconCheck: false },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
    
    // Check if email matches superadmin without exposing which email it is
    const skipBeaconCheck = superadminEmail && normalizedEmail === superadminEmail;
    
    return Response.json({ skipBeaconCheck });
  } catch (error) {
    console.error('Error in check-superadmin API:', error);
    return Response.json(
      { skipBeaconCheck: false },
      { status: 500 }
    );
  }
}

