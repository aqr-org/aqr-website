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
  const [isMac, setIsMac] = useState(false);

  // Detect platform on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMac(navigator.userAgent.toLowerCase().includes('mac'));
  }, []);

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
        className="inline-flex items-center justify-center p-2 text-qlack hover:text-qreen hover:bg-qreen/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qreen focus-visible:ring-offset-2 active:bg-qreen/10"
        aria-label={`Search (${isMac ? '⌘K' : 'Ctrl+K'})`}
        title={`Search (${isMac ? '⌘K' : 'Ctrl+K'})`}
      >
        {/* <Search className="h-5 w-5" /> */}
        <svg className="h-5 w-5" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.8645 11.3208H12.0515L11.7633 11.0429C12.7719 9.86964 13.3791 8.34648 13.3791 6.68954C13.3791 2.99485 10.3842 0 6.68954 0C2.99485 0 0 2.99485 0 6.68954C0 10.3842 2.99485 13.3791 6.68954 13.3791C8.34648 13.3791 9.86964 12.7719 11.0429 11.7633L11.3208 12.0515V12.8645L16.4666 18L18 16.4666L12.8645 11.3208ZM6.68954 11.3208C4.12693 11.3208 2.05832 9.25214 2.05832 6.68954C2.05832 4.12693 4.12693 2.05832 6.68954 2.05832C9.25214 2.05832 11.3208 4.12693 11.3208 6.68954C11.3208 9.25214 9.25214 11.3208 6.68954 11.3208Z" fill="currentColor"/>
        </svg>

      </button>
      
      <SearchModal open={isOpen} onOpenChange={setIsOpen} liveSearch={liveSearch} />
    </>
  );
}
