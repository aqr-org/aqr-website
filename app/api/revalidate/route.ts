import { revalidatePath, revalidateTag } from 'next/cache';

// Prefix -> unstable_cache tag, so editing shared content (nav, footer, event lists, etc.)
// invalidates the right cache immediately instead of waiting out its revalidate window.
// Checked in order, so more specific prefixes must come before their broader parents.
const TAG_RULES: [prefix: string, tag: string][] = [
  ['site-settings/main-navigation', 'navigation'],
  ['site-settings/footer', 'footer'],
  ['events/thehub/', 'webinars'],
  ['events/', 'events'],
  ['glossary/', 'glossary'],
  ['calendar/', 'calendar'],
  ['dir/', 'directory'],
  ['resources/inspiration/', 'inspiration'],
  ['members/', 'members'],
];

export async function POST(request: Request) {
  const body = await request.json();
  const fullSlug: string | undefined = body.story?.full_slug;
  const path = fullSlug ? `/${fullSlug}` : null;

  if (path) {
    revalidatePath(path);
  }

  // Revalidate members-only-sidebar API route if the story slug matches
  if (fullSlug === 'site-settings/members-only-sidebar') {
    // Revalidate the API route
    revalidatePath('/api/members-only-sidebar', 'page');
    // Revalidate the tag (Next.js 16 requires path as second argument)
    revalidateTag('members-only-sidebar', '/api/members-only-sidebar');
  }

  if (fullSlug) {
    const match = TAG_RULES.find(([prefix]) => fullSlug.startsWith(prefix));
    if (match) {
      revalidateTag(match[1], path!);
    }
  }

  return new Response("Revalidated path.", { status: 200 });
}
