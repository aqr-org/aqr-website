'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdvancedDirectoryFilterModal from './AdvancedDirectoryFilterModal';
import AdvancedDirectoryResults from './AdvancedDirectoryResults';

interface FilterOptions {
  companyTypes: string[];
  sectors: string[];
  skills: string[];
  recruitment: string[];
  countries: string[];
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
}

export default function AdvancedDirectoryPage({ filterOptions, initialFilters }: AdvancedDirectoryPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [filters, setFilters] = useState<FilterOptions>(
    initialFilters || {
      companyTypes: [],
      sectors: [],
      skills: [],
      recruitment: [],
      countries: []
    }
  );
  
  const [companies, setCompanies] = useState<CompanyResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isInitialMountRef = useRef(true);

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
    const hasActiveFilters = Object.values(searchFilters).some(filterArray => filterArray.length > 0);
    
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

  // Update URL search params when filters change
  const updateURLParams = useCallback((newFilters: FilterOptions) => {
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }
    
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      
      // Add each filter category to URL if it has values
      Object.entries(newFilters).forEach(([key, values]) => {
        if (values.length > 0) {
          // Join multiple values with comma
          params.set(key, values.map((v: string) => encodeURIComponent(v)).join(','));
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

  // Perform initial search if initialFilters are provided
  useEffect(() => {
    if (isInitialMountRef.current && initialFilters) {
      const hasActiveFilters = Object.values(initialFilters).some(filterArray => filterArray.length > 0);
      if (hasActiveFilters) {
        isInitialMountRef.current = false;
        performSearch(initialFilters);
      }
    }
    isInitialMountRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - initialFilters should only come from URL params on initial load

  const hasActiveFilters = Object.values(filters).some(filterArray => filterArray.length > 0);

  return (
    <div className="animate-fade-in">
      <div className="max-w-6xl mb-12">
        <AdvancedDirectoryFilterModal
          filterOptions={filterOptions}
          activeFilters={filters}
          onFiltersChange={handleFiltersChange}
          isLoading={isLoading}
        />
      </div>
      
      <div className="max-w-6xl">
        <AdvancedDirectoryResults
          companies={companies}
          isLoading={isLoading}
          hasFilters={hasActiveFilters || hasSearched}
        />
      </div>
    </div>
  );
}
