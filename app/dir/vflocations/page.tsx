import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { getStoryblokApi } from "@/lib/storyblok";
import { StoryblokStory } from "@storyblok/react/rsc";
import { draftMode } from 'next/headers';
import { generatePageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: { params: Promise<Record<string, never>> }, parent: ResolvingMetadata): Promise<Metadata> {
  // read route params and resolve parent metadata in parallel
  const [storyblok, parentMetadata] = await Promise.all([
    fetchStoryblokData('dir/vflocations'),
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

export default async function DirVFLocationsPage() {
  // Fetch initial data in parallel
  const [supabase, storyblokVFLocationsStoryData] = await Promise.all([
    createClient(),
    fetchStoryblokData('dir/vflocations')
  ]);
  const storyblokVFLocationsStory = storyblokVFLocationsStoryData.data.story;
  const companies = await supabase.from('companies').select('*').eq('beacon_membership_status', 'Active').eq('type', 'Viewing Facility');
  const companiesAdresses = companies.data && await supabase.from('company_contact_info').select('*').in('company_id', companies.data.map(company => company.id));
  
  if (companies.error) {console.error("Companies error:", companies.error);}
  if (companiesAdresses?.error) {console.error("Companies addresses error:", companiesAdresses.error);}

  const companiesWithAddresses = companies.data ? companies.data.map(company => ({
    ...company,
    ...(companiesAdresses?.data?.find(address => address.company_id === company.id)),
  })) : [];

  return (
    <div className="animate-fade-in">
      <div className="max-w-[41rem] mb-12">
        <StoryblokStory story={storyblokVFLocationsStory} />
      </div>
      {/* <pre>{JSON.stringify(companiesWithAddresses, null, 2)}</pre> */}
      <div className="max-w-[41rem]" >
        {companiesWithAddresses.map(company => {
          const addressArray = [company.addr2, company.addr3, company.addr4, company.addr5];
          // create a string out of the last two items in the array that are not empty strings or null, separated by a comma and add the county after that 
          const addressString = addressArray.filter(item => item && item.length > 0).slice(-2).join(', ') + ', ' + company.country;
          return (
            <Link 
              href={`/dir/companies/${company.slug}`} 
              key={company.slug}
              className="hover:text-qreen-dark text-qlack w-full border-b border-dashed flex justify-between items-baseline"
            >
              <h3 className="text-[1.375rem]">
                {company.name}
              </h3>
              <p>{addressString}</p>
            </Link>
          )
        })}
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