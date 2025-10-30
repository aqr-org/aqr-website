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

  return (
    <div 
      {...storyblokEditable(blok)} 
      className='w-full bg-qaupe'
      style={{ 
        textAlign: blok.align === 'center' ? 'center' 
                 : blok.align === 'right' ? 'right'
                 : 'left' as 'left' | 'right' | 'center',
      }}
    >
      <figure
        style={{
          width: blok.width ? `${blok.width}%` : '100%',
          margin: blok.align === 'center' ? '0 auto' : blok.align === 'right' ? '0 0 0 auto' : '0 auto 0 0',
          mixBlendMode: blok.special_class === 'multiply' ? 'multiply' : 'normal',
        }}
      >
        <Picture 
          src={imageUrl} 
          alt={altText}
          aspectRatioDesktop={blok.aspect_ratio.toString() || '1.77778'}
          aspectRatioMobile={blok.aspect_ratio.toString() || '1.77778'}
          sizes={`(max-width: 768px) ${blok.width ? `${blok.width}vw` : '100vw'}, ${blok.width ? `${blok.width*0.7}vw` : '70vw'}`}
          className={`w-full h-auto aspect-[${blok.aspect_ratio}]`}
        />
        </figure> 
    </div>
  )
}

