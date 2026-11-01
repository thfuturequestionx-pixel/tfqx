'use client';

type BackgroundVideoProps = {
  src?: string;
  poster?: string;
  className?: string;
};

export default function BackgroundVideo({
  src = '/videos/city-bg.mp4',
  poster,
  className = '',
}: BackgroundVideoProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--background)] ${className}`}
      aria-hidden="true"
    >
      <video
        className="h-full w-full object-cover opacity-100"
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
      <div className="hero-scrim absolute inset-0" />
      <div className="absolute inset-0 bg-[var(--video-tint)] mix-blend-overlay" />
    </div>
  );
}