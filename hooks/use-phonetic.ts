'use client';

import { useState, useEffect, useTransition } from 'react';

/**
 * Hook to fetch phonetic spelling for a word on the client side
 * 
 * Uses the API route for fetching and supports Suspense boundaries.
 * The fetch is wrapped in startTransition for low priority (non-blocking) loading.
 * 
 * @param word - The word to get phonetic spelling for
 * @returns Object with phonetic spelling, loading state, and error
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { phonetic, isLoading, error } = usePhonetic('hello');
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return <div>Phonetic: {phonetic || 'Not found'}</div>;
 * }
 * ```
 */
export function usePhonetic(word: string | null | undefined) {
  const [phonetic, setPhonetic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!word || word.trim().length === 0) {
      setPhonetic(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Use startTransition for low priority loading (won't block rendering)
    startTransition(async () => {
      try {
        const response = await fetch(`/api/phonetic?word=${encodeURIComponent(word.trim())}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch phonetic: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          setPhonetic(null);
        } else {
          setPhonetic(data.phonetic);
          setError(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setPhonetic(null);
      } finally {
        setIsLoading(false);
      }
    });
  }, [word]);

  return {
    phonetic,
    isLoading: isLoading || isPending,
    error,
  };
}


