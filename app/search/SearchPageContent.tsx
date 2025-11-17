'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Lazy load SearchModal - only needed when user opens search
const SearchModal = dynamic(() => import('@/components/SearchModal'), {
  ssr: false,
});

export default function SearchPageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Auto-open modal if there's a query parameter
    const query = searchParams.get('q');
    if (query) {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-qaupe">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-qreen-dark mb-6">
            Search AQR
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Find stories, members, and companies across the AQR community
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-gray-500 mb-4">
              Click the search button or press ⌘K to start searching
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-qreen text-white px-6 py-3 rounded-lg hover:bg-qreen/90 transition-colors"
            >
              Open Search
            </button>
          </div>
        </div>
      </div>
      
      <SearchModal open={isModalOpen} onOpenChange={setIsModalOpen} liveSearch={false} />
    </div>
  );
}

