import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import Background from '@/components/Background';

export default async function Home() {
  
  const storyblok = await fetchStoryblokData();
  const storyBlokStory = storyblok.data.story;
  
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Background color="#FF0000" />
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <StoryblokStory story={storyBlokStory} />
        </div>
      </div>
    </main>
  );
}

export async function fetchStoryblokData() {
  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/about`, { version: 'draft' });
}