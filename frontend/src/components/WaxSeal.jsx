import { motion } from 'framer-motion';

// A wax seal that stamps down — used on the booking confirmation.
// Pure SVG: irregular wax blob, pressed inner ring, monogram + heart.

const WAX = '#8E4234';
const WAX_DARK = '#6F3228';
const WAX_LIGHT = '#A85844';

export default function WaxSeal({ size = 96, delay = 0.5, className = '' }) {
  return (
    <motion.div
      aria-hidden
      className={className}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 1.7, rotate: -18 }}
      animate={{ opacity: 1, scale: 1, rotate: -8 }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 320,
        damping: 17,
        mass: 0.9,
      }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_3px_6px_rgba(35,32,25,0.25)]">
        <defs>
          <radialGradient id="waxShine" cx="0.35" cy="0.3" r="0.9">
            <stop offset="0%" stopColor={WAX_LIGHT} />
            <stop offset="55%" stopColor={WAX} />
            <stop offset="100%" stopColor={WAX_DARK} />
          </radialGradient>
        </defs>
        {/* The blob — edges bulge unevenly like pressed wax */}
        <path
          fill="url(#waxShine)"
          d="M50,4 C61,3 70,9 78,15 C86,21 95,28 95,40 C95,50 90,57 91,66
             C92,76 85,85 75,90 C65,95 56,92 47,94 C37,96 27,92 19,85
             C11,78 8,68 7,58 C6,48 4,38 10,29 C16,20 24,16 32,11 C38,7 43,5 50,4 Z"
        />
        {/* Pressed inner ring */}
        <circle cx="50" cy="50" r="31" fill="none" stroke={WAX_DARK} strokeWidth="1.6" opacity="0.7" />
        <circle cx="50" cy="50" r="28.5" fill="none" stroke={WAX_LIGHT} strokeWidth="0.8" opacity="0.5" />
        {/* Monogram */}
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fill="#F4E9DF"
          style={{ font: 'italic 300 26px Fraunces, Georgia, serif', letterSpacing: '1px' }}
        >
          am
        </text>
        {/* The heart she signs with */}
        <path
          d="M50,68 C48.5,65.5 45,64.8 45,67.5 C45,69.5 48,71.5 50,73 C52,71.5 55,69.5 55,67.5 C55,64.8 51.5,65.5 50,68 Z"
          fill="#F4E9DF"
          opacity="0.9"
        />
      </svg>
    </motion.div>
  );
}
