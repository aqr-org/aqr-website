import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { getStoryblokApi } from "@/lib/storyblok";
import { StoryblokStory } from "@storyblok/react/rsc";
import { draftMode } from 'next/headers';
import React from "react";
import AlphabetNav from "@/components/AlphabetNav";

export async function generateMetadata(
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params and resolve parent metadata in parallel
  const [storyblok, parentMetadata] = await Promise.all([
    fetchStoryblokData('glossary'),
    parent
  ]);
  
  const { meta_title, meta_description, og_image } = storyblok.data.story.content;
  const previousImages = parentMetadata.openGraph?.images || []

  return {
    title: meta_title,
    description: meta_description,
    openGraph: {
      images: [og_image?.filename, ...previousImages],
    },
  }
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
    <>
      <div className="mb-12 *:[p]:columns-2">
        <StoryblokStory story={glossaryHomeStory.data.story} />
      </div>
      <nav aria-label="Directory navigation" className="group-data-[liststyle=filters]:hidden">
        <AlphabetNav entries={groupedTerms} />
      </nav>
      <div className="space-y-8 md:grid md:grid-cols-2 md:gap-5" >
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
                  <svg className="h-1 w-full mt-6" width="100%" height="100%">
                    <rect 
                      x="1" y="1" 
                      width="100%" height="100%" 
                      fill="none" 
                      stroke="var(--color-qlack)" 
                      strokeWidth="1" 
                      strokeDasharray="4 4" />
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
                      className="break-inside-avoid-column flex items-start gap-4 mb-0"
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
    </>
  );
}

export async function fetchStoryblokData(slug: string) {
  const [{ isEnabled }, storyblokApi] = await Promise.all([
    draftMode(),
    Promise.resolve(getStoryblokApi())
  ]);
  
  const isDraftMode = isEnabled;
  return await storyblokApi.get(`cdn/stories/${slug}`, { version: isDraftMode ? 'draft' : 'published' });
}
export async function fetchGlossaryTerms() {
  const [{ isEnabled }, storyblokApi] = await Promise.all([
    draftMode(),
    Promise.resolve(getStoryblokApi())
  ]);
  
  const isDraftMode = isEnabled;
  return await storyblokApi.getAll(`cdn/stories`, { 
    version: isDraftMode ? 'draft' : 'published' ,
    starts_with: 'glossary/',
    excluding_slugs: 'glossary/'
  });
}