import { createClient } from '@/lib/supabase/server'
import Link from 'next/link';
import Image from 'next/image';
import { SupabaseClient } from '@supabase/supabase-js';

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

export default async function ComnpaniesPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient();
  
  const member = await supabase
    .from('members')
    .select('*')
    .eq('slug', slug)
    .single();

  if (member.error) {
    console.error("member error:", member.error);
  }

  // console.log("Member ID:", member.data?.id);

  // Find the correct image URL with extension
  const validImageUrl = member.data?.id 
    ? await findValidImageUrl(supabase, member.data.id)
    : null;

  // console.log("Valid Image URL:", validImageUrl);

  const memberData = {
    ...member.data,
    image: validImageUrl,
  }

  return (
    <article className='p-8'>
      
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
        <p>{memberData.jobtitle}</p>
        <p>{memberData.organisation}</p>
        <p>{memberData.country}</p>
      </section>
      
      <section>
        <div 
          className='mt-4'
          dangerouslySetInnerHTML={{ __html: memberData.biognotes || '' }} 
        />
        {memberData.maintag &&
          <Link href={'/companies/' + (memberData.maintag || '#')}>More information about {memberData.organisation}</Link>
        }
      </section>
      
      <section>
        <h2>AQR Membership</h2>
        <p>{memberData.firstname} has been a Member of the AQR since {memberData.joined}</p>
      </section>

      <section>
        <h2>Notable achievements and contributions</h2>
        {memberData.timeline && (
          memberData.timeline.map((item: string, index: number) => (
            <div key={index}>
              <h3>{item}</h3>
            </div>
          ))
        )}
      </section>
    </article>
  )
}