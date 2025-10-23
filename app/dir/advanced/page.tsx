import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';
import { Metadata, ResolvingMetadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata';

export async function generateMetadata( parent: ResolvingMetadata): Promise<Metadata> {
  try {
    // Run in parallel with individual error handling
    const [storyblokResult, parentMetadata] = await Promise.allSettled([
      fetchStoryblokData(),
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

export default async function SlugPage() {
  const storyblok = await fetchStoryblokData();
  const storyBlokStory = storyblok?.data.story;

  return (
    <article className='max-w-[41rem] animate-fade-in'>
      <StoryblokStory story={storyBlokStory} />
    </article>
  );
}

export async function fetchStoryblokData() {
  try {
    const { isEnabled } = await draftMode();
    const isDraftMode = isEnabled;
    const storyblokApi = getStoryblokApi();
    
    const response = await storyblokApi.get(`cdn/stories/dir/advanced`, { 
      version: isDraftMode ? 'draft' : 'published' 
    });
    
    return response;
  } 
  catch (error) {
    console.error('Storyblok API Error Details:');
    console.error('- Error type:', typeof error);
    console.error('- Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('- Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('- Full error object:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to fetch story: dir/advanced`);
  }
}