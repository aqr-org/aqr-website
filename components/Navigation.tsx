"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "./env-var-warning";
import { AuthButton } from "./auth-button";
import Logo from "@/components/Logo";

export default function Navigation() {
  const [open, setOpen] = useState(false);
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

  const links = (
    <>
      <li>
        <Link href="/about" ref={firstLinkRef} className="block px-4 py-2" role="menuitem">About</Link>
      </li>
      <li>
        <Link href="/companies" className="block px-4 py-2" role="menuitem">Companies</Link>
      </li>
      <li>
        <Link href="/members" className="block px-4 py-2" role="menuitem">Members</Link>
      </li>
    </>
  );

  return (
    <nav className="w-full flex justify-center bg-qaupe" aria-label="Main navigation">
      <div className="w-full max-w-maxw flex items-center justify-between p-3 px-5 text-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-20 h-20 inline-flex items-center" aria-label="Home">
            <Logo />
          </Link>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex md:items-end md:gap-8 font-[550] text-lg">
          <Link href="/about">About</Link>
          <Link href="/companies">Companies</Link>
          <Link href="/members">Members</Link>
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
            <ul className="flex flex-col p-2">{links}
              <li className="mt-2 px-4 py-2">
                {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}