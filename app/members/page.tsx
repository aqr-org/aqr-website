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

type MemberWithGroup = {
  id: string;
  slug?: string;
  lastname: string;
  firstname: string;
  organisation?: string;
  lastname_sort_key?: string;
};

export async function generateMetadata(
  { params }: { params: Promise<Record<string, never>> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const parentMetadata = await parent;
  
  try {
    const storyblok = await fetchStoryblokData('members');
    
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

// Cache the members fetch for 5 minutes (300 seconds)
// This reduces database calls significantly
// Using a simple Supabase client without cookies for read-only public data
const getCachedMembers = unstable_cache(
  async () => {
    // Create a simple client without cookies for read-only public queries
    const supabase = createSupabaseClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
    );
    
    const { data, error } = await supabase
      .from('members')
      .select('id, slug, lastname, firstname, organisation')
      .eq('beacon_membership_status', 'Active')
      .order('lastname', { ascending: true });
    
    if (error) {
      console.error("Members error:", error);
      return [];
    }
    
    return data || [];
  },
  ['active-members-list'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['members'],
  }
);

export default async function ComnpaniesPage() {
  try {
    // Use Promise.all to prevent waterfall - both requests run in parallel
    const [members, storyblok] = await Promise.all([
      getCachedMembers(),
      fetchStoryblokData('members')
    ]);

    const storyBlokStory = storyblok?.data?.story;
    
    const membersWithActiveSubs = members;

    // Group members by first letter of lastname with special grouping for numbers and rare letters
    const groupedMembers = membersWithActiveSubs.reduce((acc, member) => {
      const firstChar = member.lastname.charAt(0).toUpperCase();
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
      acc[groupKey].push(member);
      return acc;
    }, {} as Record<string, MemberWithGroup[]>);

    return (
      <div className="animate-fade-in">
        {storyBlokStory && (
          <div className="max-w-210 mb-12">
            <StoryblokStory story={storyBlokStory} />
          </div>
        )}
        <nav aria-label="Directory navigation" className="group-data-[liststyle=filters]:hidden sticky top-0 py-4 -mt-4 bg-qaupe z-10">
          <AlphabetNav entries={groupedMembers} />
        </nav>
        <div className="space-y-8 md:grid md:grid-cols-2 md:gap-5">
          {Object.keys(groupedMembers).length > 0 ? (
            Object.keys(groupedMembers)
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
                  {groupedMembers[letter].map((member: MemberWithGroup) => {
                    return (
                      <Link 
                        key={member.id} 
                        href={`/members/${member.slug}`}
                        className="break-inside-avoid-column flex items-start gap-4 mb-0"
                      >
                        <div>
                          <h3 className="text-[1.375rem]">{member.lastname}, {member.firstname}</h3>
                          <h4 className="uppercase tracking-[0.04em]">{member.organisation}</h4>
                        </div>
                      </Link>
                    );
                  })}
                </React.Fragment>
              ))
          ) : (
            <p>No members available.</p>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering members page:', error);
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
  } catch (error) {
    console.error('Error fetching Storyblok data:', error);
    // Return a safe fallback structure
    return { data: { story: null } };
  }
}