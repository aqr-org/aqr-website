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
          #bg_svg_circle_1 { transform: translate(-50%, 0%); }
          #bg_svg_circle_2 { transform: translate(10%, 50%); }
          #bg_svg_circle_3 { transform: translate(30%, -50%); filter: blur(100px); }
        `} 
      />
      <StoryblokStory story={storyBlokStory} />
    </main>
  );
}

export async function fetchStoryblokData() {
  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/about`, { version: 'draft' });
}