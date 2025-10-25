import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { NavigationLinkData } from "@/lib/types/navigation";
import { EnvVarWarning } from "../env-var-warning";
import { AuthButton } from "../auth-button";
import { hasEnvVars } from "@/lib/utils";
import NavigationDropdownItem from "./NavigationDropdownItem";

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
      {links.map((link: NavigationLinkData, index) => (
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
                className="flex items-center justify-between w-full py-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                {link.name}
                <ChevronDown 
                  className={`h-4 w-4 transition-transform duration-200 ${
                    expandedSubmenus.has(index) ? 'rotate-180' : ''
                  }`} 
                  aria-hidden="true"
                />
              </button>
              <ul
                id={`mobile-submenu-${index}`}
                className={`overflow-hidden transition-all duration-200 ${
                  expandedSubmenus.has(index) 
                    ? 'max-h-96 opacity-100' 
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
            <Link 
              href={link.link?.cached_url || ''} 
              ref={index === 0 ? firstLinkRef : undefined} 
              className="block py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset" 
              role="menuitem"
            >
              {link.name}
            </Link>
          )}
        </li>
      ))}
    </>
  );

  if (!open) return null;

  return (
    <div
      id="mobile-menu"
      ref={menuRef}
      role="menu"
      aria-label="Mobile navigation"
      className="absolute left-4 right-4 top-24 mt-2 z-50 md:hidden bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
    >
      <ul className="flex flex-col p-2" role="none">
        {mobileLinks}
        <li className="mt-2 px-4 py-2" role="none">
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
        </li>
      </ul>
    </div>
  );
}
