import RevealImage from './RevealImage';

// ── Contact-sheet framing ─────────────────────────────────────────────────────
// Every frame gets a roll number; roughly one in seven gets the grease-pencil
// circle and a handwritten note — the photographer's mark on the contact sheet.

const PENCIL = '#B3402E';
// Written notes return when we have her real handwriting — for now the mark
// is just the quiet grease-pencil circle, and rare.
const NOTES = [];

function isMarked(num) {
  return num % 9 === 4;
}

function GreasePencilCircle() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* A quick, imperfect hand-drawn loop — overshoots where the hand lifts */}
      <path
        d="M9,54 C6,28 26,9 51,8 C77,7 94,24 93,49 C92,76 73,93 49,92 C25,91 10,75 9,56 C8.5,46 12,38 17,32"
        fill="none"
        stroke={PENCIL}
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.85"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function FrameMeta({ num, caption, light = false }) {
  const marked = isMarked(num);
  return (
    <div className="mt-2 flex items-baseline gap-3">
      <span
        className={`font-mono text-[10px] tracking-[0.18em] ${light ? 'text-white/70' : 'opacity-50'}`}
      >
        FR.{String(num).padStart(2, '0')}
      </span>
      {marked && NOTES.length > 0 && (
        <span
          className="inline-block font-hand text-xl leading-none"
          style={{ color: PENCIL, transform: 'rotate(-2deg)' }}
        >
          {NOTES[num % NOTES.length]}
        </span>
      )}
      {caption && (
        <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${light ? 'text-white/60' : 'opacity-60'}`}>
          {caption}
        </span>
      )}
    </div>
  );
}

function Frame({ photo, num, onOpen, className = '', style = {} }) {
  return (
    <div className={className}>
      <div className="relative">
        <RevealImage
          src={photo.url}
          alt={photo.alt || photo.caption || ''}
          className="w-full cursor-pointer"
          style={style}
          onClick={() => onOpen(photo)}
        />
      </div>
      <FrameMeta num={num} caption={photo.caption} />
    </div>
  );
}

// ── Spreads ───────────────────────────────────────────────────────────────────

// Spread A: one full-bleed image (1 photo) — stays clean, number floats inside
function SpreadA({ photos, nums, onOpen }) {
  const p = photos[0];
  if (!p) return null;
  return (
    <div className="relative w-full" style={{ height: '90vh' }}>
      <RevealImage
        src={p.url}
        alt={p.alt || p.caption || ''}
        className="h-full w-full cursor-pointer"
        onClick={() => onOpen(p)}
      />
      <span className="absolute bottom-6 left-6 font-mono text-[10px] tracking-[0.18em] text-white/70 mix-blend-difference">
        FR.{String(nums[0]).padStart(2, '0')}
      </span>
      {p.caption && (
        <p className="absolute bottom-6 right-6 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60 mix-blend-difference">
          {p.caption}
        </p>
      )}
    </div>
  );
}

// Spread B: two offset images (2 photos)
function SpreadB({ photos, nums, onOpen, flip }) {
  const [a, b] = photos;
  return (
    <div className={`flex items-start gap-4 px-6 md:gap-8 md:px-12 ${flip ? 'flex-row-reverse' : ''}`}>
      {a && (
        <Frame
          photo={a}
          num={nums[0]}
          onOpen={onOpen}
          className="w-[55%]"
          style={{ aspectRatio: a.width && a.height ? `${a.width}/${a.height}` : '2/3' }}
        />
      )}
      {b && (
        <Frame
          photo={b}
          num={nums[1]}
          onOpen={onOpen}
          className="mt-[15vh] w-[40%]"
          style={{ aspectRatio: b.width && b.height ? `${b.width}/${b.height}` : '3/4' }}
        />
      )}
    </div>
  );
}

// Spread C: one small isolated image (1 photo)
function SpreadC({ photos, nums, onOpen, flip }) {
  const p = photos[0];
  if (!p) return null;
  return (
    <div className={`flex ${flip ? 'justify-end pr-12 md:pr-24' : 'justify-start pl-12 md:pl-24'}`}>
      <div style={{ width: 'clamp(240px, 35vw, 480px)' }}>
        <Frame
          photo={p}
          num={nums[0]}
          onOpen={onOpen}
          style={{ aspectRatio: p.width && p.height ? `${p.width}/${p.height}` : '3/4' }}
        />
      </div>
    </div>
  );
}

// Spread D: large image with vertical caption column (1 photo)
function SpreadD({ photos, nums, onOpen }) {
  const p = photos[0];
  if (!p) return null;
  return (
    <div className="flex items-end gap-8 px-6 md:px-12">
      <Frame
        photo={p}
        num={nums[0]}
        onOpen={onOpen}
        className="flex-1"
        style={{
          aspectRatio: p.width && p.height ? `${p.width}/${p.height}` : '4/3',
          maxHeight: '80vh',
        }}
      />
      {p.caption && (
        <div className="w-24 shrink-0 pb-10">
          <p className="rotate-180 font-mono text-[10px] uppercase tracking-[0.18em] opacity-60 [writing-mode:vertical-rl]">
            {p.caption}
          </p>
        </div>
      )}
    </div>
  );
}

// Spread E: three-strip (3 photos) — reads most like a contact sheet row
function SpreadE({ photos, nums, onOpen }) {
  return (
    <div className="px-6 md:px-12">
      <div className="flex items-stretch gap-2 md:gap-4" style={{ height: '60vh' }}>
        {photos.map((p, i) =>
          p ? (
            <div
              key={p.id}
              className={`relative cursor-pointer ${i === 1 ? 'flex-[2]' : 'flex-1'}`}
              onClick={() => onOpen(p)}
            >
              <RevealImage src={p.url} alt={p.alt || ''} className="h-full w-full" />
            </div>
          ) : null
        )}
      </div>
      <div className="flex gap-2 md:gap-4">
        {photos.map((p, i) =>
          p ? (
            <div key={p.id} className={i === 1 ? 'flex-[2]' : 'flex-1'}>
              <FrameMeta num={nums[i]} caption={p.caption} />
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

const SPREADS = [
  { type: 'A', consume: 1 },
  { type: 'B', consume: 2 },
  { type: 'C', consume: 1 },
  { type: 'D', consume: 1 },
  { type: 'E', consume: 3 },
];

export default function EditorialGrid({ photos, onOpen }) {
  if (!photos?.length) return null;

  const spreads = [];
  let i = 0;
  let patternIdx = 0;
  let flip = false;

  while (i < photos.length) {
    const { type, consume } = SPREADS[patternIdx % SPREADS.length];
    const chunk = photos.slice(i, i + consume);
    if (chunk.length === 0) break;
    // Frame numbers follow the roll order (1-based)
    const nums = chunk.map((_, ci) => i + ci + 1);
    spreads.push({ type, photos: chunk, nums, flip });
    i += consume;
    patternIdx++;
    flip = !flip;
  }

  return (
    <div className="flex flex-col gap-16 py-12 md:gap-24">
      {spreads.map((s, idx) => {
        const key = s.photos[0]?.id ?? idx;
        if (s.type === 'A') return <SpreadA key={key} photos={s.photos} nums={s.nums} onOpen={onOpen} />;
        if (s.type === 'B') return <SpreadB key={key} photos={s.photos} nums={s.nums} onOpen={onOpen} flip={s.flip} />;
        if (s.type === 'C') return <SpreadC key={key} photos={s.photos} nums={s.nums} onOpen={onOpen} flip={s.flip} />;
        if (s.type === 'D') return <SpreadD key={key} photos={s.photos} nums={s.nums} onOpen={onOpen} />;
        if (s.type === 'E') return <SpreadE key={key} photos={s.photos} nums={s.nums} onOpen={onOpen} />;
        return null;
      })}
    </div>
  );
}
