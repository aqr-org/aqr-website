'use client';

import React, { createContext, useContext, ReactNode } from 'react';

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

interface HomepageData {
  allEvents: Event[];
  nextEvent: Event | null;
  glossaryTerm: GlossaryTerm | null;
  latestWebinar: Webinar | null;
  phoneticGlossaryTerm: string | null;
}

const HomepageDataContext = createContext<HomepageData | null>(null);

export interface HomepageDataProviderProps {
  children: ReactNode;
  allEvents: Event[];
  nextEvent: Event | null;
  glossaryTerm: GlossaryTerm | null;
  latestWebinar: Webinar | null;
  phoneticGlossaryTerm: string | null;
}

export function HomepageDataProvider({
  children,
  allEvents,
  nextEvent,
  glossaryTerm,
  latestWebinar,
  phoneticGlossaryTerm,
}: HomepageDataProviderProps) {
  const value: HomepageData = {
    allEvents,
    nextEvent,
    glossaryTerm,
    latestWebinar,
    phoneticGlossaryTerm,
  };

  return (
    <HomepageDataContext.Provider value={value}>
      {children}
    </HomepageDataContext.Provider>
  );
}

export function useHomepageData(): HomepageData | null {
  return useContext(HomepageDataContext);
}

// Export types for use in other files
export type { Event, GlossaryTerm, Webinar, HomepageData };

