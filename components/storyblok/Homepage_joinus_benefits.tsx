import { normalizeStoryblokUrl } from "@/lib/storyblok-url";
import { storyblokEditable, StoryblokServerComponent } from "@storyblok/react/rsc";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import { UserRound } from "lucide-react";

interface Homepage_joinus_benefitsProps {
  blok: {
    subhead: string;
    headline_after_joinaqr: string;
    intro: string;
    benefits: any[]; // Array of expandable component bloks
    signoff: string;
    link_text: string;
    link: {
      cached_url: string;
    };
  };
}

export default function Homepage_joinus_benefits({ blok }: Homepage_joinus_benefitsProps) {
  return (
    <div {...storyblokEditable(blok)}>
      <div className='max-w-maxw mx-auto px-container py-12 md:flex'>
        <h2 className='uppercase tracking-[0.03em] leading-[0.95] basis-36'>{blok.subhead}</h2>
        <div className='pr-36'>
          <p className='text-4xl md:text-[6.25rem] tracking-[-0.1875rem] leading-[0.95]'>
            <span className='group inline-block relative hover:text-qreen-dark'>
              Join AQR, 
              <svg 
                className="absolute top-[calc(100%-0.25rem)] left-0 w-full group-hover:scale-x-0
                group-hover:scale-y-50 transition-all duration-300"
                width="402" height="20" viewBox="0 0 402 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.16527 12.6901C125.935 0.400088 249.995 -1.52991 373.295 0.930089L397.985 1.48009C399.955 1.52009 401.525 3.16009 401.475 5.13009C401.435 7.14009 399.725 8.73009 397.715 8.62009L373.085 7.66009C333.135 6.03009 289.915 5.44009 249.875 5.72009C184.305 6.10009 118.275 8.78009 52.9753 14.5001C36.6253 16.0201 20.2153 17.6801 4.01527 19.7901C-0.394727 20.3301 -1.85473 13.5601 3.15527 12.7001L3.16527 12.6901Z" fill="#141810"/>
              </svg>
              <svg 
                className="absolute -top-8 -left-4 w-[110%] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300"
                width="470" height="159" viewBox="0 0 470 159" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M446.932 44.8508C386.812 17.4808 276.782 22.3008 209.922 29.9408C210.352 24.1908 208.982 18.3008 205.722 13.3808C204.002 10.8208 200.952 11.5108 199.712 13.4208C195.602 7.05078 189.642 1.98078 181.912 0.570783C174.202 -0.849217 165.852 0.320784 159.312 4.75078C149.382 11.8308 146.012 26.0308 151.152 37.0408C151.262 37.2708 151.382 37.4908 151.492 37.7208C123.862 41.8708 96.3922 47.3708 69.8722 56.5108C61.3122 59.4308 52.5222 63.0908 44.4622 67.2308C36.2622 71.6908 27.9822 76.9308 21.8622 84.1008C13.2622 93.9008 11.2022 107.391 19.9522 117.871C22.6122 120.721 26.9322 116.961 24.4822 113.941C22.5422 111.601 21.2822 108.561 20.7522 105.571C19.8522 100.131 21.9822 94.5908 25.2622 90.2608C31.0122 82.7908 39.3622 77.6508 47.6022 73.2508C54.5722 69.7208 62.2522 66.5508 69.6022 63.8908C97.3522 54.2208 126.232 48.5508 155.102 43.2708C166.212 56.6508 188.562 59.3908 201.732 47.0708C205.072 44.0708 207.402 40.2608 208.722 36.1208C224.362 34.4908 240.002 33.0108 255.692 32.1108C311.112 29.3308 367.882 28.9708 421.892 43.0308C446.832 50.0608 481.232 65.6508 448.612 90.7708C372.522 147.471 103.912 173.031 20.6322 128.301C17.3822 126.381 14.3222 124.191 11.8622 121.631C9.42217 119.081 7.60217 116.171 7.03217 113.091C6.68217 111.151 4.81217 109.861 2.86217 110.221C-2.38783 111.501 0.872167 118.041 2.54217 121.121C5.91217 126.921 11.4822 131.171 17.0022 134.451C102.342 180.911 375.642 154.641 453.002 96.3908C477.142 77.8608 473.412 57.6308 446.932 44.8308V44.8508ZM197.192 42.2608C185.452 53.5808 163.472 49.1608 156.452 34.5608C152.322 26.2008 154.812 14.6908 162.462 9.12078C167.702 5.48078 174.762 4.49078 180.932 5.55078C191.072 7.34078 197.272 16.2708 200.322 25.8408C200.812 27.2208 202.052 27.6108 203.102 27.3308C203.362 32.8308 201.392 38.4008 197.192 42.2608Z" fill="#3C772B"/>
                <path d="M191.412 24.0008C188.082 23.6908 184.722 23.3808 181.342 23.1408L181.192 15.6808C181.062 11.7308 175.272 11.7708 175.192 15.7108C175.192 15.7308 175.202 18.9008 175.222 22.7908C172.092 22.6708 168.952 22.6508 165.842 22.7808C161.752 23.0508 162.132 29.0108 166.212 28.7708C169.232 28.4508 172.232 28.2908 175.232 28.2208C175.242 32.8808 175.262 37.0508 175.262 37.0708C175.472 41.2708 181.572 41.1408 181.612 36.9408L181.432 28.1808C184.662 28.2108 187.892 28.3108 191.152 28.4008C192.302 28.4208 193.302 27.5508 193.402 26.3808C193.502 25.1708 192.612 24.1008 191.392 23.9908L191.412 24.0008Z" fill="#3C772B"/>
              </svg>
            </span><br />
            {blok.headline_after_joinaqr}
          </p>
          <p className='text-lg md:text-[1.375rem] leading-tight my-12'>{blok.intro}</p>
          <h3 className="text-2xl md:text-4xl tracking-[-0.0375em] leading-tight">Benefits include:</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-16 mt-16'>
            {blok.benefits?.map((benefitBlok: any) => (
              <div className='flex items-start gap-4' key={benefitBlok._uid}>
                <svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18.5" cy="18.5" r="18.5" fill="#7BBD40"/>
                <path d="M8.70806 17.6851L16.2295 25.8934L27.4824 11.8071" stroke="#FCFAF0" stroke-width="2"/>
                </svg>
                <StoryblokServerComponent blok={benefitBlok} />
              </div>
            ))}
          </div>
          <div className='text-center my-16 space-y-12'>
            <p className='text-4xl md:text-6xl tracking-[-0.03rem] leading-[0.95]'>
              {blok.signoff}
            </p>
            <Link href={normalizeStoryblokUrl(blok.link.cached_url)} className='text-center text-lg md:text-xl'>
              <Button variant={"qreen"} className="[&_svg]:size-5">
              <UserRound className='w-6 h-6 inline-block' /> {blok.link_text} 
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}