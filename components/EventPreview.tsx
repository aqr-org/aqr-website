import Link from "next/link";
import Picture from "@/components/Picture";

interface EventPreviewProps {
  event: {
    id: string;
    slug: string;
    name: string;
    content: {
      title: string;
      description: string;
      date?: string;
      hide_time?: boolean;
      admission?: string;
      image?: {
        filename: string;
        alt: string;
      };
      organised_by?: string;
      type?: string;
    };
  };
}

export default function EventPreview({ event }: EventPreviewProps) {
  const truncateDescription = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const { name, content } = event;
  // const description = content.description ? truncateDescription(content.description, 60) : '';
  const description = content.description;

  const dateFromDateString = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  const timeFromDateString = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  
  return (
    <Link 
      href={`/events/${event.slug}`}
      className="flex gap-6 hover:opacity-80 transition-opacity"
    >
      {/* Left Column - Image */}
      {content.image && content.image.filename ? (
        <div className="w-40 h-40 flex-shrink-0">
          <Picture
            src={content.image.filename}
            alt={content.image.alt || name}
            sizes="128px"
            aspectRatioDesktop="1"
            aspectRatioMobile="1"
            className="w-full h-full object-cover rounded"
          />
        </div>
      ) : (
        <div className="w-32 h-32 bg-gray-200 flex-shrink-0 rounded"></div>
      )}
      
      {/* Right Column - Info */}
      <div className="flex-1 flex flex-col gap-4">
        {/* First row - Date and Admission */}
        <div className="flex justify-between items-start gap-4">
          <div className="text-base">
            {content.date && (
              <div className="flex gap-2">
                <span>{dateFromDateString(content.date)}</span>
                {!content.hide_time && (
                  <>
                    <span>|</span>
                    <span>{timeFromDateString(content.date)}h</span>
                  </>
                )}
              </div>
            )}
          </div>
          {content.type && (
            <span className="text-base">{content.type}</span>
          )}
        </div>
        
        {/* Second row - Title */}
        <h3 className="text-4xl tracking-[-0.02rem] leading-none">{content.title || name}</h3>
        
        {/* Third row - Description */}
        {description && (
          <p className="text-base">{description}</p>
        )}
      </div>
    </Link>
  );
}

