import { MetadataRoute } from 'next';
import { getStoryblokApi } from '@/lib/storyblok';
import { unstable_cache } from 'next/cache';

const defaultUrl = process.env.SITE_URL
  ? process.env.SITE_URL
  : "https://localhost:3001";

// Routes that should be excluded from sitemap
const EXCLUDED_PATTERNS = [
  'api/',
  'auth/',
  'protected/',
  'error/',
  'debug-rls',
  'superadmin/',
  'site-settings/',
  'members-only-content', // Protected content
];

// Static routes that should always be included
const STATIC_ROUTES = [
  { url: '/', priority: 1.0, changeFrequency: 'daily' as const },
  { url: '/calendar', priority: 0.8, changeFrequency: 'weekly' as const },
  { url: '/dir', priority: 0.8, changeFrequency: 'weekly' as const },
  { url: '/dir/advanced', priority: 0.7, changeFrequency: 'weekly' as const },
  { url: '/events', priority: 0.8, changeFrequency: 'weekly' as const },
  { url: '/glossary', priority: 0.8, changeFrequency: 'weekly' as const },
  { url: '/resources', priority: 0.8, changeFrequency: 'weekly' as const },
  { url: '/resources/inspiration', priority: 0.7, changeFrequency: 'weekly' as const },
  { url: '/resources/inspiration/titles', priority: 0.6, changeFrequency: 'weekly' as const },
  { url: '/search', priority: 0.6, changeFrequency: 'monthly' as const },
];

// Helper function to check if a route should be excluded
function shouldExcludeRoute(slug: string): boolean {
  return EXCLUDED_PATTERNS.some(pattern => slug.startsWith(pattern));
}

// Fetch all Storyblok stories with pagination
const fetchAllStoryblokStories = unstable_cache(
  async () => {
    const storyblokApi = getStoryblokApi();
    const allStories: any[] = [];
    
    // Define folders to fetch from
    const folders = [
      '', // Root level pages (e.g., /about, /careers, etc.)
      'dir/',
      'events/',
      'events/thehub/',
      'glossary/',
      'resources/inspiration/',
    ];

    // Fetch stories from each folder
    for (const folder of folders) {
      let page = 1;
      const perPage = 100; // Storyblok max per_page
      
      while (true) {
        try {
          const params: any = {
            version: 'published',
            per_page: perPage,
            page: page,
            resolve_links: 'url',
          };

          if (folder) {
            params.starts_with = folder;
            // Exclude the folder itself (e.g., exclude 'events/' but include 'events/event-name')
            params.excluding_slugs = folder;
          }
          // For root level, fetch all stories and filter by exclusion patterns

          const response = await storyblokApi.get('cdn/stories', params);
          const stories = response.data?.stories || [];
          
          if (stories.length === 0) break;
          
          // Filter out excluded routes
          const filteredStories = stories.filter((story: any) => {
            const slug = story.full_slug || story.slug || '';
            return !shouldExcludeRoute(slug);
          });
          
          allStories.push(...filteredStories);
          
          // If we got fewer than perPage, we've reached the end
          if (stories.length < perPage) break;
          
          page++;
        } catch (error) {
          console.error(`Error fetching Storyblok stories from ${folder || 'root'}:`, error);
          break;
        }
      }
    }

    return allStories;
  },
  ['sitemap-stories'],
  {
    revalidate: 3600, // Cache for 1 hour during build
    tags: ['sitemap'],
  }
);

// Map Storyblok story to sitemap entry
function storyToSitemapEntry(story: any): MetadataRoute.Sitemap[0] | null {
  const fullSlug = story.full_slug || story.slug || '';
  
  // Skip excluded routes
  if (shouldExcludeRoute(fullSlug)) {
    return null;
  }

  // Determine priority and changeFrequency based on content type
  let priority = 0.6; // Default for content pages
  let changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'weekly';

  // Set priority based on content type
  if (story.content_type === 'event') {
    priority = 0.7;
    changeFrequency = 'weekly';
  } else if (fullSlug.startsWith('glossary/')) {
    priority = 0.6;
    changeFrequency = 'monthly';
  } else if (fullSlug.startsWith('resources/inspiration/')) {
    priority = 0.6;
    changeFrequency = 'monthly';
  } else if (fullSlug.startsWith('dir/')) {
    priority = 0.7;
    changeFrequency = 'monthly';
  } else {
    // For other pages, check depth
    const depth = fullSlug.split('/').filter(Boolean).length;
    if (depth === 1) {
      priority = 0.8;
      changeFrequency = 'weekly';
    } else if (depth === 2) {
      priority = 0.7;
      changeFrequency = 'weekly';
    } else {
      priority = 0.6;
      changeFrequency = 'monthly';
    }
  }

  // Get last modified date
  let lastModified: Date | undefined;
  if (story.published_at) {
    lastModified = new Date(story.published_at);
  } else if (story.updated_at) {
    lastModified = new Date(story.updated_at);
  } else if (story.created_at) {
    lastModified = new Date(story.created_at);
  }

  // Construct URL - ensure it starts with /
  const url = fullSlug.startsWith('/') ? fullSlug : `/${fullSlug}`;
  const fullUrl = `${defaultUrl}${url}`;

  return {
    url: fullUrl,
    lastModified,
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Add static routes
  for (const route of STATIC_ROUTES) {
    entries.push({
      url: `${defaultUrl}${route.url}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }

  // Fetch and add Storyblok stories
  try {
    const stories = await fetchAllStoryblokStories();
    
    // Remove duplicates based on full_slug
    const seenSlugs = new Set<string>();
    const uniqueStories = stories.filter(story => {
      const slug = story.full_slug || story.slug || '';
      if (seenSlugs.has(slug)) {
        return false;
      }
      seenSlugs.add(slug);
      return true;
    });

    // Convert stories to sitemap entries
    for (const story of uniqueStories) {
      const entry = storyToSitemapEntry(story);
      if (entry) {
        entries.push(entry);
      }
    }
  } catch (error) {
    console.error('Error generating sitemap from Storyblok:', error);
    // Continue with static routes even if Storyblok fetch fails
  }

  // Sort by URL for consistent output
  entries.sort((a, b) => a.url.localeCompare(b.url));

  return entries;
}
