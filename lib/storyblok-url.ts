/**
 * Converts a Storyblok cached_url to a Next.js-compatible path
 * 
 * When resolve_links is set to 'url', Storyblok returns full URLs like:
 * "https://example.com/members/" or "https://example.com/dir/"
 * 
 * This function extracts the path portion and ensures it starts with '/'
 * for absolute navigation in Next.js.
 * 
 * @param cached_url - The cached_url from Storyblok (can be a full URL or relative path)
 * @returns A Next.js-compatible path starting with '/'
 */
export function normalizeStoryblokUrl(cached_url?: string): string {
  if (!cached_url) return '';
  
  try {
    // If it's already a valid absolute path starting with '/', return as is
    if (cached_url.startsWith('/')) {
      return cached_url;
    }
    
    // If it's a full URL, only extract the path portion if it matches our site URL or localhost
    const url = new URL(cached_url);
    const origin = url.origin;
    const siteUrl = process.env.URL ? new URL(process.env.URL).origin : null;
    
    // Only extract pathname if it's from our site or localhost
    if (siteUrl && origin === siteUrl) {
      return url.pathname;
    }
    if (origin.includes('localhost')) {
      return url.pathname;
    }
    
    // If it's a different domain, return the original URL
    return cached_url;
  } catch {
    // If it's not a full URL (or URL parsing fails), treat it as a relative path
    // Ensure it starts with '/'
    return cached_url.startsWith('/') ? cached_url : `/${cached_url}`;
  }
}

