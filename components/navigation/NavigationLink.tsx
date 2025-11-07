"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentProps, forwardRef } from "react";

/**
 * Normalizes a URL pathname for comparison by:
 * - Removing trailing slashes (except root '/')
 * - Converting to lowercase
 * - Removing query parameters and hash fragments
 */
function normalizePathname(pathname: string): string {
  if (!pathname) return "";
  
  // Remove query parameters and hash fragments
  const pathOnly = pathname.split("?")[0].split("#")[0];
  
  // Remove trailing slash except for root
  const normalized = pathOnly === "/" ? "/" : pathOnly.replace(/\/$/, "");
  
  return normalized.toLowerCase();
}

/**
 * Checks if a given href matches the current pathname
 */
function isCurrentPage(href: string, currentPathname: string): boolean {
  if (!href || !currentPathname) return false;
  
  // Normalize both URLs for comparison
  const normalizedHref = normalizePathname(href);
  const normalizedPathname = normalizePathname(currentPathname);
  
  return normalizedHref === normalizedPathname;
}

interface NavigationLinkProps extends ComponentProps<typeof Link> {
  href: string;
}

/**
 * A navigation link component that automatically adds a data-current-page
 * attribute when the link's href matches the current page pathname.
 */
const NavigationLink = forwardRef<HTMLAnchorElement, NavigationLinkProps>(
  function NavigationLink({ href, ...props }, ref) {
    const pathname = usePathname();
    const isCurrent = isCurrentPage(href, pathname);
    
    return (
      <Link
        href={href}
        ref={ref}
        {...props}
        data-current-page={isCurrent ? "true" : undefined}
      />
    );
  }
);

export default NavigationLink;

