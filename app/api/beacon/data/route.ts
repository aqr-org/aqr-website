import { NextRequest, NextResponse } from 'next/server';
import { beaconDataOf } from '@/lib/utils';

// GET handler for testing (optional)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'This endpoint accepts POST requests only. Send email in request body.' },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const data = await beaconDataOf(normalizedEmail);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in beacon data API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beacon data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
