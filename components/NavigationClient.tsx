"use client";

import { cn } from "@/lib/utils";
import { NavigationLinkData } from "@/lib/types/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import NavigationLogo from "./navigation/NavigationLogo";
import DesktopNavigation from "./navigation/DesktopNavigation";
import MobileNavigation from "./navigation/MobileNavigation";
import NavigationToggle from "./navigation/NavigationToggle";
import NavigationRightSide from "./navigation/NavigationRightSide";

interface NavigationClientProps {
  links: NavigationLinkData[];
}

export default function NavigationClient({ links }: NavigationClientProps) {
  const {
    open,
    setOpen,
    isScrolled,
    expandedSubmenus,
    setExpandedSubmenus,
    menuRef,
    firstLinkRef,
    toggleButtonRef,
    submenuRefs,
    toggleSubmenu,
    handleSubmenuKeyDown,
  } = useNavigation();

  return (
    <>
      <nav 
        className={cn(
          isScrolled ? 
          '-translate-y-full sticky top-0 z-50 w-full flex justify-center bg-qaupe transition-all duration-500 ease-in-out' 
          : 
          'sticky translate-y-0 top-0 z-50 w-full flex justify-center bg-qaupe transition-all duration-500 ease-in-out'
        )} 
        aria-label="Main navigation"
      >
        <div className="w-full max-w-maxw flex items-center justify-between p-5 px-container">
          <div className="flex items-center gap-14">
            <NavigationLogo />
            <DesktopNavigation
              links={links}
              expandedSubmenus={expandedSubmenus}
              firstLinkRef={firstLinkRef}
              submenuRefs={submenuRefs}
              toggleSubmenu={toggleSubmenu}
              handleSubmenuKeyDown={handleSubmenuKeyDown}
              setExpandedSubmenus={setExpandedSubmenus}
            />
          </div>

          <NavigationRightSide />
          <NavigationToggle 
            open={open} 
            setOpen={setOpen} 
            toggleButtonRef={toggleButtonRef} 
          />
          <MobileNavigation
            links={links}
            open={open}
            expandedSubmenus={expandedSubmenus}
            menuRef={menuRef}
            firstLinkRef={firstLinkRef}
            submenuRefs={submenuRefs}
            toggleSubmenu={toggleSubmenu}
            handleSubmenuKeyDown={handleSubmenuKeyDown}
          />
        </div>
      </nav>
    </>
  );
}
