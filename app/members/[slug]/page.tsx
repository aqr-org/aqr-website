import { createClient } from '@/lib/supabase/server'
import Link from 'next/link';
import Image from 'next/image';
import { SupabaseClient } from '@supabase/supabase-js';
import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import Background from '@/components/Background';

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
      <main>
        <Background />
        <StoryblokStory story={storyblokStory} />
      </main>
    );
  }

  // If no Storyblok story, try Supabase
  const memberData = await fetchSupabaseMember(slug);

  if (!memberData) {
    notFound();
  }

  // check if memberData.biognotes has any html tags in it, if not surround it with <p> tags
  let biognotes = memberData.biognotes;
  if (!biognotes.includes('<p>')) {
    biognotes = '<p>' + biognotes + '</p>';
  }
  
  // Render Supabase member data
  return (
    <article className='space-y-8 prose'>
      
      <h1 className='text-3xl font-bold mb-2'>
        {memberData.firstname} {memberData.lastname}
      </h1>
      
      <section>
        {memberData.image ? (
          <div>
            <Image 
              src={memberData.image} 
              alt={`${memberData.firstname} ${memberData.lastname}`} 
              width={240} 
              height={320}
              sizes='(max-width: 600px) 100vw, 240px'
              className='bg-[#EEEEEE] aspect-[0.75] w-[120px] rounded'
            />
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 italic">No image available</p>
          </div>
        )}
      </section>
      
      <section>
        <p>{memberData.jobtitle} 
          <br /> {memberData.organisation} 
          <br /> {memberData.country}</p>
      </section>
      
      <section>
        <div 
          className='mt-4 prose'
          dangerouslySetInnerHTML={{ __html: biognotes || '' }} 
        />
        
        {memberData.maintag &&
          <p>
            <Link href={'/dir/companies/' + (memberData.maintag || '#')}>
              More information about {memberData.organisation}
            </Link>
          </p>
        }
      </section>
      
      <section>
        <h2>AQR Membership</h2>
        <p>{memberData.firstname} has been a Member of the AQR since {memberData.joined}</p>
      </section>

      <section className='prose'>
        <h2 className='h4size'>Notable achievements and contributions</h2>
        <ul>
          {memberData.timeline && (
            memberData.timeline.map((item: string, index: number) => (
              <li key={index}>
                {item}
              </li>
            ))
          )}
        </ul>
      </section>
    </article>
  )
}