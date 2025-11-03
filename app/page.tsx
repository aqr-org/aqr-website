import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory, StoryblokServerComponent } from '@storyblok/react/rsc';
import Background from '@/components/Background';
import { draftMode } from 'next/headers';
import FeatureCards from '@/components/storyblok/FeatureCards';
import LatestSeasonCalendar from '@/components/storyblok/LatestSeasonCalendar';
import { getPhoneticSpelling } from '@/lib/phonetic';
import React, { Suspense } from 'react';

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

interface GlossaryTerm {
  id: string;
  slug: string;
  name: string;
  content: {
    name: string;
    description: string;
  };
}

interface Webinar {
  id: string;
  slug: string;
  name: string;
  content: {
    title: string;
    description?: string;
    date?: string;
    content: {
      content: {
        content: {
          text: string;
        }[];
      }[];
    };
  };
  published_at?: string;
  created_at?: string;
}

async function fetchNextUpcomingEvent(isDraftMode: boolean): Promise<Event | null> {
  const storyblokApi = getStoryblokApi();

  try {
    // Fetch a limited set of events sorted by date (much more efficient than getAll)
    // Fetch 20 most recent events sorted ascending by date to find the next upcoming one
    const response = await storyblokApi.get("cdn/stories", {
      version: isDraftMode ? "draft" : "published",
      content_type: "event",
      starts_with: "events/",
      excluding_slugs: "events/",
      sort_by: "content.date:asc",
      per_page: 20, // Limit to 20 most recent events instead of fetching all
    });

    const events = response.data?.stories || [];
    if (!events || events.length === 0) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter for future events (Storyblok sorts, but we still need to filter by today)
    const futureEvent = events.find((event: Event) => {
      if (!event.content?.date) {
        return false;
      }
      const eventDate = new Date(event.content.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });

    return futureEvent ? (futureEvent as Event) : null;
  } catch (error) {
    console.error("Error fetching events:", error);
    return null;
  }
}

async function fetchGlossaryTermOfTheDay(isDraftMode: boolean): Promise<GlossaryTerm | null> {
  const storyblokApi = getStoryblokApi();

  try {
    // Calculate date-based seed first to determine which page/index we need
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    let seed = 0;
    for (let i = 0; i < dateString.length; i++) {
      seed = ((seed << 5) - seed + dateString.charCodeAt(i)) & 0xffffffff;
    }

    // Fetch first page of glossary terms (limited to 100 per page for efficiency)
    // If we have more than 100 terms, we'd need pagination, but this covers most cases
    const response = await storyblokApi.get("cdn/stories", {
      version: isDraftMode ? "draft" : "published",
      starts_with: "glossary/",
      excluding_slugs: "glossary/",
      per_page: 100, // Limit to 100 terms instead of fetching all
    });

    const glossaryTerms = response.data?.stories || [];

    console.log("[fetchGlossaryTermOfTheDay] Total glossary terms fetched:", glossaryTerms?.length);

    if (!glossaryTerms || glossaryTerms.length === 0) {
      console.log("[fetchGlossaryTermOfTheDay] No glossary terms found");
      return null;
    }

    // Use seed to select a term consistently for the day
    const selectedIndex = Math.abs(seed) % glossaryTerms.length;
    const result = glossaryTerms[selectedIndex] as GlossaryTerm;
    console.log("[fetchGlossaryTermOfTheDay] Selected term:", result.slug, result.content?.name || result.name);
    return result;
  } catch (error) {
    console.error("Error fetching glossary terms:", error);
    // Fallback to random selection with limited fetch
    try {
      const response = await storyblokApi.get("cdn/stories", {
        version: isDraftMode ? "draft" : "published",
        starts_with: "glossary/",
        excluding_slugs: "glossary/",
        per_page: 100,
      });
      const glossaryTerms = response.data?.stories || [];
      if (glossaryTerms && glossaryTerms.length > 0) {
        const randomIndex = Math.floor(Math.random() * glossaryTerms.length);
        return glossaryTerms[randomIndex] as GlossaryTerm;
      }
    } catch (fallbackError) {
      console.error("Error in fallback glossary fetch:", fallbackError);
    }
    return null;
  }
}

async function fetchLatestWebinar(isDraftMode: boolean): Promise<Webinar | null> {
  const storyblokApi = getStoryblokApi();

  try {
    // Fetch only the most recent webinar using sorting and pagination
    const response = await storyblokApi.get("cdn/stories", {
      version: isDraftMode ? "draft" : "published",
      content_type: "webinar",
      starts_with: "events/thehub/",
      excluding_slugs: "events/thehub/",
      sort_by: "created_at:desc", // Sort by creation date descending
      per_page: 1, // Only fetch the first (most recent) webinar
    });

    const webinars = response.data?.stories || [];
    if (!webinars || webinars.length === 0) {
      return null;
    }

    // Return the first (and only) webinar from the sorted result
    return webinars[0] as Webinar;
  } catch (error) {
    console.error("Error fetching webinars:", error);
    return null;
  }
}

async function fetchAllEvents(isDraftMode: boolean): Promise<Event[]> {
  const storyblokApi = getStoryblokApi();
  try {
    return await storyblokApi.getAll(`cdn/stories`, { 
      version: isDraftMode ? 'draft' : 'published',
      content_type: 'event',
      starts_with: 'events/',
      excluding_slugs: 'events/'
    });
  } catch (error) {
    console.error("Error fetching all events:", error);
    return [];
  }
}

// Helper function to fetch phonetic spelling in parallel with other data
async function fetchPhoneticForGlossary(glossaryTermPromise: Promise<GlossaryTerm | null>): Promise<string | null> {
  const glossaryTerm = await glossaryTermPromise;
  if (!glossaryTerm) {
    return null;
  }
  const termName = glossaryTerm.content?.name || glossaryTerm.name || "";
  if (!termName) {
    return null;
  }
  return getPhoneticSpelling(termName);
}

export default async function Home() {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  
  // Create promises for glossary term and phonetic spelling
  const glossaryTermPromise = fetchGlossaryTermOfTheDay(isDraftMode);
  const phoneticPromise = fetchPhoneticForGlossary(glossaryTermPromise);
  
  // Fetch all data in parallel (including phonetic spelling)
  const [storyblok, nextEvent, glossaryTerm, latestWebinar, allEvents, phoneticGlossaryTerm] = await Promise.all([
    fetchStoryblokData(),
    fetchNextUpcomingEvent(isDraftMode),
    glossaryTermPromise,
    fetchLatestWebinar(isDraftMode),
    fetchAllEvents(isDraftMode),
    phoneticPromise,
  ]);
  
  const storyBlokStory = storyblok.data.story;
  
  // Extract hero from body if it exists (typically first blok)
  const heroBlok = storyBlokStory?.content?.body?.find((blok: any) => blok.component === 'hero_homepage');
  const bodyBloks = storyBlokStory?.content?.body?.filter((blok: any) => blok.component !== 'hero_homepage' && blok.component !== 'latest_season_calendar') || [];

  return (
    <main className="flex-1 flex flex-col gap-20 min-h-screen">
      <Background />
      
      {/* Hero section - renders immediately with storyblok data already fetched */}
      {heroBlok && (
        <StoryblokServerComponent blok={heroBlok} />
      )}

      {/* Storyblok body content - separate Suspense boundary for progressive rendering */}
      {bodyBloks.length > 0 && (
        <Suspense fallback={<StoryblokBodySkeleton />}>
          <StoryblokBodyContent bloks={bodyBloks} />
        </Suspense>
      )}

      {/* Feature Cards - separate Suspense boundary */}
      {storyBlokStory?.content?.feature_cards && (
        <Suspense fallback={<FeatureCardsSkeleton />}>
          <FeatureCardsAsync
            blok={storyBlokStory.content.feature_cards}
            nextEvent={nextEvent}
            glossaryTerm={glossaryTerm}
            latestWebinar={latestWebinar}
            phoneticGlossaryTerm={phoneticGlossaryTerm}
          />
        </Suspense>
      )}

      {/* Latest Season Calendar - separate Suspense boundary (loads last, needs allEvents) */}
      {storyBlokStory?.content?.body?.find((blok: any) => blok.component === 'latest_season_calendar') && (
        <Suspense fallback={<EventsCalendarSkeleton />}>
          <LatestSeasonCalendarAsync 
            blok={storyBlokStory.content.body.find((blok: any) => blok.component === 'latest_season_calendar')}
            allEvents={allEvents}
          />
        </Suspense>
      )}
    </main>
  );
}

// Separate async component for Storyblok body content
async function StoryblokBodyContent({ bloks }: { bloks: any[] }) {
  return (
    <>
      {bloks.map((blok: any) => (
        <StoryblokServerComponent blok={blok} key={blok._uid} />
      ))}
    </>
  );
}

// Separate async component for FeatureCards (allows progressive loading)
async function FeatureCardsAsync({ 
  blok, 
  nextEvent, 
  glossaryTerm, 
  latestWebinar,
  phoneticGlossaryTerm 
}: { 
  blok: any; 
  nextEvent: Event | null; 
  glossaryTerm: GlossaryTerm | null; 
  latestWebinar: Webinar | null;
  phoneticGlossaryTerm: string | null;
}) {
  return (
    <FeatureCards 
      blok={blok}
      nextEvent={nextEvent}
      glossaryTerm={glossaryTerm}
      latestWebinar={latestWebinar}
      phoneticGlossaryTerm={phoneticGlossaryTerm}
    />
  );
}

// Separate async component for LatestSeasonCalendar (allows progressive loading)
async function LatestSeasonCalendarAsync({ 
  blok, 
  allEvents 
}: { 
  blok: any; 
  allEvents: Event[];
}) {
  return (
    <LatestSeasonCalendar 
      blok={blok}
      events={allEvents}
    />
  );
}

// Loading skeleton components for progressive rendering
function StoryblokBodySkeleton() {
  return (
    <div className="min-h-[200px] w-full max-w-maxw mx-auto px-container animate-pulse">
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

function FeatureCardsSkeleton() {
  return (
    <div className="w-full max-w-maxw mx-auto px-container my-18 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[400px] bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EventsCalendarSkeleton() {
  return (
    <div className="relative space-y-12 bg-qlack text-qaupe min-h-[600px] animate-pulse">
      <div className="w-full max-w-maxw mx-auto px-container py-36">
        <div className="md:flex md:gap-12">
          <div className="h-8 bg-gray-700 rounded w-32 mb-6" />
          <div className="space-y-6 flex-1">
            <div className="h-16 bg-gray-700 rounded w-3/4 mb-18" />
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-24 bg-gray-700 rounded mb-4" />
                {i < 3 && <div className="border-b border-dashed border-gray-600 my-8" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function fetchStoryblokData() {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
	const storyblokApi = getStoryblokApi();
	return await storyblokApi.get(`cdn/stories/home`, { version: isDraftMode ? 'draft' : 'published' });
}