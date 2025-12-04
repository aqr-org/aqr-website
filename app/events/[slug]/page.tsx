import { getStoryblokApi } from '@/lib/storyblok';
import type { Metadata, ResolvingMetadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata';
import { storyblokEditable } from '@storyblok/react/rsc';
import { StoryblokStory } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

interface EventProps {
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

export default async function GlossaryPage({ params }: EventProps) {
  try {
    const { isEnabled } = await draftMode();
    const isDraftMode = isEnabled;
    const storyblok = await fetchStoryblokData(params);
    const content = storyblok.data.story;

    return (
      <main {...storyblokEditable(content)}> 
        <StoryblokStory story={content} />
      </main>
    );
  } catch (error: any) {
    // Check if it's a 404 error
    const statusCode = error?.response?.status;
    if (statusCode === 404) {
      notFound();
    }
    // Re-throw other errors
    throw error;
  }
}

async function fetchStoryblokData(params: EventProps['params']) {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  const resolvedParams = await params;
  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/events/${resolvedParams.slug}`, { version: isDraftMode ? 'draft' : 'published' });
}
