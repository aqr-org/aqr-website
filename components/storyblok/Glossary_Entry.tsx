import { storyblokEditable } from "@storyblok/react/rsc";
import { render } from "storyblok-rich-text-react-renderer";

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
  return (
    <div {...storyblokEditable(blok)}>
      {/* {JSON.stringify(blok, null, 2)} */}
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
    </div>
  )
}