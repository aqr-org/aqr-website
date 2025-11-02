import { createClient } from "@/lib/supabase/server";
import { headers } from 'next/headers';

/**
 * Checks if the request is coming from Storyblok editor.
 * Storyblok editor typically includes 'storyblok' in the referer header.
 * @returns true if the request is from Storyblok editor
 */
export async function isStoryblokEditor(): Promise<boolean> {
  try {
    const headersList = await headers();
    const referer = headersList.get('referer') || '';
    // Check referer for storyblok domain (handles iframe preview)
    // Also check for common Storyblok preview patterns
    return referer.includes('storyblok') || referer.includes('app.storyblok.com');
  } catch {
    // If headers() fails, assume not in editor
    return false;
  }
}

/**
 * Checks if a Storyblok story is protected and if the user is authenticated.
 * @param story - The Storyblok story object
 * @param skipAuthCheck - Optional flag to skip auth check (e.g., when in Storyblok editor)
 * @returns Object with isProtected and isAuthenticated status
 */
export async function checkStoryblokPageAuth(story: any, skipAuthCheck: boolean = false) {
  // Check if the page is marked as members_only
  const isProtected = story?.content?.members_only === true;

  if (!isProtected) {
    return {
      isProtected: false,
      isAuthenticated: false, // Not relevant if not protected
    };
  }

  // If we're skipping auth check (e.g., in Storyblok editor), return as authenticated
  if (skipAuthCheck) {
    return {
      isProtected: true,
      isAuthenticated: true,
    };
  }

  // If protected, check authentication
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const isAuthenticated = !error && !!data?.claims;

  return {
    isProtected: true,
    isAuthenticated,
  };
}

