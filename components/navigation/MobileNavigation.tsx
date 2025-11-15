import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { NavigationLinkData } from "@/lib/types/navigation";
import { AuthButton } from "../auth-button";
import NavigationDropdownItem from "./NavigationDropdownItem";
import NavigationLink from "./NavigationLink";
import { normalizeStoryblokUrl } from "@/lib/storyblok-url";

interface MobileNavigationProps {
  links: NavigationLinkData[];
  open: boolean;
  expandedSubmenus: Set<number>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  firstLinkRef: React.RefObject<HTMLAnchorElement | HTMLButtonElement | null>;
  submenuRefs: React.MutableRefObject<Map<number, HTMLButtonElement>>;
  toggleSubmenu: (index: number) => void;
  handleSubmenuKeyDown: (e: React.KeyboardEvent, index: number) => void;
}

export default function MobileNavigation({
  links,
  open,
  expandedSubmenus,
  menuRef,
  firstLinkRef,
  submenuRefs,
  toggleSubmenu,
  handleSubmenuKeyDown,
}: MobileNavigationProps) {
  const mobileLinks = (
    <>
      {links.filter(link => link.component !== "navigation_cta").map((link: NavigationLinkData, index) => {
        const isFirstItem = index === 0;
        const hasDropdown = (link.dropdown_menu && link.dropdown_menu.length > 0) || 
                           (link.dropdown_menu_2 && link.dropdown_menu_2.length > 0) || 
                           (link.dropdown_menu_3 && link.dropdown_menu_3.length > 0);
        
        return (
          <li key={index} className="relative px-4">
            {hasDropdown ? (
              <>
                <button
                  ref={(el) => {
                    if (el) {
                      submenuRefs.current.set(index, el);
                      // Assign to firstLinkRef if this is the first item
                      if (isFirstItem) {
                        (firstLinkRef as React.MutableRefObject<HTMLAnchorElement | HTMLButtonElement | null>).current = el;
                      }
                    }
                  }}
                  onClick={() => toggleSubmenu(index)}
                  onKeyDown={(e) => handleSubmenuKeyDown(e, index)}
                  aria-expanded={expandedSubmenus.has(index)}
                  aria-haspopup="true"
                  aria-controls={`mobile-submenu-${index}`}
                  className="flex items-center justify-between w-full py-2 text-left text-xl focus:outline-none border-b border-qlack/20 group/button relative hover:border-b-transparent focus-visible:border-b-transparent"
                >
                  <span className="absolute -inset-1 -inset-x-3 rounded-lg group-hover/button:bg-qreen/10 group-focus-visible/button:bg-qreen/10 group-active/button:bg-qreen/20 z-0"></span>
                  {link.name}
                  <ChevronDown 
                    className={`h-5 w-5 transition-transform duration-200 ${
                      expandedSubmenus.has(index) ? 'rotate-180' : ''
                    }`} 
                    aria-hidden="true"
                  />
                </button>
                <ul
                  id={`mobile-submenu-${index}`}
                  className={`overflow-hidden transition-all duration-200 mb-4 pl-4 ${
                    expandedSubmenus.has(index) 
                      ? 'max-h-full opacity-100' 
                      : 'max-h-0 opacity-0'
                  }`}
                  role="menu"
                  aria-label={`${link.name} submenu`}
                  aria-hidden={!expandedSubmenus.has(index)}
                  >
                    <NavigationDropdownItem 
                      item={link} 
                      itemIndex={index} 
                      level={0} 
                      isMobile={true}
                      isParentExpanded={expandedSubmenus.has(index)}
                    />
                  </ul>
              </>
            ) : (
              <NavigationLink 
                href={normalizeStoryblokUrl(link.link?.cached_url)}
                ref={isFirstItem ? firstLinkRef as React.RefObject<HTMLAnchorElement> : undefined} 
                className="block py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset" 
                role="menuitem"
              >
                {link.name}
              </NavigationLink>
            )}
          </li>
        );
      })}
    </>
  );

  if (!open) return null;

  return (
    <div
      id="mobile-menu"
      ref={menuRef as React.RefObject<HTMLDivElement>}
      role="menu"
      aria-label="Mobile navigation"
      className="absolute left-0 right-0 top-24 max-h-[calc(100vh-128px)] overflow-y-auto mt-2 z-10 md:hidden bg-qaupe rounded-lg shadow-lg"
    >
      <ul className="flex flex-col p-3 pt-8" role="none">
        {mobileLinks}
        <li className="mt-2 px-4 py-2" role="none">
          <AuthButton />
        </li>
      </ul>
    </div>
  );
}
