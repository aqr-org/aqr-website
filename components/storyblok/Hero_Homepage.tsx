import { storyblokEditable } from '@storyblok/react/rsc';

interface HeroHomepageProps {
  blok: {
    headline: string;
  };
}

export default function Hero_Homepage({ blok }: HeroHomepageProps) {
return (
	<div {...storyblokEditable(blok)} className="p-12 bg-gray-100 w-full">
		<h1 className="text-4xl font-bold">{blok.headline}</h1>
	</div>
);
}