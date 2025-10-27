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
    
    // If it's a full URL, extract the path portion
    const url = new URL(cached_url);
    return url.pathname;
  } catch {
    // If it's not a full URL (or URL parsing fails), treat it as a relative path
    // Ensure it starts with '/'
    return cached_url.startsWith('/') ? cached_url : `/${cached_url}`;
  }
}

