import Link from "next/link";
import AlphabetNav from "@/components/AlphabetNav";
import React from "react";
import { getStoryblokApi } from "@/lib/storyblok";
import { Metadata, ResolvingMetadata } from "next";
import { generatePageMetadata } from '@/lib/metadata';
import { StoryblokStory } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { BeaconMembershipResult } from '@/lib/types/beacon';
import { ArrowUpRight } from "lucide-react";

type CompanyWithGroup = {
  name: string;
  slug?: string;
};

// Cache the Beacon group membership companies fetch for 5 minutes (300 seconds)
// This reduces API calls significantly
const getCachedGroupMembershipCompanies = unstable_cache(
  async () => {
    const beaconAuthToken = process.env.BEACON_AUTH_TOKEN;
    const beaconApiUrl = process.env.BEACON_API_URL;

    if (!beaconAuthToken || !beaconApiUrl) {
      console.error('Beacon API not configured');
      return [];
    }

    try {
      // Fetch all memberships from Beacon API
      const response = await fetch(`${beaconApiUrl}/entities/membership`, {
        headers: {
          'Authorization': `Bearer ${beaconAuthToken}`,
          'Beacon-Application': 'developer_api',
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch from Beacon API: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const results: BeaconMembershipResult[] = data.results || [];

      // Filter for Group Membership type and extract company names
      const companyNamesSet = new Set<string>();
      
      results.forEach((membership) => {
        // Check if this is a Group Membership
        const isGroupMembership = membership.entity?.type?.some(
          (type: string) => type.includes('Group Membership')
        );

        if (isGroupMembership && membership.references && membership.references.length > 0) {
          // Get the last entity in references array (which should be the company)
          const lastReference = membership.references[membership.references.length - 1];
          const companyName = lastReference?.entity?.name;

          if (companyName && typeof companyName === 'string') {
            companyNamesSet.add(companyName);
          }
        }
      });

      // Convert Set to array and sort
      return Array.from(companyNamesSet).sort();
    } catch (error) {
      console.error('Error fetching Beacon group membership companies:', error);
      return [];
    }
  },
  ['beacon-group-membership-companies'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['beacon-companies'],
  }
);

// Cache the Supabase companies lookup map for 5 minutes (300 seconds)
const getCachedCompaniesLookup = unstable_cache(
  async () => {
    const supabase = createSupabaseClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('companies')
      .select('id, name, slug');

    if (error) {
      console.error('Companies lookup error:', error);
      return new Map<string, { slug: string }>();
    }

    // Create a lookup map keyed by normalized company name (lowercase)
    const lookupMap = new Map<string, { slug: string }>();
    
    if (data) {
      data.forEach((company) => {
        if (company.name) {
          const normalizedName = company.name.toLowerCase().trim();
          lookupMap.set(normalizedName, { slug: company.slug || '' });
        }
      });
    }

    return lookupMap;
  },
  ['companies-lookup-map'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['companies'],
  }
);

// Match a company name with Supabase companies
// Returns slug if found, null otherwise
async function matchCompanyWithSupabase(
  companyName: string,
  lookupMap: Map<string, { slug: string }>
): Promise<string | null> {
  // Step 1: Try exact match (case-insensitive)
  const normalizedName = companyName.toLowerCase().trim();
  const exactMatch = lookupMap.get(normalizedName);
  
  if (exactMatch && exactMatch.slug) {
    return exactMatch.slug;
  }

  // Step 2: Try fuzzy match using Supabase ilike query
  const supabase = createSupabaseClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('companies')
    .select('slug')
    .ilike('name', `%${companyName}%`)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return (data as { slug: string | null }).slug || null;
}

export async function generateMetadata(
  { params }: { params: Promise<Record<string, never>> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const parentMetadata = await parent;
  
  try {
    const storyblok = await fetchStoryblokData('members/companies');
    
    if (storyblok?.data?.story?.content) {
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
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
  
  // Fallback to parent metadata
  return await generatePageMetadata({}, parentMetadata);
}

export default async function CompaniesPage() {
  try {
    // Use Promise.all to prevent waterfall - all requests run in parallel
    const [beaconCompanies, companiesLookupRaw, storyblok] = await Promise.all([
      getCachedGroupMembershipCompanies(),
      getCachedCompaniesLookup(),
      fetchStoryblokData('members/companies')
    ]);

    const storyBlokStory = storyblok?.data?.story;

    // Convert cached lookup to Map (unstable_cache may serialize Map to plain object)
    const companiesLookup: Map<string, { slug: string }> = companiesLookupRaw instanceof Map 
      ? companiesLookupRaw 
      : new Map(Object.entries((companiesLookupRaw || {}) as Record<string, { slug: string }>));

    // Match companies with Supabase
    const companiesWithMatches = await Promise.all(
      beaconCompanies.map(async (companyName) => {
        const slug = await matchCompanyWithSupabase(companyName, companiesLookup);
        return {
          name: companyName,
          slug: slug || undefined,
        } as CompanyWithGroup;
      })
    );

    // Sort companies by name
    companiesWithMatches.sort((a, b) => a.name.localeCompare(b.name));

    // Group companies by first letter of name with special grouping for numbers and rare letters
    const groupedCompanies = companiesWithMatches.reduce((acc, company) => {
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
    }, {} as Record<string, CompanyWithGroup[]>);

    return (
      <div className="animate-fade-in">
        {storyBlokStory && (
          <div className="max-w-210 mb-12">
            <StoryblokStory story={storyBlokStory} />
          </div>
        )}
        <AlphabetNav entries={groupedCompanies} ariaLabel="Members by Company navigation" />
        <div className="space-y-8 md:grid md:grid-cols-2 md:gap-5">
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
                  <h2 id={letter} className={`text-6xl col-span-2 md:mb-4 ${index === 0 ? 'mt-0 md:mt-0' : 'md:mt-12'}`}>
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
                  {groupedCompanies[letter].map((company: CompanyWithGroup) => {
                    // If company has a slug, make it a link, otherwise plain text
                    if (company.slug) {
                      return (
                        <Link 
                          key={company.name} 
                          href={`/dir/companies/${company.slug}`}
                          className="break-inside-avoid-column flex items-start gap-4 mb-0 hover:text-qreen-dark transition-all duration-300"
                        >
                          <div>
                            <h3 className="text-[1.375rem] flex items-start gap-1 font-medium">
                              <ArrowUpRight className="w-5 h-5 relative top-1.5" />
                              {company.name}
                            </h3>
                          </div>
                        </Link>
                      );
                    } else {
                      return (
                        <div 
                          key={company.name} 
                          className="break-inside-avoid-column flex items-start gap-4 mb-0"
                        >
                          <div>
                            <h3 className="text-[1.375rem]">{company.name}</h3>
                          </div>
                        </div>
                      );
                    }
                  })}
                </React.Fragment>
              ))
          ) : (
            <p>No companies available.</p>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering companies page:', error);
    // Return a fallback UI instead of throwing
    return (
      <div className="animate-fade-in">
        <div className="max-w-210 mb-12">
          <p>Unable to load page content. Please try again later.</p>
        </div>
      </div>
    );
  }
}

async function fetchStoryblokData(slug: string) {
  try {
    const [{ isEnabled }, storyblokApi] = await Promise.all([
      draftMode(),
      Promise.resolve(getStoryblokApi())
    ]);
    
    const isDraftMode = isEnabled;
    return await storyblokApi.get(`cdn/stories/${slug}`, { version: isDraftMode ? 'draft' : 'published' });
  } catch (error: any) {
    // Handle 404 errors gracefully (story doesn't exist yet)
    const statusCode = error?.response?.status;
    if (statusCode === 404) {
      // Log a simple message instead of an error for expected 404s
      console.log(`Storyblok story not found: ${slug} (404) - this is expected if the story hasn't been created yet`);
      return { data: { story: null } };
    }
    
    // For other errors, only log if it's not a simple 404
    if (statusCode && statusCode !== 404) {
      console.error('Error fetching Storyblok data:', {
        status: statusCode,
        message: error?.message || 'Unknown error',
        slug
      });
    } else if (!statusCode) {
      // Non-HTTP error, might be a different issue
      console.error('Error fetching Storyblok data:', error);
    }
    
    // Return a safe fallback structure
    return { data: { story: null } };
  }
}

