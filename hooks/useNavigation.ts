import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function useNavigation() {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<number>>(new Set());
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const submenuRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const close = useCallback(() => {
    setOpen(false);
    setExpandedSubmenus(new Set()); // Close all submenus when mobile menu closes
  }, []);

  // Toggle submenu expansion
  const toggleSubmenu = useCallback((index: number) => {
    setExpandedSubmenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Handle keyboard navigation for submenus
  const handleSubmenuKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSubmenu(index);
    } else if (e.key === 'Escape') {
      setExpandedSubmenus(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      // Focus the submenu trigger
      submenuRefs.current.get(index)?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!expandedSubmenus.has(index)) {
        toggleSubmenu(index);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (expandedSubmenus.has(index)) {
        toggleSubmenu(index);
      }
    }
  }, [expandedSubmenus, toggleSubmenu]);

  // Mobile menu event handlers
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && open) {
        // allow normal tab but if focus leaves menu, close it
        const menu = menuRef.current;
        if (menu && !menu.contains(document.activeElement)) {
          close();
        }
      }
    }

    function onClickOutside(e: MouseEvent) {
      const menu = menuRef.current;
      const btn = toggleButtonRef.current;
      if (!menu) return;
      if (menu.contains(e.target as Node)) return;
      if (btn && btn.contains(e.target as Node)) return;
      close();
    }

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open, close]);

  // Mobile menu focus and scroll management
  useEffect(() => {
    if (open) {
      // focus the first link when opening
      setTimeout(() => firstLinkRef.current?.focus(), 0);
      // prevent body scroll on mobile
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      // restore focus to toggle button
      toggleButtonRef.current?.focus();
    }
  }, [open]);

  // Scroll detection and show/hide navigation
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;
      
      if (currentScrollY < 20) {
        setIsScrolled(false);
      }
      else {
        if (currentScrollY > 20 && scrollDelta > 0) {
          // Scrolling down and past 20px
          setIsScrolled(true);
        } else if (scrollDelta < -20) {
          // Scrolled back up by 20px or more
          setIsScrolled(false);
        }
      }
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  return {
    open,
    setOpen,
    isScrolled,
    expandedSubmenus,
    setExpandedSubmenus,
    menuRef,
    firstLinkRef,
    toggleButtonRef,
    submenuRefs,
    close,
    toggleSubmenu,
    handleSubmenuKeyDown,
  };
}
