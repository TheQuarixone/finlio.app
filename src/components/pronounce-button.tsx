"use client";

import { useRef, useState } from "react";

/* Says the brand name out loud on click — mainly for visitors unsure how
   "Finlio" is meant to sound. */
export function PronounceButton({
  className = "",
  size = "size-6",
  iconSize = "size-[15px]",
}: {
  className?: string;
  size?: string;
  iconSize?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function handlePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play();
  }

  return (
    <>
      <button
        type="button"
        onClick={handlePlay}
        aria-label="Hear how to pronounce Finlio"
        className={`inline-flex shrink-0 items-center justify-center rounded-full text-body/45 transition-[color] hover:text-ink ${size} ${
          isPlaying ? "animate-pulse text-brand-blue" : ""
        } ${className}`}
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconSize}>
          <path
            d="M3 7.5v5h3l4.5 3.5v-12L6 7.5H3Z"
            fill="currentColor"
          />
          <path
            d="M13.2 6.8a5 5 0 0 1 0 6.4M15.6 4.6a8.3 8.3 0 0 1 0 10.8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <audio
        ref={audioRef}
        src="/audio/finlio-pronunciation.m4a"
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
      />
    </>
  );
}
