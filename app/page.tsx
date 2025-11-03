import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory, StoryblokServerComponent } from '@storyblok/react/rsc';
import Background from '@/components/Background';
import { draftMode } from 'next/headers';
import FeatureCards from '@/components/storyblok/FeatureCards';
import LatestSeasonCalendar from '@/components/storyblok/LatestSeasonCalendar';
import { getPhoneticSpelling } from '@/lib/phonetic';
import React, { Suspense } from 'react';
import { cn } from '@/lib/utils';

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
  const bodyBloks = storyBlokStory?.content?.body || [];
  
  // Fallback check for feature_cards at top level (in case it's not in body)
  const topLevelFeatureCards = storyBlokStory?.content?.feature_cards;

  // Helper to render body bloks in order with special handling for certain components
  const renderBodyBloksInOrder = () => {
    if (!bodyBloks || bodyBloks.length === 0) return null;

    const elements: React.ReactNode[] = [];
    let normalBloksBatch: any[] = [];

    const flushNormalBloks = () => {
      if (normalBloksBatch.length > 0) {
        elements.push(
          <Suspense key={`normal-bloks-${normalBloksBatch[0]._uid}`} fallback={<StoryblokBodySkeleton />}>
            <StoryblokBodyContent bloks={normalBloksBatch} />
          </Suspense>
        );
        normalBloksBatch = [];
      }
    };

    bodyBloks.forEach((blok: any) => {
      if (blok.component === 'hero_homepage') {
        flushNormalBloks();
        // Hero renders immediately (no Suspense needed, data already fetched)
        elements.push(
          <StoryblokServerComponent key={blok._uid} blok={blok} />
        );
      } else if (blok.component === 'feature_cards') {
        flushNormalBloks();
        // FeatureCards with its own Suspense and props
        elements.push(
          <Suspense key={blok._uid} fallback={<FeatureCardsSkeleton />}>
            <FeatureCardsAsync
              blok={blok}
              nextEvent={nextEvent}
              glossaryTerm={glossaryTerm}
              latestWebinar={latestWebinar}
              phoneticGlossaryTerm={phoneticGlossaryTerm}
            />
          </Suspense>
        );
      } else if (blok.component === 'latest_season_calendar') {
        flushNormalBloks();
        // LatestSeasonCalendar with its own Suspense and props
        elements.push(
          <Suspense key={blok._uid} fallback={<EventsCalendarSkeleton />}>
            <LatestSeasonCalendarAsync 
              blok={blok}
              allEvents={allEvents}
            />
          </Suspense>
        );
      } else {
        // Normal component - batch it with others for a single Suspense boundary
        normalBloksBatch.push(blok);
      }
    });

    // Flush any remaining normal bloks
    flushNormalBloks();

    // If no body bloks but top-level feature_cards exists, add it at the end
    if (elements.length === 0 && topLevelFeatureCards) {
      elements.push(
        <Suspense key="top-level-feature-cards" fallback={<FeatureCardsSkeleton />}>
          <FeatureCardsAsync
            blok={topLevelFeatureCards}
            nextEvent={nextEvent}
            glossaryTerm={glossaryTerm}
            latestWebinar={latestWebinar}
            phoneticGlossaryTerm={phoneticGlossaryTerm}
          />
        </Suspense>
      );
    }

    return elements;
  };

  return (
    <main className="flex-1 flex flex-col gap-20 min-h-screen">
      <Background />
      {renderBodyBloksInOrder()}
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
    
      // <FeatureCardsClient cards={cards} />
    <div className="w-full max-w-maxw mx-auto px-container my-18 animate-pulse">
      <h2 className="uppercase tracking-[0.03em] my-8">Loading latest updates...</h2>
      <div className="relative w-[calc(100%+var(--spacing-container))] -ml-(--spacing-container)">
      <div className="absolute right-0 bottom-full pb-4 z-20 flex items-center gap-2">
        {/* Arrow buttons */}
        
          <button
            className={`bg-white/80 rounded-lg p-6 shadow-lg text-qreen-dark hover:bg-qellow/80 transition-colors cursor-pointer opacity-50`}
            aria-label="Scroll left"
          >
            <svg className="w-6 h-6" width="14" height="25" viewBox="0 0 14 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.7346 23.3375L1.41455 12.0175L12.7346 0.70752" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
            </svg>
          </button>
          <button
            className={`bg-white/80 rounded-lg p-6 shadow-lg text-qreen-dark hover:bg-qellow/80 transition-colors cursor-pointer opacity-50`}
            aria-label="Scroll right"
          >
            <svg className="w-6 h-6" width="14" height="25" viewBox="0 0 14 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.707344 23.3375L12.0273 12.0175L0.707344 0.70752" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
            </svg>
          </button>
          <div 
            className={cn(
              "relative w-[calc(100%+var(--spacing-container)*2)]",
              "flex overflow-x-auto overflow-y-hidden",
              "scroll-smooth snap-x snap-mandatory",
              "no-scrollbar",
              "gap-4 md:gap-6",
              "pr-4 md:pr-container pb-12"
            )}
            style={{ paddingLeft: "var(--spacing-container)", scrollPaddingLeft: "var(--spacing-container)"}}
          >

          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="md:w-[calc((100vw-5rem*2-2rem)/2.1)] lg:w-[calc((100vw-5rem*2-2rem)/2.7)] xl:w-[calc((100vw-5rem*2-2rem)/3.1)] w-[calc(85vw)] bg-qlack/20 shrink-0 snap-start aspect-[0.75] rounded-xl" />
          ))}
          </div>
      </div>
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