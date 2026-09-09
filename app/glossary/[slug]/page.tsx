import { getStoryblokApi } from '@/lib/storyblok';
import type { Metadata, ResolvingMetadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata';
import { storyblokEditable } from '@storyblok/react/rsc';
import { StoryblokStory } from '@storyblok/react/rsc';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { draftMode } from 'next/headers';
import { unstable_cache } from 'next/cache';
interface GlossaryPageProps {
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
    const resolvedParams = await params;
    const { isEnabled } = await draftMode();
    const storyblok = await fetchStoryblokData(resolvedParams.slug, isEnabled);
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

export default async function GlossaryPage({ params }: GlossaryPageProps) {
  try {
    const resolvedParams = await params;
    const { isEnabled } = await draftMode();
    const storyblok = await fetchStoryblokData(resolvedParams.slug, isEnabled);
    const content = storyblok.data.story;

    return (
      <main className='max-w-164 animate-fade-in' {...storyblokEditable(content)}> 
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

// Cached across requests, revalidated on publish via the Storyblok webhook (app/api/revalidate/route.ts)
const fetchStoryblokData = unstable_cache(async (slug: string, isDraftMode: boolean) => {
  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/glossary/${slug}`, { version: isDraftMode ? 'draft' : 'published' });
}, ['glossary-story'], { revalidate: 300, tags: ['glossary'] });
