/* eslint-disable @typescript-eslint/no-explicit-any */
import { storyblokEditable } from "@storyblok/react/rsc";
import FeatureCardsClient from "./FeatureCardsClient";
import React from "react";
import Image from "next/image";
import MemberCardBG from "@/components/svgs/MemberCardBG";
import { getStoryblokApi } from "@/lib/storyblok";
import { getPhoneticSpelling } from "@/lib/phonetic";
import { unstable_cache } from "next/cache";

// Helper function to get draft mode dynamically (avoids build errors when component is imported in client contexts)
async function getDraftMode(): Promise<boolean> {
  try {
    const { draftMode } = await import("next/headers");
    const { isEnabled } = await draftMode();
    return isEnabled;
  } catch (error) {
    // If we can't get draft mode (e.g., in client context), default to published
    console.warn("Could not get draft mode, defaulting to published:", error);
    return false;
  }
}

interface Event {
  id: string;
  slug: string;
  name: string;
  content: {
    title: string;
    description?: string;
    date?: string;
    hide_time?: boolean;
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

interface FeatureCardsProps {
  blok: any;
  // Props are optional - if not provided, component will fetch its own data
  nextEvent?: Event | null;
  glossaryTerm?: GlossaryTerm | null;
  latestWebinar?: Webinar | null;
  phoneticGlossaryTerm?: string | null;
}

function formatEventDate(dateString?: string, hideTime?: boolean): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (hideTime) return dateStr;
  const timeStr = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateStr} | ${timeStr}h`;
}

async function fetchNextUpcomingEventInternal(isDraftMode: boolean): Promise<Event | null> {
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

async function fetchGlossaryTermOfTheDayInternal(isDraftMode: boolean): Promise<GlossaryTerm | null> {
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

        if (!glossaryTerms || glossaryTerms.length === 0) return null;

        // Use seed to select a term consistently for the day
        const selectedIndex = Math.abs(seed) % glossaryTerms.length;
        return glossaryTerms[selectedIndex] as GlossaryTerm;
      } catch (error) {
        console.error("Error fetching glossary terms:", error);
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

async function fetchLatestWebinarInternal(isDraftMode: boolean): Promise<Webinar | null> {
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

export default async function FeatureCards({ 
  blok, 
  nextEvent: nextEventProp, 
  glossaryTerm: glossaryTermProp, 
  latestWebinar: latestWebinarProp,
  phoneticGlossaryTerm: phoneticGlossaryTermProp 
}: FeatureCardsProps) {
  // If props are not provided (rendered through Storyblok), fetch data ourselves
  const needsDataFetch = nextEventProp === undefined;
  
  let nextEvent: Event | null;
  let glossaryTerm: GlossaryTerm | null;
  let latestWebinar: Webinar | null;
  let phoneticGlossaryTerm: string | null;

  if (needsDataFetch) {
    // Fetch data internally - need to get draft mode first
    const isDraftMode = await getDraftMode();
    
    // Create promises for glossary term and phonetic spelling to parallelize
    const glossaryTermPromise = fetchGlossaryTermOfTheDayInternal(isDraftMode);
    const phoneticPromise = glossaryTermPromise.then(async (term) => {
      if (!term) return null;
      const termName = term.content?.name || term.name || "";
      if (!termName) return null;
      try {
        return await getPhoneticSpelling(termName);
      } catch (error) {
        console.error("Error fetching phonetic spelling:", error);
        return null;
      }
    });
    
    // Fetch all data in parallel (including phonetic spelling)
    const [fetchedEvent, fetchedGlossary, fetchedWebinar, fetchedPhonetic] = await Promise.all([
      fetchNextUpcomingEventInternal(isDraftMode),
      glossaryTermPromise,
      fetchLatestWebinarInternal(isDraftMode),
      phoneticPromise,
    ]);

    nextEvent = fetchedEvent;
    glossaryTerm = fetchedGlossary;
    latestWebinar = fetchedWebinar;
    phoneticGlossaryTerm = fetchedPhonetic;
    
  } else {
    // Use provided props (optimized path from page level)
    nextEvent = nextEventProp ?? null;
    glossaryTerm = glossaryTermProp ?? null;
    latestWebinar = latestWebinarProp ?? null;
    phoneticGlossaryTerm = phoneticGlossaryTermProp ?? null;
  }

  // Use phonetic spelling
  const phoneticTerm = phoneticGlossaryTerm || "";

  const cards = [];

  // Card 1: Latest Event (only if future event exists)
  if (nextEvent) {
    cards.push({
      title: "Latest event",
      linkText: "Learn more",
      linkHref: `/events/${nextEvent.slug}`,
      backgroundLayer1: (
        <div className="w-full h-full bg-qaupe relative">
          <Image src="/EventBackground.jpg" alt="Event Background" fill className="object-cover opacity-30" />
        </div>
      ),
      backgroundLayer2: (
        <div className="w-full h-full bg-qlack">
          <p className="text-qellow p-6 pt-32 translate-y-6 group-hover:translate-y-0 transition-all duration-300 line-clamp-6 xl:line-clamp-10 ">
            {nextEvent.content.description}
          </p>
        </div>
      ),
      content: (
        <div className="w-full space-y-12">
          <p className="group-hover:text-qellow transition-all duration-300">
            {formatEventDate(nextEvent.content.date, nextEvent.content.hide_time)}
          </p>
          <h4 className="text-3xl xl:text-4xl tracking-[-0.03em] group-hover:opacity-0 transition-all duration-300 line-clamp-4">{nextEvent.content.title}</h4>
        </div>
      ),
    });
  }

  // Card 2: Glossary Term of the Day
  if (glossaryTerm) {
    // Extract plain text from description if it's a rich text object
    const getDescriptionText = (description: unknown): string => {
      if (!description) return "";
      if (typeof description === "string") return description;
      if (typeof description === "object" && description !== null) {
        // Try to extract text from rich text structure
        const desc = description as { content?: Array<{ content?: Array<{ text?: string }> }> };
        if (desc.content && Array.isArray(desc.content)) {
          const texts: string[] = [];
          desc.content.forEach((item) => {
            if (item.content && Array.isArray(item.content)) {
              item.content.forEach((textItem) => {
                if (textItem.text) texts.push(textItem.text);
              });
            }
          });
          return texts.join(" ").substring(0, 450); // Limit to 450 chars
        }
      }
      return "";
    };

    cards.push({
      title: "Glossary term of the day",
      linkText: "View Glossary",
      linkHref: `/glossary/${glossaryTerm.slug}`,
      backgroundLayer1: (
        <div className="w-full h-full bg-qlack">
          <img src="/glossary_card_bg.svg" alt="Glossary Background" className="w-full h-full object-cover" />
        </div>
      ),
      backgroundLayer2: (
        <div className="w-full h-full bg-qellow">
          <img src="/glossary_card_bg_hover.svg" alt="Glossary Background" className="w-full h-full object-cover" />
        </div>
      ),
      titleColor: "text-qaupe",
      titleHoverColor: "group-hover:text-qlack",
      buttonColor: "text-qaupe",
      buttonHoverColor: "group-hover:text-qlack",
      content: (
        <div className="w-full @container">
          <h4 className="text-[2.375rem] tracking-[-0.07125rem] leading-none text-qaupe group-hover:text-qlack transition-all duration-300">
            {glossaryTerm.content.name || glossaryTerm.name}
          </h4>
          <p className="text-qaupe  group-hover:text-qlack transition-all duration-300 text-[1.375rem] leading-[1.2] mt-2 mb-8">{phoneticTerm}</p>
          <p className="text-qaupe leading-[1.31] px-4 group-hover:text-qlack transition-all duration-300 line-clamp-4 @[280px]:line-clamp-8">
            {getDescriptionText(glossaryTerm.content.description)}
          </p>
        </div>
      ),
    });
  }

  // Card 3: Membership
  cards.push({
    title: "Membership",
    linkText: "Join AQR today",
    linkHref: "/members/new-membership-application",
    backgroundLayer1: (
      <div className="w-full h-full bg-qreen relative">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <MemberCardBG />
        </div>
      </div>
    ),
    backgroundLayer2: (
      <div className="w-full h-full opacity-0 group-hover:opacity-20 transition-opacity duration-300">
        <video src="/AQRCTAVideoOpt.mp4" playsInline autoPlay muted loop className="w-full h-full object-cover" />
      </div>
    ),
    titleColor: "text-qaupe",
    titleHoverColor: "group-hover:text-qaupe",
    buttonColor: "text-qaupe",
    buttonHoverColor: "group-hover:text-qaupe",
    content: (
      <div className="@container w-full h-full text-center space-y-2 text-qaupe @[300px]:text-[1.375rem] leading-[0.8] flex flex-col items-center justify-center">
        <p>You want to <span className='text-qlack'>develop.</span></p> 
        <p>You want to <span className='text-qlack'>be recognised.</span></p>  
        <p>You feel <span className='text-qlack'>inspired.</span></p>
        
        <p className="text-2xl @[300px]:text-[2.375rem] tracking-[-0.07125rem] my-12">So let's <span className="inline-block relative">
            connect.
            <svg className="absolute top-full left-0 w-full h-auto" width="139" height="7" viewBox="0 0 139 7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.14438 1.12189C43.5164 -1.11302 86.1644 0.227837 128.481 3.0628L136.953 3.65018C137.629 3.69571 138.142 4.28381 138.093 4.95899C138.047 5.64805 137.434 6.16604 136.745 6.09584L128.3 5.36874C114.603 4.16438 99.7652 3.26408 86.0062 2.71366C63.4756 1.78534 40.7499 1.63881 18.2258 2.54722C12.5848 2.8048 6.92089 3.10945 1.32185 3.5719C-0.201771 3.68599 -0.594118 1.33936 1.14078 1.12516L1.14438 1.12189Z" fill="#FCFAF0"/>
            </svg>

          </span></p>
      </div>
    ),
  });

  // Card 4: Latest Webinar
  if (latestWebinar) {
    cards.push({
      title: "Webinar",
      linkText: "View Webinar",
      linkHref: `/events/thehub/${latestWebinar.slug}`,
      backgroundLayer1: (
        <div className="w-full h-full relative">
          <Image 
            src="/webinar_card_bg.jpg" 
            alt="Webinar Background" 
            fill 
            className="object-cover" 
          />
        </div>
      ),
      backgroundLayer2: (
        <div className="w-full h-full bg-qitrus">
          <p className="p-6 pt-16 translate-y-6 group-hover:translate-y-0 transition-all duration-300 text-lg line-clamp-4">
            { (latestWebinar.content.content && latestWebinar.content.content.content &&  latestWebinar.content.content.content[0] && latestWebinar.content.content.content[0].content && latestWebinar.content.content.content[0].content[0]) 
              ? latestWebinar.content.content.content[0].content[0].text
              : latestWebinar.content.title
             }
          </p>
        </div>
      ),
      titleColor: "text-qlack",
      titleHoverColor: "group-hover:text-qlack",
      buttonColor: "text-qlack",
      buttonHoverColor: "group-hover:text-qlack",
      content: (
        <div className="w-full flex flex-col justify-between h-full">
          <h4 className="text-3xl xl:text-4xl tracking-[-0.03em] group-hover:opacity-0 transition-all duration-300">
            {latestWebinar.content.title || latestWebinar.name}
          </h4>
          {latestWebinar.content.description && (
            <p className="">
              {typeof latestWebinar.content.description === "string"
                ? latestWebinar.content.description
                : JSON.stringify(latestWebinar.content.description)}
            </p>
          )}
        </div>
      ),
    });
  }

  // Don't render if no cards (shouldn't happen as membership is always there, but just in case)
  if (cards.length === 0) return null;

  return (
    <div {...storyblokEditable(blok)} className="w-full max-w-maxw mx-auto px-container my-18" style={{
      maskImage: "linear-gradient(to right, transparent 0, black 4rem, black calc(100% - 4rem), transparent 100%)",
      WebkitMaskImage: "linear-gradient(to right, transparent 0, black 4rem, black calc(100% - 4rem), transparent 100%)",
    }}>
      <h2 className="uppercase tracking-[0.03em] my-8">{blok.title}</h2>
      <FeatureCardsClient cards={cards} />
    </div>
  );
}

