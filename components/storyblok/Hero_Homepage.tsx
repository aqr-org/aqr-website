import { storyblokEditable } from '@storyblok/react/rsc';
import Link from 'next/link';

interface HeroHomepageProps {
  blok: {
    headline?: string;
    intro?: string;
    cta_text?: string;
    cta_link?: {
      cached_url: string;
    }
  };
}

export default function Hero_Homepage({ blok }: HeroHomepageProps) {
return (
	<div {...storyblokEditable(blok)} className="w-full box-border pt-20">
		<h1 className="text-5xl md:text-[clamp(20px,6vw,100px)] tracking-tight leading-none md:max-w-[10em] font-[400] animate-appear-text">{blok.headline || 'Enter headline...'}</h1>
    {blok.intro && <p className="mt-10 md:ml-[17%] text-2xl tracking-tight leading-[120%] max-w-[20em] animate-appear-text delay-100">{blok.intro}</p>}
		{blok.cta_text && blok.cta_link && (
			<Link 
        href={blok.cta_link.cached_url} 
        className="mt-6 md:ml-[17%] inline-block py-3 px-8 border-2 border-qlack text-xl font-[500] rounded-full animate-appear-text delay-200 hover:bg-qlack hover:text-qaupe transition"
      >
				{blok.cta_text}
			</Link>
		)}
	</div>
);
}