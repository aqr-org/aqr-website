'use client';
import AQR_QEX_Award from "../svgs/AQR_QEX_Award";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function Homepage_awards_section_shortlis_item({ shortlistItem, index }: { shortlistItem: { name: string; company: string }; index: number }) {
  const [memberLink, setMemberLink] = useState<string | null>(null);

  useEffect(() => {
    async function searchMember() {
      if (!shortlistItem.name) return;

      const supabase = createClient();
      
      // Try to match the name - split into first and last name if possible
      const nameParts = shortlistItem.name.trim().split(/\s+/);

      if (nameParts.length >= 2) {
        // Try exact match on firstname and lastname first (best match)
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        // Search for candidates that match either first or last name, then filter for exact match
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('slug, firstname, lastname')
          .or(`firstname.ilike.%${firstName}%,lastname.ilike.%${lastName}%`)
          .limit(20);
        
        if (membersError) {
          // Only log if there's actually error information
          if (membersError.message || Object.keys(membersError).length > 0) {
            console.error('Error searching for member:', membersError);
          }
          return;
        }
        
        // First try exact match on both firstname and lastname (case-insensitive)
        const exactMember = membersData?.find(
          m => m.firstname?.toLowerCase() === firstName.toLowerCase() && 
               m.lastname?.toLowerCase() === lastName.toLowerCase()
        );
        
        if (exactMember && exactMember.slug) {
          setMemberLink(exactMember.slug);
          return;
        }
        
        // Fallback to first result from partial matches
        if (membersData && membersData.length > 0 && membersData[0].slug) {
          setMemberLink(membersData[0].slug);
          return;
        }
        
        // No matches found
        return;
      } else {
        // Single name - search both firstname and lastname
        const { data, error } = await supabase
          .from('members')
          .select('slug, firstname, lastname')
          .or(`firstname.ilike.%${shortlistItem.name}%,lastname.ilike.%${shortlistItem.name}%`)
          .limit(10);

        if (error) {
          // Only log if there's actually error information
          if (error.message || Object.keys(error).length > 0) {
            console.error('Error searching for member:', error);
          }
          return;
        }

        if (!data || data.length === 0 || !data[0].slug) {
          return;
        }

        // Get the best match (first result) and return slug
        setMemberLink(data[0].slug);
      }
    }

    searchMember();
  }, [shortlistItem.name]);

  const content = (
    <div key={index} className='flex gap-4'>
      <div className='basis-[48px]'>
        <AQR_QEX_Award />
      </div>
      <div className='flex gap-4 group-hover:translate-x-4 transition-all duration-300'>
        <h4 className='text-2xl md:text-[2.375rem] tracking-tight leading-tight'>{shortlistItem.name}</h4>
        <p className='uppercase tracking-[0.03em]'>{shortlistItem.company}</p>
      </div>
    </div>
  );

  if (memberLink) {
    return (
      <Link href={`/members/${memberLink}`} className="inline-block group">
        {content}
      </Link>
    );
  }

  return content;
}