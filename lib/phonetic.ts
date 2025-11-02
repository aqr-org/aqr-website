/**
 * Interface for the Dictionary API response
 */
interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics?: Array<{
    text?: string;
    audio?: string;
    sourceUrl?: string;
    license?: {
      name: string;
      url: string;
    };
  }>;
  meanings?: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      synonyms?: string[];
      antonyms?: string[];
      example?: string;
    }>;
  }>;
}

/**
 * Fetches phonetic spelling for a single word from the dictionaryapi.dev API
 * This is a helper function used internally by getPhoneticSpelling
 * 
 * @param word - A single word to get phonetic spelling for
 * @returns Promise resolving to phonetic spelling string or null if not found/error
 */
async function getSingleWordPhonetic(word: string): Promise<string | null> {
  if (!word || typeof word !== 'string' || word.trim().length === 0) {
    return null;
  }

  const normalizedWord = word.trim().toLowerCase();
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`;

  try {
    // Fetch with Next.js caching (24 hour revalidation)
    const response = await fetch(apiUrl, {
      cache: 'force-cache',
      next: { revalidate: 86400 }, // 24 hours
    });

    if (!response.ok) {
      // API returns 404 for words not found, or other error codes
      return null;
    }

    const data = await response.json() as DictionaryEntry[];

    // API returns an array, take the first entry
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const entry = data[0];

    // Prefer .phonetic property, fallback to phonetics[0]?.text
    if (entry.phonetic) {
      return entry.phonetic;
    }

    if (entry.phonetics && entry.phonetics.length > 0 && entry.phonetics[0]?.text) {
      return entry.phonetics[0].text;
    }

    // No phonetic found in response
    return null;
  } catch (error) {
    // Network errors, JSON parsing errors, etc.
    console.error(`Error fetching phonetic spelling for "${word}":`, error);
    return null;
  }
}

/**
 * Fetches phonetic spelling for a word or phrase from the dictionaryapi.dev API
 * 
 * If multiple words are provided (separated by spaces), each word is looked up
 * individually and the results are combined. If any words are not found, they
 * are skipped (the function will still return phonetics for words that were found).
 * 
 * @param word - The word or phrase to get phonetic spelling for (e.g., "hello" or "Important player")
 * @returns Promise resolving to phonetic spelling string or null if no words found/error
 * 
 * @example
 * const phonetic = await getPhoneticSpelling('hello');
 * // Returns: "həˈləʊ"
 * 
 * @example
 * const phonetic = await getPhoneticSpelling('Important player');
 * // Returns: "ɪmˈpɔːtənt ˈpleɪə" (combined phonetics for both words)
 */
export async function getPhoneticSpelling(word: string): Promise<string | null> {
  if (!word || typeof word !== 'string' || word.trim().length === 0) {
    return null;
  }

  // Split by spaces and filter out empty strings
  const words = word.trim().split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) {
    return null;
  }

  // If single word, use the direct approach (backward compatibility)
  if (words.length === 1) {
    return await getSingleWordPhonetic(words[0]);
  }

  // For multiple words, fetch all in parallel for better performance
  const phoneticPromises = words.map(w => getSingleWordPhonetic(w));
  const phonetics = await Promise.all(phoneticPromises);

  // Filter out null values and combine remaining phonetics with spaces
  const validPhonetics = phonetics.filter((p): p is string => p !== null);

  // Return null if no words were found, otherwise return combined result
  if (validPhonetics.length === 0) {
    return null;
  }

  return validPhonetics.join(' ');
}

