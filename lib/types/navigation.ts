export interface NavigationLinkData {
  name: string;
  link?: {
    cached_url?: string;
  },
  dropdown_menu?: NavigationLinkData[];
}