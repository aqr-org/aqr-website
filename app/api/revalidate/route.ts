import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const body = await request.json();
  const path = body.story?.full_slug ? `/${body.story.full_slug}` : null;
  
  if (path) {
    revalidatePath(path);
  }
  
  // Revalidate members-only-sidebar API route if the story slug matches
  if (body.story?.full_slug === 'site-settings/members-only-sidebar') {
    // Revalidate the API route
    revalidatePath('/api/members-only-sidebar', 'page');
    // Revalidate the tag (Next.js 16 requires path as second argument)
    revalidateTag('members-only-sidebar', '/api/members-only-sidebar');
  }
  
  return new Response("Revalidated path.", { status: 200 });
}
