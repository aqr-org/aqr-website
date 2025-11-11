import { createClient } from '@/lib/supabase/server'
import Link from 'next/link';
import Image from 'next/image';
import { SupabaseClient } from '@supabase/supabase-js';
import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

async function findValidImageUrl(supabase: SupabaseClient, memberId: string) {
  try {
    // List files in the members folder that start with the memberId
    const { data: files, error } = await supabase
      .storage
      .from('images')
      .list('members', {
        search: memberId
      });

    if (error) {
      console.error("Error listing files:", error);
      return null;
    }

    // Find the first file that starts with the member ID and has an extension
    const matchingFile = files?.find((file: { name: string }) => 
      file.name.startsWith(memberId) && file.name.includes('.')
    );

    if (matchingFile) {
      const { data } = supabase
        .storage
        .from('images')
        .getPublicUrl(`members/${matchingFile.name}`);
      
      // console.log(`Found image: ${matchingFile.name}`);
      return data.publicUrl;
    }

    console.log("No matching image file found for member:", memberId);
    return null;
    
  } catch (error) {
    console.error("Error finding image:", error);
    return null;
  }
}

// Try to fetch Storyblok story first
async function fetchStoryblokStory(slug: string) {
  try {
    const { isEnabled } = await draftMode();
    const isDraftMode = isEnabled;
    const storyblokApi = getStoryblokApi();
    
    const response = await storyblokApi.get(`cdn/stories/members/${slug}`, { 
      version: isDraftMode ? 'draft' : 'published'
    });
    
    return response.data.story;
  } catch (error) {
    // Storyblok story not found, return null
    console.log(`No Storyblok story found for members/${slug}`);
    return null;
  }
}

// Fetch Supabase member data
async function fetchSupabaseMember(slug: string) {
  const supabase = await createClient();
  
  const member = await supabase
    .from('members')
    .select('*')
    .eq('slug', slug)
    .single();

  if (member.error) {
    console.error("member error:", member.error);
    return null;
  }

  // Find the correct image URL with extension
  const validImageUrl = member.data?.id 
    ? await findValidImageUrl(supabase, member.data.id)
    : null;

  return {
    ...member.data,
    image: validImageUrl,
  };
}

export default async function ComnpaniesPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // First, try to fetch from Storyblok
  const storyblokStory = await fetchStoryblokStory(slug);

  if (storyblokStory) {
    // Render Storyblok story
    return (
      <div className='max-w-maxwMain has-[aside]:max-w-full animate-fade-in' >
        <StoryblokStory story={storyblokStory} />
      </div>
    );
  }

  // If no Storyblok story, try Supabase
  const memberData = await fetchSupabaseMember(slug);

  if (!memberData) {
    notFound();
  }

  const formattedJoinedDate = memberData.joined ? (() => {
    const [month, year] = memberData.joined.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
  })() : null;

  // check if memberData.biognotes has any html tags in it, if not surround it with <p> tags
  let biognotes = memberData.biognotes;
  if (!biognotes?.includes('<p>')) {
    biognotes = '<p>' + biognotes + '</p>';
  }
  
  // Render Supabase member data
  return (
    <article className='space-y-8'>
      
      <section>
        <div className='flex flex-col md:flex-row md:items-center md:gap-8'>
          {memberData.image && (
            <div>
              <figure className='relative bg-[#EEEEEE] aspect-square w-[160px] h-[160px] rounded-full overflow-hidden'>
                <Image 
                  src={memberData.image} 
                  alt={`${memberData.firstname} ${memberData.lastname}`} 
                  fill
                  objectFit='cover'
                  sizes='(max-width: 600px) 100vw, 160px'
                />
              </figure>
            </div>
          )}
          <div className="flex flex-col gap-2 mt-4 md:mt-0">
            <h1 className='text-5xl md:text-6xl leading-[0.95] tracking-[-0.1125rem]'>
              {memberData.firstname} {memberData.lastname}
            </h1>
            <div>
              <p>{memberData.jobtitle}, {memberData.organisation}</p>
              <p>{memberData.country}</p>
            </div>
          </div>

        </div>
      </section>
      
      <section>
        {memberData.biognotes && memberData.biognotes.length > 0 && (
        <div 
          className='mt-4 prose *:[p]:text-[1.375rem]! max-w-188'
            dangerouslySetInnerHTML={{ __html: biognotes || '' }} 
          />
        )}
        
        {memberData.maintag &&
          <p className="text-[1.375rem]">
            <Link href={'/dir/companies/' + (memberData.maintag || '#')}>
              More information about {memberData.organisation}
            </Link>
          </p>
        }
      </section>
      
      <section className="space-y-5 mt-24">
        <h2 className="text-[2.375rem] leading-none">AQR Membership</h2>
        <svg className="h-1 w-full" width="100%" height="100%">
          <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
        {memberData.joined && (
          <p className="text-[1.375rem] flex items-start gap-2 md:pl-8">
            <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="basis-4 shrink-0 grow-0 relative top-2">
              <path d="M6.5501 12.5001L0.850098 6.8001L2.2751 5.3751L6.5501 9.6501L15.7251 0.475098L17.1501 1.9001L6.5501 12.5001Z" fill="#1D1B20"/>
            </svg>
            {memberData.firstname} has been a Member of the AQR since {formattedJoinedDate}
          </p>
        )}
        {!memberData.joined && (
          <p className="text-[1.375rem] flex items-start gap-2 md:pl-8">
            <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="basis-4 shrink-0 grow-0 relative top-2">
              <path d="M6.5501 12.5001L0.850098 6.8001L2.2751 5.3751L6.5501 9.6501L15.7251 0.475098L17.1501 1.9001L6.5501 12.5001Z" fill="#1D1B20"/>
            </svg>
            {memberData.firstname} is a Member of the AQR
          </p>
        )}
      </section>

      {memberData.timeline && memberData.timeline.length > 0 && (
        <section className="space-y-5 mt-24">
          <h2 className="text-[2.375rem] leading-none">Notable achievements and contributions</h2>
          <svg className="h-1 w-full" width="100%" height="100%">
            <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
          <ul className="space-y-2 md:pl-8">
            { memberData.timeline.map((item: string, index: number) => (
                <li key={index} className="text-[1.375rem] flex items-start gap-2">
                  <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="basis-4 shrink-0 grow-0 relative top-2">
                    <path d="M6.5501 12.5001L0.850098 6.8001L2.2751 5.3751L6.5501 9.6501L15.7251 0.475098L17.1501 1.9001L6.5501 12.5001Z" fill="#1D1B20"/>
                  </svg>
                  {item}
                </li>
              ))}
          </ul>
        </section>
      )}
    </article>
  )
}