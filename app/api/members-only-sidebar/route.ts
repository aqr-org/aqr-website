import { NextResponse } from 'next/server';
import { getStoryblokApi } from '@/lib/storyblok';
import { draftMode } from 'next/headers';
import { NavigationLinkData } from '@/lib/types/navigation';
import { unstable_cache } from 'next/cache';

// Cache tag for revalidation
export const CACHE_TAG = 'members-only-sidebar';

// Route segment config - cache for 60 seconds, revalidate on demand via tag
export const revalidate = 60;

async function fetchSidebarData() {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  const storyblokApi = getStoryblokApi();
  
  const response = await storyblokApi.get('cdn/stories/site-settings/members-only-sidebar', {
    version: isDraftMode ? 'draft' : 'published',
    resolve_links: 'url'
  });

  if (!response.data?.story?.content?.nav_items) {
    return [];
  }

  // Helper function to recursively map navigation items
  const mapNavigationItem = (item: NavigationLinkData): NavigationLinkData => ({
    name: item.name,
    component: item.component || '',
    link: {
      cached_url: item.link?.cached_url || ''
    },
    icon: item.icon || '',
    dropdown_menu: item.dropdown_menu?.map((dropdownItem) => 
      mapNavigationItem(dropdownItem)
    ),
    dropdown_menu_2: item.dropdown_menu_2?.map((dropdownItem) => 
      mapNavigationItem(dropdownItem)
    ),
    dropdown_menu_3: item.dropdown_menu_3?.map((dropdownItem) => 
      mapNavigationItem(dropdownItem)
    )
  });

  return response.data.story.content.nav_items.map(mapNavigationItem);
}

// Cached fetch function with tag for revalidation
const getCachedSidebarData = unstable_cache(
  async () => {
    try {
      return await fetchSidebarData();
    } catch (error) {
      console.error('Error fetching members-only-sidebar from Storyblok:', error);
      return [];
    }
  },
  ['members-only-sidebar'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: [CACHE_TAG], // Tag for manual revalidation
  }
);

export async function GET() {
  try {
    const nav_items = await getCachedSidebarData();

    return NextResponse.json(
      { nav_items },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in members-only-sidebar API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sidebar data', nav_items: [] },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

