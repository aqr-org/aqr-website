import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';
import { Metadata, ResolvingMetadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata';
import { createClient } from '@/lib/supabase/server';
import AdvancedDirectoryPageComponent from '@/components/AdvancedDirectoryPage';

export async function generateMetadata( parent: ResolvingMetadata): Promise<Metadata> {
  try {
    // Run in parallel with individual error handling
    const [storyblokResult, parentMetadata] = await Promise.allSettled([
      fetchStoryblokData(),
      parent
    ]);
    
    // Handle storyblok result
    let pageData = {};
    if (storyblokResult.status === 'fulfilled') {
      pageData = storyblokResult.value?.data.story.content;
    } else {
      console.error('Failed to fetch storyblok data:', storyblokResult.reason);
    }
    
    // Handle parent metadata
    let parentMeta = {};
    if (parentMetadata.status === 'fulfilled') {
      parentMeta = parentMetadata.value;
    } else {
      console.error('Failed to fetch parent metadata:', parentMetadata.reason);
    }
    
    return await generatePageMetadata(pageData, parentMeta);
    
  } catch (error) {
    console.error("Error in generateMetadata:", error);
    
    // Fallback: try to get parent metadata
    try {
      const parentMetadata = await parent;
      return await generatePageMetadata({}, parentMetadata);
    } catch (parentError) {
      console.error("Failed to get parent metadata:", parentError);
      return await generatePageMetadata({}, {});
    }
  }
}

export default async function AdvancedDirectoryPage() {
  // Fetch data in parallel
  const [supabase, storyblok] = await Promise.all([
    createClient(),
    fetchStoryblokData()
  ]);

  const storyBlokStory = storyblok?.data.story;

  // Fetch all filter options data
  const [
    companies,
    companyAreas,
    areasMaster,
    companyContactInfo
  ] = await Promise.all([
    supabase.from('companies').select('*').eq('beacon_membership_status', 'Active'),
    supabase.from('company_areas').select('*'),
    supabase.from('areas_master').select('*'),
    supabase.from('company_contact_info').select('*')
  ]);

  // Error handling
  if (companies.error) console.error("Companies error:", companies.error);
  if (companyAreas.error) console.error("Company areas error:", companyAreas.error);
  if (areasMaster.error) console.error("Areas master error:", areasMaster.error);
  if (companyContactInfo.error) console.error("Company contact info error:", companyContactInfo.error);

  // Get active company IDs
  const activeCompanyIds = companies.data?.map(company => company.id) || [];

  // Get unique company types
  const companyTypes = [...new Set(companies.data?.map(company => company.type).filter(Boolean) || [])]
    .map(type => ({
      value: type,
      label: type,
      count: companies.data?.filter(company => company.type === type).length || 0
    }));

  // Get unique countries (only for active companies)
  const activeCompanyContactInfo = companyContactInfo.data?.filter(contact => 
    activeCompanyIds.includes(contact.company_id)
  ) || [];
  
  const countries = [...new Set(activeCompanyContactInfo.map(contact => contact.country).filter(Boolean) || [])]
    .map(country => ({
      value: country,
      label: country,
      count: activeCompanyContactInfo.filter(contact => contact.country === country).length || 0
    }));


  // Pre-compute area counts once using a Map for better performance
  const areaCounts = new Map<string, number>();
  companyAreas.data?.forEach(ca => {
    if (activeCompanyIds.includes(ca.company_id)) {
      areaCounts.set(ca.area, (areaCounts.get(ca.area) || 0) + 1);
    }
  });

  // Get areas by category, only including areas that have at least one company
  const areasWithCompanies = new Set(companyAreas.data?.map(area => area.area) || []);
  
  const sectors = areasMaster.data
    ?.filter(area => area.category === 'Business Sectors' && areasWithCompanies.has(area.area))
    .map(area => ({
      value: area.area,
      label: area.area,
      count: areaCounts.get(area.area) || 0
    })) || [];

  const skills = areasMaster.data
    ?.filter(area => area.category === 'Skills, Expertise & Services' && areasWithCompanies.has(area.area))
    .map(area => ({
      value: area.area,
      label: area.area,
      count: areaCounts.get(area.area) || 0
    })) || [];

  const recruitment = areasMaster.data
    ?.filter(area => area.category === 'Recruitment Expertise' && areasWithCompanies.has(area.area))
    .map(area => ({
      value: area.area,
      label: area.area,
      count: areaCounts.get(area.area) || 0
    })) || [];

  const filterOptions = {
    companyTypes,
    sectors,
    skills,
    recruitment,
    countries
  };

  return (
    <>
      <div className="max-w-[41rem] mb-12">
        <StoryblokStory story={storyBlokStory} />
      </div>
      <AdvancedDirectoryPageComponent filterOptions={filterOptions} />
    </>
  );
}

export async function fetchStoryblokData() {
  try {
    const { isEnabled } = await draftMode();
    const isDraftMode = isEnabled;
    const storyblokApi = getStoryblokApi();
    
    const response = await storyblokApi.get(`cdn/stories/dir/advanced`, { 
      version: isDraftMode ? 'draft' : 'published' 
    });
    
    return response;
  } 
  catch (error) {
    console.error('Storyblok API Error Details:');
    console.error('- Error type:', typeof error);
    console.error('- Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('- Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('- Full error object:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to fetch story: dir/advanced`);
  }
}