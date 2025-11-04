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
      <div className='relative z-10 w-full max-w-maxw mx-auto px-container pt-32 pb-12 md:flex gap-4'>
        <h2 className='uppercase tracking-[0.03em] basis-36 shrink-0'>Join Us</h2>
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

// Static styles that don't change - moved outside component
const GRADIENT_STYLE: React.CSSProperties = {
  background: 'linear-gradient(to top, #F5F5F5 0%, #EAA0B1 100%)',
  width: '56px',
  height: '315px',
};

const CONTAINER_STYLE: React.CSSProperties = {
  width: '56px',
  height: '648px',
  position: 'relative',
  transformOrigin: '50% 50%',
  transform: 'rotate(45deg)',
};

// Memoized Rectangle component to prevent unnecessary re-renders
const Rectangle = React.memo(({ delay }: { delay: number }) => {
  // Memoize animation styles to avoid recreating objects on every render
  const animationStyles = React.useMemo(() => {
    const baseDelay = delay;
    return [
      {
        ...GRADIENT_STYLE,
        animation: 'shrinkGrow 10s cubic-bezier(0.4, 0, 0.2, 1) infinite forwards',
        animationDelay: `${baseDelay}s`,
        position: 'absolute' as const,
        top: '157.5px',
        left: '0',
      },
      {
        ...GRADIENT_STYLE,
        animation: 'shrinkGrow 10s cubic-bezier(0.4, 0, 0.2, 1) infinite forwards',
        animationDelay: `${baseDelay + 0.2}s`,
        position: 'absolute' as const,
        top: '268.285px',
        left: '0',
      },
      {
        ...GRADIENT_STYLE,
        animation: 'shrinkGrow 10s cubic-bezier(0.4, 0, 0.2, 1) infinite forwards',
        animationDelay: `${baseDelay + 0.4}s`,
        position: 'absolute' as const,
        top: '379.069px',
        left: '0',
      },
      {
        ...GRADIENT_STYLE,
        animation: 'shrinkGrow 10s cubic-bezier(0.4, 0, 0.2, 1) infinite forwards',
        animationDelay: `${baseDelay + 0.6}s`,
        position: 'absolute' as const,
        top: '489.854px',
        left: '0',
      },
    ];
  }, [delay]);

  return (
    <div style={CONTAINER_STYLE}>
      {animationStyles.map((style, index) => (
        <div key={index} style={style} />
      ))}
    </div>
  );
});

Rectangle.displayName = 'Rectangle';

// Memoize the rectangles array to prevent recreation on every render
const RectanglesAligned = React.memo(() => {
  const rectangles = React.useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => (
      <Rectangle key={i} delay={i * 0.5} />
    ));
  }, []);

  return (
    <div className='flex gap-5'>
      {rectangles}
    </div>
  );
});

RectanglesAligned.displayName = 'RectanglesAligned';