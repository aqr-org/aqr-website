import { storyblokEditable } from '@storyblok/react/rsc';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
	<div {...storyblokEditable(blok)} className="w-full box-border pt-32">
    <div className='absolute inset-0 -z-10'>
      <svg 
        id="bg_svg" 
        width="1440" height="950" viewBox="0 0 1440 950" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className='overflow-visible w-full h-auto max-w-maxw mx-auto relative'
      >
        <path d="M1047 649.033C1129.84 649.033 1197 581.869 1197 499.017C1197 416.165 1129.84 349 1047 349C964.157 349 897 416.165 897 499.017C897 581.869 964.157 649.033 1047 649.033Z" fill="url(#paint0_radial_204_450)"/>
        <path d="M240 839.033C322.843 839.033 390 771.869 390 689.017C390 606.165 322.843 539 240 539C157.157 539 90 606.165 90 689.017C90 771.869 157.157 839.033 240 839.033Z" fill="url(#paint1_radial_204_450)"/>
        <path d="M880 279.033C962.843 279.033 1030 211.869 1030 129.017C1030 46.1648 962.843 -21 880 -21C797.157 -21 730 46.1648 730 129.017C730 211.869 797.157 279.033 880 279.033Z" fill="url(#paint2_radial_204_450)"/>
        <path d="M573 799C614.421 799 648 765.421 648 724C648 682.579 614.421 649 573 649C531.579 649 498 682.579 498 724C498 765.421 531.579 799 573 799Z" fill="url(#paint3_linear_204_450)"/>
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
        <rect opacity="0.5" x="-180" y="839.739" width="315" height="56" transform="rotate(-45 -180 839.739)" fill="url(#paint6_linear_204_450)"/>
        <rect opacity="0.5" width="315" height="56" transform="matrix(-0.707107 -0.707107 -0.707107 0.707107 1459 756.739)" fill="url(#paint7_linear_204_450)"/>
        <path d="M1242 372C1283.42 372 1317 338.421 1317 297C1317 255.579 1283.42 222 1242 222C1200.58 222 1167 255.579 1167 297C1167 338.421 1200.58 372 1242 372Z" fill="url(#paint8_linear_204_450)"/>
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
		<h1 className="text-5xl md:text-8xl tracking-[-0.03em] leading-none md:max-w-[10em] font-[400] animate-appear-text" >
      {blok.headline || 'Enter headline...'}
    </h1>
    {blok.intro && 
      <div className='relative mt-10 md:ml-[10%] max-w-[36rem]'>
        <p className="text-2xl tracking-tight leading-[120%] animate-appear-text delay-100">
          {blok.intro}
        </p>
        <div className='absolute bottom-1/2 left-full'>
          <svg width="242" height="176" viewBox="0 0 242 176" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M77.3041 175.329C59.2195 174.014 16.4708 170.689 3.17521 159.378C-8.96372 146.498 19.4296 136.803 28.2416 133.815C40.2494 129.88 52.4264 126.812 64.8194 124.422C65.5953 124.269 66.3474 124.786 66.4998 125.562C66.643 126.318 66.1666 127.051 65.4199 127.225C49.8298 131.442 17.2758 139.678 6.541 150.853C-2.63346 161.202 52.542 169.613 58.9519 170.572C65.1116 171.532 71.3049 172.393 77.4935 173.104C78.8794 173.243 78.7825 175.401 77.3141 175.329L77.3041 175.329Z" fill="#E27A96"/>
            <path d="M3.01322 150.447C49.0127 153.247 95.5296 146.019 138.571 129.622C168.803 117.741 198.743 101.717 220.483 77.1259C226.765 69.8851 232.061 61.6685 234.998 52.5173C238.339 41.5994 234.481 29.4242 225.922 21.9346C209.683 7.85729 185.596 5.37778 164.788 4.40601C147.168 3.79807 129.491 5.06928 111.971 7.01647C110.043 7.20792 109.608 4.25055 111.64 3.96273C116.051 3.44952 120.455 2.856 124.884 2.40346C157.768 -0.787289 219.895 -4.63694 237.83 29.5135C242.148 38.0528 242.468 48.4408 238.93 57.3104L238.361 58.9612L237.654 60.547C236.333 63.6519 234.607 66.8825 232.835 69.7111C207.083 108.889 153.019 133.859 108.946 145.807C74.4205 155.163 38.2439 158.637 2.62598 155.416C-0.472433 155.035 -0.406747 150.385 3.02393 150.427L3.01322 150.447Z" fill="#E27A96"/>
          </svg>
        </div>
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