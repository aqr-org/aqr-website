import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { getStoryblokApi } from "@/lib/storyblok";
import AQRBusinessDirectorySVG from "@/components/svgs/AQRBusinessDirectorySVG";
import RenderSidebar from "@/components/render-sidebar";
import { draftMode } from 'next/headers';
import DirectoryFilterBar from "@/components/Directory_Filter_Bar";
import React from "react";

export default async function SlugPageLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode, 
  params: Promise<{ parent: string }> | { parent: string }
}) {
  // Fetch initial data in parallel

  const resolvedParams = params instanceof Promise ? await params : params;
  const { parent } = resolvedParams;

  let sidebarPath = '';
  let title = '';

  if (parent === 'careers' || parent === 'resources' || parent === 'podcasts' ) {
    sidebarPath = 'site-settings/resources-sidebar';
    title = 'Resources';
  }
  else if (parent === 'about' || parent === 'heritage') {
    sidebarPath = 'site-settings/about-sidebar';
    title = 'About';
  }
  else if (parent === 'awards') {
    sidebarPath = 'site-settings/awards-sidebar';
    title = 'Awards';
  }
  else if (parent === 'calendar' || parent === 'events' || parent === 'podcasts') {
    sidebarPath = 'site-settings/whatson-sidebar';
    title = 'What\'s On';
  }
  else if (parent === 'members-only-content') {
    sidebarPath = 'site-settings/members-only-sidebar';
    title = 'Members exclusive content';
  }
  else {
    sidebarPath = 'site-settings/directory-sidebar';
    title = 'Directory';
  }
  
  const [sidebarData] = await Promise.all([
    fetchStoryblokData(sidebarPath),
  ]);
  
  const sidebar_items = sidebarData.data.story.content.nav_items;

  return (
    <div className="flex-1 w-full max-w-maxw mx-auto px-container min-h-screen">
      <div className="flex flex-col-reverse md:flex-row md:pt-4">
          <aside className="p-6 md:p-0 md:basis-1/4 md:pr-8 md:box-border bg-qlack/5 md:bg-transparent rounded-lg mt-16 md:mt-0">
            <h3 className="text-xl md:hidden text-qlack mb-4">More in {title}:</h3>
            <RenderSidebar sidebar_items={sidebar_items} />
          </aside>
        <div className="group md:basis-3/4">
          <Suspense fallback={
            <div className="w-full min-h-[600px] md:min-h-[800px] flex items-center justify-center">
              <LoadingAnimation text="Loading..." />
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