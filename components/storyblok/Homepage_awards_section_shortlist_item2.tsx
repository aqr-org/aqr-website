import { storyblokEditable, StoryblokServerComponent } from "@storyblok/react/rsc";
import Picture from "@/components/Picture";

interface Homepage_awards_section_shortlist_item2Props {
  blok: {
    feature_image?: {
      filename: string;
      alt?: string;
    };
    research_title?: string;
    researchers?: any[]; // Array of homepage_awards_section_shortlist_item bloks
  };
}

function Homepage_awards_section_shortlist_item2({ blok }: Homepage_awards_section_shortlist_item2Props) {
  const imageUrl = blok.feature_image?.filename;
  const altText = blok.feature_image?.alt || '';
  const researchersItems = blok.researchers || [];

  return (
    <div {...storyblokEditable(blok)} className="flex gap-8 w-full">
      {imageUrl && (
        <div className="w-full basis-12 shrink-0 grow-0">
          <Picture
            src={imageUrl}
            alt={altText}
            aspectRatioDesktop="1.77778"
            aspectRatioMobile="1.77778"
            sizes="(max-width: 768px) 100vw, 100vw"
            className="w-full h-auto"
          />
        </div>
      )}
      <div className="space-y-4 basis-full">
        {blok.research_title && (
          <h4 className="text-2xl md:text-[2.375rem] tracking-tight leading-[1.2]">
            {blok.research_title}
          </h4>
        )}
        {researchersItems.length > 0 && (
          <div className="flex gap-12">
            {researchersItems.map((researchersBlok: any) => (
              <StoryblokServerComponent blok={researchersBlok} key={researchersBlok._uid} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Server components don't need React.memo - they only render on the server
export default Homepage_awards_section_shortlist_item2;
