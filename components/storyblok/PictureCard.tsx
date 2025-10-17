import Picture from "@/components/Picture";
import Link from "next/link";
import { storyblokEditable } from '@storyblok/react/rsc';

interface Props {
  blok: {
    headline: string;
    tag: string;
    image: {
      filename: string;
      alt: string;
    };
    linktext: string;
    link: {
      cached_url: string;
    }
  }
}

export default function PictureCard({blok}: Props){

    const {headline, tag, image, linktext, link} = blok;

    return(
      <div {...storyblokEditable(blok)} className="bg-qellow p-8 aspect-[0.75] max-w-[420px] rounded-xl overflow-hidden relative">
        {/* <pre>
          {JSON.stringify(image, null, 2)}
        </pre> */}
        {image?.filename && (
          <Picture 
            src={image?.filename || ''} 
            alt={image?.alt || ''} 
            sizes="(max-width: 768px) 90vw, 420px"
            width={420} 
            height={560} 
            aspectRatioDesktop="0.75"
            aspectRatioMobile="0.75"
            className="aspect-[0.75] object-cover absolute inset-0 w-full h-full z-0"
          />
        )}
        <div className="relative z-10">
          <h2>{headline || 'Enter headline'}</h2>
          {tag && (
            <p>{tag}</p>
          )}
          {linktext && (
            <p>{linktext}</p>
          )}
          {link?.cached_url && (
            <Link href={link?.cached_url || ''}>{linktext}</Link>
          )}
        </div>
      </div>
    )
  }