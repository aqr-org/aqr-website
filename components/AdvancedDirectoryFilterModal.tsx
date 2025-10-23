'use client';

import { Building2, Briefcase, Wrench, Users, MapPin, X } from 'lucide-react';
import FilterModal from './FilterModal';
import FilterButton from './FilterButton';

interface FilterOptions {
  companyTypes: string[];
  sectors: string[];
  skills: string[];
  recruitment: string[];
  countries: string[];
}

interface FilterModalProps {
  filterOptions: {
    companyTypes: { value: string; label: string; count: number }[];
    sectors: { value: string; label: string; count: number }[];
    skills: { value: string; label: string; count: number }[];
    recruitment: { value: string; label: string; count: number }[];
    countries: { value: string; label: string; count: number }[];
  };
  activeFilters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  isLoading: boolean;
}

export default function AdvancedDirectoryFilterModal({
  filterOptions,
  activeFilters,
  onFiltersChange,
  isLoading
}: FilterModalProps) {
  const handleFilterChange = (category: keyof FilterOptions, values: string[]) => {
    onFiltersChange({
      ...activeFilters,
      [category]: values
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      companyTypes: [],
      sectors: [],
      skills: [],
      recruitment: [],
      countries: []
    });
  };

  const getTotalActiveCount = () => {
    return Object.values(activeFilters).reduce((total, filters) => total + filters.length, 0);
  };

  return (
    <div className="space-y-6">
      {/* Filter Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FilterModal
          title="Company Type"
          options={filterOptions.companyTypes}
          selectedValues={activeFilters.companyTypes}
          onSelectionChange={(values) => handleFilterChange('companyTypes', values)}
          isLoading={isLoading}
        >
          <FilterButton
            label="Company Type"
            activeCount={activeFilters.companyTypes.length}
            onClick={() => {}}
            isLoading={isLoading}
            icon={<Building2 className="h-4 w-4" />}
          />
        </FilterModal>

        <FilterModal
          title="Business Sectors"
          options={filterOptions.sectors}
          selectedValues={activeFilters.sectors}
          onSelectionChange={(values) => handleFilterChange('sectors', values)}
          isLoading={isLoading}
        >
          <FilterButton
            label="Business Sectors"
            activeCount={activeFilters.sectors.length}
            onClick={() => {}}
            isLoading={isLoading}
            icon={<Briefcase className="h-4 w-4" />}
          />
        </FilterModal>

        <FilterModal
          title="Skills, Expertise & Services"
          options={filterOptions.skills}
          selectedValues={activeFilters.skills}
          onSelectionChange={(values) => handleFilterChange('skills', values)}
          isLoading={isLoading}
        >
          <FilterButton
            label="Skills & Expertise"
            activeCount={activeFilters.skills.length}
            onClick={() => {}}
            isLoading={isLoading}
            icon={<Wrench className="h-4 w-4" />}
          />
        </FilterModal>

        <FilterModal
          title="Recruitment Expertise"
          options={filterOptions.recruitment}
          selectedValues={activeFilters.recruitment}
          onSelectionChange={(values) => handleFilterChange('recruitment', values)}
          isLoading={isLoading}
        >
          <FilterButton
            label="Recruitment"
            activeCount={activeFilters.recruitment.length}
            onClick={() => {}}
            isLoading={isLoading}
            icon={<Users className="h-4 w-4" />}
          />
        </FilterModal>

        <FilterModal
          title="Country"
          options={filterOptions.countries}
          selectedValues={activeFilters.countries}
          onSelectionChange={(values) => handleFilterChange('countries', values)}
          isLoading={isLoading}
        >
          <FilterButton
            label="Country"
            activeCount={activeFilters.countries.length}
            onClick={() => {}}
            isLoading={isLoading}
            icon={<MapPin className="h-4 w-4" />}
          />
        </FilterModal>
      </div>

      {/* Active Filters Summary */}
      {getTotalActiveCount() > 0 && (
        <div className="bg-qaupe py-4 rounded-lg">
          <div className="flex items-center justify-start gap-4 mb-3">
            <span className="font-semibold text-lg">
              Active Filters ({getTotalActiveCount()})
            </span>
            <button
              onClick={clearAllFilters}
              className="group/clearAllFilters text-qrose text-sm px-4 pl-2 py-1 rounded-full font-[500] cursor-pointer flex items-center gap-1 hover:font-[700] hover:tracking-tight transition-all"
            >
              <X className="h-5 w-5 p-1 rounded-full bg-transparent text-qrose  group-hover/clearAllFilters:bg-qrose group-hover/clearAllFilters:text-qaupe transition-colors" /> Clear All Filters
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([category, filters]) =>
              filters.map((filter: string) => (
                <span
                  key={`${category}-${filter}`}
                  className="group/activeFilter bg-qreen/20 text-qreen-dark px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {filter}
                  <button
                    onClick={() => handleFilterChange(category as keyof FilterOptions, 
                      filters.filter((f: string) => f !== filter)
                    )}
                    className="text-qreen-dark bg-qaupe hover:bg-qreen-dark hover:text-qellow rounded-full p-1 transition-colors cursor-pointer group-hover/activeFilter:bg-qreen-dark group-hover/activeFilter:text-qellow"
                    aria-label={`Remove ${filter} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
