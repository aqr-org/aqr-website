import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  const body = await request.json();
  const path = body.story?.full_slug ? `/${body.story.full_slug}` : null;
  if (path) revalidatePath(path);
  return new Response("Revalidated path.", { status: 200 });
}
