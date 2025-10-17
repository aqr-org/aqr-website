import { storyblokEditable } from '@storyblok/react/rsc';
import { render } from 'storyblok-rich-text-react-renderer';

interface RichTextProps {
  blok: {
    content: string;
  }
}

export default function RichText({ blok }: RichTextProps) {
  return (
    <div {...storyblokEditable(blok)} className="rich-text prose">
      {render(blok.content)}
    </div>
  )
}