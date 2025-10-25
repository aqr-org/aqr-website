import Link from "next/link";
import { NavigationLinkData } from "@/lib/types/navigation";

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
  const hasDropdown2 = item.dropdown_menu_2 && item.dropdown_menu_2.length > 0;
  const hasDropdown3 = item.dropdown_menu_3 && item.dropdown_menu_3.length > 0;
  const hasAnyDropdown = hasNestedDropdown || hasDropdown2 || hasDropdown3;
  
  if (isMobile) {
    // Mobile styling
    const indentClass = level > 0 ? `pl-${4 + (level * 4)}` : 'pl-4';
    const textSizeClass = level > 0 ? 'text-xs' : 'text-sm';
    const textColorClass = level > 0 ? 'text-gray-500' : 'text-gray-600';
    
    return (
      <li key={itemIndex} role="none">
        {hasAnyDropdown ? (
          <div className="relative">
            <div className={`${indentClass} ${textSizeClass} ${textColorClass} font-medium py-1 border-l-2 border-gray-200 ml-2`}>
              {item.name}
            </div>
            <div className="ml-2 mt-1 space-y-2">
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
            href={item.link?.cached_url || ''}
            className={`block py-2 ${indentClass} ${textSizeClass} ${textColorClass} hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
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
    const textColorClass = level > 0 ? 'text-qlack' : 'text-qlack/80';
    const textWeightClass = level > 1 ? 'font-[400]' : 'font-[500]';
    const textBorderClass = (level > 0 && hasNestedDropdown) ? 'border-b border-qlack/20 mb-2 pb-2' : '';
    const menuBasisClass = hasDropdown3 ? 'basis-1/3' : hasDropdown2 ? 'basis-[calc(50%-(var(--spacing)*8))] min-w-0' : 'basis-full';
    
    return (
      <li key={itemIndex} role="none">
        {hasAnyDropdown ? (
          <div className="relative group/nested">
            {level !== 0 && (
              <div className={`${textSizeClass} ${textWeightClass} ${textColorClass} ${textBorderClass} font-medium pb-2 cursor-default whitespace-nowrap`}>
                {item.link?.cached_url ? <Link href={'/' + item.link?.cached_url || ''} className="hover:text-qreen-dark">
                  {item.name}
                </Link> :
                  <>
                    {item.name}
                  </>
                }
              </div>
            )}
            <div className="flex gap-16 mt-1">
              {/* Primary dropdown menu */}
              {hasNestedDropdown && (
                <ul className={`mb-2 ${menuBasisClass}`} role="menu" aria-label={`${item.name} submenu`}>
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
                <ul className={`${menuBasisClass}`} role="menu" aria-label={`${item.name} submenu 2 `}>
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
                <ul role="menu" aria-label={`${item.name} submenu 3 ${menuBasisClass}`}>
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
            href={'/' + item.link?.cached_url || ''}
            className={`block min-w-[14em] p-2 ${textWeightClass} ${textSizeClass} ${textColorClass} ${textBorderClass} hover:bg-qlack/5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
            role="menuitem"
          >
            {item.name}
          </Link>
        )}
      </li>
    );
  }
}
