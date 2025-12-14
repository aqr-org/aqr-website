import { createClient } from '@/lib/supabase/server'
import Link from 'next/link';
import Image from 'next/image';
import { SupabaseClient } from '@supabase/supabase-js';
import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

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

// Check if maintag is an active company and fetch company name
async function fetchActiveCompany(supabase: SupabaseClient, maintag: string) {
  if (!maintag) return null;
  
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('name, ident, slug')
      .eq('beacon_membership_status', 'Active')
      .or(`ident.eq.${maintag},slug.eq.${maintag}`)
      .single();

    if (error || !company) {
      return null;
    }

    return company.name;
  } catch (error) {
    console.error("Error fetching active company:", error);
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

  // Check if member's beacon_membership_status is 'Active'
  if (member.data?.beacon_membership_status !== 'Active') {
    return null;
  }

  // Find the correct image URL with extension
  const validImageUrl = member.data?.id 
    ? await findValidImageUrl(supabase, member.data.id)
    : null;

  // Check if member is on the board
  let boardPosition = null;
  if (member.data?.id) {
    const boardMember = await supabase
      .from('board_members')
      .select('position')
      .eq('member_id', member.data.id)
      .single();

    if (boardMember.data && !boardMember.error) {
      boardPosition = boardMember.data.position;
    }
  }

  // Check if maintag is an active company and get company name
  const companyName = member.data?.maintag
    ? await fetchActiveCompany(supabase, member.data.maintag)
    : null;

  // Ensure timeline is properly parsed as an array
  // Timeline can be stored as: array directly, object with "line" property, or JSON string
  let timeline: string[] = [];
  if (member.data?.timeline) {
    if (Array.isArray(member.data.timeline)) {
      // Already an array
      timeline = member.data.timeline;
    } else if (typeof member.data.timeline === 'object' && member.data.timeline !== null) {
      // Check if it's an object with a "line" property
      if ('line' in member.data.timeline && Array.isArray((member.data.timeline as any).line)) {
        timeline = (member.data.timeline as any).line;
      } else {
        // Try to convert object to array if it has array-like structure
        timeline = [];
      }
    } else if (typeof member.data.timeline === 'string') {
      // If it's a string, try to parse it as JSON
      try {
        const parsed = JSON.parse(member.data.timeline);
        if (Array.isArray(parsed)) {
          timeline = parsed;
        } else if (typeof parsed === 'object' && parsed !== null && 'line' in parsed && Array.isArray(parsed.line)) {
          timeline = parsed.line;
        }
      } catch (e) {
        console.error("Error parsing timeline JSON:", e);
        timeline = [];
      }
    }
  }

  return {
    ...member.data,
    image: validImageUrl,
    board_position: boardPosition,
    active_company_name: companyName,
    timeline: timeline,
  };
}

export default async function MemberPage({
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

  // Fetch inspiration articles by this member
  const authorFullName = `${memberData.firstname} ${memberData.lastname}`;
  const inspirationArticles = await fetchInspirationArticlesByAuthor(authorFullName);

  const formattedJoinedDate = memberData.joined ? (() => {
    // Check if it's the legacy format (MM/YYYY) or ISO date string
    if (memberData.joined.includes('/')) {
      // Legacy format: MM/YYYY
      const [month, year] = memberData.joined.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
    } else {
      // ISO date string format: 2025-10-01T11:00:00.000Z
      const date = new Date(memberData.joined);
      return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
    }
  })() : null;

  // check if memberData.biognotes has any html tags in it, if not surround it with <p> tags
  let biognotes = memberData.biognotes;
  if (!biognotes?.includes('<p>')) {
    biognotes = '<p>' + biognotes + '</p>';
  }
  
  // Render Supabase member data
  return (
    <article className='space-y-8 animate-fade-in'>
      
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
              <p>{memberData.jobtitle && (memberData.jobtitle + ', ')}{memberData.organisation}</p>
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
        
        {memberData.active_company_name &&
          <p className="text-[1.375rem] my-8">
            <Link 
              href={'/dir/companies/' + (memberData.maintag || '#')} 
              className="no-underline! flex items-center gap-2 font-semibold hover:text-qreen-dark transition-colors duration-300"
            >
              More information about {memberData.active_company_name} <ArrowUpRight className="w-5 h-5" />
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
        {memberData.board_position && (
          <p className="text-[1.375rem] flex items-start gap-2 md:pl-8">
            <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="basis-4 shrink-0 grow-0 relative top-2">
              <path d="M6.5501 12.5001L0.850098 6.8001L2.2751 5.3751L6.5501 9.6501L15.7251 0.475098L17.1501 1.9001L6.5501 12.5001Z" fill="#1D1B20"/>
            </svg>
            {memberData.board_position === 'Chair' ? (
              <>{memberData.firstname} is currently the Chair of the <Link href="/about/board" className='underline-offset-2 hover:text-qreen-dark hover:underline-offset-4 transition-all duration-300'>AQR Management Board</Link></>
            ) : memberData.board_position === 'Board Member' ? (
              <>{memberData.firstname} currently serves on the <Link href="/about/board" className='underline-offset-2 hover:text-qreen-dark hover:underline-offset-4 transition-all duration-300'>AQR Management Board</Link></>
            ) : (
              <>{memberData.firstname} currently serves on the <Link href="/about/board" className='underline-offset-2 hover:text-qreen-dark hover:underline-offset-4 transition-all duration-300'>AQR Management Board</Link> as {memberData.board_position}</>
            )}
          </p>
        )}
        
      </section>
      {memberData.timeline && Array.isArray(memberData.timeline) && memberData.timeline.length > 0 && (
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

      {inspirationArticles && inspirationArticles.length > 0 && (
        <section className="space-y-5 mt-24">
          <h2 className="text-[2.375rem] leading-none">Articles by {memberData.firstname}</h2>
          <svg className="h-1 w-full" width="100%" height="100%">
            <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
          <ul className="space-y-2 md:pl-8">
            {inspirationArticles.map((article: any) => {
              // Extract slug from full_slug if needed (e.g., "resources/inspiration/article-slug" -> "article-slug")
              let articleSlug = article.slug;
              if (article.full_slug && article.full_slug.startsWith('resources/inspiration/')) {
                articleSlug = article.full_slug.replace('resources/inspiration/', '');
              } else if (article.slug && article.slug.startsWith('resources/inspiration/')) {
                articleSlug = article.slug.replace('resources/inspiration/', '');
              }
              
              return (
                <li key={article.id || article.uuid} className="text-[1.375rem] flex items-start gap-2">
                  <ArrowUpRight className="w-5 h-5 relative top-1.5" />
                  <Link href={`/resources/inspiration/${articleSlug}`} className="hover:underline">
                    {article.content?.title || article.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  )
}

async function fetchInspirationArticlesByAuthor(authorName: string) {
  try {
    const { isEnabled } = await draftMode();
    const isDraftMode = isEnabled;
    const storyblokApi = getStoryblokApi();
    
    const response = await storyblokApi.get(`cdn/stories`, { 
      starts_with: 'resources/inspiration/',
      version: isDraftMode ? 'draft' : 'published',
      filter_query: {
        author: {
          like: `%${authorName}%`
        }
      }
    });

    return response.data?.stories || [];
  } catch (error) {
    console.error('Error fetching inspiration articles by author:', error);
    return [];
  }
}