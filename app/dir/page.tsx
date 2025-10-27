/* eslint-disable @next/next/no-img-element */
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { getStoryblokApi } from "@/lib/storyblok";
import { Company, CompanyArea, CompanyContactInfo } from "@/lib/types/company";
import { draftMode } from 'next/headers';
import { countries } from "@/lib/countries";
import React from "react";
import AlphabetNav from "@/components/AlphabetNav";
import { generatePageMetadata } from '@/lib/metadata';


type CompanyWithExtraInfo = Company & {
  company_contact_info?: CompanyContactInfo;
  company_areas?: CompanyArea[];
  ident?: string;
  slug?: string;
};


export async function generateMetadata(
  { params }: { params: Promise<Record<string, never>> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const [storyblok, parentMetadata] = await Promise.all([
    fetchStoryblokData('dir'),
    parent
  ]);
  
  const { meta_title, meta_description, og_image } = storyblok.data.story.content;
  
  return await generatePageMetadata(
    {
      meta_title,
      meta_description,
      og_image
    },
    parentMetadata
  );
}

export default async function DirPage() {
  // Fetch initial data in parallel
  const [supabase] = await Promise.all([
    createClient()
  ]);
  
  const companies = await supabase.from('companies').select('*').eq('beacon_membership_status', 'Active');

  if (companies.error) {
    console.error("Companies error:", companies.error);
  }

  // Fetch company contact info and areas in parallel
  const [company_contact_info, company_areas] = await Promise.all([
    companies.data 
      ? supabase.from('company_contact_info').select('*').in('company_id', companies.data.map(company => company.id))
      : Promise.resolve({ data: [], error: null }),
    companies.data 
      ? supabase.from('company_areas').select('*').in('company_id', companies.data.map(company => company.id))
      : Promise.resolve({ data: [], error: null })
  ]);

  // More robust error handling
  if (company_contact_info.error) {
    console.error("Company contact info error:", company_contact_info.error);
  }
  if (company_areas.error) {
    console.error("Company areas error:", company_areas.error);
  }

  // Add the company_contact_info to the companies.data
  companies.data?.forEach(company => {
    const thiscompany_contact_info = company_contact_info.data?.find(contact => contact.company_id === company.id);
    company.company_contact_info = thiscompany_contact_info;
  });

  // Add the company_areas to the companies.data
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
    <main className="animate-fade-in">
      <nav aria-label="Directory navigation" className="group-data-[liststyle=filters]:hidden sticky top-0 py-4 -mt-4 bg-qaupe z-10">
        <AlphabetNav entries={groupedCompanies} />
      </nav>
      <div className="space-y-8 md:grid md:grid-cols-2 md:gap-5" >
        <div className="text-2xl border-b col-span-2 group-data-[liststyle=filters]:block hidden">
          Filter Results:
        </div>
        {Object.keys(groupedCompanies).length > 0 ? (
          Object.keys(groupedCompanies)
            .sort((a, b) => {
              // Special sorting for group keys
              if (a === '0-9') return 1; // Numbers first
              if (b === '0-9') return -1;
              if (a === 'X-Z') return 1; // X-Z last
              if (b === 'X-Z') return -1;
              return a.localeCompare(b); // Regular alphabetical for letters
            })
            .map((letter, index) => (
              <React.Fragment key={letter}>
                <h2 id={letter} className={`text-6xl col-span-2 group-data-[liststyle=filters]:hidden md:mb-4 ${index === 0 ? 'mt-0 md:mt-0' : 'md:mt-12'}`}>
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
                {groupedCompanies[letter].map((company: CompanyWithExtraInfo) => {
                  const finalSlug = company.ident || company.slug;
                  const companyCountryFlag = countries.find(country => country.name === company.company_contact_info?.country)?.code;
                  const companyAreas = company.company_areas?.map(area => area.area).join(', ');

                  return (
                    <Link 
                      key={company.id} 
                      href={`/dir/companies/${finalSlug}`} 
                      data-country={company.company_contact_info?.country}
                      data-areas={companyAreas}
                      data-companytype={company.type}
                      className="break-inside-avoid-column flex items-start gap-4 mb-0"
                    >
                      {(companyCountryFlag && companyCountryFlag != 'GB') &&
                        <img
                          alt={company.company_contact_info?.country}
                          src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${companyCountryFlag || 'UK'}.svg`}
                          className="w-12 h-auto aspect-[1.5] relative top-[0.33em]"
                        />
                      }
                      {(companyCountryFlag && companyCountryFlag === 'GB') &&
                        <span className="w-12 h-auto aspect-[1.5] relative top-[0.33em]"> </span>
                      }
                      <div>
                        <h3 className="text-[1.375rem]">{company.name}</h3>
                        <h4 className="uppercase tracking-[0.04em]">{company.type}</h4>
                      </div>
                      
                    </Link>
                  );
                })}
              </React.Fragment>
            ))
        ) : (
          <p>No companies available.</p>
        )}
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
  return await storyblokApi.get(`cdn/stories/${slug}`, { version: isDraftMode ? 'draft' : 'published' });
}