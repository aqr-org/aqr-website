import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AlphabetNav from "@/components/AlphabetNav";
import React from "react";
import { getStoryblokApi } from "@/lib/storyblok";
import { Metadata, ResolvingMetadata } from "next";
import { generatePageMetadata } from '@/lib/metadata';
import { StoryblokStory } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';

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
  const [storyblok, parentMetadata] = await Promise.all([
    fetchStoryblokData('members'),
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

export default async function ComnpaniesPage() {
  const supabase = await createClient();

  // Use Promise.all to prevent waterfall - both requests run in parallel
  const [members, storyblok] = await Promise.all([
    supabase.from('members').select('*').eq('beacon_membership_status', 'Active'),
    fetchStoryblokData('members')
  ]);

  const storyBlokStory = storyblok.data.story;

  if (members.error) {
    console.error("Members error:", members.error);
  }
  
  const membersWithActiveSubs = members.data ? [...members.data] : [];

  membersWithActiveSubs.sort((a, b) => {
    return a.lastname.localeCompare(b.lastname);
  });

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
      <div className="max-w-210 mb-12">
        <StoryblokStory story={storyBlokStory} />
      </div>
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
}

async function fetchStoryblokData(slug: string) {
  const [{ isEnabled }, storyblokApi] = await Promise.all([
    draftMode(),
    Promise.resolve(getStoryblokApi())
  ]);
  
  const isDraftMode = isEnabled;
  return await storyblokApi.get(`cdn/stories/${slug}`, { version: isDraftMode ? 'draft' : 'published' });
}