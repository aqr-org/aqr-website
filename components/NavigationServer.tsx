import { getStoryblokApi } from '@/lib/storyblok';
import NavigationClient from '@/components/NavigationClient';
import { NavigationLinkData } from '@/lib/types/navigation';


export default async function NavigationServer() {
  const navigationData = {
    links: [
      { name: 'About', link: { cached_url: '/about' } },
      { name: 'Companies', link: { cached_url: '/companies' } },
      { name: 'Members', link: { cached_url: '/members' } }
    ] as NavigationLinkData[]
  };

  try {
    const storyblokApi = getStoryblokApi();
    const response = await storyblokApi.get('cdn/stories', { 
      version: 'draft',
      starts_with: 'site-settings/main-navigation'
    });
    
    if (response.data?.stories[0]?.content?.nav_items) {
      navigationData.links = response.data.stories[0].content.nav_items.map(
        (item: NavigationLinkData) => ({
          name: item.name,
          link: {
            cached_url: item.link?.cached_url || ''
          },
          dropdown_menu: item.dropdown_menu?.map((dropdownItem) => ({
            name: dropdownItem.name,
            link: {
              cached_url: dropdownItem.link?.cached_url || ''
            }
          }))
        } as NavigationLinkData)
      );
    }
    

  } catch (error) {
    console.error('Error fetching navigation data from Storyblok:', error);
    // Fallback to default links if Storyblok fetch fails
  }

  return <NavigationClient links={navigationData.links} />;
}
