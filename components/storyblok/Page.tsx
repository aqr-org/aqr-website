/* eslint-disable @typescript-eslint/no-explicit-any */
import { storyblokEditable, StoryblokServerComponent } from '@storyblok/react/rsc';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';

// Fallback for async components that fetch data
function AsyncComponentFallback({ component }: { component: string }) {
  // Reserve space for components that might suspend
  if (component === 'feature_cards') {
    return (
      <div className="w-full min-h-[600px] md:min-h-[700px]" aria-hidden="true" />
    );
  }
  if (component === 'latest_season_calendar') {
    return (
      <div className="w-full min-h-[400px] md:min-h-[500px]" aria-hidden="true" />
    );
  }
  // Default fallback
  return <div className="w-full min-h-[200px]" aria-hidden="true" />;
}

function StoryblokComponentWrapper({ blok }: { blok: any }) {
  // Only wrap async components that might actually suspend in Suspense
  // Components like feature_cards and latest_season_calendar can fetch data if props aren't provided
  const asyncComponents = ['feature_cards', 'latest_season_calendar'];
  
  if (asyncComponents.includes(blok.component)) {
    return (
      <Suspense fallback={<AsyncComponentFallback component={blok.component} />}>
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