import { NavigationLinkData } from "@/lib/types/navigation";
import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import { NewsletterSignUp } from "@/components/NewsletterSignUp";
import { CTABlock } from "@/components/CTABlock";
import { render } from "storyblok-rich-text-react-renderer";
import { createClient } from "@/lib/supabase/server";

interface FooterData {
  linklist_1: NavigationLinkData[];
  linklist_2: NavigationLinkData[];
  linklist_3: NavigationLinkData[];
  address: string;
  social_links: NavigationLinkData[];
  copyright: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function Footer({ footerData }: { footerData: any }) {
  // Check if user is logged in
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;

  // TODO: Replace with actual FooterClient component when footer structure is known
  return (
    <section id="bottom">
      {!isLoggedIn && <CTABlock />}
      <NewsletterSignUp />
      <footer className="w-full bg-qaupe text-qreen-dark">
        <div className="max-w-maxw mx-auto flex flex-col md:flex-row items-start py-16 font-medium justify-between gap-8 px-container">
          {footerData ? (
            <>
              <div className="flex gap-16 justify-between w-full md:w-auto">
                <div className="flex flex-col gap-2 basis-1/3">
                  {footerData.linklist_1.map((link: NavigationLinkData) => (
                    <Link href={link.link?.cached_url || ''} key={link.name}>
                      {link.name}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-2 basis-1/3">
                  {footerData.linklist_2.map((link: NavigationLinkData) => (
                    <Link href={link.link?.cached_url || ''} key={link.name}>
                      {link.name}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-2 basis-1/3">
                  {footerData.linklist_3.map((link: NavigationLinkData) => (
                    <Link href={link.link?.cached_url || ''} key={link.name}>
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex w-full md:w-auto flex-col md:flex-row items-start gap-12 md:gap-24">
                <div>
                  {render(footerData.address)}
                </div>
                <div className="flex flex-row justify-between md:flex-col items-end gap-2 text-qreen-dark w-full md:w-auto">
                  {footerData.social_links.map((link: NavigationLinkData) => (
                    <Link href={link.link?.cached_url || ''} key={link.name} className="flex items-center gap-1">
                      {link.name} <ArrowUpRight className="w-5 h-5 inline-block" />
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p>AQR Footer</p>
          )}
        </div>
        <div className="bg-qreen text-qaupe pt-8 pb-4">
          <p className="max-w-maxw mx-auto px-container">
            {footerData.copyright}
          </p>
        </div>
      </footer>
    </section>
  );
}