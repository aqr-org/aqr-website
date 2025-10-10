import { getStoryblokApi } from '@/lib/storyblok';
import { render } from 'storyblok-rich-text-react-renderer';


interface GlossaryPageProps {
  params: { slug: string };
}

export default async function GlossaryPage({ params }: GlossaryPageProps) {
  
  const storyblok = await fetchStoryblokData(params);
  const content = storyblok.data.story.content;

  return (
    <main>
      <h1>{content.name}</h1>
      <div className='bg-qreen/20'>{render(content.description)}</div>

      <div className='bg-qrose/20' dangerouslySetInnerHTML={{ __html: content.description }}></div>
      <pre>{JSON.stringify(content.description, null, 2)}</pre>


    </main>
  );
}

export async function fetchStoryblokData(params: GlossaryPageProps['params']) {
  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/glossary/${params.slug}`, { version: 'draft' });
}