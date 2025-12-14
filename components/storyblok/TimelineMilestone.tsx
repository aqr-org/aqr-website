import { storyblokEditable } from "@storyblok/react/rsc";
import { render } from "storyblok-rich-text-react-renderer";
import { cn } from "@/lib/utils";

interface TimelineMilestoneProps {
  blok: {
    year?: string;
    description?: any;
    primaryColor?: string;
    secondaryColor?: string;
    _uid: string;
  };
  editable?: boolean; // Whether to use storyblokEditable (default: true)
  variant?: 'default' | 'carousel'; // Variant for different styling contexts
  index?: number; // Index of the milestone
}

// Color mapping from globals.css
const colorMap: Record<string, string> = {
  qreen: "#7bbd40",
  "qreen-dark": "#3c772b",
  qlack: "#11160c",
  qellow: "#ebfe56",
  qeal: "#4ca79e",
  qitrus: "#f1b355",
  qrose: "#e27a96",
  qaupe: "#fcfaf0",
};

function getColorValue(colorName?: string, defaultColor: string = "#7bbd40"): string {
  if (!colorName) return defaultColor;
  return colorMap[colorName] || defaultColor;
}

// Generate a deterministic duration based on a string (for consistent SSR/client hydration)
function getDeterministicDuration(seed: string, min: number = 10, max: number = 20): string {
  // Simple hash function to convert string to number
  if (!seed || typeof seed !== 'string') return `${min}s`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const charCode = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + charCode;
    hash = hash | 0; // Convert to 32-bit integer
  }
  // Normalize to range [min, max]
  const normalized = Math.abs(hash) % 1000 / 1000; // 0-1 range
  const duration = min + (normalized * (max - min));
  return `${duration.toFixed(2)}s`;
}

export default function TimelineMilestone({ blok, editable = true, variant = 'default', index }: TimelineMilestoneProps) {
  const primaryColor = getColorValue(blok.primaryColor, "#7bbd40");
  const secondaryColor = getColorValue(blok.secondaryColor, "#4ca79e");
  
  // Generate unique IDs for gradients to avoid conflicts
  const uniqueId = blok._uid || `milestone-${index || 0}`;
  const radialGradientId = `paint0_radial_${uniqueId}`;
  const linearGradient1Id = `paint1_linear_${uniqueId}`;
  const linearGradient2Id = `paint2_linear_${uniqueId}`;
  const maskId = `mask0_${uniqueId}`;
  const clipPathId = `clip0_${uniqueId}`;

  const isCarousel = variant === 'carousel';
  
  // Generate deterministic animation duration based on uniqueId
  const animationDuration = isCarousel ? getDeterministicDuration(uniqueId, 10, 20) : undefined;

  

  return (
    <div
      {...(storyblokEditable(blok))}
      className={cn(
        "relative shrink-0 snap-start",
        "basis-[85%] md:basis-[85%]",
      )}
      data-timeline-milestone
    >
      <div 
        className={cn(
          "relative h-full pt-28 md:pt-12 pb-6 md:pb-12 pl-6 md:pl-[200px] flex md:items-end"
        )}
      >
        {/* SVG Background */}
        <svg
          className="absolute top-auto bottom-0 inset-0 w-[400px] md:w-[500px] h-auto aspect-[1.05] overflow-visible"
          width="472"
          height="448"
          viewBox="0 0 472 448"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient
              id={radialGradientId}
              cx="0"
              cy="0"
              r="1"
              gradientTransform="matrix(-106.799 -105.33 105.318 -106.811 164.99 298.013)"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0.02" stopColor={primaryColor} stopOpacity="0.7" />
              <stop offset="0.509615" stopColor={primaryColor} stopOpacity="0.23" />
              <stop offset="1" stopColor={primaryColor} stopOpacity="0" />
            </radialGradient>
            <linearGradient
              id={linearGradient1Id}
              x1="165"
              y1="179"
              x2="46.0042"
              y2="298.996"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={secondaryColor} stopOpacity="0" />
              <stop offset="1" stopColor={secondaryColor} />
            </linearGradient>
            <linearGradient
              id={linearGradient2Id}
              x1="-62"
              y1="540.739"
              x2="253"
              y2="540.739"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={primaryColor} stopOpacity="0" />
              <stop offset="0.495192" stopColor={primaryColor} stopOpacity="0.5" />
              <stop offset="0.870192" stopColor={primaryColor} />
              <stop offset="1" stopColor={primaryColor} />
            </linearGradient>
            <mask
              id={maskId}
              style={{ maskType: "alpha" }}
              maskUnits="userSpaceOnUse"
              x="45"
              y="179"
              width="240"
              height="238"
            >
              <path
                d="M165 179C231.274 179 285 232.278 285 298C285 363.722 231.274 417 165 417C98.7258 417 45 363.722 45 298C45 232.278 98.7258 179 165 179ZM165 235C129.914 235 101.471 263.443 101.471 298.529C101.471 333.616 129.914 362.059 165 362.059C200.086 362.059 228.529 333.616 228.529 298.529C228.529 263.443 200.086 235 165 235Z"
                fill="#D9D9D9"
              />
            </mask>
            <clipPath id={clipPathId}>
              <rect width="472" height="448" fill="white" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipPathId})`}>
            <path
              d="M165 448.033C247.843 448.033 315 380.869 315 298.017C315 215.165 247.843 148 165 148C82.1573 148 15 215.165 15 298.017C15 380.869 82.1573 448.033 165 448.033Z"
              fill={`url(#${radialGradientId})`}
              style={{ mixBlendMode: "multiply" }}
            />
            <g 
              opacity="0.25"
              className={isCarousel ? "animate-animated-circle origin-bottom-right" : undefined}
              style={{ transformBox: 'fill-box', animationDuration: animationDuration }}
            >
              <g mask={`url(#${maskId})`}>
                <rect
                  x="45"
                  y="179"
                  width="120"
                  height="119"
                  fill={`url(#${linearGradient1Id})`}
                />
              </g>
            </g>
            <g className="transform-[rotate(-45deg)] origin-top-left" style={{ transformBox: 'fill-box' }}>
              <rect
                x="-62"
                y="512.739"
                width="315"
                height="56"
                // transform={isCarousel ? undefined : "rotate(-45 -62 512.739)"}
                fill={`url(#${linearGradient2Id})`}
                style={isCarousel ? { 
                  transformBox: 'fill-box',
                  // transform: 'rotate(-45deg)'
                  animationDuration: animationDuration
                } : undefined}
                className={cn(
                  isCarousel ? "animate-shrink-grow-x" : undefined,
                )}
              />
            </g>
          </g>
        </svg>

        {/* Content */}
        <div className={cn(
          "relative z-10 flex flex-col gap-4 pb-12 md:pb-[150px]"
        )}>
          {blok.year && (
            <h3 className="text-2xl md:text-[2.375rem] text-qlack tracking-tight">
              {blok.year}
            </h3>
          )}
          {blok.description && (
            <div className="rich-text md:pl-6 text-balance [&_li,&_p]:text-sm md:[&_li,&_p]:text-base [&_li,&_p]:mb-2">
              {render(blok.description, {
                blokResolvers: {},
                nodeResolvers: {},
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

