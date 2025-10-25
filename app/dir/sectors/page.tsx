import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { getStoryblokApi } from "@/lib/storyblok";
import { StoryblokStory } from "@storyblok/react/rsc";
import { draftMode } from 'next/headers';
import React from "react";
import { generatePageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params: _params }: { params: Promise<Record<string, never>> }, parent: ResolvingMetadata): Promise<Metadata> {
  // read route params and resolve parent metadata in parallel
  const [storyblok, parentMetadata] = await Promise.all([
    fetchStoryblokData('dir/sectors'),
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

export default async function DirSectorsPage() {
  // Fetch initial data in parallel
  const [supabase, storyblokSectorsStoryData] = await Promise.all([
    createClient(),
    fetchStoryblokData('dir/sectors')
  ]);
  const storyblokSectorsStory = storyblokSectorsStoryData.data.story;
  const companies = await supabase.from('companies').select('*').eq('beacon_membership_status', 'Active');

  if (companies.error) {
    console.error("Companies error:", companies.error);
  }

  const companiesWithActiveSubs = companies.data ? [...companies.data] : [];
  const sectors = companiesWithActiveSubs.map(company => company.type);
  const uniqueSectors = [...new Set(sectors)];
  const uniqueSectorsWithCount = uniqueSectors.map(sector => ({
    sector,
    count: sectors.filter(s => s === sector).length
  }));
  
  return (
    <div className="animate-fade-in">
      <div className="max-w-[41rem] mb-12">
        <StoryblokStory story={storyblokSectorsStory} />
      </div>
      <div className="md:grid md:grid-cols-2 md:gap-5" >
        {uniqueSectorsWithCount.map(sector => (
          <Link 
            href={`/dir/sectors/${sector.sector.toLowerCase().replace(/ /g, '-').replace(/'/g, '')}`} 
            key={sector.sector}
            className="hover:text-qreen-dark text-qlack"
          >
            <h3 className="text-[1.375rem]">
              {sector.sector} <span className="text-[1rem]">({sector.count})</span>
            </h3>
          </Link>
        ))}
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