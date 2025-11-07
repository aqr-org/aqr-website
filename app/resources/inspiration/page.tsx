import Link from "next/link";
import Image from "next/image";
import { Metadata, ResolvingMetadata } from "next";
import { getStoryblokApi } from "@/lib/storyblok";
import { StoryblokStory } from "@storyblok/react/rsc";
import { draftMode } from 'next/headers';
import React from "react";
import { generatePageMetadata } from '@/lib/metadata';
import { Suspense } from "react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata(
  { params: _params }: { params: Promise<Record<string, never>> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params and resolve parent metadata in parallel
  const [storyblok, parentMetadata] = await Promise.all([
    fetchStoryblokData('resources/inspiration'),
    parent
  ]);
  
  const { meta_title, meta_description, og_image } = storyblok.data.story.content;
  
  return await generatePageMetadata(
    {
      meta_title,
      meta_description,
      og_image
    },
    parentMetadata
  );
}

export default async function DirPage() {
  // Fetch initial data in parallel
  const [inspirationArticlesData, inspirationHomeStory] = await Promise.all([
    fetchInspirationArticles(),
    fetchStoryblokData('resources/inspiration')
  ]);
  
  const inspirationArticles = inspirationArticlesData || [];

  if (!inspirationArticles || inspirationArticles.length === 0) {
    console.error("No inspiration articles found");
  }

  if (!inspirationHomeStory || !inspirationHomeStory.data.story) {
    console.error("No inspiration home story found");
  }

  // Sort articles by date and get the latest 10
  const sortedArticles = inspirationArticles
    .sort((a, b) => {
      const dateA = new Date(a.content?.date || a.published_at || a.created_at || 0);
      const dateB = new Date(b.content?.date || b.published_at || b.created_at || 0);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    })
    .slice(0, 11);
  
  // Enhance articles with author information
  const articlesWithAuthors = await Promise.all(
    sortedArticles.map(async (article) => {
      const authorName = article.content?.author;
      let authorImage = null;
      
      if (authorName) {
        const author = await searchMembersForAuthor(authorName);
        if (author) {
          authorImage = await findValidImageUrl(author.id);
          article.content.authorName = author.firstname + ' ' + author.lastname;
          article.content.authorLink = `/members/${author.slug}`;
        } else {
          article.content.authorName = authorName;
        }
      }
      
      return {
        ...article,
        authorImage,
        intro: article.content?.intro || '',
      };
    })
  );

  return (
    <>
      { inspirationHomeStory.data.story && inspirationHomeStory.data.story.content.body && inspirationHomeStory.data.story.content.body.length > 0 && (
        <div className="mb-12 *:[p]:columns-2 max-w-176">
          <StoryblokStory story={inspirationHomeStory.data.story} />
        </div>
      )}
      <Suspense fallback={
        <div className="w-full min-h-[600px] md:min-h-[800px] flex items-center justify-center">
          <LoadingAnimation text="Getting Inspiration..." />
        </div>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-40 gap-y-6">
          {articlesWithAuthors.map((article, index) => {
            const isFirst = index === 0;
            const finalSlug = article.slug;
            const articleTitle = article.content?.title || article.name || 'Untitled';
            const articleIntro = article.intro || '';
            const authorName = article.content?.authorName || article.content?.author || '';
            const authorLink = article.content?.authorLink || '';
            const date = article.content?.date ? new Date(article.content.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

            return (
              <Link
                key={article.id}
                href={`/resources/inspiration/${finalSlug}`}
                className={`group ${isFirst ? 'md:col-span-2' : ''}`}
              >
                <article className="h-full pb-6">
                  {isFirst ? (
                    <div className="space-y-8 group/main-article">
                      <div className="flex justify-center items-center gap-3">
                        {article.authorImage && (
                          <div className="relative w-15 h-15 rounded-full overflow-hidden shrink-0">
                            <Image
                              src={article.authorImage}
                              alt={authorName}
                              fill
                              sizes="60px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        {authorLink ? (
                          <p className="text-base uppercase tracking-[0.04rem]">{authorName}</p>
                        ) : (
                          <p className="text-base uppercase tracking-[0.04rem]">{authorName}</p>
                        )}
                      </div>
                      <div className="text-center space-y-8">
                        <h2 className="text-4xl md:text-6xl tracking-[-0.1125rem] group-hover/main-article:text-qreen transition-all duration-300">
                          {articleTitle}
                        </h2>
                        {articleIntro && (
                          <p className="text-lg line-clamp-3">
                            {articleIntro}
                          </p>
                        )}
                        {/* {date && (
                          <p className="text-sm text-qlack">{date}</p>
                        )} */}
                      </div>
                      
                    </div>
                  ) : (
                    <div className="group/article flex flex-col gap-6 h-full justify-between pb-2 border-b border-qlack hover:border-qreen-dark transition-all duration-300">
                      <div className="flex flex-col items-start gap-6">
                        <div className="relative w-15 h-15 rounded-full overflow-hidden shrink-0">
                        {article.authorImage && (
                          <Image
                            src={article.authorImage}
                            alt={authorName}
                            fill
                            sizes="60px"
                            className="object-cover"
                          />
                        )}
                        </div>
                        {/* {date && (
                          <p className="text-sm text-gray-600 mb-2">{date}</p>
                        )} */}
                        <h3 className="text-3xl group-hover/article:text-qreen-dark transition-all duration-300">
                          {articleTitle}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end">
                        {articleIntro && (
                          <p className="text-base pl-8 line-clamp-3 mb-4 group-hover/article:text-qreen-dark transition-all duration-300">
                            {articleIntro}
                          </p>
                        )}
                        <div>
                          {authorLink ? (
                            <p className="text-sm text-right group-hover/article:text-qreen-dark transition-all duration-300">{authorName}</p>
                          ) : (
                            <p className="text-sm text-right group-hover/article:text-qreen-dark transition-all duration-300">&nbsp;</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              </Link>
            );
          })}
        </div>
      </Suspense>
    </>
  );
}

async function fetchStoryblokData(slug: string) {
  const [{ isEnabled }, storyblokApi] = await Promise.all([
    draftMode(),
    Promise.resolve(getStoryblokApi())
  ]);
  
  const isDraftMode = isEnabled;
  return await storyblokApi.get(`cdn/stories/${slug}`, { version: isDraftMode ? 'draft' : 'published' });
}
async function fetchInspirationArticles() {
  const [{ isEnabled }, storyblokApi] = await Promise.all([
    draftMode(),
    Promise.resolve(getStoryblokApi())
  ]);
  
  const isDraftMode = isEnabled;
  return await storyblokApi.getAll(`cdn/stories`, { 
    version: isDraftMode ? 'draft' : 'published' ,
    starts_with: 'resources/inspiration/',
    content_type: 'article',
    excluding_slugs: 'resources/inspiration/'
  });
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
      
      // console.log(`Found image: ${matchingFile.name}`);
      return data.publicUrl;
    }

    // console.log("No matching image file found for member:", memberId);
    return null;
    
  } catch (error) {
    console.error("Error finding image:", error);
    return null;
  }
}