import { storyblokEditable } from "@storyblok/react/rsc";
import { AudioPlayer } from "./AudioPlayerClient";

interface AudioProps {
  blok: {
    audio_file: {
      filename: string;
      alt?: string;
    };
    title?: string;
  }
}

export default function Audio({ blok }: AudioProps) {
  const audioUrl = blok.audio_file?.filename;

  if (!audioUrl) {
    return null;
  }

  return (
    <div {...storyblokEditable(blok)}>
      <AudioPlayer src={audioUrl} title={blok.title} />
    </div>
  )
}
