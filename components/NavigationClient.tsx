"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn, hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "./env-var-warning";
import { AuthButton } from "./auth-button";
import Logo from "@/components/Logo";
import { NavigationLinkData } from "@/lib/types/navigation";
import { ChevronDown } from "lucide-react";

interface NavigationClientProps {
  links: NavigationLinkData[];
}

export default function NavigationClient({ links }: NavigationClientProps) {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<number>>(new Set());
  const menuRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const submenuRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const close = useCallback(() => {
    setOpen(false);
    setExpandedSubmenus(new Set()); // Close all submenus when mobile menu closes
  }, []);

  // Toggle submenu expansion
  const toggleSubmenu = useCallback((index: number) => {
    setExpandedSubmenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Handle keyboard navigation for submenus
  const handleSubmenuKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSubmenu(index);
    } else if (e.key === 'Escape') {
      setExpandedSubmenus(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      // Focus the submenu trigger
      submenuRefs.current.get(index)?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!expandedSubmenus.has(index)) {
        toggleSubmenu(index);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (expandedSubmenus.has(index)) {
        toggleSubmenu(index);
      }
    }
  }, [expandedSubmenus, toggleSubmenu]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && open) {
        // allow normal tab but if focus leaves menu, close it
        const menu = menuRef.current;
        if (menu && !menu.contains(document.activeElement)) {
          close();
        }
      }
    }

    function onClickOutside(e: MouseEvent) {
      const menu = menuRef.current;
      const btn = toggleButtonRef.current;
      if (!menu) return;
      if (menu.contains(e.target as Node)) return;
      if (btn && btn.contains(e.target as Node)) return;
      close();
    }

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) {
      // focus the first link when opening
      setTimeout(() => firstLinkRef.current?.focus(), 0);
      // prevent body scroll on mobile
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      // restore focus to toggle button
      toggleButtonRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;
      
      if (currentScrollY < 20) {
        setIsScrolled(false);
      }
      else {
        if (currentScrollY > 20 && scrollDelta > 0) {
          // Scrolling down and past 20px
          setIsScrolled(true);
        } else if (scrollDelta < -20) {
          // Scrolled back up by 20px or more
          setIsScrolled(false);
        }
      }
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mobileLinks = (
    <>
      {links.map((link: NavigationLinkData, index) => (
        <li key={index} className="relative px-4">
          {link.dropdown_menu && link.dropdown_menu.length > 0 ? (
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
                {link.dropdown_menu.map((dropdownItem, dropdownIndex) => (
                  <li key={dropdownIndex} role="none">
                    <Link 
                      href={dropdownItem.link?.cached_url || ''}
                      className="block py-2 pl-4 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                      role="menuitem"
                    >
                      {dropdownItem.name}
                    </Link>
                  </li>
                ))}
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

  return (
    <>
      <nav 
        className={cn(
          isScrolled ? 
          '-translate-y-full sticky top-0 z-50 w-full flex justify-center bg-qaupe transition-all duration-500 ease-in-out' 
          : 
          'sticky translate-y-0 top-0 z-50 w-full flex justify-center bg-qaupe transition-all duration-500 ease-in-out'
        )} 
        aria-label="Main navigation"
      >
        <div className="w-full max-w-maxw flex items-center justify-between p-5 px-container">
          <div className="flex items-center gap-14">
            <Link href="/" className="w-20 h-20 inline-flex items-center" aria-label="Home">
              <Logo />
            </Link>

            {/* Desktop links */}
            <ul className="hidden md:flex md:items-end md:gap-6 font-[500]" role="menubar">
            {links.map((link: NavigationLinkData, index) => (
              <li key={index} className="group relative" role="none">
                {link.dropdown_menu && link.dropdown_menu.length > 0 ? (
                  <>
                    <button
                      ref={(el) => {
                        if (el) submenuRefs.current.set(index, el);
                      }}
                      onClick={() => toggleSubmenu(index)}
                      onKeyDown={(e) => handleSubmenuKeyDown(e, index)}
                      onMouseEnter={() => toggleSubmenu(index)}
                      onMouseLeave={() => setExpandedSubmenus(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(index);
                        return newSet;
                      })}
                      aria-expanded={expandedSubmenus.has(index)}
                      aria-haspopup="true"
                      aria-controls={`desktop-submenu-${index}`}
                      className={`py-2 px-4 flex items-center gap-[2px] hover:bg-qreen hover:text-qaupe rounded-t-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${expandedSubmenus.has(index) ? 'bg-qreen text-qaupe' : ''}`}
                      role="menuitem"
                    >
                      {link.name}
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-300 ${
                          expandedSubmenus.has(index) ? 'rotate-180' : ''
                        }`} 
                        aria-hidden="true"
                      />
                    </button>
                    <ul
                      id={`desktop-submenu-${index}`}
                      className={`absolute top-full left-0 min-w-48 h-auto flex-col p-4 rounded-lg rounded-tl-none bg-qaupe shadow-md border-2 border-qreen transition-all duration-200 ${
                        expandedSubmenus.has(index) 
                          ? 'flex opacity-100 visible' 
                          : 'hidden opacity-0 invisible'
                      }`}
                      role="menu"
                      aria-label={`${link.name} submenu`}
                    >
                      {link.dropdown_menu.map((dropdownItem, dropdownIndex) => (
                        <li key={dropdownIndex} className="border-b text-qreen border-qreen/20 hover:text-qlack last:border-b-0" role="none">
                          <Link 
                            href={'/' + dropdownItem.link?.cached_url || ''}
                            className="block py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                            role="menuitem"
                          >
                            {dropdownItem.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link 
                    href={'/' + link.link?.cached_url || ''} 
                    ref={index === 0 ? firstLinkRef : undefined} 
                    className="py-2 px-4 flex items-center gap-[2px] hover:bg-qreen hover:text-qaupe rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset" 
                    role="menuitem"
                  >
                    {link.name}
                  </Link>
                )}
              </li>
            ))}
            </ul>
          </div>

          {/* Right side - desktop */}
          <div className="hidden md:block">
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>

          {/* Mobile: hamburger */}
          <div className="md:hidden">
            <button
              ref={toggleButtonRef}
              aria-controls="mobile-menu"
              aria-expanded={open}
              aria-label={open ? 'Close navigation' : 'Open navigation'}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Toggle navigation</span>
              {open ? (
                // X icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile menu panel */}
          {open && (
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
          )}
        </div>
      </nav>
    </>
  );
}
