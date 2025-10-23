import { NavigationLinkData } from "@/lib/types/navigation";
import Link from "next/link";

export default function RenderSidebar({ sidebar_items }: { sidebar_items: NavigationLinkData[] }) {
  return (
    <nav aria-label="Secondary sidebar navigation" id="secondary-navigation">
      {sidebar_items.map((item: NavigationLinkData, index: number) => (
        <div key={item.name+index} className="mt-8">
          {item.link?.cached_url !== "" ?
            <Link 
              href={item.link?.cached_url || ''}
              className="text-lg font-[600] text-qlack"
            >
              {item.name}
            </Link>
          : 
            <div className="text-lg font-[600] text-qlack">
              {item.name}
            </div>}
          {item.dropdown_menu &&
            <ul className="pl-4">
              {item.dropdown_menu.map((dropdownItem: NavigationLinkData, dropdownIndex: number) => (
                <li key={dropdownItem.name+dropdownIndex}>
                  <Link 
                    href={`/${dropdownItem.link?.cached_url || ''}`}
                    className="group font-[400] text-[1rem] text-qreen-dark flex gap-1 items-start"
                  >
                    <svg aria-hidden="true" className="downrightArrow h-[1em] relative top-[0.2em]" width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.2 5.6932H1V0.359863M6.86667 8.35986L9 5.6932L6.86667 3.02653" stroke="#3C772B" strokeWidth="1.5"/></svg>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {dropdownItem.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          }
        </div>
      ))}
    </nav>
  );
}