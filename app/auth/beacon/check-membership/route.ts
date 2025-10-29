import { NextRequest } from 'next/server';
import { checkActiveBeaconMembership } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return Response.json(
        { ok: false, reason: 'missing-email' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = await checkActiveBeaconMembership(normalizedEmail);
    
    return Response.json(result);
  } catch (error) {
    console.error('Error in check-membership API:', error);
    return Response.json(
      { ok: false, reason: 'error' },
      { status: 500 }
    );
  }
}

