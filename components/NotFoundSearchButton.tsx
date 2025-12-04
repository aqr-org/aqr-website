'use client';

import dynamic from 'next/dynamic';

// Dynamically import SearchButton to avoid SSR issues
const DynamicSearchButton = dynamic(() => import('@/components/SearchButton'), {
  ssr: false,
});

export default function NotFoundSearchButton() {
  return <DynamicSearchButton liveSearch={false} />;
}

