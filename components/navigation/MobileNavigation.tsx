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
  firstLinkRef: React.RefObject<HTMLAnchorElement | null>;
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
      {links.filter(link => link.component !== "navigation_cta").map((link: NavigationLinkData, index) => (
        <li key={index} className="relative px-4">
          {(link.dropdown_menu && link.dropdown_menu.length > 0) || 
         (link.dropdown_menu_2 && link.dropdown_menu_2.length > 0) || 
         (link.dropdown_menu_3 && link.dropdown_menu_3.length > 0) ? (
            <>
              <button
                ref={(el) => {
                  if (el) submenuRefs.current.set(index, el);
                }}
                onClick={() => toggleSubmenu(index)}
                onKeyDown={(e) => handleSubmenuKeyDown(e, index)}
                aria-expanded={expandedSubmenus.has(index)}
                aria-haspopup="true"
                aria-controls={`mobile-submenu-${index}`}
                className="flex items-center justify-between w-full py-2 text-left text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset border-b border-qlack/20"
              >
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
                className={`overflow-hidden transition-all duration-200 pl-4 ${
                  expandedSubmenus.has(index) 
                    ? 'max-h-full opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}
                role="menu"
                aria-label={`${link.name} submenu`}
                >
                  <NavigationDropdownItem 
                    item={link} 
                    itemIndex={index} 
                    level={0} 
                    isMobile={true}
                  />
                </ul>
            </>
          ) : (
            <NavigationLink 
              href={normalizeStoryblokUrl(link.link?.cached_url)}
              ref={index === 0 ? firstLinkRef as React.RefObject<HTMLAnchorElement> : undefined} 
              className="block py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset" 
              role="menuitem"
            >
              {link.name}
            </NavigationLink>
          )}
        </li>
      ))}
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
