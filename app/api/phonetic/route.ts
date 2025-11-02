import { NextRequest, NextResponse } from 'next/server';
import { getPhoneticSpelling } from '@/lib/phonetic';

/**
 * GET /api/phonetic?word=hello
 * 
 * Returns the phonetic spelling for a given word.
 * This API route wraps the core utility function for client-side usage.
 * 
 * @param request - Next.js request object
 * @returns JSON response with phonetic spelling or null
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get('word');

  if (!word || word.trim().length === 0) {
    return NextResponse.json(
      { phonetic: null, error: 'Word parameter is required' },
      { status: 400 }
    );
  }

  try {
    const phonetic = await getPhoneticSpelling(word);
    return NextResponse.json({ phonetic });
  } catch (error) {
    console.error('Error in phonetic API route:', error);
    return NextResponse.json(
      { phonetic: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

