/* eslint-disable @typescript-eslint/no-explicit-any */
import { storyblokEditable, StoryblokServerComponent } from '@storyblok/react/rsc';
import { cn } from '@/lib/utils';

interface FlexProps {
  blok: {
    flex_items?: any[];
    on_mobile?: string;
    gap_size: string;
  };
}

// Map gap_size values to Tailwind classes - this ensures Tailwind generates all classes
const gapSizeMap: Record<string, string> = {
  '1': 'gap-1', '2': 'gap-2', '3': 'gap-3', '4': 'gap-4', '5': 'gap-5', '6': 'gap-6', '7': 'gap-7', '8': 'gap-8', '9': 'gap-9', '10': 'gap-10', '11': 'gap-11', '12': 'gap-12', '13': 'gap-13', '14': 'gap-14', '15': 'gap-15', '16': 'gap-16', '17': 'gap-17', '18': 'gap-18', '19': 'gap-19', '20': 'gap-20', '21': 'gap-21', '22': 'gap-22', '23': 'gap-23', '24': 'gap-24',
};

export default function Flex({ blok }: FlexProps) {
  const flexItems = blok.flex_items || [];
  const onMobile = blok.on_mobile || 'stack';
  const gapSize = blok.gap_size || '8';

  // Get the Tailwind class from the map, default to gap-8 if invalid
  const gapClass = gapSizeMap[gapSize] || 'gap-8';

  // Determine flex direction classes based on on_mobile setting
  const flexClasses = cn(
    'flex justify-between items-center',
    gapClass,
    onMobile === 'stack' ? 'flex-col md:flex-row' : 'flex-row'
  );

  if (flexItems.length === 0) {
    return null;
  }

  return (
    <div {...storyblokEditable(blok)} className={flexClasses}>
      {flexItems.map((nestedBlok: any) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </div>
  );
}