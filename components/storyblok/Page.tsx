/* eslint-disable @typescript-eslint/no-explicit-any */
import { storyblokEditable, StoryblokServerComponent } from '@storyblok/react/rsc';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';

// Fallback for Hero_Homepage that matches its approximate height to prevent layout shift
function HeroHomepageFallback() {
  return (
    <div className="w-full max-w-maxw mx-auto px-container box-border pt-32">
      {/* Matches approximate height: pt-32 (128px) + SVG (~500-600px) + title (~150px) + optional content (~100px) */}
      <div className="min-h-[600px] md:min-h-[800px]" aria-hidden="true" />
    </div>
  );
}

function StoryblokComponentWrapper({ blok }: { blok: any }) {
  // Wrap hero_homepage in Suspense to prevent layout shift
  if (blok.component === 'hero_homepage') {
    return (
      <Suspense fallback={<HeroHomepageFallback />}>
        <StoryblokServerComponent blok={blok} />
      </Suspense>
    );
  }
  
  return <StoryblokServerComponent blok={blok} />;
}

export default function Page({ blok }: { blok: any }) {
return (
	<main {...storyblokEditable(blok)} className={cn(blok.aside && blok.aside.length > 0 ? 'md:flex gap-8' : '')}>
    <article className={
        cn(blok.aside && blok.aside.length > 0 
           ? 'md:basis-3/4 md:shrink max-w-210' 
           : 'space-y-7.5')
    }>
      {blok.body?.map((nestedBlok: any) => (
        <StoryblokComponentWrapper blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </article>
    {blok.aside && blok.aside.length > 0 && (
      <aside className={
          cn(blok.aside && blok.aside.length > 0 
             ? 'md:basis-1/4 md:grow max-w-[24rem]' 
             : '')
      }> 
        {blok.aside.map((nestedBlok: any) => (
          <StoryblokComponentWrapper blok={nestedBlok} key={nestedBlok._uid} />
        ))}
      </aside>
    )}
	</main>
);
}