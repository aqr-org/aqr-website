import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import "./globals.css";
import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import StoryblokProvider from "@/components/StoryblokProvider";
import { draftMode } from 'next/headers';
import DraftModeAlert from '@/components/storyblok/DraftModeAlert';
import DraftModeActivate from '@/components/storyblok/DraftModeActivate';
import BackgroundGraphics from "@/components/BackgroundGraphics";
import Background from "@/components/Background";
import { BackgroundColorProvider } from "@/components/BackgroundProvider";
import { getStoryblokApi } from '@/lib/storyblok';
import { NavigationLinkData } from '@/lib/types/navigation';

const defaultUrl = process.env.SITE_URL
  ? process.env.SITE_URL
  : "https://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "AQR: Association for Qualitative Research, UK and worldwide",
  description: "AQR is the UK's principal authority on qual research, the hub of qualitative excellence, packed with info about research, organisations, methods",
  openGraph: {
    images: [`/og-image-base.jpg`],
  }
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

// Helper function to recursively map navigation items
const mapNavigationItem = (item: NavigationLinkData): NavigationLinkData => ({
  name: item.name,
  component: item.component || '',
  link: {
    cached_url: item.link?.cached_url || ''
  },
  dropdown_menu: item.dropdown_menu?.map((dropdownItem) => 
    mapNavigationItem(dropdownItem)
  ),
  dropdown_menu_2: item.dropdown_menu_2?.map((dropdownItem) => 
    mapNavigationItem(dropdownItem)
  ),
  dropdown_menu_3: item.dropdown_menu_3?.map((dropdownItem) => 
    mapNavigationItem(dropdownItem)
  )
});

// Async component for Navigation that fetches its own data
async function NavigationAsync() {
  try {
    const { isEnabled } = await draftMode();
    const isDraftMode = isEnabled;
    const storyblokApi = getStoryblokApi();
    
    const navigationResponse = await storyblokApi.get('cdn/stories', { 
      version: isDraftMode ? 'draft' : 'published',
      starts_with: 'site-settings/main-navigation',
      resolve_links: 'url'
    });

    const navigationData = {
      links: [] as NavigationLinkData[]
    };

    if (navigationResponse.data?.stories[0]?.content?.nav_items) {
      navigationData.links = navigationResponse.data.stories[0].content.nav_items.map(mapNavigationItem);
    }

    return <Navigation links={navigationData.links} />;
  } catch (error: any) {
    // Silently handle prerendering errors to avoid build failures
    if (error?.message?.includes('prerender') || error?.digest === 'HANGING_PROMISE_REJECTION') {
      return <Navigation links={[]} />;
    }
    console.error('Error fetching navigation data from Storyblok:', error);
    return <Navigation links={[]} />;
  }
}

// Async component for Footer that fetches its own data
async function FooterAsync() {
  try {
    const { isEnabled } = await draftMode();
    const isDraftMode = isEnabled;
    const storyblokApi = getStoryblokApi();
    
    const footerResponse = await storyblokApi.get('cdn/stories', {
      version: isDraftMode ? 'draft' : 'published',
      starts_with: 'site-settings/footer',
      resolve_links: 'url'
    });

    const footerData = footerResponse.data?.stories[0]?.content || null;

    return <Footer footerData={footerData} />;
  } catch (error: any) {
    // Silently handle prerendering errors to avoid build failures
    if (error?.message?.includes('prerender') || error?.digest === 'HANGING_PROMISE_REJECTION') {
      return <Footer footerData={null} />;
    }
    console.error('Error fetching footer data from Storyblok:', error);
    return <Footer footerData={null} />;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // No longer blocking on navigation/footer data - layout renders immediately
  return (
    <StoryblokProvider>
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased w-full overflow-x-hidden`}>
          {/* Navigation streams in progressively */}
          <Suspense fallback={<div className="min-h-[120px]" />}>
            <NavigationAsync />
          </Suspense>
          <DraftModeWrapper />
          <BackgroundColorProvider>
            <Background />
            <BackgroundGraphics />
            {children}
          </BackgroundColorProvider>
          {/* Footer streams in progressively */}
          <Suspense fallback={<div className="min-h-[200px]" />}>
            <FooterAsync />
          </Suspense>
      </body>
    </html>
    </StoryblokProvider>
  );
}

// Separate async component for draft mode indicators (non-blocking)
async function DraftModeWrapper() {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  
  return (
    <>
      {isDraftMode && <DraftModeAlert />}
      {!isDraftMode && <DraftModeActivate />}
    </>
  );
}
