import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { Metadata, ResolvingMetadata } from 'next'
import Background from '@/components/Background';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation'
import { generatePageMetadata } from '@/lib/metadata';

interface PageProps {
  params: Promise<{ parent: string }> | { parent: string };
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata | (() => Promise<Metadata>)
): Promise<Metadata> {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const parentMetaPromise = typeof parent === 'function' ? parent() : parent;
    const [storyblokResult, parentMetadata] = await Promise.allSettled([
      fetchStoryblokData(resolvedParams),
      parentMetaPromise
    ]);
    // Handle storyblok result
    let pageData = {};
    if (storyblokResult.status === 'fulfilled') {
      pageData = storyblokResult.value.data.story.content;
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
    const storyblok = await fetchStoryblokData(resolvedParams);
    const storyBlokStory = storyblok.data.story;

    return (
      <>
        <Background />
        {storyBlokStory && <StoryblokStory story={storyBlokStory} />}
      </>
    );
  } catch (error) {
    console.error("Error in SlugPage:", error);
    notFound();
  }
}

async function fetchStoryblokData(params: { parent: string }) {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  const storyblokApi = getStoryblokApi();

  const storyPath = `cdn/stories/${params.parent}`;
  const version = isDraftMode ? 'draft' : 'published';

  try {
    const response = await storyblokApi.get(storyPath, {
      version: version,
      resolve_links: 'url'
    });
    return response;
  } catch (error: any) {
    // Try to extract meaningful error information
    let errorMessage = 'Unknown error';
    let statusCode: number | undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Check for HTTP response errors
    if (error?.response) {
      statusCode = error.response?.status;
      const responseData = error.response?.data;
      
      if (statusCode === 404) {
        errorMessage = `Story not found: ${params.parent}`;
        // Log concise 404 message (expected when story doesn't exist)
        console.log(`Storyblok story not found: ${params.parent} (404)`);
      } else {
        // Log full details for other errors
        console.error('Storyblok API Error Details:');
        console.error('- HTTP Status:', statusCode);
        console.error('- Response Data:', responseData);
        console.error('- Requested slug:', params.parent);
        
        if (statusCode === 401) {
          errorMessage = 'Unauthorized - Check Storyblok API token';
        } else if (statusCode === 403) {
          errorMessage = 'Forbidden - Check Storyblok permissions';
        }
      }
    } else {
      // Non-HTTP errors - log full details
      console.error('Storyblok API Error:', error);
    }
    
    // If it's a 404, throw a more specific error
    if (statusCode === 404) {
      throw new Error(errorMessage);
    }
    
    // Re-throw original error to preserve stack trace
    throw error;
  }
}