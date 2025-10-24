'use client';

import DirectoryCompanyCard from './ui/directoryCompanyCard';
import {Lightbulb} from 'lucide-react';

interface CompanyResult {
  id: string;
  name: string;
  type: string;
  slug: string;
  logo: {
    publicUrl: string;
  };
}

interface AdvancedDirectoryResultsProps {
  companies: CompanyResult[];
  isLoading: boolean;
  hasFilters: boolean;
}

export default function AdvancedDirectoryResults({ 
  companies, 
  isLoading, 
  hasFilters 
}: AdvancedDirectoryResultsProps) {
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-dashed border-gray-300 py-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!hasFilters) {
    return (
      <div className="py-12">
        <div className="max-w-md">
          <h3 className="text-xl font-semibold text-qlack mb-4">
            Find Companies
          </h3>
          <p className="text-gray-600 mb-6">
            Use the filters above to find companies that match your criteria. 
            You can filter by company type, business sectors, skills, recruitment expertise, and location.
          </p>
          <div className="border border-qreen-dark text-qreen-dark p-6 rounded-lg flex gap-2">
            <Lightbulb className="h-6 w-6 text-qreen-dark mb-2" />
            <p className="text-sm italic">
              <strong className="font-semibold not-italic">Tip:</strong> Start by selecting a company type or location to see relevant companies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-qlack mb-4">
            No Companies Found
          </h3>
          <p className="text-gray-600 mb-6">
            No companies match your current filter criteria. Try adjusting your filters to see more results.
          </p>
          <div className="bg-qaupe p-6 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Suggestions:</strong>
            </p>
            <ul className="text-sm text-gray-700 mt-2 space-y-1">
              <li>• Try selecting fewer filters</li>
              <li>• Check different company types</li>
              <li>• Expand your location criteria</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg text-qlack">
          Showing {companies.length} {companies.length === 1 ? 'company' : 'companies'}
        </h3>
      </div>
      
      <div className="md:grid md:grid-cols-4 md:gap-5">
        {companies.map(company => (
          <DirectoryCompanyCard 
            key={company.id} 
            company={company}
          />
        ))}
      </div>
    </div>
  );
}
