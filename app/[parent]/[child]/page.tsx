import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { Metadata, ResolvingMetadata } from 'next'
import { draftMode } from 'next/headers';
import { generatePageMetadata } from '@/lib/metadata';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ parent: string; child: string }> | { parent: string; child: string };
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata | (() => Promise<Metadata>)
): Promise<Metadata> {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const parentMetaPromise = typeof parent === 'function' ? parent() : parent;
    const [storyblokResult, parentMetadata] = await Promise.allSettled([
      fetchStoryblokData(resolvedParams.parent, resolvedParams.child),
      parentMetaPromise
    ]);
    // Handle storyblok result
    let pageData = {};
    if (storyblokResult.status === 'fulfilled') {
      pageData = storyblokResult.value?.data.story.content;
    } else {
      console.error('Failed to fetch storyblok data:', storyblokResult.reason);
    }

    // Handle parent metadata
    let parentMeta = {};
    if (parentMetadata.status === 'fulfilled') {
      parentMeta = parentMetadata.value;
    } else {
      console.error('Failed to fetch parent metadata:', parentMetadata.reason);
    }

    return await generatePageMetadata(pageData, parentMeta);
  } catch (error) {
    console.error("Error in generateMetadata:", error);
    // Fallback: try to get parent metadata
    try {
      const parentMeta = typeof parent === 'function' ? await parent() : parent;
      return await generatePageMetadata({}, parentMeta);
    } catch (parentError) {
      console.error("Failed to get parent metadata:", parentError);
      return await generatePageMetadata({}, {});
    }
  }
}

export default async function SlugPage({ params }: PageProps) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const storyblok = await fetchStoryblokData(resolvedParams.parent, resolvedParams.child);
    const storyBlokStory = storyblok?.data.story;
    if (!storyBlokStory) {
      notFound();
    }
    return (
      <div className='max-w-164 has-[aside]:max-w-full animate-fade-in'>
        <StoryblokStory story={storyBlokStory} />
      </div>
    );
  } catch (error) {
    console.error("Error in SlugPage:", error);
    notFound();
  }
}

async function fetchStoryblokData(parent: string, child: string) {
  try {
    const { isEnabled } = await draftMode();
    const isDraftMode = isEnabled;
    const storyblokApi = getStoryblokApi();
    const response = await storyblokApi.get(
      `cdn/stories/${parent}/${child}`,
      {
        version: isDraftMode ? 'draft' : 'published',
        resolve_links: 'url',
      }
    );
    return response;
  } catch (error) {
    // Log error details for debugging
    console.error('Storyblok API Error Details:');
    console.error('- Error type:', typeof error);
    console.error('- Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('- Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('- Params being requested:', parent, child);
    // Re-throw to be caught by the main component's try-catch
    throw error;
  }
}