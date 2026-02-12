import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';
import EventPreview from '@/components/EventPreview';
import React from 'react';
import { cn } from '@/lib/utils';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

interface Event {
  id: string;
  slug: string;
  name: string;
  content: {
    title: string;
    description: string;
    date?: string;
    hide_time?: boolean;
    admission?: string;
    image?: {
      filename: string;
      alt: string;
    };
    organised_by?: string;
    type?: string;
  };
}

function getSeason(dateString: string): Season {
  if (!dateString) return 'Winter'; // default
  const date = new Date(dateString);
  const month = date.getMonth() + 1; // 1-12

  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Autumn';
  return 'Winter'; // December, January, February
}

function getSeasonYear(dateString?: string): number {
  const date = dateString ? new Date(dateString) : new Date();
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();

  // Winter spans two years: Dec belongs with Jan/Feb of next year.
  // Use the December year as the winter group year.
  if (month <= 2) return year - 1;
  return year;
}

function groupEventsByYearAndSeason(events: any[]): Record<string, Event[]> {
  const grouped: Record<string, Event[]> = {};

  events.forEach(event => {
    const dateString = event.content?.date;
    if (dateString) {
      const season = getSeason(dateString);
      const year = season === 'Winter' ? getSeasonYear(dateString) : new Date(dateString).getFullYear();
      const key = `${year}-${season}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    } else {
      // If no date, add to current year Winter as default
      const year = getSeasonYear();
      const key = `${year}-Winter`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    }
  });

  return grouped;
}

function getSeasonOrder(season: Season): number {
  const order: Record<Season, number> = {
    Spring: 0,
    Summer: 1,
    Autumn: 2,
    Winter: 3
  };
  return order[season];
}

function sortSeasonGroups(groups: Record<string, Event[]>): Array<{ key: string; events: Event[] }> {
  return Object.entries(groups)
    .map(([key, events]) => ({ key, events }))
    .sort((a, b) => {
      const [aYear, aSeason] = a.key.split('-');
      const [bYear, bSeason] = b.key.split('-');
      
      // First sort by year
      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }
      
      // If same year, sort by season
      return getSeasonOrder(aSeason as Season) - getSeasonOrder(bSeason as Season);
    });
}

export default async function CalendarPage() {
  
  const [storyblok, eventsData] = await Promise.all([
    fetchStoryblokData(),
    fetchAllEvents()
  ]);
  
  const storyBlokStory = storyblok.data.story;
  const events = eventsData || [];
  
  // Group events by year and season
  const groupedEvents = groupEventsByYearAndSeason(events);
  
  // Sort groups chronologically
  const sortedGroups = sortSeasonGroups(groupedEvents);
  
  return (
    <div className="max-w-210">
      {storyBlokStory && storyBlokStory.content.body && storyBlokStory.content.body.length > 0 &&
      <div className="mb-12">
        <StoryblokStory story={storyBlokStory} />
      </div>
      }
      
      {/* Display events grouped by season and year */}
      <div className="space-y-12">
        {sortedGroups.map(({ key, events: seasonEvents }, index) => {
          const [year, season] = key.split('-');
          const yearNum = Number.parseInt(year, 10);
          const displayName = season === 'Winter'
            ? `Winter calendar ${String(yearNum).slice(-2)}/${String(yearNum + 1).slice(-2)}`
            : `${season} calendar ${year}`;
          
          return (
            <section key={key}>
              <h2 
                className={cn(
                  "text-5xl md:text-6xl tracking-tight mt-24 mb-18", 
                  index === 0 ? "md:mt-0" : ""
                )}
              >
                {displayName}
              </h2>
              <div className="space-y-6">
                {seasonEvents.map((event, index) => (
                  <React.Fragment key={event.id}>
                    <EventPreview event={event} />
                    {(index < (seasonEvents.length - 1)) && (
                      <div className="my-8 border-b border-dashed border-qlack w-full"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// Cache calendar page Storyblok data
const fetchStoryblokData = cache(async () => {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/calendar`, { 
    version: isDraftMode ? 'draft' : 'published',
    resolve_links: 'url'
  });
});

// For calendar page, we need all events, but we'll fetch them in batches and cache
const fetchAllEvents = unstable_cache(
  async () => {
    const { isEnabled } = await draftMode();
    const isDraftMode = isEnabled;
    const storyblokApi = getStoryblokApi();
    
    // Fetch events in batches to avoid huge payloads
    // Start with first page
    let allEvents: any[] = [];
    let page = 1;
    const perPage = 100; // Storyblok max per_page
    
    while (true) {
      const response = await storyblokApi.get('cdn/stories', {
        version: isDraftMode ? 'draft' : 'published',
        content_type: 'event',
        starts_with: 'events/',
        excluding_slugs: 'events/',
        per_page: perPage,
        page: page,
        sort_by: 'content.date:desc',
      });
      
      const events = response.data?.stories || [];
      if (events.length === 0) break;
      
      allEvents = allEvents.concat(events);
      
      // If we got fewer than perPage, we've reached the end
      if (events.length < perPage) break;
      
      page++;
    }
    
    return allEvents;
  },
  ['calendar-all-events'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['events', 'calendar'],
  }
);