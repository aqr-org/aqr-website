import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { NavigationLinkData } from "@/lib/types/navigation";
import NavigationDropdownItem from "./NavigationDropdownItem";
import { normalizeStoryblokUrl } from "@/lib/storyblok-url";

interface DesktopNavigationProps {
  links: NavigationLinkData[];
  expandedSubmenus: Set<number>;
  firstLinkRef: React.RefObject<HTMLAnchorElement | null>;
  submenuRefs: React.RefObject<Map<number, HTMLButtonElement>>;
  toggleSubmenu: (index: number) => void;
  handleSubmenuKeyDown: (e: React.KeyboardEvent, index: number) => void;
  setExpandedSubmenus: React.Dispatch<React.SetStateAction<Set<number>>>;
}

export default function DesktopNavigation({
  links,
  expandedSubmenus,
  firstLinkRef,
  submenuRefs,
  toggleSubmenu,
  handleSubmenuKeyDown,
  setExpandedSubmenus,
}: DesktopNavigationProps) {
  return (
    <ul className="hidden md:flex md:items-end md:justify-between font-medium" role="menubar">
      {links.filter(link => link.component !== "navigation_cta").map((link: NavigationLinkData, index) => (
        <li 
          key={index} 
          className="group relative" 
          role="none"
          onMouseEnter={() => toggleSubmenu(index)}
          onMouseLeave={() => setExpandedSubmenus(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          })}
        >
          {(link.dropdown_menu && link.dropdown_menu.length > 0) || 
         (link.dropdown_menu_2 && link.dropdown_menu_2.length > 0) || 
         (link.dropdown_menu_3 && link.dropdown_menu_3.length > 0) ? (
            <>
              <button
                ref={(el) => {
                  if (el && submenuRefs.current) submenuRefs.current.set(index, el);
                }}
                onClick={() => toggleSubmenu(index)}
                onKeyDown={(e) => handleSubmenuKeyDown(e, index)}
                aria-expanded={expandedSubmenus.has(index)}
                aria-haspopup="true"
                aria-controls={`desktop-submenu-${index}`}
                className={`group py-2 px-4 flex items-center gap-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${expandedSubmenus.has(index) ? 'border-qlack' : ''}`}
                role="menuitem"
              >
                <ChevronDown 
                  className={`w-3 h-3 transition-transform duration-300 ${
                    expandedSubmenus.has(index) ? 'rotate-180' : ''
                  }`} 
                  aria-hidden="true"
                />
                <span className="border-b border-transparent group-hover:border-qlack whitespace-nowrap">
                  {link.name}
                </span>
              </button>
              <ul
                id={`desktop-submenu-${index}`}
                className={`absolute top-full -left-4 min-w-52 h-auto flex-col p-8 rounded-lg bg-qaupe shadow-md border border-qlack/20 transition-all duration-200 ${
                  expandedSubmenus.has(index) 
                    ? 'flex opacity-100 visible' 
                    : 'hidden opacity-0 invisible'
                }`}
                role="menu"
                aria-label={`${link.name} submenu`}
                    >
                      <NavigationDropdownItem 
                        item={link} 
                        itemIndex={index} 
                        level={0} 
                        isMobile={false}
                      />
                    </ul>
            </>
          ) : (
            <Link 
              href={normalizeStoryblokUrl(link.link?.cached_url)}
              ref={index === 0 ? firstLinkRef as React.RefObject<HTMLAnchorElement> : undefined} 
              className="py-2 px-4 flex items-center gap-[2px] hover:bg-qreen hover:text-qaupe rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset" 
              role="menuitem"
            >
              {link.name}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
