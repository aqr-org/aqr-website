import { NextRequest, NextResponse } from 'next/server';
import { getStoryblokApi } from '@/lib/storyblok';
import { createClient } from '@/lib/supabase/server';
import { GroupedSearchResults, SearchResult, StoryblokSearchResult, MemberSearchResult, CompanySearchResult } from '@/lib/types/search';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: {
          storyblok: {
            'Resources/Inspiration': [],
            'Events': [],
            'The Hub': [],
            'Glossary': [],
            'Pages': []
          },
          members: [],
          companies: []
        },
        totalCount: 0,
        query: query || ''
      });
    }

    const searchQuery = query.trim();
    
    // Run searches in parallel
    const [storyblokResults, memberResults, companyResults] = await Promise.all([
      searchStoryblok(searchQuery),
      searchMembers(searchQuery),
      searchCompanies(searchQuery)
    ]);

    // Group and format results
    const groupedResults: GroupedSearchResults = {
      storyblok: {
        'Resources/Inspiration': [],
        'Events': [],
        'The Hub': [],
        'Glossary': [],
        'Pages': []
      },
      members: [],
      companies: []
    };

    // Process Storyblok results
    storyblokResults.forEach(story => {
      const result: SearchResult = {
        id: story.id,
        title: story.name,
        slug: story.slug,
        type: 'storyblok',
        excerpt: extractExcerpt(story.content),
        group: getStoryblokGroup(story.full_slug),
        url: `/${story.full_slug}`
      };

      if (groupedResults.storyblok[result.group as keyof typeof groupedResults.storyblok]) {
        groupedResults.storyblok[result.group as keyof typeof groupedResults.storyblok].push(result);
      }
    });

    // Process Member results
    memberResults.forEach(member => {
      const fullName = [member.firstname, member.lastname].filter(Boolean).join(' ');
      groupedResults.members.push({
        id: member.id,
        title: fullName || 'Unknown Member',
        slug: member.slug || member.id,
        type: 'member',
        excerpt: member.biognotes || `${member.jobtitle || ''} at ${member.organisation || ''}`.trim(),
        group: 'Members',
        url: `/members/${member.slug || member.id}`
      });
    });

    // Process Company results
    companyResults.forEach(company => {
      groupedResults.companies.push({
        id: company.id,
        title: company.name,
        slug: company.slug || company.id,
        type: 'company',
        excerpt: company.narrative,
        group: 'Companies',
        url: `/dir/${company.slug || company.id}`
      });
    });

    const totalCount = Object.values(groupedResults.storyblok).flat().length + 
                      groupedResults.members.length + 
                      groupedResults.companies.length;

    return NextResponse.json({
      results: groupedResults,
      totalCount,
      query: searchQuery
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

async function searchStoryblok(query: string): Promise<StoryblokSearchResult[]> {
  const storyblokApi = getStoryblokApi();
  const allResults: StoryblokSearchResult[] = [];

  // Define the folders to search
  const folders = [
    'resources/inspiration/',
    'events/',
    'events/thehub/',
    'glossary/'
  ];

  // Search each folder
  for (const folder of folders) {
    try {
      const response = await storyblokApi.get('cdn/stories', {
        version: 'published',
        search_term: query,
        starts_with: folder,
        per_page: 25,
        resolve_links: 'url'
      });

      if (response.data?.stories) {
        allResults.push(...response.data.stories);
      }
    } catch (error) {
      console.error(`Error searching Storyblok folder ${folder}:`, error);
    }
  }

  // Also search root level pages (excluding excluded folders)
  try {
    const response = await storyblokApi.get('cdn/stories', {
      version: 'published',
      search_term: query,
      per_page: 25,
      resolve_links: 'url'
    });

    if (response.data?.stories) {
      const rootStories = response.data.stories.filter((story: any) => {
        const slug = story.full_slug;
        return !slug.startsWith('api/') && 
               !slug.startsWith('error/') && 
               !slug.startsWith('protected/') && 
               !slug.startsWith('site-settings/') &&
               !folders.some(folder => slug.startsWith(folder));
      });
      allResults.push(...rootStories);
    }
  } catch (error) {
    console.error('Error searching Storyblok root pages:', error);
  }

  // Remove duplicates based on story ID
  const seenIds = new Set<string>();
  const uniqueResults = allResults.filter(story => {
    if (seenIds.has(story.id)) {
      return false;
    }
    seenIds.add(story.id);
    return true;
  });

  return uniqueResults;
}

async function searchMembers(query: string): Promise<MemberSearchResult[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('members')
    .select('id, firstname, lastname, organisation, jobtitle, biognotes, slug')
    .or(`firstname.ilike.%${query}%,lastname.ilike.%${query}%,organisation.ilike.%${query}%,jobtitle.ilike.%${query}%,biognotes.ilike.%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error searching members:', error);
    return [];
  }

  return data || [];
}

async function searchCompanies(query: string): Promise<CompanySearchResult[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, narrative, slug, beacon_membership_status')
    .eq('beacon_membership_status', 'Active')
    .or(`name.ilike.%${query}%,narrative.ilike.%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error searching companies:', error);
    return [];
  }

  return data || [];
}

function getStoryblokGroup(fullSlug: string): string {
  if (fullSlug.startsWith('resources/inspiration/')) return 'Resources/Inspiration';
  if (fullSlug.startsWith('events/thehub/')) return 'The Hub';
  if (fullSlug.startsWith('events/')) return 'Events';
  if (fullSlug.startsWith('glossary/')) return 'Glossary';
  return 'Pages';
}

function extractExcerpt(content: any): string {
  if (!content) return '';
  
  // Try to extract text from rich text content
  if (content.content) {
    const textContent = extractTextFromRichText(content);
    return textContent.substring(0, 150) + (textContent.length > 150 ? '...' : '');
  }
  
  // Try to extract from other content fields
  if (typeof content === 'string') {
    return content.substring(0, 150) + (content.length > 150 ? '...' : '');
  }
  
  return '';
}

function extractTextFromRichText(content: any): string {
  if (!content || !Array.isArray(content)) return '';
  
  let text = '';
  
  for (const item of content) {
    if (item.type === 'paragraph' && item.content) {
      for (const textItem of item.content) {
        if (textItem.type === 'text') {
          text += textItem.text + ' ';
        }
      }
    }
  }
  
  return text.trim();
}
