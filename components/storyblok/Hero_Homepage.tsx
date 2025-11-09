import { storyblokEditable } from '@storyblok/react/rsc';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Hero_Homepage_RenderTitle from '@/components/storyblok/Hero_Homepage_RenderTitle';

interface HeroHomepageProps {
  blok: {
    headline: Record<string, unknown>;
    intro?: string;
    cta_text?: string;
    cta_link?: {
      cached_url: string;
    }
  };
}

export default function Hero_Homepage({ blok }: HeroHomepageProps) {
return (
	<div {...storyblokEditable(blok)} className="w-full max-w-maxw mx-auto px-container box-border pt-16 md:pt-32">
    <div className='absolute inset-0 -z-10 w-full h-full overflow-hidden'>
      <svg 
        id="bg_svg" 
        width="1440" height="950" viewBox="0 0 1440 950" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className='overflow-visible w-auto h-2/3 top-[120px] md:top-0 md:w-full md:h-auto max-w-maxw mx-auto relative'
      >
        <path 
          style={{
            transformBox: 'fill-box',
            transform: 'translate(calc(var(--mouseXdelta) * 5%), calc(var(--mouseYdelta) * 5%))'
          }}
          d="M1047 649.033C1129.84 649.033 1197 581.869 1197 499.017C1197 416.165 1129.84 349 1047 349C964.157 349 897 416.165 897 499.017C897 581.869 964.157 649.033 1047 649.033Z" fill="url(#paint0_radial_204_450)"
        />
        <path 
          style={{
            transformBox: 'fill-box',
            transform: 'translate(calc(var(--mouseXdelta) * 5%), calc(var(--mouseYdelta) * 5%))'
          }}
          d="M240 839.033C322.843 839.033 390 771.869 390 689.017C390 606.165 322.843 539 240 539C157.157 539 90 606.165 90 689.017C90 771.869 157.157 839.033 240 839.033Z" 
          fill="url(#paint1_radial_204_450)"
        />
        <path 
          style={{
            transformBox: 'fill-box',
            transform: 'translate(calc(var(--mouseXdelta) * 7.5%), calc(var(--mouseYdelta) * 7.5%))'
          }}
          d="M880 279.033C962.843 279.033 1030 211.869 1030 129.017C1030 46.1648 962.843 -21 880 -21C797.157 -21 730 46.1648 730 129.017C730 211.869 797.157 279.033 880 279.033Z" 
          fill="url(#paint2_radial_204_450)"
        />
        <path 
          id="qitrus-circle"
          style={{
            transformBox: 'fill-box',
            transform: 'translate(calc(var(--mouseXdelta) * 10%), calc(var(--mouseYdelta) * 10%))'
          }}
          d="M573 799C614.421 799 648 765.421 648 724C648 682.579 614.421 649 573 649C531.579 649 498 682.579 498 724C498 765.421 531.579 799 573 799Z" 
          fill="url(#paint3_linear_204_450)"
        />
        <g
          id='disc-1' 
          style={{
            transformBox: 'fill-box',
            transform: 'translate(calc(var(--mouseXdelta) * 6%), calc(var(--mouseYdelta) * 6%))'
          }}
        >
          <path 
            className='animate-animated-circle origin-bottom-right' 
            style={{
                transformBox: 'fill-box'
            }}
            opacity="0.35" 
            d="M243 277C243 210.73 296.72 157 363 157" 
            stroke="url(#paint4_linear_204_450)" 
            strokeWidth="57" 
            strokeMiterlimit="10"
          />
        </g>
        <g
          id='disc-2'
          style={{
            transformBox: 'fill-box',
            transform: 'translate(calc(var(--mouseXdelta) * 6%), calc(var(--mouseYdelta) * 6%))'
          }}
        >
          <path 
            className='animate-animated-circle origin-top-left duration-1000' 
            style={{
                transformBox: 'fill-box'
            }}
            opacity="0.35" 
            d="M940 589C940 655.27 886.28 709 820 709" 
            stroke="url(#paint5_linear_204_450)" 
            strokeWidth="57" 
            strokeMiterlimit="10"
          />
        </g>
        <g style={{
            transformBox: 'fill-box',
            transform: 'translate(calc(var(--mouseXdelta) * 7.5%), calc(var(--mouseYdelta) * 7.5%))'
        }}>
          <rect opacity="0.5" x="-180" y="839.739" width="315" height="56" transform="rotate(-45 -180 839.739)" fill="url(#paint6_linear_204_450)"/>
        </g>
        <g style={{
            transformBox: 'fill-box',
            transform: 'translate(calc(var(--mouseXdelta) * 7.5%), calc(var(--mouseYdelta) * 7.5%))'
        }}>
          <rect opacity="0.5" width="315" height="56" transform="matrix(-0.707107 -0.707107 -0.707107 0.707107 1459 756.739)" fill="url(#paint7_linear_204_450)"/>
        </g>
        <g style={{
            transformBox: 'fill-box',
            transform: 'translate(calc(var(--mouseXdelta) * 10%), calc(var(--mouseYdelta) * 10%))'
        }}>
          <path d="M1242 372C1283.42 372 1317 338.421 1317 297C1317 255.579 1283.42 222 1242 222C1200.58 222 1167 255.579 1167 297C1167 338.421 1200.58 372 1242 372Z" fill="url(#paint8_linear_204_450)"/>
        </g>
        <defs>
          <radialGradient id="paint0_radial_204_450" cx="0" cy="0" r="1" gradientTransform="matrix(-106.799 -105.33 105.318 -106.811 1046.99 499.013)" gradientUnits="userSpaceOnUse">
            <stop offset="0.02" stopColor="#4CA79E" stopOpacity="0.5"/>
            <stop offset="0.509615" stopColor="#79BDB6" stopOpacity="0"/>
            <stop offset="1" stopColor="#A6D3CF" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="paint1_radial_204_450" cx="0" cy="0" r="1" gradientTransform="matrix(-106.799 -105.33 105.318 -106.811 239.99 689.013)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EFB5C2" stopOpacity="0.9"/>
            <stop offset="0.509615" stopColor="#EFB5C2" stopOpacity="0.33"/>
            <stop offset="1" stopColor="#EFB5C2" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="paint2_radial_204_450" cx="0" cy="0" r="1" gradientTransform="matrix(-106.799 -105.33 105.318 -106.811 879.99 129.013)" gradientUnits="userSpaceOnUse">
            <stop offset="0.02" stopColor="#7BBD40" stopOpacity="0.7"/>
            <stop offset="0.509615" stopColor="#7BBD40" stopOpacity="0.23"/>
            <stop offset="1" stopColor="#7BBD40" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="paint3_linear_204_450" x1="626.035" y1="777.036" x2="519.964" y2="670.965" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F1B355"/>
            <stop offset="1" stopColor="#F1B355" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="paint4_linear_204_450" x1="303" y1="277" x2="303" y2="157" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4CA79E" stopOpacity="0"/>
            <stop offset="1" stopColor="#4CA79E"/>
          </linearGradient>
          <linearGradient id="paint5_linear_204_450" x1="880" y1="589" x2="880" y2="709" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E27A96" stopOpacity="0"/>
            <stop offset="1" stopColor="#E27A96"/>
          </linearGradient>
          <linearGradient id="paint6_linear_204_450" x1="-180" y1="867.739" x2="135" y2="867.739" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7BBD42" stopOpacity="0"/>
            <stop offset="0.495192" stopColor="#7BBD42" stopOpacity="0.5"/>
            <stop offset="0.870192" stopColor="#7BBD42"/>
            <stop offset="1" stopColor="#7BBD42"/>
          </linearGradient>
          <linearGradient id="paint7_linear_204_450" x1="0" y1="28" x2="315" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EBFE56" stopOpacity="0"/>
            <stop offset="0.495192" stopColor="#EBFE56" stopOpacity="0.5"/>
            <stop offset="0.870192" stopColor="#EBFE56"/>
            <stop offset="1" stopColor="#E1F547"/>
          </linearGradient>
          <linearGradient id="paint8_linear_204_450" x1="1188.96" y1="350.029" x2="1295.03" y2="243.967" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7BBD42"/>
            <stop offset="1" stopColor="#7BBD42" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
    <Hero_Homepage_RenderTitle richtext={blok.headline} />
    {blok.intro && 
      <div className='relative mt-10 md:ml-[10%] max-w-xl'>
        <p className="text-2xl tracking-tight leading-[120%] animate-appear-text delay-100">
          {blok.intro}
        </p>
      </div>
    }
		{blok.cta_text && blok.cta_link && (
      <Button className="mt-6 md:ml-[10%]">
        <Link 
          href={blok.cta_link.cached_url}           
        >
          {blok.cta_text}
        </Link>
      </Button>
		)}
	</div>
);
}