import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory, StoryblokServerComponent } from '@storyblok/react/rsc';
import Background from '@/components/Background';
import { draftMode } from 'next/headers';
import FeatureCards from '@/components/storyblok/FeatureCards';
import LatestSeasonCalendar from '@/components/storyblok/LatestSeasonCalendar';
import { getPhoneticSpelling } from '@/lib/phonetic';
import React from 'react';

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
    const events = await storyblokApi.getAll("cdn/stories", {
      version: isDraftMode ? "draft" : "published",
      content_type: "event",
      starts_with: "events/",
      excluding_slugs: "events/",
    });

    if (!events || events.length === 0) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter and sort future events
    const futureEvents = events
      .filter((event: Event) => {
        if (!event.content?.date) {
          return false;
        }
        const eventDate = new Date(event.content.date);
        eventDate.setHours(0, 0, 0, 0);
        const isFuture = eventDate >= today;
        return isFuture;
      })
      .sort((a: Event, b: Event) => {
        const dateA = a.content?.date ? new Date(a.content.date).getTime() : Infinity;
        const dateB = b.content?.date ? new Date(b.content.date).getTime() : Infinity;
        return dateA - dateB;
      });

    const result = futureEvents.length > 0 ? (futureEvents[0] as Event) : null;
    return result;
  } catch (error) {
    console.error("Error fetching events:", error);
    return null;
  }
}

async function fetchGlossaryTermOfTheDay(isDraftMode: boolean): Promise<GlossaryTerm | null> {
  const storyblokApi = getStoryblokApi();

  try {
    const glossaryTerms = await storyblokApi.getAll("cdn/stories", {
      version: isDraftMode ? "draft" : "published",
      starts_with: "glossary/",
      excluding_slugs: "glossary/",
    });

    console.log("[fetchGlossaryTermOfTheDay] Total glossary terms fetched:", glossaryTerms?.length);

    if (!glossaryTerms || glossaryTerms.length === 0) {
      console.log("[fetchGlossaryTermOfTheDay] No glossary terms found");
      return null;
    }

    // Get date-based seed for consistent daily selection
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    let seed = 0;
    for (let i = 0; i < dateString.length; i++) {
      seed = ((seed << 5) - seed + dateString.charCodeAt(i)) & 0xffffffff;
    }

    // Use seed to select a term consistently for the day
    const selectedIndex = Math.abs(seed) % glossaryTerms.length;
    const result = glossaryTerms[selectedIndex] as GlossaryTerm;
    console.log("[fetchGlossaryTermOfTheDay] Selected term:", result.slug, result.content?.name || result.name);
    return result;
  } catch (error) {
    console.error("Error fetching glossary terms:", error);
    // Fallback to random selection
    try {
      const glossaryTerms = await storyblokApi.getAll("cdn/stories", {
        version: isDraftMode ? "draft" : "published",
        starts_with: "glossary/",
        excluding_slugs: "glossary/",
      });
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
    const webinars = await storyblokApi.getAll("cdn/stories", {
      version: isDraftMode ? "draft" : "published",
      content_type: "webinar",
      starts_with: "events/thehub/",
      excluding_slugs: "events/thehub/",
    });

    console.log("[fetchLatestWebinar] Total webinars fetched:", webinars?.length);

    if (!webinars || webinars.length === 0) {
      console.log("[fetchLatestWebinar] No webinars found");
      return null;
    }

    // Sort by date descending (most recent first)
    const sortedWebinars = webinars.sort((a: Webinar, b: Webinar) => {
      const dateA = a.content?.date
        ? new Date(a.content.date).getTime()
        : a.published_at
          ? new Date(a.published_at).getTime()
          : 0;
      const dateB = b.content?.date
        ? new Date(b.content.date).getTime()
        : b.published_at
          ? new Date(b.published_at).getTime()
          : 0;
      return dateB - dateA;
    });

    const result = sortedWebinars.length > 0 ? (sortedWebinars[0] as Webinar) : null;
    if (result) {
      console.log("[fetchLatestWebinar] Selected webinar:", result.slug, result.content?.title || result.name);
    }
    return result;
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

export default async function Home() {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  
  // Fetch all data in parallel
  const [storyblok, nextEvent, glossaryTerm, latestWebinar, allEvents] = await Promise.all([
    fetchStoryblokData(),
    fetchNextUpcomingEvent(isDraftMode),
    fetchGlossaryTermOfTheDay(isDraftMode),
    fetchLatestWebinar(isDraftMode),
    fetchAllEvents(isDraftMode),
  ]);
  
  const storyBlokStory = storyblok.data.story;
  
  // Get phonetic spelling for glossary term (optimized - only if glossary term exists)
  const phoneticGlossaryTerm = glossaryTerm
    ? await getPhoneticSpelling(glossaryTerm.content.name || glossaryTerm.name || "")
    : null;
  
  // Debug: Log what data we're passing to FeatureCards
  console.log("[Home] Data summary:", {
    hasNextEvent: !!nextEvent,
    hasGlossaryTerm: !!glossaryTerm,
    hasLatestWebinar: !!latestWebinar,
    hasAllEvents: allEvents.length > 0,
    nextEventSlug: nextEvent?.slug,
    glossaryTermSlug: glossaryTerm?.slug,
    webinarSlug: latestWebinar?.slug,
  });

  // Helper function to render Storyblok body with optimization for latest_season_calendar
  const renderStoryblokBody = () => {
    if (!storyBlokStory?.content?.body || storyBlokStory.content.body.length === 0) {
      return null;
    }

    return (
      <>
        {storyBlokStory.content.body.map((blok: any) => {
          // Intercept latest_season_calendar component to pass events prop
          if (blok.component === 'latest_season_calendar') {
            return (
              <LatestSeasonCalendar 
                key={blok._uid} 
                blok={blok} 
                events={allEvents}
              />
            );
          }
          // Render other components normally
          return <StoryblokServerComponent blok={blok} key={blok._uid} />;
        })}
      </>
    );
  };
  
  return (
    <main className="flex-1 flex flex-col gap-20 min-h-screen">
      <Background />
      
      {renderStoryblokBody()}

      {/* Feature Cards - check if blok exists in story content */}
      {storyBlokStory?.content?.feature_cards && (
        <FeatureCards 
          blok={storyBlokStory.content.feature_cards}
          nextEvent={nextEvent}
          glossaryTerm={glossaryTerm}
          latestWebinar={latestWebinar}
          phoneticGlossaryTerm={phoneticGlossaryTerm}
        />
      )}
    </main>
  );
}

async function fetchStoryblokData() {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
	const storyblokApi = getStoryblokApi();
	return await storyblokApi.get(`cdn/stories/home`, { version: isDraftMode ? 'draft' : 'published' });
}