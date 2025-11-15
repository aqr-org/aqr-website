"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
 * For 'dir/advanced' routes with query params, also checks that query params match
 */
function isCurrentPage(href: string, currentPathname: string, currentSearchParams: URLSearchParams): boolean {
  if (!href || !currentPathname) return false;
  
  // Normalize both URLs for comparison
  const normalizedHref = normalizePathname(href);
  const normalizedPathname = normalizePathname(currentPathname);
  
  // Check if pathnames match
  if (normalizedHref !== normalizedPathname) {
    return false;
  }
  
  // Special handling for 'dir/advanced' routes with query parameters
  if (normalizedHref.includes('dir/advanced')) {
    // Extract query params from href if present (parse manually to avoid window dependency)
    const hrefQueryString = href.includes('?') ? href.split('?')[1].split('#')[0] : '';
    const hrefParams = new URLSearchParams(hrefQueryString);
    
    // If href has query params, current URL must have the same params
    if (hrefParams.toString()) {
      // Check if all href params match current search params
      for (const [key, value] of hrefParams.entries()) {
        if (currentSearchParams.get(key) !== value) {
          return false;
        }
      }
      
      // Also check that current params don't have extra params that href doesn't have
      // (optional: remove this if you want href params to be a subset)
      for (const [key, value] of currentSearchParams.entries()) {
        if (!hrefParams.has(key) || hrefParams.get(key) !== value) {
          return false;
        }
      }
    }
    // If href has no query params, current URL should also have no query params
    else if (currentSearchParams.toString()) {
      return false;
    }
  }
  
  return true;
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
    const searchParams = useSearchParams();
    const isCurrent = isCurrentPage(href, pathname, searchParams);
    
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

