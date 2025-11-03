"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";


export function CTABlock() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setShouldLoadVideo(true);
            // Disconnect after first intersection to avoid unnecessary re-observations
            observer.disconnect();
          }
        });
      },
      {
        // Start loading when component is 200px away from viewport
        rootMargin: "200px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-qreen text-qaupe relative my-16 md:my-25">
      {shouldLoadVideo && (
        <video
          src="/AQRCTAVideoOpt.mp4"
          playsInline
          autoPlay
          muted
          loop
          preload="none"
          className={`w-full h-full object-cover absolute top-0 left-0 transition-opacity duration-1000 ${
            isVisible ? "opacity-10" : "opacity-0"
          }`}
        />
      )}
      <div className="max-w-maxw mx-auto px-container py-24 space-y-8 relative z-10">
        <div className="md:flex">
          <h2 className="md:basis-[160px] uppercase tracking-[0.04em]">Membership</h2>
          <div className="space-y-8">
            <p className="text-[2.375rem] tracking-[-0.07125rem] leading-none">
              You want to <span className="text-qlack">develop.</span>
              <br />
              You want to <span className="text-qlack">be recognised.</span>
              <br />
              You feel <span className="text-qlack">inspired.</span>
            </p>
            <div className="md:flex gap-12 mt-16 w-25">
              <svg width="104" height="92" viewBox="0 0 104 92" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                <path d="M0 0V91.233H40.435L39.0343 87.3159H3.91707V3.91707H99.5753V87.3159H62.8714L52.6821 64.4581H47.9469L59.884 91.233H103.48V0H0Z" fill="currentColor"/>
              </svg>

              <p className="text-[6.25rem] tracking-[-0.0375em] leading-none">So let's <span className="relative">connect.<svg width="366" height="17" viewBox="0 0 366 17" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-[90%] left-0 w-full h-auto"><path d="M3.02533 2.96613C115.042 -2.94216 227.788 0.602579 339.657 8.09722L362.056 9.65004C363.843 9.77042 365.199 11.3251 365.07 13.1101C364.948 14.9317 363.327 16.3011 361.506 16.1155L339.18 14.1933C302.969 11.0094 263.744 8.62933 227.37 7.17422C167.807 4.72006 107.728 4.3327 48.1827 6.7342C33.2698 7.41515 18.2964 8.22053 3.49452 9.4431C-0.533409 9.74472 -1.57064 3.54106 3.01582 2.97477L3.02533 2.96613Z" fill="currentColor"/></svg></span></p>
            </div>

            <Link href="/members/new-membership-application" className="inline-flex items-center gap-2 font-medium mt-6 pb-4 text-lg">Join AQR today <ArrowUpRight className="w-6 h-6 inline-block" /></Link>
          </div>

        </div>
      </div>
    </div>
  );
}