import { getStoryblokApi } from '@/lib/storyblok';
import type { Metadata, ResolvingMetadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata';
import { storyblokEditable } from '@storyblok/react/rsc';
import { StoryblokStory } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { checkStoryblokPageAuth, isStoryblokEditor } from '@/lib/auth-utils';

type Props = {
  params: Promise<Record<string, never>>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params: _params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch the newest webinar
  const newestWebinar = await fetchNewestWebinar();
  
  if (newestWebinar) {
    const { meta_title, meta_description, og_image } = newestWebinar.content;
    
    return await generatePageMetadata(
      {
        meta_title,
        meta_description,
        og_image
      },
      parent
    );
  }
  
  // Return basic metadata if no webinar found
  return {
    title: 'Webinar',
    description: 'Latest webinar'
  };
}

export default async function WebinarPage() {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  const newestWebinar = await fetchNewestWebinar();

  if (!newestWebinar) {
    return (
      <main>
        <p>No webinars available.</p>
      </main>
    );
  }

  // Check if we're in Storyblok editor (skip auth check if so)
  const inStoryblokEditor = await isStoryblokEditor();
  
  // Check if page is protected and user is authenticated
  // This must be outside try-catch to allow Next.js to handle redirect properly
  const authStatus = await checkStoryblokPageAuth(newestWebinar, inStoryblokEditor);
  if (authStatus.isProtected && !authStatus.isAuthenticated) {
    redirect("/auth/login");
  }

  return (
    <main {...storyblokEditable(newestWebinar)}> 
      <StoryblokStory story={newestWebinar} />
    </main>
  );
}

async function fetchNewestWebinar() {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  const storyblokApi = getStoryblokApi();
  
  // Fetch all webinars
  const webinars = await storyblokApi.getAll(`cdn/stories`, { 
    version: isDraftMode ? 'draft' : 'published',
    content_type: 'webinar',
    starts_with: 'events/thehub/',
    excluding_slugs: 'events/thehub/'
  });
  
  if (!webinars || webinars.length === 0) {
    return null;
  }
  
  // Sort by date (most recent first) and get the newest
  const sortedWebinars = webinars.sort((a, b) => {
    const dateA = a.content?.date || a.published_at || a.created_at || '';
    const dateB = b.content?.date || b.published_at || b.created_at || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
  
  // Fetch the full story of the newest webinar
  const newestSlug = sortedWebinars[0].slug;
  const fullStory = await storyblokApi.get(`cdn/stories/events/thehub/${newestSlug}`, { 
    version: isDraftMode ? 'draft' : 'published' 
  });
  
  return fullStory.data.story;
}
