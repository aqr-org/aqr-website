import { getStoryblokApi } from '@/lib/storyblok';
import { StoryblokStory } from '@storyblok/react/rsc';
import type { Metadata, ResolvingMetadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { draftMode } from 'next/headers';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const storyblok = await fetchStoryblokData(params);
  const { meta_title, meta_description, og_image } = storyblok.data.story.content;
 
  return await generatePageMetadata(
    {
      meta_title,
      meta_description,
      og_image
    },
    parent
  );
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const storyblok = await fetchStoryblokData(params);
  const story = storyblok.data.story;
  const author = await searchMembersForAuthor(story.content.author);

  if (author) {
    story.content.authorLink = `/members/${author.slug}`;
    story.content.authorName = author.firstname + ' ' + author.lastname;
    story.content.authorImage = await findValidImageUrl(author.id);
    story.content.authorArticles = await findAllArticlesForAuthor(author.firstname + ' ' + author.lastname);
    story.content.authorBiognotes = author.biognotes;
    story.content.slug = story.slug;
  }

  const onlyArticleIsThisArticle = story.content.authorArticles && story.content.authorArticles.length === 1 && story.content.authorArticles[0].slug === story.slug;

  return (
    <main>
      <StoryblokStory story={story} />
      {/* <pre>{JSON.stringify(storyblok.data, null, 2)}</pre> */}
      {/* {author && author.slug && (
        <div>
          <figure className='relative aspect-[0.75] w-[120px] rounded'>
            <Image 
              src={story.content.authorImage} 
              alt={author.firstname + ' ' + author.lastname} 
              fill
              sizes='(max-width: 768px) 70vw, 120px'
              className='aspect-[0.75] w-[120px]'
            />
          </figure >
          <p>{author.biognotes}</p>

          { story.content.authorArticles && story.content.authorArticles.length > 0 && !onlyArticleIsThisArticle && (
            <>
              <h2 className='text-lg my-4'>Other articles by {author.firstname} {author.lastname}:</h2>
              <ul>
                {story.content.authorArticles.map((article: { 
                  content: {
                    title: string 
                  }, 
                  slug?: string
                }) => (
                  <li key={article.content.title}>
                    <Link href={`/resources/inspiration/${article.slug}`}>
                      {article.content.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )} */}
    </main>
  );
}

async function fetchStoryblokData(params: ArticlePageProps['params']) {
  const resolvedParams = await params;
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/resources/inspiration/${resolvedParams.slug}`, { version: isDraftMode ? 'draft' : 'published' });
}

async function searchMembersForAuthor(authorName: string) {
  const supabase = await createClient();

  // Guard against undefined/null authorName
  if (!authorName || !authorName.trim()) {
    console.log('No author name provided');
    return null;
  }
  
  // Split the author name into parts
  const nameParts = authorName.trim().split(/\s+/);
  
  if (nameParts.length >= 2) {
    // If we have first and last name, search for exact match
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' '); // Handle multiple last names
    
    const { data, error } = await supabase
      .from('members')
      .select('id, firstname, lastname, organisation, slug, biognotes')
      .eq('firstname', firstName)
      .eq('lastname', lastName)
      .maybeSingle();
      
    if (error) {
      console.error("Member error:", error);
      return null;
    }
    
    return data;
  } else {
    // Fallback to partial search for single names
    const { data, error } = await supabase
      .from('members')
      .select('id, firstname, lastname, organisation, slug, biognotes')
      .or(`firstname.ilike.%${authorName}%,lastname.ilike.%${authorName}%`)
      .maybeSingle();
      
    if (error) {
      console.error("Member error:", error);
      return null;
    }
    
    return data;
  }
}

async function findValidImageUrl(memberId: string) {
  const supabase = await createClient();
  try {
    // List files in the members folder that start with the memberId
    const { data: files, error } = await supabase
      .storage
      .from('images')
      .list('members', {
        search: memberId
      });

    if (error) {
      console.error("Error listing files:", error);
      return null;
    }

    // Find the first file that starts with the member ID and has an extension
    const matchingFile = files?.find((file: { name: string }) => 
      file.name.startsWith(memberId) && file.name.includes('.')
    );

    if (matchingFile) {
      const { data } = supabase
        .storage
        .from('images')
        .getPublicUrl(`members/${matchingFile.name}`);
      
      console.log(`Found image: ${matchingFile.name}`);
      return data.publicUrl;
    }

    console.log("No matching image file found for member:", memberId);
    return null;
    
  } catch (error) {
    console.error("Error finding image:", error);
    return null;
  }
}

async function findAllArticlesForAuthor(author: string) {
  //search storyblok for all articles with the author name field author
  const { isEnabled } = await draftMode();
  const isDraftMode = isEnabled;
  const storyblokApi = getStoryblokApi();
  const articles = await storyblokApi.get(`cdn/stories`, { 
    starts_with: 'resources/inspiration/',
    version: isDraftMode ? 'draft' : 'published',
    filter_query: {
      author: {
        like: `%${author}%`
      }
    }
  });

  return articles.data.stories;
}