'use client';

import { Building2, Briefcase, Wrench, Users, MapPin, X, Check } from 'lucide-react';
import FilterModal from './FilterModal';
import FilterButton from './FilterButton';

interface FilterOptions {
  companyTypes: string[];
  sectors: string[];
  skills: string[];
  recruitment: string[];
  countries: string[];
  gradProg?: boolean;
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
  gradProgCount?: number;
}

export default function AdvancedDirectoryFilterModal({
  filterOptions,
  activeFilters,
  onFiltersChange,
  isLoading,
  gradProgCount = 0
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
      countries: [],
      gradProg: false
    });
  };

  const handleGradProgChange = (checked: boolean) => {
    onFiltersChange({
      ...activeFilters,
      gradProg: checked
    });
  };

  const getTotalActiveCount = () => {
    let count = 0;
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (key === 'gradProg') {
        if (value === true) count += 1;
      } else if (Array.isArray(value)) {
        count += value.length;
      }
    });
    return count;
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

        {/* Graduate Training Programme Checkbox */}
        <div className="flex items-center gap-3 px-4 py-2 h-12 bg-qreen/10 rounded-full">
          <label className="flex items-center gap-3 cursor-pointer flex-1">
            <div className="relative">
              <input
                type="checkbox"
                checked={activeFilters.gradProg === true}
                onChange={(e) => handleGradProgChange(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                activeFilters.gradProg === true 
                  ? 'bg-qreen border-qreen' 
                  : 'border-gray-300 bg-qaupe'
              }`}>
                {activeFilters.gradProg === true && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
            </div>
            <span className="text-qreen-dark font-medium">
              Graduate Training{activeFilters.gradProg === true ? '!' : '?'}
            </span>
            {/* {gradProgCount > 0 && (
              <span className="text-sm text-gray-500">({gradProgCount})</span>
            )} */}
          </label>
        </div>
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
              className="group/clearAllFilters text-qrose text-sm px-4 pl-2 py-1 rounded-full font-medium cursor-pointer flex items-center gap-1 hover:font-bold hover:tracking-tight transition-all"
            >
              <X className="h-5 w-5 p-1 rounded-full bg-transparent text-qrose  group-hover/clearAllFilters:bg-qrose group-hover/clearAllFilters:text-qaupe transition-colors" /> Clear All Filters
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([category, value]) => {
              if (category === 'gradProg' && value === true) {
                return (
                  <span
                    key={`${category}-gradProg`}
                    className="group/activeFilter bg-qreen/20 text-qreen-dark px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    Offers Graduate Training Programme
                    <button
                      onClick={() => handleGradProgChange(false)}
                      className="text-qreen-dark bg-qaupe hover:bg-qreen-dark hover:text-qellow rounded-full p-1 transition-colors cursor-pointer group-hover/activeFilter:bg-qreen-dark group-hover/activeFilter:text-qellow"
                      aria-label="Remove Graduate Training Programme filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              }
              if (Array.isArray(value)) {
                return value.map((filter: string) => (
                  <span
                    key={`${category}-${filter}`}
                    className="group/activeFilter bg-qreen/20 text-qreen-dark px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {filter}
                    <button
                      onClick={() => handleFilterChange(category as keyof FilterOptions, 
                        value.filter((f: string) => f !== filter)
                      )}
                      className="text-qreen-dark bg-qaupe hover:bg-qreen-dark hover:text-qellow rounded-full p-1 transition-colors cursor-pointer group-hover/activeFilter:bg-qreen-dark group-hover/activeFilter:text-qellow"
                      aria-label={`Remove ${filter} filter`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ));
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
