import { NavigationLinkData } from "@/lib/types/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeStoryblokUrl } from "@/lib/storyblok-url";

export default function RenderSidebar({ sidebar_items }: { sidebar_items: NavigationLinkData[] }) {
  return (
    <nav aria-label="Secondary sidebar navigation" id="secondary-navigation" className="md:sticky md:top-8">
      {sidebar_items.map((item: NavigationLinkData, index: number) => (
        <div key={item.name+index} className={cn(index === 0 ? "mt-0" : "mt-8")}>
          {item.component === "navigation_cta" ? (
            <Button variant="default" className="text-qreen-dark border-qreen-dark">
              <Link href={normalizeStoryblokUrl(item.link?.cached_url)} className="flex items-center gap-2 text-base">
              {item.icon === 'suitcase' && (
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="4.38623" width="14" height="10.9474" rx="2" stroke="#3C772B" strokeWidth="2"/>
                  <path d="M10.5788 4.38618V2.85986C10.5788 2.30758 10.1311 1.85986 9.57879 1.85986H6.4209C5.86861 1.85986 5.4209 2.30758 5.4209 2.85986V4.38618" stroke="#3C772B" strokeWidth="2"/>
                </svg>
              )}
              {item.icon === 'user' && (
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.3333 16.5V15.5C13.3333 14.9477 12.9756 14.5 12.4233 14.5H3.57667C3.02438 14.5 2.66667 14.9477 2.66667 15.5V16.5" stroke="#3C772B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 10.5C10.2091 10.5 12 8.70914 12 6.5C12 4.29086 10.2091 2.5 8 2.5C5.79086 2.5 4 4.29086 4 6.5C4 8.70914 5.79086 10.5 8 10.5Z" stroke="#3C772B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
                {item.name}
              </Link>
            </Button>
          ) : item.link?.cached_url !== "" ? (
            <Link 
              href={normalizeStoryblokUrl(item.link?.cached_url)}
              className="text-lg font-[600] text-qlack"
            >
              {item.name}
            </Link>
          ) : (
            <div className="text-lg font-[600] text-qlack">
              {item.name}
            </div>
          )}
          {item.dropdown_menu &&
            <ul className="pl-4">
              {item.dropdown_menu.map((dropdownItem: NavigationLinkData, dropdownIndex: number) => (
                <li key={dropdownItem.name+dropdownIndex}>
                  <Link 
                    href={normalizeStoryblokUrl(dropdownItem.link?.cached_url)}
                    className="group font-[400] text-[1rem] text-qreen-dark flex gap-1 items-start"
                  >
                    <svg aria-hidden="true" className="downrightArrow h-[1em] relative top-[0.2em]" width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.2 5.6932H1V0.359863M6.86667 8.35986L9 5.6932L6.86667 3.02653" stroke="#3C772B" strokeWidth="1.5"/></svg>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {dropdownItem.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          }
        </div>
      ))}
    </nav>
  );
}