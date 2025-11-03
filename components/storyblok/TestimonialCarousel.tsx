import { storyblokEditable } from "@storyblok/react/rsc";
import TestimonialCarouselClient from "./TestimonialCarouselClient";

interface TestimonialCarouselProps {
  blok: {
    title: string;
    testimonials?: Array<{
      component: string;
      quote?: string;
      name?: string;
      subtitle?: string;
      portrait?: {
        filename: string;
        alt?: string;
      };
      _uid: string;
    }>;
  };
}

export default function TestimonialCarousel({ blok }: TestimonialCarouselProps) {
  // Extract and transform testimonials from Storyblok blok
  const testimonials =
    blok.testimonials?.map((testimonial) => ({
      quote: testimonial.quote || "",
      name: testimonial.name || "",
      subtitle: testimonial.subtitle || "",
      portrait: testimonial.portrait
        ? {
            filename: testimonial.portrait.filename,
            alt: testimonial.portrait.alt || testimonial.name || "",
          }
        : {
            filename: "",
            alt: "",
          },
    })) || [];

  if (testimonials.length === 0) return null;

  return (
    <div
      {...storyblokEditable(blok)}
      className=" bg-qellow"
    >
      <div className="w-full max-w-maxw mx-auto px-container overflow-hidden relative">
        <h2 className="uppercase tracking-[0.03em] mt-12">{blok.title}</h2>
        <TestimonialCarouselClient testimonials={testimonials} />
      </div>
    </div>
  );
}

