/* eslint-disable @next/next/no-img-element */
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { Metadata, ResolvingMetadata } from "next";
import { getStoryblokApi } from "@/lib/storyblok";
import { StoryblokStory } from '@storyblok/react/rsc';
import AQRBusinessDirectorySVG from "@/components/svgs/AQRBusinessDirectorySVG";
import { Company, CompanyArea, CompanyContactInfo } from "@/lib/types/company";
import RenderSidebar from "@/components/render-sidebar";
import { draftMode } from 'next/headers';
import DirectoryFilterBar from "@/components/Directory_Filter_Bar";
import { countries } from "@/lib/countries";

type CompanyWithExtraInfo = Company & {
  company_contact_info?: CompanyContactInfo;
  company_areas?: CompanyArea[];
  ident?: string;
  slug?: string;
};


export async function generateMetadata(
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const storyblok = await fetchStoryblokData('dir');
  const { meta_title, meta_description, og_image } = storyblok.data.story.content;
 
  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: meta_title,
    description: meta_description,
    openGraph: {
      images: [og_image?.filename, ...previousImages],
    },
  }
}

export default async function DirPage() {
  const sidebarData = await fetchStoryblokData('site-settings/directory-sidebar');
  const story = await fetchStoryblokData('dir');
  const sidebar_items = sidebarData.data.story.content.nav_items ;
  const supabase = await createClient();

  const companies = await supabase.from('companies').select('*').eq('beacon_membership_status', 'Active');

  if (companies.error) {
    console.error("Companies error:", companies.error);
  }
  // fetch the company_contact_info for the companies in companies.data, the id of a company matches the company_id in company_contact_info
  const company_contact_info = 
    companies.data 
    ? await supabase.from('company_contact_info').select('*').in('company_id', companies.data.map(company => company.id)) 
    : { data: [], error: null };

  if (company_contact_info.error) {
    console.error("Company contact info error:", company_contact_info.error);
  }
  // add the company_contact_info to the companies.data
  companies.data?.forEach(company => {
    const thiscompany_contact_info = company_contact_info.data?.find(contact => contact.company_id === company.id);
    company.company_contact_info = thiscompany_contact_info;
  });

  const company_areas = 
  companies.data 
    ? await supabase.from('company_areas').select('*').in('company_id', companies.data.map(company => company.id)) 
    : { data: [], error: null };

  if (company_areas.error) {
    console.error("Company areas error:", company_areas.error);
  }
  // add the company_areas to the companies.data
  companies.data?.forEach(company => {
    const thiscompany_areas = company_areas.data?.filter(area => area.company_id === company.id);
    company.company_areas = thiscompany_areas;
  });

  const companiesWithActiveSubs = companies.data ? [...companies.data] : [];

  companiesWithActiveSubs.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  // Group companies by first letter with special grouping for numbers and rare letters
  const groupedCompanies = companiesWithActiveSubs.reduce((acc, company) => {
    const firstChar = company.name.charAt(0).toUpperCase();
    let groupKey: string;
    
    // Group all numbers 0-9 together
    if (/[0-9]/.test(firstChar)) {
      groupKey = '0-9';
    }
    // Group letters X, Y, Z together
    else if (['X', 'Y', 'Z'].includes(firstChar)) {
      groupKey = 'X-Z';
    }
    // All other letters get their own group
    else {
      groupKey = firstChar;
    }
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(company);
    return acc;
  }, {} as Record<string, CompanyWithExtraInfo[]>);
  
  return (
    <main>
      <DirectoryFilterBar />
      <div className="flex-1 w-full max-w-maxw mx-auto px-container flex flex-col gap-20 min-h-screen">
        <div className="flex gap-12 pt-8">
          <aside className="basis-1/4">
            <AQRBusinessDirectorySVG />
            <RenderSidebar sidebar_items={sidebar_items} />
          </aside>
          <div className="basis-3/4">
            {story.data.story && 
              <StoryblokStory story={story.data.story} />
            }
            <Suspense fallback={<LoadingAnimation text="Loading companies..." />}>
              <nav aria-label="Directory navigation">
                <ul className="flex gap-4 mb-8">
                  {Object.keys(groupedCompanies).map(letter => (
                    <li key={letter} className="text-xl text-qreen-dark font-[700]">
                      <Link href={`#${letter}`}>{letter}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="space-y-8">
                {Object.keys(groupedCompanies).length > 0 ? (
                  Object.keys(groupedCompanies)
                    .sort((a, b) => {
                      // Special sorting for group keys
                      if (a === '0-9') return -1; // Numbers first
                      if (b === '0-9') return 1;
                      if (a === 'X-Z') return 1; // X-Z last
                      if (b === 'X-Z') return -1;
                      return a.localeCompare(b); // Regular alphabetical for letters
                    })
                    .map(letter => (
                      <div key={letter} className="space-y-4">
                        <h2 id={letter} className="text-6xl ">
                          {letter}
                          <svg className="h-1 w-full mt-6" width="100%" height="100%">
                            <rect 
                              x="1" y="1" 
                              width="100%" height="100%" 
                              fill="none" 
                              stroke="var(--color-qlack)" 
                              strokeWidth="1" 
                              strokeDasharray="4 4" />
                          </svg>
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                          {groupedCompanies[letter].map((company: CompanyWithExtraInfo) => {
                            const finalSlug = company.ident || company.slug;
                            const companyCountryFlag = countries.find(country => country.name === company.company_contact_info?.country)?.code;
                            const companyAreas = company.company_areas?.map(area => area.area).join(', ');

                            return (
                              <Link 
                                key={company.id} 
                                href={`/dir/${finalSlug}`} 
                                data-country={company.company_contact_info?.country}
                                data-areas={companyAreas}
                                className="break-inside-avoid-column flex items-start gap-4"
                              >
                                <img
                                  alt={company.company_contact_info?.country}
                                  src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${companyCountryFlag || 'UK'}.svg`}
                                  className="w-12 h-auto aspect-[1.5] relative top-[0.33em]"
                                />
                                <div>
                                  <h3 className="text-xl">{company.name}</h3>
                                  <h4 className="uppercase tracking-[0.04em]">{company.type}</h4>
                                </div>
                                
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))
                ) : (
                  <p>No companies available.</p>
                )}
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}

export async function fetchStoryblokData(slug: string) {
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/${slug}`, { version: isDraftMode ? 'draft' : 'published' });
}