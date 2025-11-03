"use client";

import { ReactNode, useEffect } from "react";
import { storyblokInit, apiPlugin } from '@storyblok/react';

export default function StoryblokProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    storyblokInit({
      accessToken: process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN,
      use: [apiPlugin],
      // Don't import components here to avoid circular dependency
      // Components are registered server-side in lib/storyblok.ts
      // The bridge works independently using storyblokEditable attributes
      apiOptions: {
        region: 'eu',
      },
      bridge: true,
    });
  }, []);

  return children;
}