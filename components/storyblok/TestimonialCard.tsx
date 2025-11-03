import Picture from "@/components/Picture";

interface TestimonialCardProps {
  quote: string;
  name: string;
  subtitle: string;
  portrait: {
    filename: string;
    alt: string;
  };
}

export default function TestimonialCard({
  quote,
  name,
  subtitle,
  portrait,
}: TestimonialCardProps) {
  return (
    <div className="flex gap-6 items-start">
      {/* Portrait on left */}
      {portrait?.filename && (
        <div className="shrink-0">
          <Picture
            src={portrait.filename}
            alt={portrait.alt || name}
            aspectRatioDesktop="1"
            aspectRatioMobile="1"
            sizes="(max-width: 768px) 20vw, 15vw"
            className="rounded-full w-20 h-20 md:w-40 md:h-40 object-cover overflow-hidden block"
          />
        </div>
      )}
      
      {/* Text content on right */}
      <div className="flex-1 flex flex-col gap-2 overflow-visible">
        <p className="text-3xl text-qreen-dark max-w-160 relative overflow-visible">
          {quote}
          <svg className="absolute bottom-[120%] left-0" width="40" height="36" viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.3">
            <path d="M22.5641 18.5143H40V36H22.5641V18.5143Z" fill="#3C772B"/>
            <path d="M32.3077 0H38.9744L32.3077 18.5143H22.5641L32.3077 0Z" fill="#3C772B"/>
            <path d="M0 18.5143H17.4359V36H0V18.5143Z" fill="#3C772B"/>
            <path d="M9.74359 0H16.4103L9.74359 18.5143H0L9.74359 0Z" fill="currentColor"/>
            </g>
          </svg>
        </p>
        <div className="flex flex-col mt-2">
          <p className="text-base text-qlack font-medium">{name}</p>
          {subtitle && <p className="text-base text-qlack">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

