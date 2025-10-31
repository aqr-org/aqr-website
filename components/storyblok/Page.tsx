/* eslint-disable @typescript-eslint/no-explicit-any */
import { storyblokEditable, StoryblokServerComponent } from '@storyblok/react/rsc';
import { cn } from '@/lib/utils';

export default function Page({ blok }: { blok: any }) {
return (
	<main {...storyblokEditable(blok)} className={cn(blok.aside && blok.aside.length > 0 ? 'md:flex gap-8' : '')}>
    <article className={
        cn(blok.aside && blok.aside.length > 0 
           ? 'md:basis-3/4 md:shrink max-w-210' 
           : 'space-y-7.5')
    }>
      {blok.body?.map((nestedBlok: any) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </article>
    {blok.aside && blok.aside.length > 0 && (
      <aside className={
          cn(blok.aside && blok.aside.length > 0 
             ? 'md:basis-1/4 md:grow max-w-[24rem]' 
             : '')
      }> 
        {blok.aside.map((nestedBlok: any) => (
          <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
        ))}
      </aside>
    )}
	</main>
);
}