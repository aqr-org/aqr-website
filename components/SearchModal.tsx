'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { GroupedSearchResults, SearchResult } from '@/lib/types/search';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liveSearch?: boolean;
}

export default function SearchModal({ open, onOpenChange, liveSearch = true }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GroupedSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [totalCount, setTotalCount] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const timeoutRef = useRef<NodeJS.Timeout>();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setTotalCount(0);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results);
      setTotalCount(data.totalCount);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults(null);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback((searchQuery: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
  }, [performSearch]);

  // Initialize query from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery && open) {
      setQuery(urlQuery);
      // Only auto-search if live search is enabled
      if (liveSearch) {
        performSearch(urlQuery);
      }
    }
  }, [open, searchParams, liveSearch, performSearch]);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults(null);
      setSelectedIndex(-1);
      setTotalCount(0);
    }
  }, [open]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
    
    // Only trigger live search if enabled
    if (liveSearch) {
      debouncedSearch(value);
    } else {
      // Clear results when not live searching
      setResults(null);
      setTotalCount(0);
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter key for submit when not live searching
    if (e.key === 'Enter' && !liveSearch && !results) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (!results) return;

    const allResults = getAllResults();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          handleResultClick(allResults[selectedIndex]);
        }
        break;
      case 'Escape':
        onOpenChange(false);
        break;
    }
  };

  const getAllResults = (): SearchResult[] => {
    if (!results) return [];
    
    const allResults: SearchResult[] = [];
    
    // Add Storyblok results
    Object.values(results.storyblok).forEach(group => {
      allResults.push(...group);
    });
    
    // Add member and company results
    allResults.push(...results.members, ...results.companies);
    
    return allResults;
  };

  const renderResult = (result: SearchResult, index: number, groupName?: string, groupIndex?: number) => (
    <button
      key={`${groupName || result.group}-${groupIndex || 0}-${index}`}
      onClick={() => handleResultClick(result)}
      className={cn(
        "w-full text-left p-3 rounded-lg hover:bg-qreen/10 transition-colors",
        selectedIndex === index && "bg-qreen/20 ring-2 ring-qreen/30"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-qreen-dark truncate">{result.title}</h4>
          {result.excerpt && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{result.excerpt}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-qreen bg-qreen/10 px-2 py-1 rounded">
              {result.group}
            </span>
            <span className="text-xs text-gray-500">{result.url}</span>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
      </div>
    </button>
  );

  const renderGroup = (title: string, results: SearchResult[], startIndex: number, groupIndex: number) => {
    if (results.length === 0) return null;
    
    return (
      <div key={title} className="mb-6">
        <h3 className="text-sm font-semibold text-qreen-dark mb-3 flex items-center gap-2">
          {title}
          <span className="text-xs bg-qreen/20 text-qreen px-2 py-1 rounded">
            {results.length}
          </span>
        </h3>
        <div className="space-y-1">
          {results.map((result, index) => 
            renderResult(result, startIndex + index, title, groupIndex)
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl text-qreen-dark flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search stories, members, companies..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-4 py-3 text-base"
                autoComplete="off"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
            </div>
            
            {/* Submit Button (only show when live search is disabled) */}
            {!liveSearch && (
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!query.trim() || isLoading}
                  className="bg-qreen border-none text-white hover:bg-qreen/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Results */}
          <div 
            ref={resultsRef}
            className="max-h-[50vh] overflow-y-auto"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            {query && !isLoading && results && (
              <>
                {totalCount > 0 ? (
                  <div className="space-y-6">
                    {/* Storyblok Results */}
                    {Object.entries(results.storyblok).map(([groupName, groupResults], groupIndex) => {
                      const startIndex = Object.values(results.storyblok)
                        .slice(0, groupIndex)
                        .reduce((acc, group) => acc + group.length, 0);
                      return renderGroup(groupName, groupResults, startIndex, groupIndex);
                    })}
                    
                    {/* Member Results */}
                    {renderGroup('Members', results.members, 
                      Object.values(results.storyblok).reduce((acc, group) => acc + group.length, 0),
                      Object.keys(results.storyblok).length
                    )}
                    
                    {/* Company Results */}
                    {renderGroup('Companies', results.companies,
                      Object.values(results.storyblok).reduce((acc, group) => acc + group.length, 0) + results.members.length,
                      Object.keys(results.storyblok).length + 1
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No results found for "{query}"</p>
                    <p className="text-sm mt-2">Try different keywords or check your spelling</p>
                  </div>
                )}
              </>
            )}

            {query && isLoading && (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-qreen" />
                <p>Searching...</p>
              </div>
            )}

            {!query && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{liveSearch ? 'Start typing to search' : 'Enter your search term'}</p>
                <p className="text-sm mt-2">
                  {liveSearch 
                    ? 'Search through stories, members, and companies' 
                    : 'Click Search to find stories, members, and companies'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
              </div>
              <span>⌘K to open search</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
