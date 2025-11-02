import { NextRequest, NextResponse } from 'next/server';
import mailchimp from '@mailchimp/mailchimp_marketing';

// Configure Mailchimp (will use environment variables)
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY || '',
  server: process.env.MAILCHIMP_API_SERVER || '',
});

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Check if Mailchimp is configured
    if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_AUDIENCE_ID || !process.env.MAILCHIMP_API_SERVER) {
      console.error('Mailchimp environment variables not configured');
      return NextResponse.json(
        { error: 'Newsletter service is not configured. Please try again later.' },
        { status: 500 }
      );
    }

    // Prepare merge fields
    const mergeFields: { [key: string]: string } = {};
    if (firstName) mergeFields.FNAME = firstName;
    if (lastName) mergeFields.LNAME = lastName;

    // Add subscriber to Mailchimp audience
    try {
      await mailchimp.lists.addListMember(process.env.MAILCHIMP_AUDIENCE_ID, {
        email_address: email.trim().toLowerCase(),
        status: 'subscribed',
        ...(Object.keys(mergeFields).length > 0 && { merge_fields: mergeFields }),
      });

      return NextResponse.json(
        { message: 'Successfully subscribed to newsletter!' },
        { status: 200 }
      );
    } catch (error: any) {
      // Handle Mailchimp-specific errors
      if (error.status === 400 && error.response?.body?.title === 'Member Exists') {
        return NextResponse.json(
          { error: 'This email is already subscribed to our newsletter.' },
          { status: 400 }
        );
      }

      console.error('Mailchimp API error:', error);
      return NextResponse.json(
        { error: error.response?.body?.title || error.message || 'Failed to subscribe. Please try again later.' },
        { status: error.status || 500 }
      );
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
