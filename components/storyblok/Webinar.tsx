import { storyblokEditable } from "@storyblok/react/rsc";
import { render } from "storyblok-rich-text-react-renderer";

interface WebinarProps {
  blok: {
    title: string;
    description: string;
    content: string;
    youtube_id: string;
  }
}

export default function Webinar({ blok }: WebinarProps) {

  const sanitizedYoutubeId = () => {
    const youtubeId = blok.youtube_id;
    
    // If it's already just an ID (no URL), return it
    if (!youtubeId.includes('http') && !youtubeId.includes('/')) {
      return youtubeId;
    }
    
    try {
      const url = new URL(youtubeId);
      
      // Handle youtu.be/ format
      if (url.hostname.includes('youtu.be')) {
        const pathname = url.pathname;
        // Remove leading slash and any query parameters
        return pathname.replace('/', '').split('?')[0];
      }
      
      // Handle www.youtube.com/watch?v= format
      if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
        const id = url.searchParams.get('v');
        if (id) return id;
        
        // Fallback: try to extract from pathname if v param doesn't exist
        const pathMatch = url.pathname.match(/\/(?:v|embed)\/([a-zA-Z0-9_-]+)/);
        if (pathMatch) return pathMatch[1];
      }
    } catch (error) {
      // If URL parsing fails, return the original string
      console.error('Error parsing YouTube URL:', error);
      return youtubeId;
    }
    return youtubeId;
  };

  const videoId = sanitizedYoutubeId();
  
  return (
    <div {...storyblokEditable(blok)}>
      {blok.youtube_id && blok.youtube_id.length > 0 &&
        <div className="w-full h-auto aspect-video">
          <iframe 
            width="560" 
            height="315" 
            src={`https://www.youtube.com/embed/${videoId}`} 
            title="YouTube video player" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen
            className="w-full h-auto aspect-video"
          ></iframe>
        </div>
      }
      <div className="max-w-[41rem] prose">
        <h1 className='h3size'>
          {blok.title}
        </h1>
        <h2 className="h4size text-qreen-dark">
          {blok.description}
        </h2>
        <div className='prose'>
          {render(blok.content)}
        </div>
      </div>
    </div>
  )
}