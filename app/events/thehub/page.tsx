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
    fetchStoryblokData('events/thehub'),
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

export default async function TheHubPage() {
  // Fetch initial data in parallel
  const [webinarsData, TheHubHomeStory] = await Promise.all([
    fetchWebinars(),
    fetchStoryblokData('events/thehub')
  ]);
  
  const webinars = webinarsData || [];

  if (!webinars || webinars.length === 0) {
    console.error("No webinars found");
  }

  if (!TheHubHomeStory || !TheHubHomeStory.data.story) {
    console.error("No the hub story found");
  }

  // Group webinars by publication date (month/year)
  const groupedWebinars = webinars.reduce((acc, webinar) => {
    // Use the date field from the webinar content
    const dateString = webinar.content?.date || webinar.published_at || webinar.created_at;
    
    if (!dateString) {
      // If no date, group under "No Date"
      const groupKey = 'No Date';
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(webinar);
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
    acc[groupKey].push(webinar);
    return acc;
  }, {});

  return (
    <>
      <div className="mb-12 *:[p]:columns-2 max-w-[44rem]">
        <StoryblokStory story={TheHubHomeStory.data.story} />
      </div>
      <Suspense fallback={<LoadingAnimation text="Getting Webinars..." />}>
        <div className="space-y-8" >
          <div className="text-2xl border-b col-span-2 group-data-[liststyle=filters]:block hidden">
            Filter Results:
          </div>
          {Object.keys(groupedWebinars).length > 0 ? (
            Object.keys(groupedWebinars)
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
                  <h2 id={monthYear.replace(/\s+/g, '-').toLowerCase()} className={`text-2xl col-span-2 group-data-[liststyle=filters]:hidden md:mb-4 ${index === 0 ? 'mt-0 md:mt-0' : 'md:mt-12'}`}>
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
                  {groupedWebinars[monthYear].map((webinar: {
                    slug: string;
                    id: string;
                    name: string;
                    content: {
                      description: string;
                    };
                  }) => {

                    const finalSlug = webinar.slug;

                    return (
                      <Link 
                        key={webinar.id} 
                        href={`/events/thehub/${finalSlug}`} 
                      >
                        <h3 className="text-lg">{webinar.name}</h3>
                        <p>{webinar.content.description}</p>
                      </Link>
                    );
                  })}
                </React.Fragment>
              ))
          ) : (
            <>
            <p>No inspiration webinars available.</p>
            {JSON.stringify(webinarsData)}
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
async function fetchWebinars() {
  const [{ isEnabled }, storyblokApi] = await Promise.all([
    draftMode(),
    Promise.resolve(getStoryblokApi())
  ]);
  
  const isDraftMode = isEnabled;
  return await storyblokApi.getAll(`cdn/stories`, { 
    version: isDraftMode ? 'draft' : 'published' ,
    content_type: 'webinar',
    starts_with: 'events/thehub/',
    excluding_slugs: 'events/thehub/'
  });
}