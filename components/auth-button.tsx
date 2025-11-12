"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogoutMenuItem } from "./logout-button";
import { useEffect, useState, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { UserRound } from "lucide-react";
import { NavigationLinkData } from "@/lib/types/navigation";
import NavigationLink from "./navigation/NavigationLink";
import { normalizeStoryblokUrl } from "@/lib/storyblok-url";
import { cn } from "@/lib/utils";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarItems, setSidebarItems] = useState<NavigationLinkData[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes in real-time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Check if user is superadmin when user email is available
  useEffect(() => {
    const checkSuperadmin = async () => {
      if (!user?.email) {
        setIsSuperadmin(false);
        return;
      }

      try {
        const normalizedEmail = user.email.trim().toLowerCase();
        const response = await fetch('/api/check-superadmin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsSuperadmin(data.skipBeaconCheck || false);
        } else {
          setIsSuperadmin(false);
        }
      } catch (error) {
        console.error('Error checking superadmin status:', error);
        setIsSuperadmin(false);
      }
    };

    checkSuperadmin();
  }, [user?.email]);

  // Fetch members-only sidebar items
  useEffect(() => {
    const fetchSidebarItems = async () => {
      try {
        // Fetch will respect Cache-Control headers from the API
        const response = await fetch('/api/members-only-sidebar');
        if (response.ok) {
          const data = await response.json();
          setSidebarItems(data.nav_items || []);
        }
      } catch (error) {
        console.error('Error fetching members-only-sidebar:', error);
      }
    };

    fetchSidebarItems();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMenu();
    }
  };

  // Always show menu on mobile, toggle on desktop
  const shouldShowMenu = isOpen;

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  return user ? (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={toggleMenu}
        onKeyDown={handleKeyDown}
        // onMouseEnter={() => setIsOpen(true)}
        // onMouseLeave={() => setIsOpen(false)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
        className="inline-block p-1 border-2 border-qreen text-qreen rounded-full hover:bg-qreen hover:text-qaupe focus:outline-none focus:ring-2 focus:shadow-lg focus:shadow-qreen-dark/50 transition-colors"
      >
        <UserRound className="w-6 h-6" />
      </button>
      <div
        className={`block md:${isOpen ? 'block' : 'hidden'} md:absolute md:top-full md:right-0 w-auto min-w-64 bg-qaupe p-4 rounded-lg space-y-2 border-2 border-qreen z-50 mt-2 md:mt-0`}
        role="menu"
        aria-orientation="vertical"
      >
          
          {sidebarItems.map((item: NavigationLinkData, index: number) => (
            <div key={item.name + index} className={cn(index === 0 ? "mt-0" : "mt-2")}>
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
                  className="flex-col text-qreen items-center gap-1 block hover:text-qreen/80 focus:outline-none focus:ring-2 focus:ring-qreen focus:rounded px-1"
                  role="menuitem"
                >
                  {item.name}
                </NavigationLink>
              ) : (
                <div className="flex-col text-qlack font-semibold items-center gap-1 block px-1">
                  {item.name}
                </div>
              )}
              {item.dropdown_menu &&
                <ul className="space-y-1 mt-1">
                  {item.dropdown_menu.map((dropdownItem: NavigationLinkData, dropdownIndex: number) => (
                    <li key={dropdownItem.name + dropdownIndex}>
                      <NavigationLink 
                        href={normalizeStoryblokUrl(dropdownItem.link?.cached_url)}
                        className={cn(
                          "group/sidebarlink",
                          "flex gap-1 items-start",
                          "text-sm font-medium",
                          "text-qreen data-[current-page=true]:text-qreen-dark/60",
                          "hover:text-qreen/80 focus:outline-none focus:ring-2 focus:ring-qreen focus:rounded px-1"
                        )}
                        role="menuitem"
                      >
                        <svg aria-hidden="true" className="group-data-[current-page=true]/sidebarlink:hidden downrightArrow h-[1em] relative top-[0.2em]" width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.2 5.6932H1V0.359863M6.86667 8.35986L9 5.6932L6.86667 3.02653" stroke="#7BBD40" strokeWidth="1.5"/></svg>
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
          
          <div className="text-qreen mt-4">
            <div className="bg-qreen/10 p-4 rounded-lg">
              <p className="text-xs text-qlack/50 mb-1 whitespace-nowrap flex items-center gap-1 font-normal">
                <UserRound className="w-3 h-3" /> {user.email}!
              </p>
              {isSuperadmin ? (
                <Link
                  href="/superadmin"
                  className="flex-col text-qreen items-center gap-1 block hover:text-qreen/80 focus:outline-none focus:ring-2 focus:ring-qreen focus:rounded px-1"
                  role="menuitem"
                >
                  Superadmin Panel
                </Link>
              ) : (
                <Link
                  href="/protected"
                  className="flex-col text-qreen items-center gap-1 block hover:text-qreen/80 focus:outline-none focus:ring-2 focus:ring-qreen focus:rounded px-1"
                  role="menuitem"
                >
                  Edit profile
                </Link>
              )}
            </div>
            <div className="text-right">
              <LogoutMenuItem />
            </div>
          </div>
      </div>
    </div>
  ) : (
    <div className="flex gap-8 justify-between w-full">
      <Link href="/auth/login" className="font-medium flex gap-2 items-center whitespace-nowrap">
        <span>
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.2201 6.6105V3.9705C13.2201 2.3205 11.8701 0.970497 10.2201 0.970497H5.85008C4.20008 0.970497 2.85008 2.3205 2.85008 3.9705V6.6105H0.0800781V15.8905C0.0800781 18.1005 1.87008 19.8905 4.08008 19.8905H12.0001C14.2101 19.8905 16.0001 18.1005 16.0001 15.8905V6.6105H13.2201ZM4.86008 3.9705C4.86008 3.4205 5.31008 2.9705 5.86008 2.9705H10.2301C10.7801 2.9705 11.2301 3.4205 11.2301 3.9705V6.6105H4.86008V3.9705ZM14.0001 15.8905C14.0001 16.9905 13.1001 17.8905 12.0001 17.8905H4.08008C2.98008 17.8905 2.08008 16.9905 2.08008 15.8905V8.6105H14.0001V15.8905Z" fill="currentColor"/>
            <path d="M9.42008 15.9605L8.69008 12.7705C9.12008 12.5405 9.42008 12.0905 9.42008 11.5605C9.42008 10.8005 8.80008 10.1805 8.04008 10.1805C7.28008 10.1805 6.66008 10.8005 6.66008 11.5605C6.66008 12.0805 6.96008 12.5305 7.39008 12.7705L6.66008 15.9605H9.42008Z" fill="currentColor"/>
        </svg>
        </span>
        Log in
      </Link>
      {/* <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button> */}
      <Button variant={"qreen"} className="[&_svg]:size-5">
        <Link href='/members/new-membership-application' className="flex items-center gap-1">
          <span>
            <UserRound className="w-5 h-5" />
          </span>
          Join AQR
        </Link>
      </Button>
    </div>
  );
}
