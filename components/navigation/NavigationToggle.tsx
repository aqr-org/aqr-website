interface NavigationToggleProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleButtonRef: React.RefObject<HTMLButtonElement>;
}

export default function NavigationToggle({ open, setOpen, toggleButtonRef }: NavigationToggleProps) {
  return (
    <div className="md:hidden">
      <button
        ref={toggleButtonRef}
        aria-controls="mobile-menu"
        aria-expanded={open}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-qlack-5 focus:outline-2 focus:outline-qreen"
      >
        <span className="sr-only">Toggle navigation</span>
        {open ? (
          // X icon
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Hamburger icon
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
    </div>
  );
}
