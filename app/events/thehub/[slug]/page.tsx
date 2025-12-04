import { getStoryblokApi } from '@/lib/storyblok';
import type { Metadata, ResolvingMetadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata';
import { storyblokEditable } from '@storyblok/react/rsc';
import { StoryblokStory } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { checkStoryblokPageAuth, isStoryblokEditor } from '@/lib/auth-utils';

interface WebinarPageProps {
  params: Promise<{ slug: string }>;
}

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // read route params
    const storyblok = await fetchStoryblokData(params);
    const { meta_title, meta_description, og_image } = storyblok.data.story.content;
 
    return await generatePageMetadata(
      {
        meta_title,
        meta_description,
        og_image
      },
      parent
    );
  } catch (error) {
    // Return fallback metadata if story not found
    return await generatePageMetadata({}, parent);
  }
}

export default async function GlossaryPage({ params }: WebinarPageProps) {
  let storyBlokStory;
  
  try {
    const { isEnabled } = await draftMode();
    const isDraftMode = isEnabled;
    const storyblok = await fetchStoryblokData(params);
    storyBlokStory = storyblok.data.story;
  } catch (error: any) {
    // Check if it's a 404 error
    const statusCode = error?.response?.status;
    if (statusCode === 404) {
      notFound();
    }
    // Re-throw other errors
    throw error;
  }

  // Check if we're in Storyblok editor (skip auth check if so)
  const inStoryblokEditor = await isStoryblokEditor();
  
  // Check if page is protected and user is authenticated
  // This must be outside try-catch to allow Next.js to handle redirect properly
  const authStatus = await checkStoryblokPageAuth(storyBlokStory!, inStoryblokEditor);
  if (authStatus.isProtected && !authStatus.isAuthenticated) {
    redirect("/auth/login");
  }

  return (
    <main {...storyblokEditable(storyBlokStory!)}> 
      <StoryblokStory story={storyBlokStory!} />
    </main>
  );
}

async function fetchStoryblokData(params: WebinarPageProps['params']) {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  const resolvedParams = await params;
  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/events/thehub/${resolvedParams.slug}`, { version: isDraftMode ? 'draft' : 'published' });
}
