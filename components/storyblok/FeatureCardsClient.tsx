"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import FeatureCard from "./FeatureCard";
import CarouselNavigation from "@/components/CarouselNavigation";

interface CardData {
  title: string;
  linkText: string;
  linkHref: string;
  content: React.ReactNode;
  backgroundLayer1?: React.ReactNode;
  backgroundLayer2?: React.ReactNode;
  titleColor?: string;
  titleHoverColor?: string;
  buttonColor?: string;
  buttonHoverColor?: string;
}

interface FeatureCardsClientProps {
  cards: CardData[];
}

export default function FeatureCardsClient({ cards }: FeatureCardsClientProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    // Account for padding when checking scroll position
    // When scrollLeft is 0, we're at the padded position (first card visible)
    // We consider it scrollable left only if we've scrolled past the padding
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
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsScrolling(false), 150);
    };

    let scrollTimeout: NodeJS.Timeout;
    container.addEventListener("scroll", handleScroll);

    // Handle resize
    const handleResize = () => {
      updateScrollButtons();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      clearTimeout(scrollTimeout);
    };
  }, [cards]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.querySelector("div[data-card]")?.clientWidth || 0;
    const gap = parseInt(getComputedStyle(container).gap) || 0;
    const scrollAmount = cardWidth + gap;

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
        const cardWidth = container.querySelector("div[data-card]")?.clientWidth || 0;
        const gap = parseInt(getComputedStyle(container).gap) || 0;
        const scrollAmount = cardWidth + gap;
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

  if (cards.length === 0) return null;

  return (
    <div className="relative w-[calc(100%+var(--spacing-container))] -ml-(--spacing-container)">
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
          // Gap between cards
          "gap-4 md:gap-6",
          "pr-4 md:pr-container pb-12"
        )}
        style={{
          paddingLeft: "var(--spacing-container)",
          scrollPaddingLeft: "var(--spacing-container)",
          // Mask with gradient fade on left and right edges
         
        }}
      >
        {cards.map((card, index) => {
          // Calculate card widths for responsive peeking
          const cardWidthClass = "md:w-[calc((100%-5rem*2-2rem)/2.1)] lg:w-[calc((100%-5rem*2-2rem)/2.7)] xl:w-[calc((100%-5rem*2-2rem)/3.1)]";
          
          const mobileWidthClass = "w-[85%]"

          return (
            <div
              key={index}
              data-card
              className={cn(
                "shrink-0 snap-start",
                mobileWidthClass,
                cardWidthClass,
              )}
            >
              <FeatureCard
                title={card.title}
                linkText={card.linkText}
                linkHref={card.linkHref}
                backgroundLayer1={card.backgroundLayer1}
                backgroundLayer2={card.backgroundLayer2}
                titleColor={card.titleColor}
                titleHoverColor={card.titleHoverColor}
                buttonColor={card.buttonColor}
                buttonHoverColor={card.buttonHoverColor}
              >
                {card.content}
              </FeatureCard>
            </div>
          );
        })}
      </div>
    </div>
  );
}

