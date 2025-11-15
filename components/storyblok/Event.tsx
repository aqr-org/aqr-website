import { storyblokEditable } from "@storyblok/react/rsc";
import { render } from "storyblok-rich-text-react-renderer";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import Picture from "@/components/Picture";
import { cn } from "@/lib/utils";

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

export default function Event({ blok }: EventProps) {

  
  return (
    <div {...storyblokEditable(blok)} className="lg:flex gap-8">
      <main className="max-w-164 md:basis-8/12 shrink">
        <div className="prose">
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
      </main>
      <aside className='sidebar_right p-6 mt-12 pt-12 lg:mt-0 lg:basis-4/12 lg:grow lg:max-w-[24rem] lg:self-start'> 
        <div className="prose">
          {/* {JSON.stringify(blok.image)} */}
            {blok.image && blok.image.filename &&
              <Picture
                src={blok.image.filename}
                alt={blok.image.alt}
                sizes="(max-width: 768px) 90vw, 20vw"
                aspectRatioDesktop="1.77778"
                aspectRatioMobile="1.77778"
                className="w-full h-auto aspect-[1.77778] block"
              />
            }
            <h5>{blok.title}</h5>
            {blok.admission && (
              <p>Admission: {blok.admission}</p>
            )}
            {blok.organised_by && (
              <p>Organised by: {blok.organised_by}</p>
            )}
            {blok.admission_link && (
              <Link href={blok.admission_link.cached_url}>
                <Button variant="qaupe">
                  Sign up
                </Button>
              </Link>
            )}
        </div>
      </aside>
    </div>
  )
}