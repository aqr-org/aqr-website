"use client";

import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { NavigationLinkData } from "@/lib/types/navigation";
import NavigationDropdownItem from "./NavigationDropdownItem";
import { normalizeStoryblokUrl } from "@/lib/storyblok-url";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const filteredLinks = links.filter(link => link.component !== "navigation_cta");

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasDropdown = (link: NavigationLinkData) => {
    return (
      (link.dropdown_menu && link.dropdown_menu.length > 0) || 
      (link.dropdown_menu_2 && link.dropdown_menu_2.length > 0) || 
      (link.dropdown_menu_3 && link.dropdown_menu_3.length > 0)
    );
  };

  const renderDropdownSubmenu = (items: NavigationLinkData[] | undefined, prefix: string): React.ReactNode => {
    if (!items || items.length === 0) return null;
    
    return items.map((item, itemIndex) => {
      const itemHasDropdown = hasDropdown(item);
      const key = `${prefix}-${itemIndex}`;
      
      if (itemHasDropdown) {
        return (
          <DropdownMenuSub key={key}>
            <DropdownMenuSubTrigger className="hover:bg-qellow focus:bg-qellow">
              {item.name}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-qaupe border-qlack/20">
              {renderDropdownSubmenu(item.dropdown_menu, `${key}-menu1`)}
              {renderDropdownSubmenu(item.dropdown_menu_2, `${key}-menu2`)}
              {renderDropdownSubmenu(item.dropdown_menu_3, `${key}-menu3`)}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }
      
      return (
        <DropdownMenuItem key={key} asChild>
          <Link
            href={normalizeStoryblokUrl(item.link?.cached_url)}
            className="w-full hover:bg-qellow focus:bg-qellow"
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.name}
          </Link>
        </DropdownMenuItem>
      );
    });
  };

  return (
    <ul 
      className="hidden md:flex md:items-end md:justify-between font-medium relative" 
      role="menubar"
    >
      {/* Expanded navigation (when viewport >= 1100px) */}
      <div className="hidden min-[1295px]:flex items-end justify-between w-full">
        {filteredLinks.map((link: NavigationLinkData, index) => (
          <li 
            key={index} 
            className="group" 
            role="none"
            onMouseEnter={() => toggleSubmenu(index)}
            onMouseLeave={() => setExpandedSubmenus(prev => {
              const newSet = new Set(prev);
              newSet.delete(index);
              return newSet;
            })}
          >
            {hasDropdown(link) ? (
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
                  className={`group py-2 px-4 flex items-center gap-[4px] rounded-lg focus:bg-qlack/10 focus:outline-none ${expandedSubmenus.has(index) ? 'text-qreen-dark' : ''}`}
                  role="menuitem"
                >
                  <ChevronDown 
                    className={`w-3 h-3 transition-transform duration-300 ${
                      expandedSubmenus.has(index) ? 'rotate-180' : ''
                    }`} 
                    aria-hidden="true"
                  />
                  <span className=" hover:text-qreen-dark">
                    {link.name}
                  </span>
                </button>
                <ul
                  id={`desktop-submenu-${index}`}
                  className={`absolute top-full -left-4 min-w-full h-auto flex-col gap-12 p-8 rounded-lg bg-qaupe shadow-md border border-qlack/20 transition-all duration-200 ${
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
      </div>

      {/* Collapsed menu button (when viewport < 1100px) */}
      <div className="flex min-[1100px]:hidden">
        {mounted ? (
          <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className="py-2 px-4 flex items-center gap-2 rounded-lg hover:bg-qreen hover:text-qaupe focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                aria-label="Navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="w-5 h-5" />
                <span>Menu</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-[280px] bg-qaupe border-qlack/20"
              align="end"
            >
              {filteredLinks.map((link: NavigationLinkData, index) => {
                if (hasDropdown(link)) {
                  return (
                    <DropdownMenuSub key={index}>
                      <DropdownMenuSubTrigger className="hover:bg-qellow focus:bg-qellow">
                        {link.name}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-qaupe border-qlack/20">
                        <>
                          {renderDropdownSubmenu(link.dropdown_menu, `link-${index}-menu1`)}
                          {renderDropdownSubmenu(link.dropdown_menu_2, `link-${index}-menu2`)}
                          {renderDropdownSubmenu(link.dropdown_menu_3, `link-${index}-menu3`)}
                        </>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                }
                return (
                  <DropdownMenuItem key={index} asChild>
                    <Link
                      href={normalizeStoryblokUrl(link.link?.cached_url)}
                      className="hover:bg-qellow focus:bg-qellow"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            className="py-2 px-4 flex items-center gap-2 rounded-lg hover:bg-qreen hover:text-qaupe focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            aria-label="Navigation menu"
            aria-expanded={false}
            disabled
          >
            <Menu className="w-5 h-5" />
            <span>Menu</span>
          </button>
        )}
      </div>
    </ul>
  );
}
