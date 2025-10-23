import { getStoryblokApi } from '@/lib/storyblok';
import { render } from 'storyblok-rich-text-react-renderer';
import type { Metadata, ResolvingMetadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata';
 
interface GlossaryPageProps {
  params: { slug: string };
}

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const theseParams = await params;
  const storyblok = await fetchStoryblokData(theseParams);
  const { meta_title, meta_description, og_image } = storyblok.data.story.content;
 
  return await generatePageMetadata(
    {
      meta_title,
      meta_description,
      og_image
    },
    parent
  );
}

export default async function GlossaryPage({ params }: GlossaryPageProps) {
  const theseParams = await params;
  const storyblok = await fetchStoryblokData(theseParams);
  const content = storyblok.data.story.content;

  return (
    <main className='max-w-[41rem]'>
      <h1 className='text-4xl font-[400] my-8'>
        {content.name}
      </h1>
      <div className='prose'>
        {render(content.description)}
      </div>
      {content.synonyms && content.synonyms.content.length > 0 &&
        <div className='prose'>
          <h2>Synonyms</h2>
          {render(content.synonyms)}
        </div>
      }
      
      {content.related && content.related.content.length > 0 &&
        <div className='prose'>
          <h2>Related</h2>
          {render(content.related)}
        </div>
      }
      {/* <pre>{JSON.stringify(storyblok.data, null, 2)}</pre> */}
    </main>
  );
}

export async function fetchStoryblokData(params: GlossaryPageProps['params']) {
  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/glossary/${params.slug}`, { version: 'draft' });
}