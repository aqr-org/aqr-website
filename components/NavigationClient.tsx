"use client";

import { cn } from "@/lib/utils";
import { NavigationLinkData } from "@/lib/types/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import NavigationLogo from "./navigation/NavigationLogo";
import DesktopNavigation from "./navigation/DesktopNavigation";
import MobileNavigation from "./navigation/MobileNavigation";
import NavigationToggle from "./navigation/NavigationToggle";
import NavigationRightSide from "./navigation/NavigationRightSide";
import { AuthButton } from "./auth-button";
import SearchButton from "./SearchButton";

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
          '-translate-y-full fixed top-0 z-40 w-full flex justify-center bg-qaupe transition-all duration-500 ease-in-out' 
          : 
          'fixed translate-y-0 top-0 z-40 w-full flex justify-center bg-qaupe transition-all duration-500 ease-in-out'
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
          <div className="flex md:hidden items-center gap-4">
            <SearchButton liveSearch={false} />
            <NavigationToggle 
              open={open}
              setOpen={setOpen}
              toggleButtonRef={toggleButtonRef as React.RefObject<HTMLButtonElement>}
            />
          </div>
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
