import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { getStoryblokApi } from "@/lib/storyblok";
import { StoryblokStory } from "@storyblok/react/rsc";
import { draftMode } from 'next/headers';
import React from "react";
import { generatePageMetadata } from '@/lib/metadata';
import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";

export async function generateMetadata(
  { params: _params }: { params: Promise<Record<string, never>> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params and resolve parent metadata in parallel
  const [storyblok, parentMetadata] = await Promise.all([
    fetchStoryblokData('resources/inspiration/titles'),
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
  const [inspirationArticlesData, inspirationHomeStory] = await Promise.all([
    fetchInspirationArticles(),
    fetchStoryblokData('resources/inspiration/titles')
  ]);
  
  const inspirationArticles = inspirationArticlesData || [];

  if (!inspirationArticles || inspirationArticles.length === 0) {
    console.error("No inspiration articles found");
  }

  if (!inspirationHomeStory || !inspirationHomeStory.data.story) {
    console.error("No inspiration titles story found");
  }

  // Group articles by publication date (month/year)
  const groupedArticles = inspirationArticles.reduce((acc, article) => {
    // Use the date field from the article content
    const dateString = article.content?.date || article.published_at || article.created_at;
    
    if (!dateString) {
      // If no date, group under "No Date"
      const groupKey = 'No Date';
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(article);
      return acc;
    }
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const groupKey = `${monthNames[month]} ${year}`;
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(article);
    return acc;
  }, {});

  return (
    <>
      <div className="mb-12 *:[p]:columns-2 max-w-176">
        <StoryblokStory story={inspirationHomeStory.data.story} />
      </div>
      <Suspense fallback={
        <div className="w-full min-h-[600px] md:min-h-[800px] flex items-center justify-center">
          <LoadingAnimation text="Getting Inspiration..." />
        </div>
      }>
        <div className="space-y-8" >
          <div className="text-2xl border-b col-span-2 group-data-[liststyle=filters]:block hidden">
            Filter Results:
          </div>
          {Object.keys(groupedArticles).length > 0 ? (
            Object.keys(groupedArticles)
              .sort((a, b) => {
                // Special sorting for "No Date" group
                if (a === 'No Date') return 1; // No Date last
                if (b === 'No Date') return -1;
                
                // Parse month/year for date-based sorting
                const parseDate = (dateStr: string) => {
                  const [month, year] = dateStr.split(' ');
                  const monthIndex = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].indexOf(month);
                  return new Date(parseInt(year), monthIndex);
                };
                
                return parseDate(b).getTime() - parseDate(a).getTime(); // Most recent first
              })
              .map((monthYear, index) => (
                <React.Fragment key={monthYear}>
                  <h2 
                    id={monthYear.replace(/\s+/g, '-').toLowerCase()} 
                    className={`text-4xl md:text-[3.75rem] tracking-[-0.1125rem] col-span-2 group-data-[liststyle=filters]:hidden md:mb-4 ${index === 0 ? 'mt-0 md:mt-0' : 'md:mt-12'}`}
                  >
                    {monthYear}
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
                  {groupedArticles[monthYear].map((article: {
                    slug: string;
                    id: string;
                    name: string;
                    content: {
                      author: string;
                    };
                  }) => {

                    const finalSlug = article.slug;

                    return (
                      <Link 
                        key={article.id} 
                        href={`/resources/inspiration/${finalSlug}`} 
                        className="group/article flex justify-between"
                      >
                        <h3 className="text-lg group-hover/article:text-qreen-dark transition-all duration-300">{article.name}</h3>
                        <p className="text-base text-qreen-dark">{article.content.author}</p>
                      </Link>
                    );
                  })}
                </React.Fragment>
              ))
          ) : (
            <>
            <p>No inspiration articles available.</p>
            {JSON.stringify(inspirationArticlesData)}
            </>
          )}
        </div>
      </Suspense>
    </>
  );
}

async function fetchStoryblokData(slug: string) {
  const [{ isEnabled }, storyblokApi] = await Promise.all([
    draftMode(),
    Promise.resolve(getStoryblokApi())
  ]);
  
  const isDraftMode = isEnabled;
  return await storyblokApi.get(`cdn/stories/${slug}`, { version: isDraftMode ? 'draft' : 'published' });
}
async function fetchInspirationArticles() {
  const [{ isEnabled }, storyblokApi] = await Promise.all([
    draftMode(),
    Promise.resolve(getStoryblokApi())
  ]);
  
  const isDraftMode = isEnabled;
  return await storyblokApi.getAll(`cdn/stories`, { 
    version: isDraftMode ? 'draft' : 'published' ,
    content_type: 'article',
    starts_with: 'resources/inspiration/',
    excluding_slugs: 'resources/inspiration/'
  });
}