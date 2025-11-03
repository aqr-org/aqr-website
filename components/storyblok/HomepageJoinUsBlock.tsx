import { storyblokEditable } from '@storyblok/react/rsc';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import React from 'react';

interface HomepageJoinUsBlockProps {
  blok: {
    mini_title: string;
    headline: string;
    link_text: string;
    link: {
      cached_url: string;
    };
  };
}

export default function HomepageJoinUsBlock({ blok }: HomepageJoinUsBlockProps) {
  return (
    <div {...storyblokEditable(blok)} className='relative overflow-hidden w-full min-h-[320px] flex flex-col justify-center mb-24'>
      <div className='absolute left-1/2 -translate-x-1/2 -top-36'>
        <RectanglesAligned />
      </div>
      <div className='relative z-10 w-full max-w-maxw mx-auto px-container pt-32 pb-12 md:flex gap-12'>
        <h2 className='uppercase tracking-[0.03em] basis-1/6'>Join Us</h2>
        <div>
          <p className='text-4xl md:text-6xl tracking-[-3%] leading-[0.95]'>
            {blok.headline}
          </p>
          <Link href={blok.link.cached_url} className='inline-flex items-center gap-2 font-medium pt-12 pb-4 text-lg'>
            {blok.link_text} <ArrowUpRight className='w-6 h-6 inline-block' />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Memoized Rectangle component to prevent unnecessary re-renders
const Rectangle = React.memo(({ delay }: { delay: string }) => {
  const gradientStyle = {
    background: 'linear-gradient(to top, #F5F5F5 0%, #EAA0B1 100%)',
    width: '56px',
    height: '315px',
  };

  const baseDelay = parseFloat(delay);
  const getAnimationStyle = (offset: number) => ({
    animation: 'shrinkGrow 10s cubic-bezier(0.4, 0, 0.2, 1) infinite forwards',
    animationDelay: `${baseDelay + offset}s`,
  });

  return (
    <div style={{ width: '56px', height: '648px', position: 'relative', transformOrigin: '50% 50%', transform: 'rotate(45deg)' }}>
      <div style={{ ...gradientStyle, ...getAnimationStyle(0), position: 'absolute', top: '157.5px', left: '0' }} />
      <div style={{ ...gradientStyle, ...getAnimationStyle(0.2), position: 'absolute', top: '268.285px', left: '0' }} />
      <div style={{ ...gradientStyle, ...getAnimationStyle(0.4), position: 'absolute', top: '379.069px', left: '0' }} />
      <div style={{ ...gradientStyle, ...getAnimationStyle(0.6), position: 'absolute', top: '489.854px', left: '0' }} />
    </div>
  );
});

Rectangle.displayName = 'Rectangle';

function RectanglesAligned() {
  return (
    <div className='flex gap-5'>
      <Rectangle delay='0' />
      <Rectangle delay='0.5' />
      <Rectangle delay='1' />
      <Rectangle delay='1.5' />
      <Rectangle delay='2' />
      <Rectangle delay='2.5' />
      <Rectangle delay='3' />
      <Rectangle delay='3.5' />
      <Rectangle delay='4' />
      <Rectangle delay='4.5' />
      <Rectangle delay='5' />
      <Rectangle delay='5.5' />
      <Rectangle delay='6' />
      <Rectangle delay='6.5' />
      <Rectangle delay='7' />
      <Rectangle delay='7.5' />
      <Rectangle delay='8' />
      <Rectangle delay='8.5' />
      <Rectangle delay='9' />
      <Rectangle delay='9.5' />
      <Rectangle delay='10' />
      <Rectangle delay='10.5' />
      <Rectangle delay='11' />
      <Rectangle delay='11.5' />
      <Rectangle delay='12' />
      <Rectangle delay='12.5' />
      <Rectangle delay='13' />
      <Rectangle delay='13.5' />
      <Rectangle delay='14' />
      <Rectangle delay='14.5' />
    </div>
  );
}