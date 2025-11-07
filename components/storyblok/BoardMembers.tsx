"use client";

import { storyblokEditable } from '@storyblok/react/rsc';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface BoardMember {
  id: string;
  member_id: string;
  member_name: string;
  position: string;
  slug: string;
  image: string | null;
  jobtitle: string | null;
  organisation: string | null;
}

interface BoardMembersProps {
  blok: {
    _uid?: string;
    [key: string]: any;
  };
}

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
      
      return data.publicUrl;
    }

    return null;
    
  } catch (error) {
    console.error("Error finding image:", error);
    return null;
  }
}

export default function BoardMembers({ blok }: BoardMembersProps) {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBoardMembers() {
      const supabase = createClient();
      
      // Fetch board members with member slug
      const { data: boardMembersData, error } = await supabase
        .from('board_members')
        .select('id, member_id, member_name, position')
        .order('created_at');

      if (error) {
        console.error('Error fetching board members:', error);
        setIsLoading(false);
        return;
      }

      if (!boardMembersData || boardMembersData.length === 0) {
        setIsLoading(false);
        return;
      }

      // Fetch member slugs, jobtitle, organisation and images for each board member
      const boardMembersWithDetails = await Promise.all(
        boardMembersData.map(async (bm) => {
          // Get member slug, jobtitle, and organisation
          const { data: member, error: memberError } = await supabase
            .from('members')
            .select('slug, jobtitle, organisation')
            .eq('id', bm.member_id)
            .maybeSingle();

          if (memberError) {
            console.error(`Error fetching member ${bm.member_id}:`, memberError);
          }

          // Get member image
          const imageUrl = await findValidImageUrl(supabase, bm.member_id);

          return {
            ...bm,
            slug: member?.slug || '',
            image: imageUrl,
            jobtitle: member?.jobtitle || null,
            organisation: member?.organisation || null
          };
        })
      );

      setBoardMembers(boardMembersWithDetails);
      setIsLoading(false);
    }

    fetchBoardMembers();
  }, []);

  if (isLoading) {
    return (
      <div {...storyblokEditable(blok)} className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="text-center py-8">
            <p>Loading board members...</p>
          </div>
        </div>
      </div>
    );
  }

  if (boardMembers.length === 0) {
    return null;
  }

  return (
    <div {...storyblokEditable(blok)} className="w-full md:w-[66vw]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px">
        {boardMembers.map((boardMember) => (
          <Link
            key={boardMember.id}
            href={`/members/${boardMember.slug}`}
            className="group/board-member flex flex-col transition-opacity outline outline-qlack"
          >
            <div className="w-full">
              {boardMember.image ? (
                <figure className="relative bg-qellow aspect-square w-full h-auto overflow-hidden mx-auto outline outline-qlack">
                  <Image 
                    src={boardMember.image} 
                    alt={boardMember.member_name} 
                    fill
                    className="object-cover group-hover/board-member:opacity-80 transition-opacity"
                    sizes="aspect-square w-full h-full object-cover"
                  />
                </figure>
              ) : (
                <div className="relative bg-[#EEEEEE] aspect-square w-[200px] h-[200px] overflow-hidden mx-auto flex items-center justify-center">
                  <span className="text-qlack/40 text-2xl">
                    {boardMember.member_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-3 px-3 py-2 group-hover/board-member:bg-qellow transition-all duration-300">
              <div>
                <h3 className="text-lg">
                  {boardMember.member_name}
                </h3>
                <p className="text-sm uppercase tracking-[0.02em]">
                  {boardMember.position}
                </p>
              </div>
              {(boardMember.jobtitle || boardMember.organisation) && (
                <p className="text-xs">
                  {boardMember.jobtitle}<br />{boardMember.organisation}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

