'use client';

import { useState, useCallback, useRef } from 'react';
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
  contact_info?: {
    country?: string;
    addr2?: string;
    addr3?: string;
    addr4?: string;
    addr5?: string;
  } | null;
  areas: Array<{
    area: string;
    slug: string;
  }>;
  address?: string | null;
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
}

export default function AdvancedDirectoryPage({ filterOptions }: AdvancedDirectoryPageProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    companyTypes: [],
    sectors: [],
    skills: [],
    recruitment: [],
    countries: []
  });
  
  const [companies, setCompanies] = useState<CompanyResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

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
