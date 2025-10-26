import { getStoryblokApi } from '@/lib/storyblok';
import type { Metadata, ResolvingMetadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata';
import { storyblokEditable } from '@storyblok/react/rsc';
import { StoryblokStory } from '@storyblok/react/rsc';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
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

export default async function GlossaryPage({ params }: GlossaryPageProps) {
  const storyblok = await fetchStoryblokData(params);
  const content = storyblok.data.story;

  return (
    <main className='max-w-[41rem]' {...storyblokEditable(content)}> 
      <StoryblokStory story={content} />
    </main>
  );
}

async function fetchStoryblokData(params: GlossaryPageProps['params']) {
  const resolvedParams = await params;
  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/glossary/${resolvedParams.slug}`, { version: 'draft' });
}
