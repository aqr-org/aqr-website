'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/hooks/useNavigation";

interface AlphabetNavProps {
  entries: {
    [key: string]: unknown[];
  };
  ariaLabel?: string;
}

export default function AlphabetNav({ entries, ariaLabel = "Directory navigation" }: AlphabetNavProps) {
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const { isScrolled } = useNavigation();

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is not intersecting, nav is stuck
        setIsStuck(!entry.isIntersecting);
      },
      {
        threshold: [0],
        rootMargin: '0px',
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" style={{ position: 'relative', top: '-121px' }} />
      <nav 
        ref={navRef}
        aria-label={ariaLabel} 
        className={cn(
          'group-data-[liststyle=filters]:hidden', 
          'border sticky top-[120px] ',
          'px-4 py-4 z-10 -ml-(--spacing-container) w-[calc(100%+2*var(--spacing-container))] md:w-full', 
          'md:-ml-6',
          'transition-all duration-300 ease-in-out',
          // 'mask-r-from-75%',
          isStuck ? 'bg-qaupe/95 shadow-md px-2 md:px-4 rounded-lg border-qreen-dark/30 -ml-[calc(var(--spacing-container)-0.5rem)] w-[calc(100%+2*var(--spacing-container)-1rem)]' : 'border-transparent',
          isStuck && isScrolled ? '-translate-y-full' : 'translate-y-0'
        )}
      >
        <div className="relative">
          <ul className="flex gap-0 w-full overflow-x-auto no-scrollbar pr-20 md:pr-0 mask-r-from-90% md:mask-none">
            {Object.keys(entries).sort((a, b) => {
                // Special sorting for group keys
                if (a === '0-9') return 1; // Numbers first
                if (b === '0-9') return -1;
                if (a === 'X-Z') return 1; // X-Z last
                if (b === 'X-Z') return -1;
                return a.localeCompare(b); // Regular alphabetical for letters
              }).map(letter => (
              <li key={letter} className="text-xl text-qreen-dark px-2 font-bold relative group/letter">
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-full w-8 rounded-lg bg-qitrus/50 z-10 pointer-events-none group-hover/letter:block hidden"></div>
                <Link href={`#${letter}`} className="whitespace-nowrap relative z-10">{letter}</Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  )
}