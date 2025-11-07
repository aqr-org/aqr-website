"use client"

import { storyblokEditable } from '@storyblok/react/rsc';
import { render } from 'storyblok-rich-text-react-renderer';
import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableBlok {
  summary: string;
  definition?: any; // Rich text field from Storyblok
  description?: string; // Plain text field (for programmatic usage)
  _uid?: string;
}

interface ExpandableProps {
  blok?: ExpandableBlok;
  // Direct props for programmatic usage (when not using as Storyblok component)
  summary?: string;
  definition?: any;
  description?: string;
  _uid?: string;
}

export default function Expandable(props: ExpandableProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Support both Storyblok blok prop and direct props
  const blok = props.blok || {
    summary: props.summary || '',
    definition: props.definition,
    description: props.description,
    _uid: props._uid,
  };

  const uid = blok._uid || 'default';
  const summary = blok.summary || '';
  const hasRichText = blok.definition != null;
  const hasPlainText = blok.description != null && blok.description.trim() !== '';

  return (
    <div {...(props.blok ? storyblokEditable(blok as any) : {})} className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className='relative group/faq'>
        <CollapsibleTrigger
          className={cn(
            "w-full flex items-center justify-between gap-4 text-left pr-2",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-qreen",
            "transition-all duration-200",
            "group relative",
            "cursor-pointer",
            "hover:text-qreen-dark transition-all duration-300",
          )}
          aria-expanded={isOpen}
          aria-controls={`expandable-content-${uid}`}
        >
          <span className="font-semibold text-[1.375rem] tracking-tight leading-tight flex-1">{summary}</span>
        </CollapsibleTrigger>
        <CollapsibleContent
          id={`expandable-content-${uid}`}
          className="mt-4 pr-6"
        >
          {hasRichText && (
            <div className="rich-text prose">
              {render(blok.definition, {
                blokResolvers: {},
                nodeResolvers: {},
              })}
            </div>
          )}
          {hasPlainText && !hasRichText && (
            <div className="rich-text prose">
              <p>{blok.description}</p>
            </div>
          )}
        </CollapsibleContent>
        <div 
          className='w-[calc(100%-2rem)] md:w-[calc(100%-1rem)] flex items-center absolute left-0 top-[calc(100%+.5rem)] border-b border-dashed border-qreen cursor-pointer'
          onClick={() => setIsOpen(!isOpen)}
          role="button"
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
        >
          <span className='absolute left-full ml-1 w-8 h-8 md:w-5 md:h-5 rounded-full bg-qaupe border border-qreen text-qreen font-semibold flex items-center justify-center group-hover/faq:bg-qreen group-hover/faq:text-qaupe transition-all duration-300'>{isOpen ? '-' : '+'}</span>
        </div>
      </Collapsible>
    </div>
  );
}

