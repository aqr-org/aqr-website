"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import CarouselNavigation from "@/components/CarouselNavigation";
import TimelineMilestone from "./TimelineMilestone";

interface TimelineMilestoneData {
  year?: string;
  description?: any;
  primaryColor?: string;
  secondaryColor?: string;
  _uid: string;
}

interface TimelineClientProps {
  milestones: TimelineMilestoneData[];
}

export default function TimelineClient({ milestones }: TimelineClientProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const paddingLeft = parseFloat(getComputedStyle(container).paddingLeft) || 0;
    setCanScrollLeft(scrollLeft > paddingLeft + 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollButtons();

    const handleScroll = () => {
      updateScrollButtons();
    };

    container.addEventListener("scroll", handleScroll);

    const handleResize = () => {
      updateScrollButtons();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [milestones]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const milestoneWidth = container.querySelector("div[data-timeline-milestone]")?.clientWidth || 0;
    const gap = parseInt(getComputedStyle(container).gap) || 0;
    const scrollAmount = milestoneWidth + gap;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Swipe gesture handling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isDragging = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) {
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
        isDragging = deltaX > deltaY && deltaX > 10;
      }

      if (isDragging) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return;

      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchStartX - touchEndX;

      if (Math.abs(deltaX) > 50) {
        const direction = deltaX > 0 ? "right" : "left";
        const milestoneWidth = container.querySelector("div[data-timeline-milestone]")?.clientWidth || 0;
        const gap = parseInt(getComputedStyle(container).gap) || 0;
        const scrollAmount = milestoneWidth + gap;
        container.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }

      isDragging = false;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Mousewheel horizontal scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const rect = container.getBoundingClientRect();
      const isOverCarousel =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isOverCarousel) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || Math.abs(e.deltaX) > 0) {
          e.preventDefault();
          container.scrollBy({
            left: e.deltaX || e.deltaY * 0.5,
            behavior: "smooth",
          });
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  if (milestones.length === 0) return null;

  return (
    <>  
      <div className="relative w-full max-w-maxwMain h-[88px] mt-12">
        <CarouselNavigation
          onScrollLeft={() => scroll("left")}
          onScrollRight={() => scroll("right")}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          className="top-0 bottom-auto right-auto left-0"
        />
      </div>
      <div 
        className="w-full md:w-[calc(100vw*0.7+var(--spacing-container))] xl:w-[calc(var(--container-maxw)*0.666+var(--spacing-container))] bg-qaupe mask-r-from-90%"
        style={{
          backgroundSize: '10px 10px',
          backgroundImage: 'repeating-linear-gradient(-45deg, #00000033 0, #00000033 1px, #00000000 0, #00000000 50%)'
        }}
      >
        <div className="relative z-10 h-full">
          <svg className="h-1 w-full absolute top-0 left-0" width="100%" height="100%">
            <rect 
              x="1" y="1" width="100%" height="100%" 
              fill="none" 
              stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
          <svg className="h-1 w-full absolute top-[calc(100%-1px)] left-0" width="100%" height="100%">
            <rect 
              x="1" y="1" width="100%" height="100%" 
              fill="none" 
              stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>

          {/* Scroll container */}
          <div
            ref={scrollContainerRef}
            className={cn(
              "relative w-[calc(100%+var(--spacing-container)*2)]",
              "flex items-stretch overflow-x-auto overflow-y-hidden",
              "scroll-smooth snap-x snap-mandatory",
              "no-scrollbar",
              "gap-4 md:gap-6",
              "h-full",
              "pr-[25%] md:pr-[50%]"
            )}
          >
            {milestones.map((milestone, index) => (
              <TimelineMilestone 
                key={milestone._uid} 
                blok={milestone} 
                editable={false}
                variant="carousel"
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

