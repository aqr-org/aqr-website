"use client";

import { useRef, useEffect, useState, memo } from "react";
import { cn } from "@/lib/utils";
import TestimonialCard from "./TestimonialCard";
import CarouselNavigation from "@/components/CarouselNavigation";

interface TestimonialData {
  quote: string;
  name: string;
  subtitle: string;
  portrait: {
    filename: string;
    alt: string;
  };
}

interface TestimonialCarouselClientProps {
  testimonials: TestimonialData[];
}

export default function TestimonialCarouselClient({
  testimonials,
}: TestimonialCarouselClientProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    // Account for padding when checking scroll position
    const paddingLeft = parseFloat(getComputedStyle(container).paddingLeft) || 0;
    setCanScrollLeft(scrollLeft > paddingLeft + 5); // Small threshold
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px threshold
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollButtons();

    const handleScroll = () => {
      updateScrollButtons();
    };

    container.addEventListener("scroll", handleScroll);

    // Handle resize
    const handleResize = () => {
      updateScrollButtons();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [testimonials]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const testimonialWidth = container.querySelector("div[data-testimonial]")?.clientWidth || 0;
    const gap = parseInt(getComputedStyle(container).gap) || 0;
    const scrollAmount = testimonialWidth + gap;

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
        // Threshold for swipe - scroll in opposite direction of swipe
        const direction = deltaX > 0 ? "right" : "left";
        const testimonialWidth = container.querySelector("div[data-testimonial]")?.clientWidth || 0;
        const gap = parseInt(getComputedStyle(container).gap) || 0;
        const scrollAmount = testimonialWidth + gap;
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
      // Check if mouse is over the carousel
      const rect = container.getBoundingClientRect();
      const isOverCarousel =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isOverCarousel) {
        // Prefer horizontal scrolling, but also allow vertical scroll if primarily vertical
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || Math.abs(e.deltaX) > 0) {
          e.preventDefault();
          container.scrollBy({
            left: e.deltaX || e.deltaY * 0.5, // Convert vertical to horizontal if needed
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


  if (testimonials.length === 0) return null;

  return (
    <div className="w-[calc(100%+var(--spacing-container))] -ml-(--spacing-container) py-18">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={cn(
          "grid h-full w-full",
          "grid-cols-2 grid-rows-2 gap-8", // Mobile: 2x2 grid (4 shapes visible)
          "md:grid-cols-4 md:grid-rows-2 md:gap-6", // Desktop: 4x2 grid (8 shapes visible)
          "p-6 md:p-8" // Padding to prevent shapes from touching edges
        )}>
          {Array.from({ length: 8 }, (_, i) => (
            <AnimatedShape
              key={`testimonial-shape-${i}`}
              id={`testimonial-shape-${i}`}
              desktopOnly={i >= 4}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <CarouselNavigation
          onScrollLeft={() => scroll("left")}
          onScrollRight={() => scroll("right")}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
        />

      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "relative w-[calc(100%+var(--spacing-container)*2)]",
          "flex overflow-x-auto overflow-y-hidden",
          "scroll-smooth snap-x snap-mandatory",
          "no-scrollbar", // Use existing utility
          // Gap between testimonials
          "gap-4 md:gap-6",
          "pr-4 md:pr-container py-18"
        )}
        style={{
          paddingLeft: "var(--spacing-container)",
          scrollPaddingLeft: "var(--spacing-container)",
        }}
      >
        {testimonials.map((testimonial, index) => {
          // Calculate testimonial widths for responsive peeking
          // Each testimonial fills almost the whole width minus 1/3 of next (divide by 1.33)
          const testimonialWidthClass = "md:w-[calc((100vw-5rem*2-1.5rem)/1.33)] lg:w-[calc((100vw-5rem*2-1.5rem)/1.33)] xl:w-[calc((100vw-5rem*2-1.5rem)/1.33)]";
          
          const mobileWidthClass = "w-[calc(85vw)]";

          return (
            <div
              key={index}
              data-testimonial
              className={cn(
                "shrink-0 snap-start",
                mobileWidthClass,
                testimonialWidthClass,
              )}
            >
              <TestimonialCard
                quote={testimonial.quote}
                name={testimonial.name}
                subtitle={testimonial.subtitle}
                portrait={testimonial.portrait}
              />
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

// Memoized Shape component with unique gradient ID to prevent conflicts
const AnimatedShape = memo(function AnimatedShape({ 
  id,
  desktopOnly = false
}: { 
  id: string;
  desktopOnly?: boolean;
}) {
  const gradientId = `paint0_linear_${id}`;
  
  return (
    <svg 
      width="149" 
      height="149" 
      viewBox="0 0 149 149" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn(
        "animate-animated-circle origin-bottom-right",
        "w-[80px] h-[80px] md:w-[100px] md:h-[100px]", // Responsive sizing
        desktopOnly && "hidden md:block", // Hide on mobile, show on desktop
        "justify-self-center self-center" // Center shapes in grid cells
      )}
      style={{
        animationDuration: '30s',
        willChange: "transform, opacity",
        transformBox: 'fill-box'
      }}
      >
      <path 
        opacity="0.7" 
        d="M28.5 148.5C28.5 82.2301 82.2199 28.5 148.5 28.5" 
        stroke={`url(#${gradientId})`} 
        strokeWidth="57" 
        strokeMiterlimit="10"
      />
      <defs>
        <linearGradient 
          id={gradientId} 
          x1="73.9655" 
          y1="-0.579161" 
          x2="73.9655" 
          y2="148.5" 
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#7BBD42" stopOpacity="0"/>
          <stop offset="1" stopColor="#7BBD42"/>
        </linearGradient>
      </defs>
    </svg>
  );
});

AnimatedShape.displayName = 'AnimatedShape';