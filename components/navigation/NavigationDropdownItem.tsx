import Link from "next/link";
import { NavigationLinkData } from "@/lib/types/navigation";
import { normalizeStoryblokUrl } from "@/lib/storyblok-url";

interface NavigationDropdownItemProps {
  item: NavigationLinkData;
  itemIndex: number;
  level?: number;
  isMobile?: boolean;
}

export default function NavigationDropdownItem({ 
  item, 
  itemIndex, 
  level = 0, 
  isMobile = true 
}: NavigationDropdownItemProps) {
  const hasNestedDropdown = item.dropdown_menu && item.dropdown_menu.length > 0;
  const    hasDropdown2 = item.dropdown_menu_2 && item.dropdown_menu_2.length > 0;
  const    hasDropdown3 = item.dropdown_menu_3 && item.dropdown_menu_3.length > 0;
  const hasAnyDropdown = hasNestedDropdown || hasDropdown2 || hasDropdown3;
  
  if (isMobile) {
    // Mobile styling
    const indentClass = level > 0 ? `pl-${4 + (level * 4)}` : 'pl-4';
    const textSizeClass = level > 0 ? 'text-base' : 'text-lg';
    const textColorClass = level > 0 ? 'text-qreen-dark' : 'text-qreen-dark';
    
    return (
      <li key={itemIndex} role="none">
        {hasAnyDropdown ? (
          <div className="relative">
            {level !== 0 && (
              <div className={`${textSizeClass} ${textColorClass} font-medium py-1 pt-4`}>
                {item.name}
              </div>
            )}
            <div className="mt-1 space-y-2">
              {/* Primary dropdown menu */}
              {hasNestedDropdown && (
                <ul className="space-y-1" role="menu" aria-label={`${item.name} submenu`}>
                  {item.dropdown_menu?.map((nestedItem, nestedIndex) => 
                    <NavigationDropdownItem 
                      key={nestedIndex}
                      item={nestedItem} 
                      itemIndex={nestedIndex} 
                      level={level + 1} 
                      isMobile={true}
                    />
                  )}
                </ul>
              )}
              
              {/* Secondary dropdown menu */}
              {hasDropdown2 && (
                <ul className="space-y-1" role="menu" aria-label={`${item.name} submenu 2`}>
                  {item.dropdown_menu_2?.map((nestedItem, nestedIndex) => 
                    <NavigationDropdownItem 
                      key={`2-${nestedIndex}`}
                      item={nestedItem} 
                      itemIndex={nestedIndex} 
                      level={level + 1} 
                      isMobile={true}
                    />
                  )}
                </ul>
              )}
              
              {/* Tertiary dropdown menu */}
              {hasDropdown3 && (
                <ul className="space-y-1" role="menu" aria-label={`${item.name} submenu 3`}>
                  {item.dropdown_menu_3?.map((nestedItem, nestedIndex) => 
                    <NavigationDropdownItem 
                      key={`3-${nestedIndex}`}
                      item={nestedItem} 
                      itemIndex={nestedIndex} 
                      level={level + 1} 
                      isMobile={true}
                    />
                  )}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <Link 
            href={normalizeStoryblokUrl(item.link?.cached_url)}
            className={`block py-2 text-qreen ${textSizeClass} ${textColorClass} hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
            role="menuitem"
          >
            {item.name}
          </Link>
        )}
      </li>
    );
  } else {
    // Desktop styling
    // const indentClass = level > 1 ? `pl-${2 + (level * 1)}` : '';
    const textSizeClass = level > 1 ? 'text-sm' : 'text-base';
    const textColorClass = level > 0 ? 'text-qreen-dark' : 'text-qreen-dark/80';
    const textWeightClass = level > 1 ? 'font-normal' : 'font-medium';
    const textBorderClass = (level > 0 && hasNestedDropdown) ? 'border-b border-dashed border-qlack/40 mb-2 pb-2' : '';
    const menuBaseClass = '[&>li_ul]:mb-4';
    const menuBasisClass = hasDropdown3 ? 'basis-1/3' : hasDropdown2 ? 'basis-[calc(50%-(var(--spacing)*8))] min-w-0' : 'basis-full';
    
    return (
      <li key={itemIndex} role="none">
        {hasAnyDropdown ? (
          <div className="relative group/nested">
            {level !== 0 && (
              <div className={`${textSizeClass} ${textWeightClass} text-qlack ${textBorderClass} font-medium pb-2 cursor-default`}>
                {item.link?.cached_url ? <Link href={normalizeStoryblokUrl(item.link?.cached_url)} className="hover:text-qreen-dark">
                  {item.name}
                </Link> :
                  <>
                    {item.name}
                  </>
                }
              </div>
            )}
            <div className="flex gap-6 mt-1">
              {/* Primary dropdown menu */}
              {hasNestedDropdown && (
                <ul className={`mb-2 ${menuBasisClass} ${menuBaseClass}`} role="menu" aria-label={`${item.name} submenu`}>
                  {item.dropdown_menu?.map((nestedItem, nestedIndex) => 
                    <NavigationDropdownItem 
                      key={nestedIndex}
                      item={nestedItem} 
                      itemIndex={nestedIndex} 
                      level={level + 1} 
                      isMobile={false}
                    />
                  )}
                </ul>
              )}
              
              {/* Secondary dropdown menu */}
              {hasDropdown2 && (
                <ul className={`${menuBasisClass} ${menuBaseClass}`} role="menu" aria-label={`${item.name} submenu 2 `}>
                  {item.dropdown_menu_2?.map((nestedItem, nestedIndex) => 
                    <NavigationDropdownItem 
                      key={`2-${nestedIndex}`}
                      item={nestedItem} 
                      itemIndex={nestedIndex} 
                      level={level + 1} 
                      isMobile={false}
                    />
                  )}
                </ul>
              )}
              
              {/* Tertiary dropdown menu */}
              {hasDropdown3 && (
                <ul className={`${menuBasisClass} ${menuBaseClass}`} role="menu" aria-label={`${item.name} submenu 3`}>
                  {item.dropdown_menu_3?.map((nestedItem, nestedIndex) => 
                    <NavigationDropdownItem 
                      key={`3-${nestedIndex}`}
                      item={nestedItem} 
                      itemIndex={nestedIndex} 
                      level={level + 1} 
                      isMobile={false}
                    />
                  )}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <Link 
            href={normalizeStoryblokUrl(item.link?.cached_url)}
            className={`
              ${textWeightClass} ${textSizeClass} ${textColorClass} ${textBorderClass} 
              block min-w-[14em] px-2 py-1 
              hover:bg-qellow 
              rounded 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
            `}
            role="menuitem"
          >
            {item.name}
          </Link>
        )}
      </li>
    );
  }
}
