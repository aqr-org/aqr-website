import { NavigationLinkData } from "@/lib/types/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeStoryblokUrl } from "@/lib/storyblok-url";
import { UserRound } from "lucide-react";
import NavigationLink from "./navigation/NavigationLink";

export default function RenderSidebar({ sidebar_items }: { sidebar_items: NavigationLinkData[] }) {
  return (
    <nav aria-label="Secondary sidebar navigation" id="secondary-navigation" className="md:sticky md:top-8">
      {sidebar_items.map((item: NavigationLinkData, index: number) => (
        <div key={item.name+index} className={cn(index === 0 ? "mt-0" : "mt-8")}>
          {item.component === "navigation_cta" ? (
            <Button variant="default" className="text-qreen-dark border-qreen-dark">
              <NavigationLink href={normalizeStoryblokUrl(item.link?.cached_url)} className="flex items-center gap-2 text-base">
              {item.icon === 'suitcase' && (
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="4.38623" width="14" height="10.9474" rx="2" stroke="#3C772B" strokeWidth="2"/>
                  <path d="M10.5788 4.38618V2.85986C10.5788 2.30758 10.1311 1.85986 9.57879 1.85986H6.4209C5.86861 1.85986 5.4209 2.30758 5.4209 2.85986V4.38618" stroke="#3C772B" strokeWidth="2"/>
                </svg>
              )}
              {item.icon === 'user' && (
                <UserRound />
              )}
                {item.name}
              </NavigationLink>
            </Button>
          ) : item.link?.cached_url !== "" ? (
            <NavigationLink 
              href={normalizeStoryblokUrl(item.link?.cached_url)}
              className="md:text-lg font-semibold text-qlack mb-1.25 block"
            >
              {item.name}
            </NavigationLink>
          ) : (
            <div className="md:text-lg font-semibold text-qlack mb-1.25">
              {item.name}
            </div>
          )}
          {item.dropdown_menu &&
            <ul className="pl-4 space-y-1.25">
              {item.dropdown_menu.map((dropdownItem: NavigationLinkData, dropdownIndex: number) => (
                <li key={dropdownItem.name+dropdownIndex}>
                  <NavigationLink 
                    href={normalizeStoryblokUrl(dropdownItem.link?.cached_url)}
                    className={cn(
                      "group/sidebarlink",
                      "flex gap-1 items-start",
                      "text-base font-medium",
                      "text-qreen-dark data-[current-page=true]:text-qreen-dark/60"
                    )}
                  >
                    <svg aria-hidden="true" className="group-data-[current-page=true]/sidebarlink:hidden downrightArrow h-[1em] relative top-[0.2em]" width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.2 5.6932H1V0.359863M6.86667 8.35986L9 5.6932L6.86667 3.02653" stroke="#3C772B" strokeWidth="1.5"/></svg>
                    <span className="group-hover/sidebarlink:translate-x-1 transition-transform duration-300">
                      {dropdownItem.name}
                    </span>
                  </NavigationLink>
                </li>
              ))}
            </ul>
          }
        </div>
      ))}
    </nav>
  );
}