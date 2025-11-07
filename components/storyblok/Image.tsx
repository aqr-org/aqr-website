import { storyblokEditable } from "@storyblok/react/rsc";
import Picture from "@/components/Picture";
import { cn } from "@/lib/utils";

interface ImageProps {
  blok: {
    asset: {
      filename: string;
      alt: string;
    };
    width: number;
    width_mobile: number;
    max_width: number;
    min_width: number;
    aspect_ratio: string;
    align: string;
    special_class: string;
  }
}

export default function Image({ blok }: ImageProps) {
  const imageUrl = blok.asset?.filename;
  const altText = blok.asset?.alt || '';

  const dimensions = {
    width: blok.asset.filename ? blok.asset.filename?.split('/')[5].split('x')[0] : 0,
    height: blok.asset.filename ? blok.asset.filename?.split('/')[5].split('x')[1] : 0,
  }
  const aspectRatio = Number(dimensions.width) / Number(dimensions.height);
  const roundedStyles = blok.aspect_ratio === 'circle' ? 'rounded-full overflow-hidden' : 'rounded overflow-hidden';

  if (blok.aspect_ratio === 'original') {
    blok.aspect_ratio = aspectRatio.toString();
  }
  if (blok.aspect_ratio === 'circle') {
    blok.aspect_ratio = '1';
  }

  
  if (!imageUrl) {
    return null;
  }
  
  // Round width to nearest 10% step (10, 20, 30, ..., 100)
  const roundedWidth = blok.width ? Math.round(blok.width / 10) * 10 : 100;
  const clampedWidth = Math.min(Math.max(roundedWidth, 10), 100);

  // Map width percentage to Tailwind class (only for md and above)
  const widthClasses: Record<number, string> = {
    10: 'md:w-[10%]',
    20: 'md:w-[20%]',
    30: 'md:w-[30%]',
    40: 'md:w-[40%]',
    50: 'md:w-[50%]',
    60: 'md:w-[60%]',
    70: 'md:w-[70%]',
    80: 'md:w-[80%]',
    90: 'md:w-[90%]',
    100: 'md:w-full',
  };

  const widthClassesMobile: Record<number, string> = {
    10: 'w-[10%]',
    20: 'w-[20%]',
    30: 'w-[30%]',
    40: 'w-[40%]',
    50: 'w-[50%]',
    60: 'w-[60%]',
    70: 'w-[70%]',
    80: 'w-[80%]',
    90: 'w-[90%]',
    100: 'w-full',
  };

  const basisClasses: Record<number, string> = {
    10: 'md:basis-[10%]',
    20: 'md:basis-[20%]',
    30: 'md:basis-[30%]',
    40: 'md:basis-[40%]',
    50: 'md:basis-[50%]',
    60: 'md:basis-[60%]',
    70: 'md:basis-[70%]',
    80: 'md:basis-[80%]',
    90: 'md:basis-[90%]',
    100: 'md:basis-full',
  };

  // Text alignment classes
  const textAlignClass = 
    blok.align === 'center' ? 'text-center' 
    : blok.align === 'right' ? 'text-right'
    : 'text-left';

  // Margin classes for alignment (only for md and above)
  const marginClass = 
    blok.align === 'center' ? 'md:mx-auto' 
    : blok.align === 'right' ? 'md:ml-auto'
    : 'md:mr-auto';

  // Mix blend mode class
  const blendModeClass = blok.special_class === 'multiply' ? 'mix-blend-multiply' : '';

  return (
    <div 
      {...storyblokEditable(blok)} 
      className={cn(
        blok.special_class === 'multiply' && 'bg-qaupe', 
        basisClasses[clampedWidth as keyof typeof basisClasses] || 'md:basis-full',
        'shrink-0',
        widthClassesMobile[blok.width_mobile as keyof typeof widthClassesMobile] || 'w-full',
        widthClasses[clampedWidth as keyof typeof widthClasses] || 'md:w-full',
        roundedStyles
      )}
      >
      <figure
        className={cn(
          textAlignClass,
          marginClass,
          blendModeClass,
          'w-full'
        )}
        style={{
          maxWidth: blok.max_width ? `${blok.max_width}px` : '100%',
          minWidth: blok.min_width ? `${blok.min_width}px` : '100%',
        }}
      >
        <Picture 
          src={imageUrl} 
          alt={altText}
          aspectRatioDesktop={blok.aspect_ratio.toString() || '1.77778'}
          aspectRatioMobile={blok.aspect_ratio.toString() || '1.77778'}
          sizes={`(max-width: 768px) 90vw, 70vw`}
          className={cn(
            `w-full h-auto`,
            textAlignClass,
            '[&>img]:inline-block'
          )}
          style={{ aspectRatio: blok.aspect_ratio ? blok.aspect_ratio : '1.77778' }}
        />
        </figure> 
    </div>
  )
}

