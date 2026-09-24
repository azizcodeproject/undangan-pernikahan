"use client";

import { useEffect, useRef, useState } from "react";
import { extractYoutubeVideoId } from "@/lib/youtube";
import type { WeddingMusic } from "@/lib/types";

type MusicControlProps = {
  music: WeddingMusic;
  isPlaying: boolean;
  unlocked: boolean;
  onToggle: () => void;
};

type YoutubePlayerHandle = {
  playVideo: () => void;
  pauseVideo: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          width: number;
          height: number;
          playerVars: Record<string, number | string>;
          events: { onReady: () => void };
        },
      ) => YoutubePlayerHandle;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function MusicControl({
  music,
  isPlaying,
  unlocked,
  onToggle,
}: MusicControlProps) {
  const youtubeId = extractYoutubeVideoId(music.youtubeUrl);
  const useYoutube = Boolean(youtubeId);

  if (!unlocked) {
    return null;
  }

  return (
    <>
      {useYoutube && youtubeId ? (
        <YoutubeBackdrop videoId={youtubeId} isPlaying={isPlaying} />
      ) : (
        <LocalAudio src={music.localSrc} isPlaying={isPlaying} />
      )}
      <button
        type="button"
        onClick={onToggle}
        className="fixed top-[4.35rem] right-3 z-40 flex size-12 items-center justify-center rounded-full bg-jade text-white shadow-lg shadow-jade/20 transition hover:bg-jade-deep sm:top-auto sm:right-4 sm:bottom-6"
        aria-label={isPlaying ? "Jeda musik" : "Putar musik"}
      >
        {isPlaying ? <PauseGlyph /> : <PlayGlyph />}
      </button>
    </>
  );
}

function LocalAudio({ src, isPlaying }: { src: string; isPlaying: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (isPlaying) {
      audio.play().catch(() => undefined);
      return;
    }

    audio.pause();
  }, [isPlaying]);

  return <audio ref={audioRef} src={src} loop preload="auto" />;
}

function YoutubeBackdrop({
  videoId,
  isPlaying,
}: {
  videoId: string;
  isPlaying: boolean;
}) {
  const playerRef = useRef<YoutubePlayerHandle | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function createPlayer() {
      if (cancelled || playerRef.current || !window.YT?.Player) {
        return;
      }

      playerRef.current = new window.YT.Player("yt-bg-player", {
        videoId,
        width: 1,
        height: 1,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: videoId,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            if (!cancelled) {
              setIsReady(true);
            }
          },
        },
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      if (!document.getElementById("yt-iframe-api")) {
        const script = document.createElement("script");
        script.id = "yt-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }

      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!isReady || !player) {
      return;
    }

    if (isPlaying) {
      player.playVideo();
      return;
    }

    player.pauseVideo();
  }, [isPlaying, isReady]);

  return (
    <div className="pointer-events-none sr-only" aria-hidden>
      <div id="yt-bg-player" />
    </div>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <div className="flex h-4 items-end gap-0.5" aria-hidden>
      <span className="eq-bar h-4 w-0.5 rounded-full bg-white" />
      <span className="eq-bar h-4 w-0.5 rounded-full bg-white" />
      <span className="eq-bar h-4 w-0.5 rounded-full bg-white" />
    </div>
  );
}
