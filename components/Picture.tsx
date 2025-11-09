import type React from 'react';

interface PictureProps {
  src: string,
  src_mobile?: string,
  aspectRatioDesktop: string,
  aspectRatioMobile: string,
  alt: string,
  sizes?: string,
  className?: string,
  width?: number,
  height?: number,
  noCrop?: boolean,
  priority?: boolean,
  nofade?: boolean,
  placeholder?: string,
  style?: React.CSSProperties
}

// Helper functions to generate srcSet strings (memoized at module level)
function generateNoCropDesktopSrcSet(src: string): string {
  const sizes = [160, 320, 480, 640, 750, 828, 1080, 1200, 1920];
  return sizes.map(size => `${src}/m/${size}x0/filters:format(webp) ${size}w`).join(',\n            ');
}

function generateNoCropMobileSrcSet(src: string, src_mobile?: string): string {
  const baseSrc = src_mobile || src;
  const sizes = [160, 320, 375, 414, 540, 600, 768, 1080];
  return sizes.map(size => `${baseSrc}/m/${size}x0/filters:format(webp) ${size}w`).join(',\n            ');
}

function generateDesktopSrcSet(src: string, aspectRatio: number): string {
  const sizes = [160, 320, 480, 640, 750, 828, 1080, 1200, 1920];
  return sizes.map(size => {
    const height = Math.ceil(size / aspectRatio);
    return `${src}/m/${size}x${height}/smart/filters:format(webp) ${size}w`;
  }).join(',\n            ');
}

function generateMobileSrcSet(src: string, src_mobile: string | undefined, aspectRatio: number): string {
  const baseSrc = src_mobile || src;
  const sizes = [160, 320, 375, 414, 540, 600, 768, 1080];
  return sizes.map(size => {
    const height = Math.ceil(size / aspectRatio);
    return `${baseSrc}/m/${size}x${height}/smart/filters:format(webp) ${size}w`;
  }).join(',\n            ');
}

function Picture(props: PictureProps) {
  //get the last four characters of props.src string
  const fileType = props.src ? props.src.slice(-4) : ''

  if (fileType === '') {
    return null
  }
  
  if (props.noCrop) {
    if (fileType === '.svg') {
      return (
        <picture className={props.className}>
          <img
            src={props.src} 
            alt={props.alt} 
          />
        </picture>
      )
    }
    else {
      const desktopSrcSet = generateNoCropDesktopSrcSet(props.src);
      const mobileSrcSet = generateNoCropMobileSrcSet(props.src, props.src_mobile);
      const aspectRatio = Number(props.aspectRatioDesktop);
      
      return(
        <picture 
          className={props.className}
          style={props.style}
        >
          <source 
            media="(min-width: 768px)" 
            srcSet={desktopSrcSet}
            sizes={props.sizes ? props.sizes : '100vw'}
          />
          <source 
            media="(max-width: 767px)" 
            srcSet={mobileSrcSet}
            sizes={props.sizes ? props.sizes : '100vw'}
          />
          <img
            src={`${props.src}/m/20x0/filters:format(webp):blur(5)`} 
            alt={props.alt}
            width={props.width || 1080}
            height={props.height || 1080 * Math.ceil(aspectRatio)}
            sizes={props.sizes ? props.sizes : '100vw'}
            loading={props.priority ? 'eager' : 'lazy'}
          />
        </picture>
      )
    }
  }

  if (fileType === '.svg') {
    return (
      <picture className={props.className}>
        <img
          src={props.src} 
          alt={props.alt} 
        />
      </picture>
    )
  }
  else {
    const aspectRatioDesktop = Number(props.aspectRatioDesktop);
    const aspectRatioMobile = Number(props.aspectRatioMobile);
    const desktopSrcSet = generateDesktopSrcSet(props.src, aspectRatioDesktop);
    const mobileSrcSet = generateMobileSrcSet(props.src, props.src_mobile, aspectRatioMobile);
    
    return(
      <picture 
        className={props.className}
        style={props.style}
      >
        <source 
          media="(min-width: 768px)" 
          srcSet={desktopSrcSet}
          sizes={props.sizes ? props.sizes : '100vw'}
        />
        <source 
          media="(max-width: 767px)" 
          srcSet={mobileSrcSet}
          sizes={props.sizes ? props.sizes : '100vw'}
        />
        <img
          src={`${props.src}/m/20x0/smart/filters:format(webp):blur(5)`} 
          alt={props.alt}
          width={props.width || 1080}
          height={props.height || 1080 * Math.ceil(aspectRatioDesktop)}
          sizes={props.sizes ? props.sizes : '100vw'}
          loading={props.priority ? 'eager' : 'lazy'}
        />
      </picture>
    )
  }
}

// Server components don't need React.memo - they only render on the server
export default Picture;