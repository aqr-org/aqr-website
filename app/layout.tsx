import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Navigation from "@/components/Navigation";
import "./globals.css";
import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import StoryblokProvider from "@/components/StoryblokProvider";
import { draftMode } from 'next/headers';
import DraftModeAlert from '@/components/storyblok/DraftModeAlert';
import DraftModeActivate from '@/components/storyblok/DraftModeActivate';
import BackgroundGraphics from "@/components/BackgroundGraphics";
import { BackgroundColorProvider } from "@/components/BackgroundProvider";

const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;

  return (
    <StoryblokProvider>
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
          <Navigation />
          {isDraftMode && (
            <DraftModeAlert />
          )}
          <DraftModeActivate />
          <BackgroundColorProvider>
            <BackgroundGraphics />
            <Suspense fallback={<LoadingAnimation text="Loading companies..." />}>
            <div className="flex-1 w-full max-w-maxw mx-auto px-5 flex flex-col gap-20 min-h-screen">
              {children}
            </div>
            </Suspense>
          </BackgroundColorProvider>
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            AQR Footer
          </p>
        </footer>
      </body>
    </html>
    </StoryblokProvider>
  );
}
