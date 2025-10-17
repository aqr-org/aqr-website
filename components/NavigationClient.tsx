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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

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
          <Link 
            href={link.link?.cached_url || ''} 
            ref={index === 0 ? firstLinkRef : undefined} 
            className="block py-2" 
            role="menuitem"
            >
            {link.name}
          </Link>
          {/* Optional Dropdown menu */}
          { link.dropdown_menu && (
          <ul className="relative top-full left-0 w-full h-full flex flex-col">
            {link.dropdown_menu.map((dropdownItem, dropdownIndex) => (
              <li key={dropdownIndex} >
                <Link 
                  href={dropdownItem.link?.cached_url || ''}
                  className="block py-2"
                >
                  {dropdownItem.name}
                </Link>
              </li>
            ))}
          </ul>
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
            <ul className="hidden md:flex md:items-end md:gap-6 font-[500]">
            {links.map((link: NavigationLinkData, index) => (
              <li key={index} className="group relative">
                <Link 
                  href={'/' + link.link?.cached_url || ''} 
                  ref={index === 0 ? firstLinkRef : undefined} 
                  className={`py-2 px-4 flex items-center gap-[2px] group-hover:bg-qreen group-hover:text-qaupe ${(link.dropdown_menu && link.dropdown_menu.length > 0) ? 'rounded-t-xl' : 'rounded-xl'}`} 
                  role="menuitem"
                  >
                  {link.name}
                  { link.dropdown_menu && link.dropdown_menu.length > 0 && (
                    <span className="inline-block group-hover:translate-y-[2px] transition-transform duration-300">
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  )}
                </Link>
                {/* Optional Dropdown menu */}
                { link.dropdown_menu && link.dropdown_menu.length > 0 && (
                <ul className="absolute top-full left-0 min-w-48 h-auto group-hover:flex hidden flex-col p-4 rounded-lg rounded-tl-none bg-qaupe shadow-md border-2 border-qreen">
                  {link.dropdown_menu.map((dropdownItem, dropdownIndex) => (
                    <li key={dropdownIndex} className="border-b text-qreen border-qreen/20 hover:text-qlack last:border-b-0">
                      <Link 
                        href={'/' + dropdownItem.link?.cached_url || ''}
                        className="block py-2"
                      >
                        {dropdownItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
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
              <ul className="flex flex-col p-2">
                {mobileLinks}
                <li className="mt-2 px-4 py-2">
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
