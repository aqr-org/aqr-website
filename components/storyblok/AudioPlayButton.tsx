"use client";

import { useState, useRef, useEffect } from 'react';

interface AudioPlayButtonProps {
  src: string;
}

export function AudioPlayButton({ src }: AudioPlayButtonProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  return (
    <>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={togglePlayPause}
        className="flex items-center justify-center cursor-pointer"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="48" height="48" rx="24" stroke="#FCFAF0" strokeWidth="2"/>
            <rect x="18" y="16" width="4" height="18" rx="2" fill="#FCFAF0"/>
            <rect x="28" y="16" width="4" height="18" rx="2" fill="#FCFAF0"/>
          </svg>
        ) : (
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="48" height="48" rx="24" stroke="#FCFAF0" strokeWidth="2"/>
            <path d="M33.5 25L19.5 33.5L19.5 16.5L33.5 25Z" fill="#FCFAF0"/>
          </svg>
        )}
      </button>
    </>
  );
}

