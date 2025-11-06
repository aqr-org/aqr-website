interface CarouselNavigationProps {
  onScrollLeft: () => void;
  onScrollRight: () => void;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

export default function CarouselNavigation({
  onScrollLeft,
  onScrollRight,
  canScrollLeft,
  canScrollRight,
}: CarouselNavigationProps) {
  return (
    <div className="hidden md:flex absolute right-0 bottom-full pb-4 z-20 items-center gap-2">
      <button
        onClick={onScrollLeft}
        className={`bg-white/80 rounded-lg p-6 shadow-lg text-qreen-dark hover:bg-qellow/80 transition-colors cursor-pointer ${canScrollLeft ? 'opacity-100' : 'opacity-50'}`}
        aria-label="Scroll left"
      >
        <svg className="w-6 h-6" width="14" height="25" viewBox="0 0 14 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.7346 23.3375L1.41455 12.0175L12.7346 0.70752" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
        </svg>
      </button>
      <button
        onClick={onScrollRight}
        className={`bg-white/80 rounded-lg p-6 shadow-lg text-qreen-dark hover:bg-qellow/80 transition-colors cursor-pointer ${canScrollRight ? 'opacity-100' : 'opacity-50'}`}
        aria-label="Scroll right"
      >
        <svg className="w-6 h-6" width="14" height="25" viewBox="0 0 14 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.707344 23.3375L12.0273 12.0175L0.707344 0.70752" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
        </svg>
      </button>
    </div>
  );
}

