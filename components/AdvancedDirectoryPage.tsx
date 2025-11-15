'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import AdvancedDirectoryFilterModal from './AdvancedDirectoryFilterModal';
import AdvancedDirectoryResults from './AdvancedDirectoryResults';

interface FilterOptions {
  companyTypes: string[];
  sectors: string[];
  skills: string[];
  recruitment: string[];
  countries: string[];
  gradProg?: boolean;
}

interface CompanyResult {
  id: string;
  name: string;
  type: string;
  slug: string;
  logo: {
    publicUrl: string;
  };
}

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface AdvancedDirectoryPageProps {
  filterOptions: {
    companyTypes: FilterOption[];
    sectors: FilterOption[];
    skills: FilterOption[];
    recruitment: FilterOption[];
    countries: FilterOption[];
  };
  initialFilters?: FilterOptions;
  gradProgCount?: number;
}

export default function AdvancedDirectoryPage({ filterOptions, initialFilters, gradProgCount = 0 }: AdvancedDirectoryPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<FilterOptions>(
    initialFilters || {
      companyTypes: [],
      sectors: [],
      skills: [],
      recruitment: [],
      countries: [],
      gradProg: false
    }
  );
  
  const [companies, setCompanies] = useState<CompanyResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isInitialMountRef = useRef(true);
  const isUpdatingFromURLRef = useRef(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    (searchFilters: FilterOptions) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(async () => {
        await performSearch(searchFilters);
      }, 300);
    },
    []
  );

  const performSearch = async (searchFilters: FilterOptions) => {
    // Check if any filters are selected
    const hasActiveFilters = Object.entries(searchFilters).some(([key, value]) => {
      if (key === 'gradProg') {
        return value === true;
      }
      return Array.isArray(value) && value.length > 0;
    });
    
    if (!hasActiveFilters) {
      setCompanies([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch('/api/companies/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchFilters),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }

      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to parse comma-separated values from URL params
  const parseFilterParam = useCallback((param: string | null): string[] => {
    if (!param) return [];
    return param.split(',').filter(Boolean).map(v => decodeURIComponent(v.trim()));
  }, []);

  // Parse filters from URL search params
  const parseFiltersFromURL = useCallback((params: URLSearchParams): FilterOptions => {
    // Parse gradProg from URL params (boolean checkbox)
    const gradProgParam = params.get('gradProg');
    const gradProg = gradProgParam === 'true';

    return {
      companyTypes: parseFilterParam(params.get('companyTypes')),
      sectors: parseFilterParam(params.get('sectors')),
      skills: parseFilterParam(params.get('skills')),
      recruitment: parseFilterParam(params.get('recruitment')),
      countries: parseFilterParam(params.get('countries')),
      gradProg: gradProg
    };
  }, [parseFilterParam]);

  // Update URL search params when filters change
  const updateURLParams = useCallback((newFilters: FilterOptions) => {
    // Don't update URL if we're currently syncing from URL to avoid loops
    if (isUpdatingFromURLRef.current) {
      return;
    }

    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }
    
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      
      // Add each filter category to URL if it has values
      Object.entries(newFilters).forEach(([key, value]) => {
        if (key === 'gradProg') {
          // Handle boolean checkbox
          if (value === true) {
            params.set(key, 'true');
          }
        } else if (Array.isArray(value) && value.length > 0) {
          // Join multiple values with comma
          params.set(key, value.map((v: string) => encodeURIComponent(v)).join(','));
        }
      });
      
      // Update URL without adding to history (using replace)
      const newURL = params.toString() 
        ? `${pathname}?${params.toString()}`
        : pathname;
      
      router.replace(newURL, { scroll: false });
    }, 300); // Debounce URL updates
  }, [pathname, router]);

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    debouncedSearch(newFilters);
    updateURLParams(newFilters);
  };

  // Perform initial search if initialFilters are provided, or clear filters if none
  useEffect(() => {
    if (isInitialMountRef.current) {
      if (initialFilters) {
        const hasActiveFilters = Object.entries(initialFilters).some(([key, value]) => {
          if (key === 'gradProg') {
            return value === true;
          }
          return Array.isArray(value) && value.length > 0;
        });
        if (hasActiveFilters) {
          performSearch(initialFilters);
        } else {
          // No active filters in initialFilters - ensure filters are cleared
          const clearedFilters: FilterOptions = {
            companyTypes: [],
            sectors: [],
            skills: [],
            recruitment: [],
            countries: [],
            gradProg: false
          };
          setFilters(clearedFilters);
          setCompanies([]);
          setHasSearched(false);
        }
      } else {
        // No initialFilters provided - clear all filters
        const clearedFilters: FilterOptions = {
          companyTypes: [],
          sectors: [],
          skills: [],
          recruitment: [],
          countries: [],
          gradProg: false
        };
        setFilters(clearedFilters);
        setCompanies([]);
        setHasSearched(false);
      }
      isInitialMountRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - initialFilters should only come from URL params on initial load

  // Sync filters with URL parameters when URL changes (e.g., from link clicks)
  useEffect(() => {
    // Skip on initial mount (handled by initialFilters)
    if (isInitialMountRef.current) {
      return;
    }

    // Only handle if we're on the dir/advanced page
    if (pathname !== '/dir/advanced') {
      return;
    }

    isUpdatingFromURLRef.current = true;

    // Parse filters from current URL
    const urlFilters = parseFiltersFromURL(searchParams);

    // Check if URL has any query params
    const hasURLParams = searchParams.toString().length > 0;

    if (!hasURLParams) {
      // No query params - clear all filters
      const clearedFilters: FilterOptions = {
        companyTypes: [],
        sectors: [],
        skills: [],
        recruitment: [],
        countries: [],
        gradProg: false
      };
      setFilters(clearedFilters);
      setCompanies([]);
      setHasSearched(false);
    } else {
      // Has query params - apply filters from URL
      setFilters(urlFilters);
      
      // Check if there are active filters
      const hasActiveFilters = Object.entries(urlFilters).some(([key, value]) => {
        if (key === 'gradProg') {
          return value === true;
        }
        return Array.isArray(value) && value.length > 0;
      });

      if (hasActiveFilters) {
        debouncedSearch(urlFilters);
      } else {
        setCompanies([]);
        setHasSearched(false);
      }
    }

    // Reset flag after a short delay to allow state updates to complete
    setTimeout(() => {
      isUpdatingFromURLRef.current = false;
    }, 100);
  }, [searchParams, pathname, parseFiltersFromURL, debouncedSearch]);

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'gradProg') {
      return value === true;
    }
    return Array.isArray(value) && value.length > 0;
  });

  return (
    <div className="animate-fade-in">
      <div className="max-w-6xl mb-12">
        <AdvancedDirectoryFilterModal
          filterOptions={filterOptions}
          activeFilters={filters}
          onFiltersChange={handleFiltersChange}
          isLoading={isLoading}
          gradProgCount={gradProgCount}
        />
      </div>
      
      <div className="max-w-6xl" id="directory-list-results">
        <AdvancedDirectoryResults
          companies={companies}
          isLoading={isLoading}
          hasFilters={hasActiveFilters || hasSearched}
        />
      </div>
    </div>
  );
}
