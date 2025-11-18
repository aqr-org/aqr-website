import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { Metadata, ResolvingMetadata } from 'next'
import { draftMode } from 'next/headers';
import { generatePageMetadata } from '@/lib/metadata';
import { notFound, redirect } from 'next/navigation';
import { checkStoryblokPageAuth, isStoryblokEditor } from '@/lib/auth-utils';

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
  const resolvedParams = params instanceof Promise ? await params : params;
  let storyBlokStory;
  
  try {
    const storyblok = await fetchStoryblokData(resolvedParams.parent, resolvedParams.child);
    storyBlokStory = storyblok?.data.story;
    if (!storyBlokStory) {
      notFound();
    }
  } catch (error) {
    console.error("Error in SlugPage:", error);
    notFound();
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
    <div className='max-w-176 has-[aside]:max-w-full animate-fade-in'>
      {storyBlokStory && <StoryblokStory story={storyBlokStory} />}
    </div>
  );
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
        errorMessage = `Story not found: ${parent}/${child}`;
        // Log concise 404 message (expected when story doesn't exist)
        console.log(`Storyblok story not found: ${parent}/${child} (404)`);
      } else {
        // Log full details for other errors
        console.error('Storyblok API Error Details:');
        console.error('- HTTP Status:', statusCode);
        console.error('- Response Data:', responseData);
        console.error('- Requested path:', `${parent}/${child}`);
        
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