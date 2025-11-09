/* eslint-disable @typescript-eslint/no-explicit-any */
import { storyblokEditable, StoryblokServerComponent } from '@storyblok/react/rsc';
import { cn } from '@/lib/utils';

interface FlexProps {
  blok: {
    flex_items?: any[];
    on_mobile?: string;
    gap_size: string;
    vertical_align_items: string;
    horizontal_align_items: string;
    evenly_space_items: boolean;
    add_outer_padding_x: boolean;
    margins: string;
    inner_spacing: string;
  };
}

// Map gap_size values to Tailwind classes - this ensures Tailwind generates all classes
const gapSizeMap: Record<string, string> = {
  '1': 'gap-1', '2': 'gap-2', '3': 'gap-3', '4': 'gap-4', '5': 'gap-5', '6': 'gap-6', '7': 'gap-7', '8': 'gap-8', '9': 'gap-9', '10': 'gap-10', '11': 'gap-11', '12': 'gap-12', '13': 'gap-13', '14': 'gap-14', '15': 'gap-15', '16': 'gap-16', '17': 'gap-17', '18': 'gap-18', '19': 'gap-19', '20': 'gap-20', '21': 'gap-21', '22': 'gap-22', '23': 'gap-23', '24': 'gap-24',
};

// Map gap_size values to rem values (Tailwind spacing scale: 1 = 0.25rem, 2 = 0.5rem, etc.)
const gapSizeRemMap: Record<string, string> = {
  '1': '0.25rem', '2': '0.5rem', '3': '0.75rem', '4': '1rem', '5': '1.25rem', '6': '1.5rem', '7': '1.75rem', '8': '2rem', '9': '2.25rem', '10': '2.5rem', '11': '2.75rem', '12': '3rem', '13': '3.25rem', '14': '3.5rem', '15': '3.75rem', '16': '4rem', '17': '4.25rem', '18': '4.5rem', '19': '4.75rem', '20': '5rem', '21': '5.25rem', '22': '5.5rem', '23': '5.75rem', '24': '6rem',
};

export default function Flex({ blok }: FlexProps) {
  const flexItems = blok.flex_items || [];
  const onMobile = blok.on_mobile || 'stack';
  const gapSize = blok.gap_size || '8';
  const alignItems = blok.vertical_align_items === 'top' ? 'md:items-start' 
                   : blok.vertical_align_items === 'bottom' ? 'md:items-end' 
                   : blok.vertical_align_items === 'stretch' ? 'md:items-stretch'
                   : 'md:items-center';
  
  // Calculate basis accounting for gaps
  // Formula: calc((100% - (n-1) * gap) / n) where n is the number of items
  const itemCount = blok.flex_items?.length || 0;
  const gapRem = gapSizeRemMap[gapSize] || '2rem';
  let basis = '';
  let basisStyle: React.CSSProperties = {};
  
  if (blok.evenly_space_items && itemCount > 0) {
    if (itemCount === 1) {
      basis = 'md:*:basis-full';
    } else {
      // Calculate basis with gap: (100% - (n-1) * gap) / n
      const gapCount = itemCount - 1;
      basisStyle = {
        ['--basis-calc' as string]: `calc((100% - ${gapCount} * ${gapRem}) / ${itemCount})`,
      };
      basis = 'md:*:basis-[var(--basis-calc)]';
    }
  } else {
    // Fallback to original basis calculation when not evenly spacing
    basis = itemCount === 1 ? 'md:*:basis-1/1' 
          : itemCount === 2 ? 'md:*:basis-1/2' 
          : itemCount === 3 ? 'md:*:basis-1/3' 
          : itemCount === 4 ? 'md:*:basis-1/4' 
          : 'md:*:basis-1/2';
  }

  // Get the Tailwind class from the map, default to gap-8 if invalid
  const gapClass = gapSizeMap[gapSize] || 'gap-8';
  const widthAndPaddingClass = blok.add_outer_padding_x ? 'w-full max-w-maxw px-container mx-auto' : '';

  // Determine flex direction classes based on on_mobile setting
  const flexClasses = cn(
    'relative flex',
    blok.vertical_align_items === 'stretch' && '[&>.rich-text]:relative [&>.rich-text]:flex-1 [&>.rich-text]:flex [&>.rich-text]:flex-col [&>.rich-text]:justify-between',
    alignItems,
    gapClass,
    blok.evenly_space_items && basis,
    widthAndPaddingClass,
    onMobile === 'stack' ? 'flex-col md:flex-row' : 'flex-row',
    blok.evenly_space_items ? 'shrink-1 grow-0' : 'shrink grow',
    '[&_figure]:my-0'
  );
  // Process margins: add 'rem' to each value, or default to '0rem 0rem 0rem 0rem' if invalid
  // If add_outer_padding_x is true, set second and fourth parts (right and left) to 'auto'
  let marginValue = blok.add_outer_padding_x ? '0rem auto 0rem auto' : '0rem 0rem 0rem 0rem';
  if (blok.margins) {
    const marginParts = blok.margins.trim().split(/\s+/);
    if (marginParts.length === 4 && marginParts.every(part => !isNaN(Number(part)) && part !== '')) {
      marginValue = marginParts.map((part, index) => {
        // If add_outer_padding_x is true, set second (right) and fourth (left) to 'auto'
        if (blok.add_outer_padding_x && (index === 1 || index === 3)) {
          return 'auto';
        }
        return `${part}rem`;
      }).join(' ');
    }
  }

  if (flexItems.length === 0) {
    return null;
  }

  return (
    <div 
      {...storyblokEditable(blok)} 
      className={flexClasses}
      style={{
        margin: marginValue,
        ...basisStyle,
      }}
    >
      {/* <pre>
        {JSON.stringify(blok.flex_items[0], null, 2)}
      </pre> */}
      {flexItems.map((nestedBlok: any) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </div>
  );
}