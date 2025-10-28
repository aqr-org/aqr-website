'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import SearchModal from './SearchModal';

interface SearchButtonProps {
  liveSearch?: boolean;
}

export default function SearchButton({ liveSearch = true }: SearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut handler
  useHotkeys('cmd+k,ctrl+k', (e) => {
    e.preventDefault();
    setIsOpen(true);
  });

  // Close modal on escape
  useHotkeys('escape', () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center p-2 text-qreen hover:text-qreen/80 hover:bg-qreen/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-qreen focus:ring-offset-2"
        aria-label="Search (⌘K)"
        title="Search (⌘K)"
      >
        <Search className="h-5 w-5" />
      </button>
      
      <SearchModal open={isOpen} onOpenChange={setIsOpen} liveSearch={liveSearch} />
    </>
  );
}
