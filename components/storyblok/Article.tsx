import { storyblokEditable } from "@storyblok/react/rsc";
import { render } from "storyblok-rich-text-react-renderer";
import Link from "next/link";
import Image from "next/image";

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
    <div {...storyblokEditable(blok)} className='flex gap-8'>
      <div className='max-w-164 basis-3/4'>
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
      </div>
      <div className='basis-1/4 grow'>
        
        {blok.authorName && blok.authorLink && (
          <div className='space-y-5'>  
            {blok.authorImage && (
            <figure className='relative aspect-square w-30 h-30 rounded-full overflow-hidden'>
              <Image 
                src={blok.authorImage || ''} 
                alt={blok.authorName} 
                fill
                sizes='(max-width: 768px) 70vw, (max-width: 1440px) 24vw, 240px'
                className='w-full h-full object-cover object-top'
              />
            </figure >
            )}
            <h3 className='text-2xl tracking-[-0.035rem]'><Link href={blok.authorLink}>{blok.authorName}</Link></h3>
            <p>
              {blok.authorBiognotes && blok.authorBiognotes.length > 200 
                ? `${blok.authorBiognotes.substring(0, 200)}... ` 
                : blok.authorBiognotes}
            </p>
            <p>
              {blok.authorBiognotes && blok.authorBiognotes.length > 200 && blok.authorLink && blok.authorLink.length > 0 && (
                <Link href={blok.authorLink}>
                  read more
                </Link>
              )}
            </p>

            {/* {JSON.stringify(blok.authorArticles[0])} */}

            { blok.authorArticles && blok.authorArticles.length > 0 && !onlyArticleIsThisArticle && (
              <>
                <h2 className='h3size'>Other articles by {blok.authorName}:</h2>
                <ul>
                  {blok.authorArticles.map((article: { 
                    name?: string;
                    slug?: string;
                  }, index: number) => (
                    <li key={index} className='small'>
                      <Link href={`/resources/inspiration/${article.slug}`}>
                        {article.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>  
        )}
      </div>
    </div>
  );
}