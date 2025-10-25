export interface NavigationLinkData {
  name: string;
  link?: {
    cached_url?: string;
  },
  dropdown_menu?: NavigationLinkData[];
  dropdown_menu_2?: NavigationLinkData[];
  dropdown_menu_3?: NavigationLinkData[];
}