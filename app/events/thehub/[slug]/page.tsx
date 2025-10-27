import { getStoryblokApi } from '@/lib/storyblok';
import type { Metadata, ResolvingMetadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata';
import { storyblokEditable } from '@storyblok/react/rsc';
import { StoryblokStory } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';

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
}

export default async function GlossaryPage({ params }: WebinarPageProps) {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  const storyblok = await fetchStoryblokData(params);
  const content = storyblok.data.story;

  return (
    <main {...storyblokEditable(content)}> 
      <StoryblokStory story={content} />
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
