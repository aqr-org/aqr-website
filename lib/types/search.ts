export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  type: 'storyblok' | 'member' | 'company';
  excerpt?: string;
  group: string;
  url: string;
}

export interface StoryblokSearchResult {
  id: string;
  name: string;
  slug: string;
  content: any;
  full_slug: string;
  created_at: string;
  published_at: string;
}

export interface MemberSearchResult {
  id: string;
  firstname?: string;
  lastname?: string;
  organisation?: string;
  jobtitle?: string;
  biognotes?: string;
  slug?: string;
}

export interface CompanySearchResult {
  id: string;
  name: string;
  narrative?: string;
  slug?: string;
  logo?: string;
}

export interface GroupedSearchResults {
  storyblok: {
    'Resources/Inspiration': SearchResult[];
    'Events': SearchResult[];
    'The Hub': SearchResult[];
    'Glossary': SearchResult[];
    'Pages': SearchResult[];
  };
  members: SearchResult[];
  companies: SearchResult[];
}

export interface SearchResponse {
  results: GroupedSearchResults;
  totalCount: number;
  query: string;
}
