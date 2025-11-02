// route handler enabling draft mode
import { draftMode, cookies } from 'next/headers';
import { getStoryblokApi, storyblokInit, apiPlugin } from '@storyblok/react'
import { redirect } from 'next/navigation';

storyblokInit({
  accessToken: process.env.STORYBLOK_PREVIEW_TOKEN || process.env.STORYBLOK_ACCESS_TOKEN,
  use: [apiPlugin]
});

export async function GET(request: Request) {
  // Parse query string parameters
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')

  //Check if the secret is correct and next parameters are present
  if (secret !== process.env.STORYBLOK_PREVIEW_TOKEN && secret !== process.env.STORYBLOK_ACCESS_TOKEN ) {
    return new Response(`Unauthorized you buffoon`, { status: 401 })
  }
  let searchslug = slug

  if (!slug) {
    searchslug = 'home'
  }

  // Fetch the headless CMS to check if the provided `slug` exists
  // getPostBySlug would implement the required fetching logic to the headless CMS
  // Normalize slug: strip leading/trailing slashes and default to 'home'
  searchslug = String(searchslug || 'home').replace(/^\/+|\/+$/g, '') || 'home';

  const posts = await getStoryblokApi().get(`cdn/stories/${searchslug}`, {
    version: 'draft'
  })

  const post = posts.data
  // return new Response(JSON.stringify(post, null, 2))

  // If the slug doesn't exist prevent draft mode from being enabled
  if (!post) {
    return new Response(`Invalid slug: ${slug}`, { status: 401 })
  }

  // Enable Draft Mode by setting the cookie
  (await draftMode()).enable()

  // Get the cookie instance first
  const cookieStore = await cookies()
  const draftCookie = cookieStore.get('__prerender_bypass')
    
  // Then set it with the proper value handling
  cookieStore.set('__prerender_bypass', draftCookie?.value || '', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
  });
 
  // Redirect to the same page the user came from
  // Check for explicit redirect parameter first, then Referer header, then fall back to slug-based redirect
  const redirectPath = searchParams.get('redirect') || 
    request.headers.get('referer')?.replace(new URL(request.url).origin, '') ||
    (searchslug === 'home' ? '/' : `/${searchslug}`)
  
  // Normalize redirect path - ensure it's a valid path
  const normalizedPath = redirectPath.startsWith('http') 
    ? new URL(redirectPath).pathname 
    : redirectPath.split('?')[0] // Remove query string if present
  
  redirect(normalizedPath || '/')

  const responseHtml = `<!doctype html>
  <html>
    <head>
    <meta charset="utf-8">
    <title>Draft Mode Enabled</title></head>
    <body style="padding:3em; position:relative; font-family:system-ui,-apple-system,sans-serif;">
      <h1>Draft mode enabled</h1>
      <p>Draft mode enabled! In Storyblok editor, just refresh this preview page to view published mode.</p>
      
      <div class="refresh-indicator">Refresh page now.</div>

    </body>
  </html>`;

  return new Response(responseHtml, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}