'use client';
import Link from "next/link";
import React from "react";

interface Shortlist_itemProps {
  shortlistItem: {
    name: string;
    member_slug: string;
    company: string;
  };
  index: number;
}

function Shortlist_item({ shortlistItem, index }: Shortlist_itemProps) {


  const content = (
    <div key={index}>
      <div className='space-y-2 group-hover:text-qreen-dark transition-all duration-300'>
        <h5 className='text-xl md:text-[1.5rem] tracking-tight leading-tight'>{shortlistItem.name}</h5>
        <p className='uppercase tracking-[0.03em]'>{shortlistItem.company}</p>
      </div>
    </div>
  );

  if (shortlistItem.member_slug) {
    return (
      <Link href={`/members/${shortlistItem.member_slug}`} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(Shortlist_item);

