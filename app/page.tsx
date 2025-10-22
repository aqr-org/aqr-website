import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import Background from '@/components/Background';
import { draftMode } from 'next/headers';

export default async function Home() {
  
  const storyblok = await fetchStoryblokData();
  const storyBlokStory = storyblok.data.story;
  
  return (
    <main className="flex-1 w-full max-w-maxw mx-auto px-container flex flex-col gap-20 min-h-screen">
      <Background 
        css={`
          #bg_svg_circle_1 { transform: translate(0%, 0%); }
        `} 
      />
      
      {storyBlokStory && storyBlokStory.content.body && storyBlokStory.content.body.length > 0 &&
        <StoryblokStory story={storyBlokStory} />
      }
    </main>
  );
}

export async function fetchStoryblokData() {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
	const storyblokApi = getStoryblokApi();
	return await storyblokApi.get(`cdn/stories/home`, { version: isDraftMode ? 'draft' : 'published' });
}