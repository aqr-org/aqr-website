import { storyblokEditable } from '@storyblok/react/rsc';
import { render } from 'storyblok-rich-text-react-renderer';
import React from 'react';
import Youtube from './Youtube';
import Audio from './Audio';
import Image from './Image';
import Flex from './Flex';
import Button from './Button';
import { cn } from '@/lib/utils';

interface RichTextProps {
  blok: {
    content: string;
    max_width: number;
    add_outer_padding_x: boolean;
    special_class: string;
    margins: string;
  }
}

/**
 * Cleans MS Word artifacts from Storyblok rich text content
 * - Removes excessive non-breaking spaces (if >30% of spaces are NBSP, replace all)
 * - Removes other invisible/hidden Word characters
 * - Preserves all intentional formatting (h1, h2, bold, italic, etc.)
 */
function cleanStoryblokContent(content: any): any {
  if (!content) return content;

  // If content is a string, parse it first
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch {
      // If it's not JSON, return as-is
      return content;
    }
  }

  // Recursively process the content structure
  if (Array.isArray(content)) {
    return content.map(cleanStoryblokContent);
  }

  if (typeof content === 'object' && content !== null) {
    const cleaned: any = { ...content };

    // If this is a text node, clean the text
    if (content.type === 'text' && typeof content.text === 'string') {
      cleaned.text = cleanTextContent(content.text);
    }

    // Recursively clean nested content
    if (content.content) {
      cleaned.content = cleanStoryblokContent(content.content);
    }

    return cleaned;
  }

  return content;
}

/**
 * Cleans text content from MS Word artifacts
 */
function cleanTextContent(text: string): string {
  if (!text) return text;

  // Count non-breaking spaces (NBSP - \u00A0) and regular spaces
  const nbspCount = (text.match(/\u00A0/g) || []).length;
  const regularSpaceCount = (text.match(/ /g) || []).length;
  const totalSpaces = nbspCount + regularSpaceCount;

  // If more than 30% of spaces are non-breaking, replace all NBSP with regular spaces
  // This indicates content was pasted from MS Word
  const nbspRatio = totalSpaces > 0 ? nbspCount / totalSpaces : 0;
  let cleaned = text;

  if (nbspRatio > 0.3) {
    // Replace all non-breaking spaces with regular spaces
    cleaned = cleaned.replace(/\u00A0/g, ' ');
  }

  // Remove other common MS Word invisible characters
  // Zero-width space (U+200B)
  cleaned = cleaned.replace(/\u200B/g, '');
  // Zero-width non-breaking space (U+FEFF)
  cleaned = cleaned.replace(/\uFEFF/g, '');
  // Zero-width joiner (U+200D)
  cleaned = cleaned.replace(/\u200D/g, '');
  // Zero-width non-joiner (U+200C)
  cleaned = cleaned.replace(/\u200C/g, '');
  // Soft hyphen (U+00AD) - only remove if it's not being used intentionally
  // We'll keep soft hyphens as they might be intentional

  // Remove MS Word smart quotes if they're excessive (but this is less critical)
  // We'll keep them as they might be intentional formatting

  return cleaned;
}

// Memoize blok resolvers to prevent recreation on every render
const blokResolvers = {
  youtube: (props: any) => <Youtube blok={props} />,
  audio: (props: any) => <Audio blok={props} />,
  image: (props: any) => <Image blok={props} />,
  flex: (props: any) => <Flex blok={props} />,
  button: (props: any) => <Button blok={props} />,
};

// Memoize node resolvers to prevent recreation on every render
const nodeResolvers = {
  table: (children: React.ReactNode) => {
    // Check if children already include tbody
    const childrenArray = React.Children.toArray(children);
    const hasTbody = childrenArray.some(
      (child: any) => 
        child?.type === 'tbody' || 
        (typeof child === 'object' && child?.props?.tag === 'tbody')
    );
    
    // If no tbody exists, wrap all direct tr elements in tbody
    if (!hasTbody) {
      return (
        <table>
          <tbody>
            {children}
          </tbody>
        </table>
      );
    }
    
    return <table>{children}</table>;
  },
};

function RichText({ blok }: RichTextProps) {
  // Clean the content before rendering
  // Since this is a server component, it only renders once on the server
  const cleanedContent = cleanStoryblokContent(blok.content);
  
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

  return (
    <div 
      {...storyblokEditable(blok)} 
      className={cn(
        "rich-text prose", 
        blok.add_outer_padding_x ? 'px-container max-w-maxw mx-auto' : '',
        blok.special_class?.includes('narrowSpacingBetweenItems') && 'narrowSpacingBetweenItems',
        blok.special_class?.includes('summary') && 'pb-8 border-b border-qreen [&>p]:line-clamp-3',
        blok.special_class?.includes('bottom-border') && 'pb-12 border-b border-qreen'
      )}
      style={{ 
        maxWidth: blok.max_width ? `${blok.max_width}px` 
                : blok.add_outer_padding_x ? 'var(--container-maxw)' 
                : '100%',
        margin: marginValue,
      }}
    >
      {render(cleanedContent, {
        blokResolvers,
        nodeResolvers,
      })}
    </div>
  )
}

// Server components don't need React.memo - they only render on the server
export default RichText;