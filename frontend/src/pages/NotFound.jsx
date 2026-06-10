import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-start justify-center px-6 md:px-12">
      <p className="meta">FR.404</p>

      {/* An empty film frame */}
      <div className="relative mt-8 flex h-44 w-64 items-center justify-center border border-ink/20 bg-dark/[0.04] md:h-56 md:w-80">
        <span aria-hidden className="absolute -top-3 left-3 flex gap-2 opacity-30">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="h-1.5 w-2.5 rounded-[2px] border border-ink/60" />
          ))}
        </span>
        <span className="font-hand text-2xl opacity-60" style={{ color: '#B3402E', rotate: '-2deg' }}>
          blank frame
        </span>
        <span aria-hidden className="absolute -bottom-3 left-3 flex gap-2 opacity-30">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="h-1.5 w-2.5 rounded-[2px] border border-ink/60" />
          ))}
        </span>
      </div>

      <h1 className="mt-10 font-display text-[clamp(2.5rem,8vw,6rem)] font-light leading-none tracking-[-0.03em]">
        This one didn&rsquo;t <em className="italic">develop</em>.
      </h1>
      <p className="mt-4 max-w-md font-body text-sm font-light leading-relaxed text-ink-soft">
        The page you&rsquo;re looking for isn&rsquo;t on this roll. Let&rsquo;s get you back to
        the good frames.
      </p>
      <Link to="/" className="link-draw meta mt-10">
        ← Back to the beginning
      </Link>
    </div>
  );
}
