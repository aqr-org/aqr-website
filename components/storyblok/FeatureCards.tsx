/* eslint-disable @typescript-eslint/no-explicit-any */
import { storyblokEditable } from "@storyblok/react/rsc";
import { getStoryblokApi } from "@/lib/storyblok";
import FeatureCardsClient from "./FeatureCardsClient";
import React from "react";
import Image from "next/image";
import { getPhoneticSpelling } from '@/lib/phonetic';
import MemberCardBG from "@/components/svgs/MemberCardBG";


interface FeatureCardsProps {
  blok: any;
}

// Helper to check draft mode without importing next/headers at module level
async function getDraftMode(): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return !!cookieStore.get("__prerender_bypass");
  } catch {
    // If cookies() is not available (e.g., in client context), default to published
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

async function fetchNextUpcomingEvent(): Promise<Event | null> {
  const isDraftMode = await getDraftMode();
  const storyblokApi = getStoryblokApi();

  try {
    const events = await storyblokApi.getAll("cdn/stories", {
      version: isDraftMode ? "draft" : "published",
      content_type: "event",
      starts_with: "events/",
      excluding_slugs: "events/",
    });

    if (!events || events.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter and sort future events
    const futureEvents = events
      .filter((event: Event) => {
        if (!event.content?.date) return false;
        const eventDate = new Date(event.content.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      })
      .sort((a: Event, b: Event) => {
        const dateA = a.content?.date ? new Date(a.content.date).getTime() : Infinity;
        const dateB = b.content?.date ? new Date(b.content.date).getTime() : Infinity;
        return dateA - dateB;
      });

    return futureEvents.length > 0 ? (futureEvents[0] as Event) : null;
  } catch (error) {
    console.error("Error fetching events:", error);
    return null;
  }
}

async function fetchGlossaryTermOfTheDay(): Promise<GlossaryTerm | null> {
  const isDraftMode = await getDraftMode();
  const storyblokApi = getStoryblokApi();

  try {
    const glossaryTerms = await storyblokApi.getAll("cdn/stories", {
      version: isDraftMode ? "draft" : "published",
      starts_with: "glossary/",
      excluding_slugs: "glossary/",
    });

    if (!glossaryTerms || glossaryTerms.length === 0) return null;

    // Get date-based seed for consistent daily selection
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    let seed = 0;
    for (let i = 0; i < dateString.length; i++) {
      seed = ((seed << 5) - seed + dateString.charCodeAt(i)) & 0xffffffff;
    }

    // Use seed to select a term consistently for the day
    const selectedIndex = Math.abs(seed) % glossaryTerms.length;
    return glossaryTerms[selectedIndex] as GlossaryTerm;
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

async function fetchLatestWebinar(): Promise<Webinar | null> {
  const isDraftMode = await getDraftMode();
  const storyblokApi = getStoryblokApi();

  try {
    const webinars = await storyblokApi.getAll("cdn/stories", {
      version: isDraftMode ? "draft" : "published",
      content_type: "webinar",
      starts_with: "events/thehub/",
      excluding_slugs: "events/thehub/",
    });

    if (!webinars || webinars.length === 0) return null;

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

    return sortedWebinars.length > 0 ? (sortedWebinars[0] as Webinar) : null;
  } catch (error) {
    console.error("Error fetching webinars:", error);
    return null;
  }
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

export default async function FeatureCards({ blok }: FeatureCardsProps) {
  // Fetch all data in parallel
  const [nextEvent, glossaryTerm, latestWebinar] = await Promise.all([
    fetchNextUpcomingEvent(),
    fetchGlossaryTermOfTheDay(),
    fetchLatestWebinar(),
  ]);

  const phoneticGlossaryTerm = await getPhoneticSpelling(glossaryTerm?.content.name || glossaryTerm?.name || "");


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
          <h4 className="text-[2.375rem] tracking-[-0.07125rem] text-qaupe group-hover:text-qlack transition-all duration-300">
            {glossaryTerm.content.name || glossaryTerm.name}
          </h4>
          <p className="text-qaupe  group-hover:text-qlack transition-all duration-300 text-[1.375rem] mb-8">{phoneticGlossaryTerm}</p>
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
    <div {...storyblokEditable(blok)} className="w-full my-18">
      <h2 className="uppercase tracking-[0.03em] my-8">{blok.title}</h2>
      <FeatureCardsClient cards={cards} />
    </div>
  );
}

