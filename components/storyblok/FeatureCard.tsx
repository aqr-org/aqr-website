import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface FeatureCardProps {
  title: string;
  linkText: string;
  linkHref: string;
  children?: React.ReactNode;
  className?: string;
  backgroundLayer1?: React.ReactNode;
  backgroundLayer2?: React.ReactNode;
  titleColor?: string;
  titleHoverColor?: string;
  buttonColor?: string;
  buttonHoverColor?: string;
}

export default function FeatureCard({
  title,
  linkText,
  linkHref,
  children,
  className,
  backgroundLayer1,
  backgroundLayer2,
  titleColor,
  titleHoverColor,
  buttonColor,
  buttonHoverColor,
}: FeatureCardProps) {
  return (
    <Link href={linkHref}>
      <div
        className={cn(
          "group relative aspect-[0.75] rounded-xl overflow-hidden shadow-lg",
          className
        )}
      >
        {/* First background layer */}
        {backgroundLayer1 && (
          <div className="absolute inset-0 z-0">{backgroundLayer1}</div>
        )}
        
        {/* Second background layer (for hover overlay) */}
        {backgroundLayer2 && (
          <div className="absolute inset-0 z-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {backgroundLayer2}
          </div>
        )}
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col p-6">
          {/* Top right title */}
          <div className="flex justify-end mb-auto">
            <h3 
              className={cn(
                "uppercase tracking-[0.04rem]",
                titleColor || "text-qlack",
                titleHoverColor || "group-hover:text-qellow"
              )}
            >
              {title}
            </h3>
          </div>
          
          {/* Main content */}
          <div className="flex-1 flex flex-col items-center justify-start py-8">
            {children}
          </div>
          
          {/* Bottom left link */}
          <div className="mt-auto">
            <button
              className={cn(
                "text-lg font-semibold inline-flex items-center gap-1 pointer-events-none",
                buttonColor || "text-qlack",
                buttonHoverColor || "group-hover:text-qellow"
              )}
            >
              {linkText} <ArrowUpRight className="w-6 h-6 inline-block" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

