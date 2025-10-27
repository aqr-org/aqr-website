import { getStoryblokApi } from '@/lib/storyblok';
import NavigationClient from '@/components/NavigationClient';
import { NavigationLinkData } from '@/lib/types/navigation';
import { cache } from 'react';

const getNavigationData = cache(async () => {
  const navigationData = {
    links: [] as NavigationLinkData[]
  };

  try {
    const storyblokApi = getStoryblokApi();
    const response = await storyblokApi.get('cdn/stories', { 
      version: 'draft',
      starts_with: 'site-settings/main-navigation'
    });
    
    if (response.data?.stories[0]?.content?.nav_items) {
  
      // Helper function to recursively map navigation items
      const mapNavigationItem = (item: NavigationLinkData): NavigationLinkData => ({
        name: item.name,
        link: {
          cached_url: item.link?.cached_url || ''
        },
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

      navigationData.links = response.data.stories[0].content.nav_items.map(mapNavigationItem);
    }
    

  } catch (error: any) {
    // Silently handle prerendering errors to avoid build failures
    if (error?.message?.includes('prerender') || error?.digest === 'HANGING_PROMISE_REJECTION') {
      // Return empty navigation during prerendering
      return navigationData;
    }
    console.error('Error fetching navigation data from Storyblok:', error);
    // Fallback to default links if Storyblok fetch fails
  }

  return navigationData;
});

export default async function NavigationServer() {
  const navigationData = await getNavigationData();
  return <NavigationClient links={navigationData.links} />;
}
