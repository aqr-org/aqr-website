import { draftMode, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  
  (await draftMode()).disable();
  
  const cookieStore = await cookies();
  const cookie = cookieStore.get("__prerender_bypass")!;
  (await cookies()).set({
    name: "__prerender_bypass",
    value: cookie?.value,
    expires: new Date(0), // Set expiration date to the past
    httpOnly: true,
    path: "/",
    secure: true,
    sameSite: "none",
  });

  // Redirect to the same page the user came from
  // Check for explicit redirect parameter first, then Referer header, then fall back to home
  const { searchParams } = new URL(request.url);
  const redirectPath = searchParams.get('redirect') || 
    request.headers.get('referer')?.replace(new URL(request.url).origin, '') ||
    '/';
  
  // Normalize redirect path - ensure it's a valid path
  const normalizedPath = redirectPath.startsWith('http') 
    ? new URL(redirectPath).pathname 
    : redirectPath.split('?')[0]; // Remove query string if present
  
  redirect(normalizedPath || '/');

  const responseHtml = `<!doctype html>
  <html>
    <head>
    <meta charset="utf-8">
    <title>Draft Mode Disabled</title></head>
    <body style="padding:3em; position:relative; font-family:system-ui,-apple-system,sans-serif;">
      <h1>Draft mode disabled</h1>
      <p>Draft mode disabled! In Storyblok editor, just refresh this preview page to view published mode.</p>
      <div class="refresh-indicator">Refresh the page now</span></div>

    </body>
  </html>`;

  return new Response(responseHtml, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}