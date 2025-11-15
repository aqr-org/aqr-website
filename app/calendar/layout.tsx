import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { getStoryblokApi } from "@/lib/storyblok";
import RenderSidebar from "@/components/render-sidebar";
import { draftMode } from 'next/headers';
import React from "react";

export default async function CalendarPageLayout({ children }: { children: React.ReactNode }) {
  // Fetch initial data in parallel
  const [sidebarData] = await Promise.all([
    fetchStoryblokData('site-settings/whatson-sidebar'),
  ]);
  
  const sidebar_items = sidebarData.data.story.content.nav_items;
  
  return (
      <div className="flex-1 w-full max-w-maxw mx-auto px-container min-h-screen">
       <div className="flex flex-col-reverse md:flex-row md:pt-4">
          <aside className="p-6 md:p-0 md:basis-1/4 md:pr-8 md:box-border bg-qlack/5 md:bg-transparent rounded-lg mt-16 md:mt-0">
            <h3 className="text-xl md:hidden text-qlack mb-4">More in What's On:</h3>
            <RenderSidebar sidebar_items={sidebar_items} />
          </aside>
          <div className="group md:basis-3/4">
            <Suspense fallback={
              <div className="w-full min-h-[600px] md:min-h-[800px] flex items-center justify-center">
                <LoadingAnimation text="Loading Resources..." />
              </div>
            }>
               {children}
            </Suspense>
          </div>
        </div>
      </div>
  );
}

async function fetchStoryblokData(slug: string) {
  const [{ isEnabled }, storyblokApi] = await Promise.all([
    draftMode(),
    Promise.resolve(getStoryblokApi())
  ]);
  
  const isDraftMode = isEnabled;
  return await storyblokApi.get(`cdn/stories/${slug}`, { 
    version: isDraftMode ? 'draft' : 'published',
    resolve_links: 'url'
  });
}