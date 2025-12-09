import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { getStoryblokApi } from "@/lib/storyblok";
import { StoryblokStory } from "@storyblok/react/rsc";
import { draftMode } from 'next/headers';
import React from "react";
import AlphabetNav from "@/components/AlphabetNav";
import { generatePageMetadata } from '@/lib/metadata';
import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

export async function generateMetadata(
  { params: _params }: { params: Promise<Record<string, never>> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params and resolve parent metadata in parallel
  const [storyblok, parentMetadata] = await Promise.all([
    fetchStoryblokData('glossary'),
    parent
  ]);
  
  const { meta_title, meta_description, og_image } = storyblok.data.story.content;
  
  return await generatePageMetadata(
    {
      meta_title,
      meta_description,
      og_image
    },
    parentMetadata
  );
}

export default async function DirPage() {
  // Fetch initial data in parallel
  const [glossaryTermsData, glossaryHomeStory] = await Promise.all([
    fetchGlossaryTerms(),
    fetchStoryblokData('glossary')
  ]);
  
  const glossaryTerms = glossaryTermsData || [];

  if (!glossaryTerms || glossaryTerms.length === 0) {
    console.error("No glossary terms found");
  }

  if (!glossaryHomeStory || !glossaryHomeStory.data.story) {
    console.error("No glossary home story found");
  }

  // Group glossary terms by first letter with special grouping for numbers and rare letters
  const groupedTerms = glossaryTerms.reduce((acc, term) => {
    const firstChar = term.name.charAt(0).toUpperCase();
    let groupKey: string;
    
    // Group all numbers 0-9 together
    if (/[0-9]/.test(firstChar)) {
      groupKey = '0-9';
    }
    // Group letters X, Y, Z together
    else if (['X', 'Y', 'Z'].includes(firstChar)) {
      groupKey = 'X-Z';
    }
    // All other letters get their own group
    else {
      groupKey = firstChar;
    }
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(term);
    return acc;
  }, {});

  return (
    <article className="animate-fade-in">
      <div className="mb-12 *:[p]:columns-2 max-w-maxwMain">
        <StoryblokStory story={glossaryHomeStory.data.story} />
      </div>
      <Suspense fallback={
        <div className="w-full min-h-[400px] flex items-center justify-center">
          <LoadingAnimation text="Loading glossary..." />
        </div>
      }>
        <AlphabetNav entries={groupedTerms} ariaLabel="Glossary navigation" />
        <div className="md:grid md:grid-cols-2 md:gap-y-0 md:gap-x-40" >
          <div className="text-2xl border-b col-span-2 group-data-[liststyle=filters]:block hidden">
            Filter Results:
          </div>
          {Object.keys(groupedTerms).length > 0 ? (
            Object.keys(groupedTerms)
              .sort((a, b) => {
                // Special sorting for group keys
                if (a === '0-9') return -1; // Numbers first
                if (b === '0-9') return 1;
                if (a === 'X-Z') return 1; // X-Z last
                if (b === 'X-Z') return -1;
                return a.localeCompare(b); // Regular alphabetical for letters
              })
              .map((letter, index) => (
                <React.Fragment key={letter}>
                  <h2 id={letter} className={`text-6xl col-span-2 group-data-[liststyle=filters]:hidden md:mb-4 ${index === 0 ? 'mt-0 md:mt-0' : 'md:mt-12'}`}>
                    {letter}
                    <svg className="h-1 w-full mt-6 mb-4" width="100%" height="100%">
                      <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
                    </svg>
                  </h2>
                  {groupedTerms[letter].map((term: {
                    slug: string;
                    id: string;
                    name: string;
                  }) => {

                    const finalSlug = term.slug;

                    return (
                      <Link 
                        key={term.id} 
                        href={`/glossary/${finalSlug}`} 
                        className="break-inside-avoid-column flex items-start gap-4 mb-0 hover:text-qreen-dark transition-all duration-300"
                      >
                        <div>
                          <h3 className="text-[1.375rem]">{term.name}</h3>
                        </div>
                      </Link>
                    );
                  })}
                </React.Fragment>
              ))
          ) : (
            <>
            <p>No glossary terms available.</p>
            {JSON.stringify(glossaryTermsData)}
            </>
          )}
        </div>
      </Suspense>
    </article>
  );
}

// Cache glossary page Storyblok data
const fetchStoryblokData = cache(async (slug: string) => {
  const [{ isEnabled }, storyblokApi] = await Promise.all([
    draftMode(),
    Promise.resolve(getStoryblokApi())
  ]);
  
  const isDraftMode = isEnabled;
  return await storyblokApi.get(`cdn/stories/${slug}`, { 
    version: isDraftMode ? 'draft' : 'published',
    resolve_links: 'url'
  });
});
// Cache glossary terms fetch - fetch in batches instead of getAll()
const fetchGlossaryTerms = unstable_cache(
  async () => {
    const [{ isEnabled }, storyblokApi] = await Promise.all([
      draftMode(),
      Promise.resolve(getStoryblokApi())
    ]);
    
    const isDraftMode = isEnabled;
    
    // Fetch glossary terms in batches to avoid huge payloads
    let allTerms: any[] = [];
    let page = 1;
    const perPage = 100; // Storyblok max per_page
    
    while (true) {
      const response = await storyblokApi.get('cdn/stories', {
        version: isDraftMode ? 'draft' : 'published',
        starts_with: 'glossary/',
        excluding_slugs: 'glossary/',
        per_page: perPage,
        page: page,
      });
      
      const terms = response.data?.stories || [];
      if (terms.length === 0) break;
      
      allTerms = allTerms.concat(terms);
      
      // If we got fewer than perPage, we've reached the end
      if (terms.length < perPage) break;
      
      page++;
    }
    
    return allTerms;
  },
  ['glossary-all-terms'],
  {
    revalidate: 3600, // Cache for 1 hour (glossary terms don't change often)
    tags: ['glossary'],
  }
);