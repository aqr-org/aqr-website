import { storyblokEditable } from "@storyblok/react/rsc";
import AQR_QEX_Award_Logo from '@/components/svgs/AQR_QEX_Award_Logo';
import Homepage_awards_section_shortlis_item from './Homepage_awards_section_shortlis_item';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';

interface Homepage_awards_sectionProps {
  blok: {
    subtitle: string;
    title: string;
    intro: string;
    year: string;
    shortlist_title: string;
    shortlist: {
      name: string;
      company: string;
    }[];
    learn_more_text: string;
    learn_more_link: {
      cached_url: string;
    };
  };
}

export default function Homepage_awards_section({ blok }: Homepage_awards_sectionProps) {
  return (
    <div {...storyblokEditable(blok)} className="bg-[url('/bg_blurred_circles.svg')] bg-cover bg-center">
      <div className='max-w-maxw mx-auto px-container py-24 md:flex md:gap-4'>
        <h2 className='uppercase tracking-[0.03em] leading-[0.95] basis-36 shrink-0'>{blok.subtitle}</h2>
        <div className='md:pr-36'>
          <div>
            <p className='text-4xl md:text-[3.75rem] tracking-[-0.08rem] leading-[0.95]'>{blok.title}</p>
            <div className='flex flex-col md:flex-row gap-12 my-12'>
              <div>
                <p className='text-lg md:text-[1.375rem] leading-tight'>{blok.intro}</p>
              </div>
              <div className='space-y-4'>
                <div className='w-[84px]'>
                  <AQR_QEX_Award_Logo />
                </div>
                <p className='text-4xl leading-none tracking-[-0.01em]'>
                  Qualitative
                  <br />
                  Excellence
                  <br />
                  <span className='whitespace-nowrap'>Award <span className='text-qreen'>{blok.year}</span></span>
                </p>
              </div>
            </div>
          </div>

          <h3 className='text-lg md:text-[1.375rem] leading-tight my-12'>{blok.shortlist_title}</h3>
          <div className='space-y-9'>
            {blok.shortlist.map((shortlistItem: { name: string; company: string }, index: number) => (
              <Homepage_awards_section_shortlis_item key={index} shortlistItem={shortlistItem} index={index} />
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