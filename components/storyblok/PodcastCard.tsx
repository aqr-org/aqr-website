import { storyblokEditable } from "@storyblok/react/rsc";
import { AudioPlayButton } from "./AudioPlayButton";
import Link from "next/link";
import AudioSymbol from "../svgs/AudioSymbol";

interface PodcastCardProps {
  blok: {
    category: string;
    title: string;
    description: string;
    audiofile?: {
      filename: string;
    }; 
    link_text: string;
    link?: {
      cached_url: string;
    }

  }
}

export default function PodcastCard({ blok }: PodcastCardProps) {
  const hasAudio = blok.audiofile && blok.audiofile.filename;
  const hasLink = blok.link && blok.link.cached_url;

  return (
    <div {...storyblokEditable(blok)} className="bg-linear-to-r from-[#4CA79E] to-qreen p-8 pt-5 rounded-xl text-qaupe group/animate-audio-symbol">
      <div className="flex items-center gap-2 pb-4 border-b border-qaupe">
        <AudioSymbol />
        <p className="text-xs">{blok.category}</p>
      </div>
      <h2 className="text-3xl leading-8 pt-4">{blok.title}</h2>
      <div className="flex gap-4 items-center">
        <p className="text-[1.375rem] leading-[1.3] line-clamp-3 mt-2 px-4">{blok.description}</p>
        {hasAudio && (
          <div className="flex flex-col items-center gap-1">
            <AudioPlayButton src={blok.audiofile!.filename} />
            {hasLink && (
              <Link href={blok.link!.cached_url} className="text-xs text-qaupe underline mt-2 hover:no-underline text-center whitespace-nowrap">
                {blok.link_text || 'Go to podcast'}
              </Link>
            )}
          </div>
        )}
        {!hasAudio && hasLink && (
          <Link href={blok.link!.cached_url}>
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="48" height="48" rx="24" stroke="#FCFAF0" strokeWidth="2"/>
              <path d="M33.5 25L19.5 33.5L19.5 16.5L33.5 25Z" fill="#FCFAF0"/>
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}