import { storyblokEditable } from "@storyblok/react/rsc";
import { render } from "storyblok-rich-text-react-renderer";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface ArticleProps {
  blok: {
    slug?: string;
    title?: string;
    intro?: string;
    content?: string;
    author?: string;
    authorLink?: string;
    authorName?: string;
    authorImage?: string;
    authorArticles?: {
      content: {
        title: string;
      };
      slug?: string;
    }[];
    authorBiognotes?: string;
    date?: string;
  }
}

export default function Article({ blok }: ArticleProps) {
  
  const onlyArticleIsThisArticle = blok.authorArticles && blok.authorArticles.length === 1 && blok.authorArticles[0].slug === blok.slug;
  
  return (
    <div {...storyblokEditable(blok)} className='block space-y-12 lg:flex gap-12'>
      <main className='max-w-maxwMain basis-8/12 min-h-screen'>
        <div className='flex justify-between items-center mb-4'>
          <p className='text-sm text-qreen-dark'>
            {blok.date && new Date(blok.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {/* {blok.authorLink && blok.authorName && (
            <Link href={blok.authorLink} className='text-sm'>
              <p>Author: {blok.authorName}</p>
            </Link>
          )} */}
        </div>
        <h1 className='text-6xl tracking-[-0.07125rem] mb-8'>
          {blok.title}
        </h1>
        <p className='text-2xl tracking-tight my-4 text-qreen-dark'>
          {blok.intro}
        </p>
        <div className='prose prose_article'>
          {render(blok.content)}
        </div>
      </main>
      {/* Author aside */}
      <aside className='sidebar_right basis-4/12 shrink-0 grow bg-qlack/5 self-start rounded-sm overflow-hidden'>
        {blok.authorName && blok.authorLink && (
          <div className='md:flex lg:block'>  
            {blok.authorImage && (
              <div className='p-6 lg:pb-0'>
                <figure className='relative aspect-square basis-30 shrink-0 w-48 h-48 lg:w-full lg:h-auto overflow-hidden rounded-full'>
                  <Image 
                    src={blok.authorImage || ''} 
                    alt={blok.authorName} 
                    fill
                    sizes='(max-width: 768px) 33vw, (max-width: 1440px) 20vw, 240px'
                    className='w-full h-full object-cover object-top'
                  />
                </figure >
              </div>
            )}
            <div className='p-6 space-y-4'>
              <h3 className='text-2xl tracking-[-0.035rem]'><Link href={blok.authorLink}>{blok.authorName}</Link></h3>
              <p className='text-sm'>
                {blok.authorBiognotes && blok.authorBiognotes.length > 200 
                  ? `${blok.authorBiognotes.substring(0, 200)}... ` 
                  : blok.authorBiognotes}
              </p>
              <p className='text-sm'>
                {blok.authorBiognotes && blok.authorBiognotes.length > 200 && blok.authorLink && blok.authorLink.length > 0 && (
                  <Link href={blok.authorLink} className='no-underline! font-semibold'>
                    <ArrowUpRight className='w-4 h-4 inline-block' /> Read more
                  </Link>
                )}
              </p>
              {/* {JSON.stringify(blok.authorArticles[0])} */}

              { blok.authorArticles && blok.authorArticles.length > 0 && !onlyArticleIsThisArticle && (
                <div className='space-y-2 mt-8'>
                  <h4 className='text-lg tracking-[-0.035rem] leading-tight'>Other articles by {blok.authorName}:</h4>
                  <ul>
                    {blok.authorArticles.map((article: { 
                      name?: string;
                      slug?: string;
                    }, index: number) => (
                      <li key={index} className='small text-sm'>
                        <Link href={`/resources/inspiration/${article.slug}`} className='block no-underline! font-semibold text-qreen-dark py-2 border-b border-dashed border-qreen-dark hover:text-qreen hover:border-solid hover:border-qreen transition-all duration-300'>
                          {article.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>  
        )}
      </aside>
    </div>
  );
}