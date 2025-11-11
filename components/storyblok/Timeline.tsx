import { storyblokEditable } from "@storyblok/react/rsc";
import TimelineClient from "./TimelineClient";
import { cn } from "@/lib/utils";

interface TimelineProps {
  blok: {
    milestones?: Array<{
      component: string;
      year?: string;
      description?: any;
      primaryColor?: string;
      secondaryColor?: string;
      _uid: string;
    }>;
  };
}

export default function Timeline({ blok }: TimelineProps) {
  // Extract and transform milestones from Storyblok blok
  const milestones =
    blok.milestones?.map((milestone) => ({
      year: milestone.year || "",
      description: milestone.description,
      primaryColor: milestone.primaryColor,
      secondaryColor: milestone.secondaryColor,
      _uid: milestone._uid,
    })) || [];

  if (milestones.length === 0) return null;

  return (
    <div
      {...storyblokEditable(blok)}
      className={cn(
        "w-full md:w-[calc(100vw*0.7+var(--spacing-container))] xl:w-[calc(var(--container-maxw)*0.666+var(--spacing-container))] overflow-hidden relative my-12"
      )}
    >
      <TimelineClient milestones={milestones} />
    </div>
  );
}

