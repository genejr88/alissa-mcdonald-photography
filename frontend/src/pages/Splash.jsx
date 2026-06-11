// Pre-launch splash page — blush watercolor "under construction" card.
// Gated in App.jsx by SPLASH_ENABLED; visiting /loop unlocks the full site.

const PINK = '#D98A8A';
const PINK_SOFT = '#EFC2BC';
const INK = '#3A3735';

function Heart({ className = '', style = {}, size = 16 }) {
  return (
    <svg
      aria-hidden
      className={`absolute ${className}`}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 20s-7-4.6-9.2-9C1.2 7.7 3 4.5 6.2 4.5c2 0 3.3 1.1 4 2.3.3.6 1.3.6 1.6 0 .7-1.2 2-2.3 4-2.3 3.2 0 5 3.2 3.4 6.5C17 15.4 12 20 12 20z"
        stroke={PINK}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraDoodle() {
  return (
    <svg width="92" height="64" viewBox="0 0 92 64" fill="none" aria-hidden>
      {/* rays */}
      <path d="M12 18 L6 12 M80 18 L86 12 M12 46 L6 52 M80 46 L86 52" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      {/* body */}
      <rect x="18" y="20" width="56" height="34" rx="6" stroke={INK} strokeWidth="2" />
      <path d="M36 20 L39 13 H53 L56 20" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="62" y="25" width="7" height="4" rx="1.5" stroke={INK} strokeWidth="1.4" />
      {/* lens */}
      <circle cx="46" cy="37" r="11" stroke={INK} strokeWidth="2" />
      {/* heart in the lens */}
      <path
        d="M46 42s-4.4-2.9-5.7-5.6c-1-2 .1-4 2.1-4 1.2 0 2 .7 2.5 1.4.2.4.9.4 1.1 0 .4-.7 1.3-1.4 2.5-1.4 2 0 3.1 2 2.1 4-1.3 2.7-4.6 5.6-4.6 5.6z"
        fill={PINK}
      />
    </svg>
  );
}

export default function Splash() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center"
      style={{ background: '#FBF3EF', color: INK }}
    >
      {/* Watercolor washes in the corners */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rotate-[-30deg] rounded-full opacity-50 blur-2xl"
        style={{ background: `radial-gradient(closest-side, ${PINK_SOFT}, transparent 70%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rotate-[20deg] rounded-full opacity-50 blur-2xl"
        style={{ background: `radial-gradient(closest-side, ${PINK_SOFT}, transparent 70%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full opacity-40 blur-2xl"
        style={{ background: `radial-gradient(closest-side, ${PINK_SOFT}, transparent 70%)` }}
      />

      {/* Scattered hearts */}
      <Heart className="left-[12%] top-[22%]" size={18} />
      <Heart className="right-[14%] top-[30%] rotate-12" size={14} />
      <Heart className="left-[18%] bottom-[24%] -rotate-12" size={14} />
      <Heart className="right-[10%] bottom-[18%]" size={20} />
      <Heart className="right-[28%] top-[12%] rotate-6" size={12} />

      {/* Monogram ring */}
      <div
        className="relative flex h-64 w-64 flex-col items-center justify-center rounded-full sm:h-72 sm:w-72"
        style={{ border: `1.5px solid ${PINK}`, boxShadow: `0 0 0 6px #FBF3EF, 0 0 0 7px ${PINK_SOFT}` }}
      >
        <span
          className="font-hand text-7xl leading-none sm:text-8xl"
          style={{ color: PINK }}
        >
          ap
        </span>
        <p
          className="mt-3 font-display text-xl tracking-[0.25em] sm:text-2xl"
          style={{ color: INK }}
        >
          ALISSA
        </p>
        <p className="font-display text-xl tracking-[0.25em] sm:text-2xl" style={{ color: INK }}>
          MCDONALD
        </p>
        <p className="mt-2 font-mono text-[10px] tracking-[0.45em]" style={{ color: INK }}>
          • PHOTOGRAPHY •
        </p>
        <span className="mt-2 flex items-center gap-2" style={{ color: PINK }}>
          <span className="block h-px w-8" style={{ background: PINK_SOFT }} />
          <span className="text-sm leading-none">♥</span>
          <span className="block h-px w-8" style={{ background: PINK_SOFT }} />
        </span>
      </div>

      {/* Headline */}
      <h1 className="mt-10 font-hand text-5xl leading-tight sm:text-7xl" style={{ color: INK }}>
        Website Under Construction
      </h1>

      {/* Highlight bar */}
      <p
        className="mt-5 inline-block -rotate-1 rounded-sm px-5 py-2 font-mono text-xs tracking-[0.3em] sm:text-sm"
        style={{ background: `${PINK_SOFT}99`, color: INK }}
      >
        SOMETHING BEAUTIFUL IS COMING SOON! <span style={{ color: PINK }}>♥</span>
      </p>

      {/* Her handwriting, her words */}
      <img
        src="https://res.cloudinary.com/dxngcapcj/image/upload/amp-brand/hand-tagline.png"
        alt="Capturing moments, one click at a time"
        className="mt-7 h-14 w-auto opacity-80 sm:h-16"
        style={{ transform: 'rotate(-1.5deg)' }}
      />

      {/* Camera doodle */}
      <div className="mt-8">
        <CameraDoodle />
      </div>

      {/* Thank-you note */}
      <p className="mt-6 max-w-md font-body text-base font-light leading-relaxed">
        Thank you so much for stopping by!
        <br />
        I can&rsquo;t wait to capture beautiful memories with you. <span style={{ color: PINK }}>♡</span>
      </p>

      {/* Social row */}
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-10">
        <a
          href="https://www.instagram.com/alissamcdonald.photography_"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 font-body text-sm transition-opacity hover:opacity-70"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-paper"
            style={{ background: PINK }}
          >
            {/* Instagram glyph */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="white" strokeWidth="2" />
              <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" />
              <circle cx="17.2" cy="6.8" r="1.2" fill="white" />
            </svg>
          </span>
          @alissamcdonald.photography_
        </a>
        <a
          href="https://www.facebook.com/uncagedcreations.byAlissa"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 font-body text-sm transition-opacity hover:opacity-70"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: PINK }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
              <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3V11H9v3h2.3v7h2.2z" />
            </svg>
          </span>
          /alissamcdphotography
        </a>
      </div>

      {/* Footer line */}
      <p className="mt-12 font-mono text-[10px] tracking-[0.35em]" style={{ color: PINK }}>
        LET&rsquo;S CREATE BEAUTIFUL MEMORIES TOGETHER ♡
      </p>
    </div>
  );
}
