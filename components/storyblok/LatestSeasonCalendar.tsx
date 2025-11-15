/* eslint-disable @typescript-eslint/no-explicit-any */
import { storyblokEditable } from '@storyblok/react/rsc';
import EventPreview from '@/components/EventPreview';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { type Event } from './HomepageDataContext';
import { getStoryblokApi } from '@/lib/storyblok';

type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

interface LatestSeasonCalendarProps {
  blok: {
    link_text?: string;
    [key: string]: any;
  };
  events?: Event[];
}

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

// Fetch events in batches instead of getAll() to reduce bandwidth
async function fetchAllEventsInternal(isDraftMode: boolean): Promise<Event[]> {
  const storyblokApi = getStoryblokApi();
  try {
    // Fetch events in batches
    let allEvents: Event[] = [];
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
  } catch (error) {
    console.error("Error fetching all events:", error);
    return [];
  }
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

function getYearFromDate(dateString: string): number {
  if (!dateString) return new Date().getFullYear();
  const date = new Date(dateString);
  return date.getFullYear();
}

function groupEventsByYearAndSeason(events: any[]): Record<string, Event[]> {
  const grouped: Record<string, Event[]> = {};

  events.forEach(event => {
    const dateString = event.content?.date;
    if (dateString) {
      const season = getSeason(dateString);
      const year = getYearFromDate(dateString);
      const key = `${year}-${season}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    } else {
      // If no date, add to current year Winter as default
      const year = new Date().getFullYear();
      const key = `${year}-Winter`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    }
  });

  return grouped;
}

function getCurrentSeason(): { season: Season; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  let season: Season;
  if (month >= 3 && month <= 5) season = 'Spring';
  else if (month >= 6 && month <= 8) season = 'Summer';
  else if (month >= 9 && month <= 11) season = 'Autumn';
  else season = 'Winter';

  return { season, year };
}

function getFollowingSeason(currentSeason: Season, currentYear: number): { season: Season; year: number } {
  const seasonOrder: Record<Season, number> = {
    Spring: 0,
    Summer: 1,
    Autumn: 2,
    Winter: 3
  };

  const nextSeasonOrder = (seasonOrder[currentSeason] + 1) % 4;
  const followingSeason = Object.keys(seasonOrder).find(
    key => seasonOrder[key as Season] === nextSeasonOrder
  ) as Season;

  // If current season is Winter, following season is in the next year
  const followingYear = currentSeason === 'Winter' ? currentYear + 1 : currentYear;

  return { season: followingSeason, year: followingYear };
}

export default async function LatestSeasonCalendar({ blok, events: eventsProp }: LatestSeasonCalendarProps) {
  // Determine which events to use: context → prop → fetch
  let events: Event[] = [];
  
  if (eventsProp) {
    // Use provided prop (highest priority)
    events = eventsProp;
  } else {
    // Check context for events
    // Note: Since this is a server component, we can't use hooks directly.
    // We'll fetch if no prop is provided (context check will be handled by making this async)
    // Actually, since this is a server component called by StoryblokServerComponent,
    // we need to fetch here if prop is not provided
    const isDraftMode = await getDraftMode();
    events = await fetchAllEventsInternal(isDraftMode);
  }

  // Group events by year and season
  const groupedEvents = groupEventsByYearAndSeason(events);

  // Get current season (calendar season we're currently in)
  const currentSeasonInfo = getCurrentSeason();
  const followingSeasonInfo = getFollowingSeason(currentSeasonInfo.season, currentSeasonInfo.year);

  // Create keys for current and following seasons
  const currentKey = `${currentSeasonInfo.year}-${currentSeasonInfo.season}`;
  const followingKey = `${followingSeasonInfo.year}-${followingSeasonInfo.season}`;

  // Get events for current and following seasons
  const currentSeasonEvents = groupedEvents[currentKey] || [];
  const followingSeasonEvents = groupedEvents[followingKey] || [];

  // Determine which seasons to display
  const hasCurrentEvents = currentSeasonEvents.length > 0;
  const hasFollowingEvents = followingSeasonEvents.length > 0;

  // If no events in current or following season, display nothing
  if (!hasCurrentEvents && !hasFollowingEvents) {
    return null;
  }

  const linkText = blok.link_text || 'View all events';

  // Prepare seasons to display
  const seasonsToDisplay: Array<{ key: string; events: Event[]; displayName: string }> = [];

  if (hasCurrentEvents) {
    seasonsToDisplay.push({
      key: currentKey,
      events: currentSeasonEvents,
      displayName: `${currentSeasonInfo.season} calendar ${currentSeasonInfo.year}`
    });
  }

  // Show following season only if current season also has events
  if (hasFollowingEvents && hasCurrentEvents) {
    seasonsToDisplay.push({
      key: followingKey,
      events: followingSeasonEvents,
      displayName: `${followingSeasonInfo.season} calendar ${followingSeasonInfo.year}`
    });
  }

  return (
    <section {...storyblokEditable(blok)} className="relative space-y-12 bg-qlack text-qaupe">
      <Image 
        src="/EventsCalendarBackground.jpg" 
        alt="Events Background" 
        width={4096 } 
        height={2730} 
        className="absolute inset-0 z-0 w-full h-full object-cover opacity-50" 
      />
      <div className="relative z-10 w-full max-w-maxw mx-auto px-container py-36">
        <div className="md:flex md:gap-4">
          <h2 className="uppercase tracking-[0.03em] basis-36 shrink-0">Events</h2>
          <div>
            {seasonsToDisplay.map((seasonData, seasonIndex) => (
              <div key={seasonData.key}>
                <h2 className="text-6xl tracking-tight mb-18">
                  {seasonData.displayName}
                </h2>
                <div className="space-y-6 max-w-210">
                  {seasonData.events.map((event, eventIndex) => (
                    <React.Fragment key={event.id}>
                      <EventPreview event={event} />
                      {(eventIndex < (seasonData.events.length - 1)) && (
                        <div className="my-8 border-b border-dashed border-qaupe w-full"></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {linkText && (
          <div className="mt-24 text-center">
            <Link href="/calendar" className="inline-flex items-center gap-2 text-base font-medium hover:opacity-80 transition-opacity">
              {linkText} 
              <ArrowUpRight className="w-6 h-6 inline-block" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

