import { storyblokEditable, StoryblokServerComponent } from "@storyblok/react/rsc";
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import Picture from '@/components/Picture';

interface Homepage_awards_sectionProps {
  blok: {
    subtitle: string;
    title: string;
    intro: string;
    award_logo: {
      filename: string;
      alt: string;
    };
    shortlist_title: string;
    shortlist: any[]; // Array of homepage_awards_section_shortlist_item2 bloks
    learn_more_text: string;
    learn_more_link: {
      cached_url: string;
    };
  };
}

function Homepage_awards_section({ blok }: Homepage_awards_sectionProps) {
  return (
    <div {...storyblokEditable(blok)} className="bg-[url('/bg_blurred_circles.svg')] bg-cover bg-center">
      <div className='max-w-maxw mx-auto px-container py-24 lg:flex lg:gap-4'>
        <h2 className='uppercase tracking-[0.03em] leading-[0.95] basis-36 shrink-0 mb-4'>{blok.subtitle}</h2>
        <div className='lg:pr-36'>
          <div>
            <p className='text-4xl md:text-[3.75rem] tracking-[-0.08rem] leading-[0.95]'>{blok.title}</p>
            <div className='flex flex-col md:flex-row gap-12 my-12'>
              <div>
                <p className='text-lg md:text-[1.375rem] leading-tight'>{blok.intro}</p>
              </div>
              <div className='space-y-4'>
                <div className='w-44 basis-44 shrink-0 grow-0'>
                  <Picture
                    src={blok.award_logo.filename}
                    alt={blok.award_logo.alt || 'Award Logo'}
                    aspectRatioDesktop="1"
                    aspectRatioMobile="1"
                    sizes="(max-width: 768px) 75vw, 176px"
                    className="w-full h-auto"
                    noCrop={true}
                  />
                </div>
              </div>
            </div>
          </div>

          <h3 className='text-lg md:text-[1.375rem] leading-tight my-12'>{blok.shortlist_title}</h3>
          <div className='space-y-12'>
            {blok.shortlist.map((shortlistItem: any) => (
              <div key={shortlistItem._uid}>
                <StoryblokServerComponent blok={shortlistItem} />
                <hr className="my-12!" />
              </div>
            ))}
          </div>
          <Link href={blok.learn_more_link.cached_url} className='inline-flex items-center gap-2 font-medium mt-12 pb-4 text-lg pl-[calc(48px+4*var(--spacing))]'>
            {blok.learn_more_text} <ArrowUpRight className='w-6 h-6 inline-block' />
          </Link>

        </div>
      </div>
    </div>
  );
}

// Server components don't need React.memo - they only render on the server
export default Homepage_awards_section;