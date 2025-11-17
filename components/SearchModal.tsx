'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2, ArrowRight, ChevronDown } from 'lucide-react';
import { GroupedSearchResults, SearchResult, SearchGroup } from '@/lib/types/search';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liveSearch?: boolean;
}

export default function SearchModal({ open, onOpenChange, liveSearch = true }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set());
  const [isMac, setIsMac] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const urlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  // Detect platform on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMac(navigator.userAgent.toLowerCase().includes('mac'));
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setGroups([]);
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
      setGroups(data.groups);
      setTotalCount(data.totalCount);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setGroups([]);
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
    if (urlQuery && open && !initializedRef.current) {
      setQuery(urlQuery);
      initializedRef.current = true;
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
      setGroups([]);
      setSelectedIndex(-1);
      setTotalCount(0);
      setLoadingGroups(new Set());
      setFilterGroup(null);
      initializedRef.current = false;
    }
  }, [open]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    
    // Update URL params (debounced to avoid excessive updates)
    if (urlTimeoutRef.current) {
      clearTimeout(urlTimeoutRef.current);
    }
    
    urlTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 500); // Longer delay for URL updates to avoid interfering with typing
    
    // Only trigger live search if enabled
    if (liveSearch) {
      debouncedSearch(value);
    } else {
      // Clear results when not live searching
      setGroups([]);
      setTotalCount(0);
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const loadMoreResults = async (groupName: string) => {
    if (!query.trim()) return;

    setLoadingGroups(prev => new Set(prev).add(groupName));

    try {
      const response = await fetch('/api/search/more', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: query.trim(), 
          groupName,
          offset: 0,
          limit: 50
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load more results');
      }

      const data = await response.json();
      
      // Update the group with all results
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.name === groupName 
            ? { ...group, results: data.results, hasMore: data.hasMore }
            : group
        )
      );
    } catch (error) {
      console.error('Error loading more results:', error);
    } finally {
      setLoadingGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupName);
        return newSet;
      });
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter key for submit when not live searching
    if (e.key === 'Enter' && !liveSearch && !groups.length) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (!groups.length) return;

    const allResults = getAllResults();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const newIndexDown = selectedIndex < allResults.length - 1 ? selectedIndex + 1 : selectedIndex;
        setSelectedIndex(newIndexDown);
        scrollToSelectedResult(newIndexDown);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const newIndexUp = selectedIndex > 0 ? selectedIndex - 1 : -1;
        setSelectedIndex(newIndexUp);
        scrollToSelectedResult(newIndexUp);
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

  const scrollToSelectedResult = (index: number) => {
    if (index < 0 || !resultsRef.current) return;
    
    const container = resultsRef.current;
    const resultElements = container.querySelectorAll('[data-result-index]');
    const selectedElement = resultElements[index] as HTMLElement;
    
    if (selectedElement) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = selectedElement.getBoundingClientRect();
      
      // Check if element is above the visible area
      if (elementRect.top < containerRect.top) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Check if element is below the visible area
      else if (elementRect.bottom > containerRect.bottom) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  };

  const getAllResults = (): SearchResult[] => {
    if (!groups.length) return [];
    
    const allResults: SearchResult[] = [];
    
    // Add all results from all groups
    groups.forEach(group => {
      allResults.push(...group.results);
    });
    
    return allResults;
  };

  const renderResult = (result: SearchResult, index: number, groupName?: string, groupIndex?: number) => (
    <button
      key={`${groupName || result.group}-${groupIndex || 0}-${index}`}
      data-result-index={index}
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
            <div 
              className="text-sm text-gray-600 mt-1 line-clamp-2 **:text-sm **:text-gray-600 **:font-normal **:m-0 **:p-0 **:leading-normal"
              dangerouslySetInnerHTML={{ __html: result.excerpt }}
            />
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-qreen bg-qreen/10 px-2 py-1 rounded">
              {result.group}
            </span>
            {/* <span className="text-xs text-gray-500">{result.url}</span> */}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
      </div>
    </button>
  );

  const renderGroup = (group: SearchGroup, startIndex: number) => {
    if (group.results.length === 0) return null;
    
    const isLoading = loadingGroups.has(group.name);
    
    return (
      <div key={group.name} className="mb-6">
        <h3 className="text-sm font-semibold text-qreen-dark mb-3 flex items-center gap-2">
          {group.name}
          <span className="text-xs bg-qreen/20 text-qreen px-2 py-1 rounded">
            {group.results.length}{group.hasMore ? ` of ${group.totalCount}` : ''}
          </span>
        </h3>
        <div className="space-y-1">
          {group.results.map((result, index) => 
            renderResult(result, startIndex + index, group.name, 0)
          )}
        </div>
        
        {/* Show All Button */}
        {group.hasMore && (
          <div className="mt-3">
            <Button
              onClick={() => loadMoreResults(group.name)}
              disabled={isLoading}
              size="sm"
              className="w-full text-qreen border-qreen hover:bg-qreen hover:text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show all {group.totalCount} results
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <VisuallyHidden>
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl text-qreen-dark flex items-center gap-2">
              Search
            </DialogTitle>
          </DialogHeader>
        </VisuallyHidden>
        
        <div className="px-6 pb-6 pt-2">
          {/* Search Input */}
          <div className="mb-6 -ml-4 flex gap-4 items-center justify-between w-[calc(100%-1.5rem)] bg-qlack/10 rounded-lg">
            <div className="relative basis-full">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search stories, members, companies..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="px-4 py-3 text-lg w-full"
                autoComplete="off"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
            </div>
            
            {/* Submit Button (only show when live search is disabled) */}
            {!liveSearch && (
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!query.trim() || isLoading}
                  className="bg-qreen rounded-none rounded-r-lg border-none text-white hover:bg-qreen/90 text-base h-full aspect-square w-auto inline-flex items-center justify-center [&_svg]:h-5 [&_svg]:w-5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="text-qaupe animate-spin" />
                    </>
                  ) : (
                    <>
                      {/* <Search className="h-4 w-4 mr-2" /> */}
                      <Search className="text-qaupe" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Results */}
          <div 
            ref={resultsRef}
            className="max-h-[calc(60vh-var(--spacing)*12)] overflow-y-auto"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            {query && !isLoading && groups.length > 0 && (
              <>
                {totalCount > 0 && (
                  <>
                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
                      <button
                        onClick={() => setFilterGroup(null)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                          !filterGroup
                            ? "bg-qreen text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        Show All
                      </button>
                      {groups.map((group) => (
                        <button
                          key={group.name}
                          onClick={() => setFilterGroup(group.name)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                            filterGroup === group.name
                              ? "bg-qreen text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          {group.name} ({group.totalCount})
                        </button>
                      ))}
                    </div>

                    <div className="space-y-6">
                      {(() => {
                        // Apply filter if set
                        let displayGroups = groups;
                        if (filterGroup) {
                          displayGroups = groups.filter(g => g.name === filterGroup);
                        }

                        // Reorder groups: Companies first, then Members, then Storyblok results
                        const memberCompanyGroups = displayGroups.filter(group => group.name === 'Companies' || group.name === 'Members')
                          .sort((a, b) => {
                            if (a.name === 'Companies' && b.name === 'Members') return -1;
                            if (a.name === 'Members' && b.name === 'Companies') return 1;
                            return 0;
                          });
                        const storyblokGroups = displayGroups.filter(group => !['Members', 'Companies'].includes(group.name));
                        const orderedGroups = [...memberCompanyGroups, ...storyblokGroups];
                        
                        return orderedGroups.map((group, groupIndex) => {
                          const startIndex = orderedGroups
                            .slice(0, groupIndex)
                            .reduce((acc, g) => acc + g.results.length, 0);
                          return renderGroup(group, startIndex);
                        });
                      })()}
                    </div>
                  </>
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
              <span>{isMac ? '⌘K' : 'Ctrl+K'} to open search</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
