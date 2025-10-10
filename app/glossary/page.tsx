import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import Background from '@/components/Background';

export default async function Home() {
  
  const storyblok = await fetchStoryblokData();
  const storyBlokStory = storyblok.data.story;
  
  return (
    <main>
      <Background 
        css={`
          #bg_svg_circle_1 { transform: translate(0%, 0%); }
        `} 
      />
      <StoryblokStory story={storyBlokStory} />
    </main>
  );
}

export async function fetchStoryblokData() {
  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/glossary`, { version: 'draft' });
}