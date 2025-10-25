import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { getStoryblokApi } from "@/lib/storyblok";
import { StoryblokStory } from "@storyblok/react/rsc";
import { draftMode } from 'next/headers';
import React from "react";
import { generatePageMetadata } from '@/lib/metadata';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params and resolve parent metadata in parallel
  const [storyblok, parentMetadata] = await Promise.all([
    fetchStoryblokData('dir/recruitment'),
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
    fetchStoryblokData('dir/recruitment')
  ]);
  const storyblokSectorsStory = storyblokSectorsStoryData.data.story;
  const companies = await supabase.from('companies').select('*').eq('beacon_membership_status', 'Active');
  const companyAreas = await supabase.from('company_areas').select('*');
  const areasMaster = await supabase.from('areas_master').select('*');

  if (companies.error) {console.error("Companies error:", companies.error);}
  if (companyAreas.error) {console.error("Company areas error:", companyAreas.error)}
  if (areasMaster.error) {console.error("Areas master error:", areasMaster.error)}

  const companiesWithActiveSubs = companies.data ? [...companies.data] : [];

  const activeCompanyIds = companiesWithActiveSubs.map(company => company.id);
  
  const uniqueActiveAreasExpertise = companyAreas.data ? companyAreas.data
    .filter(area => {
      const areaMaster = areasMaster.data?.find(areaMaster => areaMaster.area === area.area);
      return areaMaster && areaMaster.category === 'Recruitment Expertise';
    })
    .filter(area => activeCompanyIds.includes(area.company_id))
    .map(area => ({
      area: area.area,
      slug: area.slug
    }))
    .filter((area, index, self) => 
      index === self.findIndex(a => a.area === area.area && a.slug === area.slug)
    ) : [];

  const uniqueAreasWithCount = uniqueActiveAreasExpertise.map(area => ({
    area: area.area,
    slug: area.slug,
    count: companyAreas.data
      ? companyAreas.data
          .filter(a => activeCompanyIds.includes(a.company_id))
          .filter(a => a.area === area.area).length
      : 0
  }));

  return (
    <div className="animate-fade-in">
      <div className="max-w-[41rem] mb-12">
        <StoryblokStory story={storyblokSectorsStory} />
      </div>
      {/* <pre>{JSON.stringify(uniqueAreasWithCount, null, 2)}</pre> */}
      <div className="md:grid md:grid-cols-2 md:gap-5" >
        {uniqueAreasWithCount.map(area => (
          <Link 
            href={`/dir/recruitment/${area.slug}`} 
            key={area.slug}
            className="hover:text-qreen-dark text-qlack"
          >
            <h3 className="text-[1.375rem]">
              {area.area} <span className="text-[1rem]">({area.count})</span>
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