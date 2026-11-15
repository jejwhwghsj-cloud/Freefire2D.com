import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Film,
  X,
  CheckCircle2,
} from 'lucide-react';
import posterZoneImg from '../assets/images/game_trailer_poster_1794720370116.jpg';

const TRAILER_MP4_URL = '/free-fire-2d-trailer.mp4';

interface TrailerPlayerProps {
  onClose?: () => void;
}

export const TrailerPlayer: React.FC<TrailerPlayerProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const [downloaded, setDownloaded] = useState(false);

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      if (video.ended) {
        video.currentTime = 0;
      }
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const handleReplay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  };

  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-amber-400/50 bg-slate-950 shadow-2xl">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-[#0b101c] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Film className="w-4 h-4 text-amber-400" />
          <span className="font-display font-bold text-sm uppercase tracking-wider text-white">
            Your Private 15s HD Promo Trailer (MP4)
          </span>
          <span className="hidden sm:inline text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
            1280×720 H.264 + AAC Audio
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <a
            href={TRAILER_MP4_URL}
            download="free-fire-2d-trailer.mp4"
            onClick={() => {
              setDownloaded(true);
              setTimeout(() => setDownloaded(false), 3500);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Save 15-Second Heavy HD MP4 Trailer Video directly to your device"
          >
            {downloaded ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-900" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloaded ? 'MP4 Saved!' : 'Download 15s MP4 Video'}</span>
          </a>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Trailer Studio"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Native 1280x720 HD MP4 Video Player */}
      <div className="relative w-full aspect-video bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={TRAILER_MP4_URL}
          poster={posterZoneImg}
          controls
          playsInline
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            if (e.currentTarget.duration && Number.isFinite(e.currentTarget.duration)) {
              setDuration(e.currentTarget.duration);
            }
          }}
          className="w-full h-full block object-contain bg-black"
        />

        {!isPlaying && currentTime === 0 && (
          <button
            onClick={handleTogglePlay}
            className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center gap-3 transition-opacity hover:bg-black/25 cursor-pointer"
            aria-label="Play Heavy 15 Second MP4 Promo Trailer"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-400/30 transition-transform hover:scale-105">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
            <span className="px-4 py-1.5 rounded-lg bg-slate-950/85 border border-amber-400/40 text-xs font-bold uppercase tracking-wider text-amber-300">
              Play 15s Heavy HD Video Trailer
            </span>
          </button>
        )}
      </div>

      {/* Bottom Controls & Direct Download Bar */}
      <div className="px-4 py-2.5 bg-[#0b101c] border-t border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={handleReplay}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Replay</span>
          </button>
        </div>

        <div className="flex-1 flex items-center gap-2.5">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-[width] duration-75"
            />
          </div>
          <span className="font-mono-numbers text-xs text-slate-300 font-bold shrink-0">
            {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
};
