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
          {!isDraftMode && 
            <DraftModeActivate />
          }
          <BackgroundColorProvider>
            <BackgroundGraphics />
            <Suspense fallback={<LoadingAnimation text="Loading companies..." />}>
              {children}
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
