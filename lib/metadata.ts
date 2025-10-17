import { getStoryblokApi } from '@/lib/storyblok';
import { draftMode } from 'next/headers';
import { Metadata } from 'next';

// Hardcoded fallbacks (last resort)
const HARDCODED_DEFAULTS = {
  title: "AQR: Association for Qualitative Research",
  description: "The UK's principal authority on qualitative research, the hub of qualitative excellence",
  ogImage: "/og-image-base.jpg"
};

// Cache for Storyblok defaults to avoid repeated API calls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedDefaults: any = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getStoryblokDefaults() {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (cachedDefaults && (now - lastFetch) < CACHE_DURATION) {
    return cachedDefaults;
  }

  try {
    const { isEnabled } = await draftMode();
    const isDraftMode = isEnabled;
    const storyblokApi = getStoryblokApi();
    
    const response = await storyblokApi.get('cdn/stories/site-settings/seo-base', { 
      version: isDraftMode ? 'draft' : 'published' 
    });
    
    const { meta_title, meta_description, og_image } = response.data.story.content;
    
    const defaults = {
      title: meta_title || HARDCODED_DEFAULTS.title,
      description: meta_description || HARDCODED_DEFAULTS.description,
      ogImage: og_image?.filename || HARDCODED_DEFAULTS.ogImage,
    };
    
    // Cache the result
    cachedDefaults = defaults;
    lastFetch = now;
    
    return defaults;
  } catch (error) {
    console.error('Error fetching Storyblok defaults:', error);
    return HARDCODED_DEFAULTS;
  }
}

export async function generatePageMetadata(
  pageData: {
    meta_title?: string;
    meta_description?: string;
    og_image?: { filename: string };
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentMetadata: any
): Promise<Metadata> {
  // Get Storyblok defaults
  const storyblokDefaults = await getStoryblokDefaults();
  
  // Three-tier fallback system
  const title = pageData.meta_title || storyblokDefaults.title || HARDCODED_DEFAULTS.title;
  const description = pageData.meta_description || storyblokDefaults.description || HARDCODED_DEFAULTS.description;
  const ogImage = pageData.og_image?.filename || storyblokDefaults.ogImage || HARDCODED_DEFAULTS.ogImage;
  
  // Combine with parent images
  const previousImages = parentMetadata.openGraph?.images || [];
  const allImages = ogImage ? [ogImage, ...previousImages] : [...previousImages];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: allImages,
    },
  };
}