import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { Metadata, ResolvingMetadata } from 'next'
import { draftMode } from 'next/headers';
import { generatePageMetadata } from '@/lib/metadata';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const theseParams = await params;
    
    // Run in parallel with individual error handling
    const [storyblokResult, parentMetadata] = await Promise.allSettled([
      fetchStoryblokData(theseParams),
      parent
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
      const parentMetadata = await parent;
      return await generatePageMetadata({}, parentMetadata);
    } catch (parentError) {
      console.error("Failed to get parent metadata:", parentError);
      return await generatePageMetadata({}, {});
    }
  }
}

export default async function SlugPage({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const storyblok = await fetchStoryblokData(resolvedParams);
    const storyBlokStory = storyblok?.data.story;

    if (!storyBlokStory) {
      notFound();
    }

    return (
      <article className='max-w-164 animate-fade-in'>
        <StoryblokStory story={storyBlokStory} />
      </article>
    );
  } catch (error) {
    console.error("Error in SlugPage:", error);
    notFound();
  }
}

async function fetchStoryblokData(params: { slug: string }) {
  try {
    const { isEnabled } = await draftMode();
    const isDraftMode = isEnabled;
    const storyblokApi = getStoryblokApi();
    
    const response = await storyblokApi.get(`cdn/stories/contacts/${params.slug}`, { 
      version: isDraftMode ? 'draft' : 'published' 
    });
    
    return response;
  } 
  catch (error) {
    // Log error details for debugging
    console.error('Storyblok API Error Details:');
    console.error('- Error type:', typeof error);
    console.error('- Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('- Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('- Slug being requested:', params.slug);
    
    // Re-throw to be caught by the main component's try-catch
    throw error;
  }
}