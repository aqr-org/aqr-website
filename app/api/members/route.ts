import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all members with firstname, lastname, and slug
    const { data: members, error } = await supabase
      .from('members')
      .select('firstname, lastname, slug')
      .not('slug', 'is', null)
      .order('lastname', { ascending: true });

    if (error) {
      console.error('Members query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': 'https://app.storyblok.com'
          }
        }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json(
        [],
        {
          headers: {
            'Access-Control-Allow-Origin': 'https://app.storyblok.com'
          }
        }
      );
    }

    // Format the response as requested
    const formattedMembers = members
      .filter(member => member.firstname && member.lastname && member.slug)
      .map(member => ({
        name: `${member.firstname} ${member.lastname}`,
        value: member.slug
      }));

    return NextResponse.json(
      formattedMembers,
      {
        headers: {
          'Access-Control-Allow-Origin': 'https://app.storyblok.com'
        }
      }
    );

  } catch (error) {
    console.error('Members API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': 'https://app.storyblok.com'
        }
      }
    );
  }
}

