import { storyblokEditable } from "@storyblok/react/rsc";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { normalizeStoryblokUrl } from "@/lib/storyblok-url";
import { UserRound, Download } from "lucide-react";

interface StoryblokButtonProps {
  blok: {
    text: string;
    link?: {
      url?: string;
      cached_url?: string;
      linktype?: string;
    } | string;
    variant?: "default" | "qreen" | "alert" | "filled" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    icon?: "user" | "download";
    target?: "_blank" | "_self";
  };
}

export default function StoryblokButton({ blok }: StoryblokButtonProps) {
  const buttonText = blok.text || "";
  const variant = blok.variant || "default";
  const size = blok.size || "default";
  const target = blok.target || "_self";

  // Handle link - can be a string or an object with url/cached_url
  let href = "";
  if (typeof blok.link === "string") {
    href = blok.link;
  } else if (blok.link?.url) {
    href = blok.link.url;
  } else if (blok.link?.cached_url) {
    href = blok.link.cached_url;
  }

  // If no link is provided, render as a button element
  if (!href) {
    return (
      <div {...storyblokEditable(blok)}>
        <Button variant={variant} size={size}>
          {
              blok.icon === "user" ? <UserRound className="w-5 h-5" /> 
              : blok.icon === "download" ? <Download className="w-5 h-5" /> 
              : null
            }
          {buttonText}
        </Button>
      </div>
    );
  }

  // If link is external (starts with http:// or https://), use regular anchor tag
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <div {...storyblokEditable(blok)}>
        <Button variant={variant} size={size} asChild>
          <a href={normalizeStoryblokUrl(href)} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
            {
              blok.icon === "user" ? <UserRound className="w-5 h-5" /> 
              : blok.icon === "download" ? <Download className="w-5 h-5" /> 
              : null
            }
            {buttonText}
          </a>
        </Button>
      </div>
    );
  }

  // For internal links, use Next.js Link
  return (
    <div {...storyblokEditable(blok)}>
      <Button variant={variant} size={size} asChild>
        <Link href={normalizeStoryblokUrl(href)} target={target} className='no-underline!'>
          {
              blok.icon === "user" ? <UserRound className="w-5 h-5" /> 
              : blok.icon === "download" ? <Download className="w-5 h-5" /> 
              : null
            }
          {buttonText}
        </Link>
      </Button>
    </div>
  );
}

