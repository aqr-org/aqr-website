import { storyblokEditable } from "@storyblok/react/rsc";
import { render } from "storyblok-rich-text-react-renderer";
import { getPhoneticSpelling } from '@/lib/phonetic';

interface Glossary_EntryProps {
  blok: {
    name: string;
    description: string;
    synonyms: {
      content: string;
    };
    related: {
      content: string;
    };
  }
}

export default function Glossary_Entry({ blok }: Glossary_EntryProps) {
  const content = blok;
  const phoneticSpelling = getPhoneticSpelling(content.name);
  return (
    <div {...storyblokEditable(blok)}>
      <h1 className='text-4xl md:text-6xl tracking-[-0.07125rem] mb-8'>
        {content.name}
        <span className='text-xl text-qreen-dark block mt-2 tracking-normal'>
          {phoneticSpelling}
        </span>
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
    </div>
  )
}