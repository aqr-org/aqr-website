import { Suspense } from 'react';
import SearchPageContent from './SearchPageContent';

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-qaupe flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading search results…</div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
