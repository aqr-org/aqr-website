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

  if (blok.aspect_ratio === 'original') {
    blok.aspect_ratio = aspectRatio.toString();
  }

  if (!imageUrl) {
    return null;
  }

  // Round width to nearest 10% step (10, 20, 30, ..., 100)
  const roundedWidth = blok.width 
    ? Math.round(blok.width / 10) * 10 
    : 100;
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
        'bg-qaupe', 
        textAlignClass
      )}
    >
      <figure
        className={cn(
          widthClassesMobile[blok.width_mobile as keyof typeof widthClassesMobile] || 'w-full',
          widthClasses[clampedWidth as keyof typeof widthClasses] || 'md:w-full',
          marginClass,
          blendModeClass
        )}
        style={{
          maxWidth: dimensions.width ? `${dimensions.width}px` : undefined,
        }}
      >
        <Picture 
          src={imageUrl} 
          alt={altText}
          aspectRatioDesktop={blok.aspect_ratio.toString() || '1.77778'}
          aspectRatioMobile={blok.aspect_ratio.toString() || '1.77778'}
          sizes={`(max-width: 768px) 90vw, 70vw`}
          className={`w-full h-auto aspect-[${blok.aspect_ratio}]`}
        />
        </figure> 
    </div>
  )
}

