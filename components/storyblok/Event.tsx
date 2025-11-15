import { storyblokEditable } from "@storyblok/react/rsc";
import { render } from "storyblok-rich-text-react-renderer";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import Picture from "@/components/Picture";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Calendar, Clock } from "lucide-react";

interface EventProps {
  blok: {
    title: string;
    description: string;
    content: string;
    date: string;
    hide_time: boolean;
    admission: string;
    admission_link: {
      cached_url: string;
    };
    venue: string;
    venue_link: {
      cached_url: string;
    };
    image: {
      filename: string;
      alt: string;
    };
    organised_by: string;
  }
}

export default function Event({ blok }: EventProps) {

  const dateFromDateString = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  const timeFromDateString = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  
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
            {blok.date && 
              <div className="space-y-2">
                <p className="flex items-center gap-1 leading-none">
                  <Calendar className="w-4 h-4 inline-block" />{dateFromDateString(blok.date)}
                </p>
                {!blok.hide_time && (
                  <p className="flex items-center gap-1 leading-none">
                    <Clock className="w-4 h-4 inline-block" />{timeFromDateString(blok.date)}h
                  </p>
                )}
              </div>
            }
            <div className="space-y-2 font-semibold">
              {blok.admission && (
                <p>
                  <span className="text-sm block font-normal">Admission:</span> 
                  {blok.admission}
                </p>
              )}
              {blok.venue && (
                <div className="space-y-0">
                  <p>
                    <span className="text-sm block font-normal">Venue:</span>
                    {blok.venue}
                  </p>
                  {blok.venue_link && blok.venue_link.cached_url && blok.venue_link.cached_url !== "" && (
                    <p>
                      <Link href={blok.venue_link.cached_url} className="inline-flex items-center gap-1 no-underline! font-semibold">
                        <ArrowUpRight className="w-4 h-4 inline-block" /> View venue
                      </Link>
                    </p>
                  )}
                </div>
              )}
              {blok.organised_by && (
                <p>
                  <span className="text-sm block font-normal">Organised by:</span> 
                  {blok.organised_by}
                </p>
              )}
            </div>
            {blok.admission_link && (
              <Link href={blok.admission_link.cached_url}>
                <Button variant="qaupe" className="w-full">
                  Sign up
                </Button>
              </Link>
            )}
        </div>
      </aside>
    </div>
  )
}