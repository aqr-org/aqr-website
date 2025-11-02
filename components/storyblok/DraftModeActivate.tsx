'use client';

import { useState, useEffect } from 'react';

export default function DraftModeAlert() {

  const [isStoryblokEditor, setIsStoryblokEditor] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('_storyblok')) {
      setIsStoryblokEditor(true);
    }
  }, []);

  return (
    <>
      {isStoryblokEditor && (
        <a 
          href={`/api/draft?secret=${process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN}`}
          className="bg-qreen-dark text-white fixed bottom-0 right-0 z-40 p-2 text-center text-sm"
        >
          Activate Draft Mode
        </a>
      )}
    </>
  )
}