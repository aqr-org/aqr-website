import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory, storyblokEditable } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';
import { HomepageDataProvider } from '@/components/storyblok/HomepageDataContext';
import { unstable_cache } from 'next/cache';

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
  // Calculate date-based seed for cache key
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const cacheKey = `glossary-term-${dateString}-${isDraftMode ? 'draft' : 'published'}`;

  // Cache the fetch operation for 24 hours (86400 seconds)
  // This ensures we only fetch once per day, regardless of how many times the component renders
  const getCachedTerm = unstable_cache(
    async () => {
      const storyblokApi = getStoryblokApi();

      try {
        // Calculate seed for selecting the term
        let seed = 0;
        for (let i = 0; i < dateString.length; i++) {
          seed = ((seed << 5) - seed + dateString.charCodeAt(i)) & 0xffffffff;
        }

        // Fetch first page of glossary terms (limited to 100 per page for efficiency)
        const response = await storyblokApi.get("cdn/stories", {
          version: isDraftMode ? "draft" : "published",
          starts_with: "glossary/",
          excluding_slugs: "glossary/",
          per_page: 100,
        });

        const glossaryTerms = response.data?.stories || [];

        if (!glossaryTerms || glossaryTerms.length === 0) {
          return null;
        }

        // Use seed to select a term consistently for the day
        const selectedIndex = Math.abs(seed) % glossaryTerms.length;
        return glossaryTerms[selectedIndex] as GlossaryTerm;
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
    },
    [cacheKey],
    {
      revalidate: 86400, // 24 hours in seconds
      tags: [`glossary-term-${dateString}`],
    }
  );

  return getCachedTerm();
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
      sort_by: "content.date:desc", // Sort by content date descending
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
  const { getPhoneticSpelling } = await import('@/lib/phonetic');
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

  return (
    <div className="flex-1 flex flex-col gap-20 min-h-screen" {...storyblokEditable(storyBlokStory)}>
      <HomepageDataProvider
        allEvents={allEvents}
        nextEvent={nextEvent}
        glossaryTerm={glossaryTerm}
        latestWebinar={latestWebinar}
        phoneticGlossaryTerm={phoneticGlossaryTerm}
      >
        {/* Reserve space to prevent footer layout shift during initial render */}
        <div className="w-full min-h-[1000px] md:min-h-[1200px]">
          <StoryblokStory story={storyBlokStory} />
        </div>
      </HomepageDataProvider>
    </div>
  );
}


async function fetchStoryblokData() {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
	const storyblokApi = getStoryblokApi();
	return await storyblokApi.get(`cdn/stories/home`, { version: isDraftMode ? 'draft' : 'published' });
}