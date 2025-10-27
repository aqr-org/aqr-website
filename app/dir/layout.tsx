import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { getStoryblokApi } from "@/lib/storyblok";
import AQRBusinessDirectorySVG from "@/components/svgs/AQRBusinessDirectorySVG";
import RenderSidebar from "@/components/render-sidebar";
import { draftMode } from 'next/headers';
import DirectoryFilterBar from "@/components/Directory_Filter_Bar";
import React from "react";

export default async function DirPageLayout({ children }: { children: React.ReactNode }) {
  // Fetch initial data in parallel
  const [sidebarData] = await Promise.all([
    fetchStoryblokData('site-settings/directory-sidebar'),
  ]);
  
  const sidebar_items = sidebarData.data.story.content.nav_items;

  return (
    <main>
      <DirectoryFilterBar />
      <div className="flex-1 w-full max-w-maxw mx-auto px-container min-h-screen">
        <div className="md:flex md:pt-4">
          <aside className="pb-8 md:pb-0 md:basis-1/4 md:pr-8 md:box-border">
            <div className="hidden md:block">
              <AQRBusinessDirectorySVG />
            </div>
            <RenderSidebar sidebar_items={sidebar_items} />
          </aside>
          <div id="directory-list" className="group md:basis-3/4" data-liststyle="letters">
            <Suspense fallback={<LoadingAnimation text="Loading..." />}>
              {children}
            </Suspense>
          </div>
        </div>
      </div>
    </main>
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