import { storyblokEditable } from "@storyblok/react/rsc";
import { render } from "storyblok-rich-text-react-renderer";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import Picture from "@/components/Picture";

interface EventProps {
  blok: {
    title: string;
    description: string;
    content: string;
    date: string;
    admission: string;
    admission_link: {
      cached_url: string;
    }
    image: {
      filename: string;
      alt: string;
    }
    organised_by: string;
  }
}

export default function Glossary_Entry({ blok }: EventProps) {

  
  return (
    <div {...storyblokEditable(blok)} className="md:flex gap-8">
      <div className="max-w-[41rem] md:basis-3/4 shrink-1 prose">
        <h1 className='h3size'>
          {blok.title}
        </h1>
        <h2 className="h4size text-qreen-dark">
          {blok.description}
        </h2>
        <div className='prose'>
          {render(blok.content)}
        </div>
      </div>
      <div className="md:basis-1/4 grow-1 mt-8 prose">
      {/* {JSON.stringify(blok.image)} */}
        {blok.image && blok.image.filename &&
          <Picture
            src={blok.image.filename}
            alt={blok.image.alt}
            sizes="(max-width: 768px) 90vw, 20vw"
            aspectRatioDesktop="1.77778"
            aspectRatioMobile="1.77778"
            className="w-full h-auto aspect-[1.77778]"
          />
        }
        <p>{blok.title}</p>
        {blok.admission && (
          <p>Admission: {blok.admission}</p>
        )}
        {blok.organised_by && (
          <p>Organised by: {blok.organised_by}</p>
        )}
        {blok.admission_link && (
          <Link href={blok.admission_link.cached_url}>
            <Button variant="default">
              Sign up
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}