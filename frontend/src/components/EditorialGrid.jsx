import RevealImage from './RevealImage';

// Spread A: one full-bleed image (1 photo)
function SpreadA({ photos, onOpen }) {
  const p = photos[0];
  if (!p) return null;
  return (
    <div className="relative w-full" style={{ height: '90vh' }}>
      <RevealImage
        src={p.url}
        alt={p.alt || p.caption || ''}
        className="w-full h-full cursor-pointer"
        onClick={() => onOpen(p)}
      />
      {p.caption && (
        <p className="absolute bottom-6 right-6 text-xs tracking-widest uppercase opacity-60 text-white mix-blend-difference">
          {p.caption}
        </p>
      )}
    </div>
  );
}

// Spread B: two offset images (2 photos)
function SpreadB({ photos, onOpen, flip }) {
  const [a, b] = photos;
  return (
    <div className={`flex gap-4 md:gap-8 items-start px-4 md:px-12 ${flip ? 'flex-row-reverse' : ''}`}>
      <div className="w-[55%] mt-0">
        {a && (
          <RevealImage
            src={a.url}
            alt={a.alt || ''}
            className="w-full cursor-pointer"
            style={{ aspectRatio: a.width && a.height ? `${a.width}/${a.height}` : '2/3' }}
            onClick={() => onOpen(a)}
          />
        )}
        {a?.caption && <p className="mt-3 text-xs tracking-widest uppercase opacity-50">{a.caption}</p>}
      </div>
      <div className="w-[40%] mt-[15vh]">
        {b && (
          <RevealImage
            src={b.url}
            alt={b.alt || ''}
            className="w-full cursor-pointer"
            style={{ aspectRatio: b.width && b.height ? `${b.width}/${b.height}` : '3/4' }}
            onClick={() => onOpen(b)}
          />
        )}
        {b?.caption && <p className="mt-3 text-xs tracking-widest uppercase opacity-50">{b.caption}</p>}
      </div>
    </div>
  );
}

// Spread C: one small isolated image (1 photo)
function SpreadC({ photos, onOpen, flip }) {
  const p = photos[0];
  if (!p) return null;
  return (
    <div className={`flex ${flip ? 'justify-end pr-12 md:pr-24' : 'justify-start pl-12 md:pl-24'}`}>
      <div style={{ width: 'clamp(240px, 35vw, 480px)' }}>
        <RevealImage
          src={p.url}
          alt={p.alt || ''}
          className="w-full cursor-pointer"
          style={{ aspectRatio: p.width && p.height ? `${p.width}/${p.height}` : '3/4' }}
          onClick={() => onOpen(p)}
        />
        {p.caption && <p className="mt-3 text-xs tracking-widest uppercase opacity-50">{p.caption}</p>}
      </div>
    </div>
  );
}

// Spread D: large image with caption column (1 photo)
function SpreadD({ photos, onOpen }) {
  const p = photos[0];
  if (!p) return null;
  return (
    <div className="flex gap-8 px-4 md:px-12 items-end">
      <div className="flex-1">
        <RevealImage
          src={p.url}
          alt={p.alt || ''}
          className="w-full cursor-pointer"
          style={{ aspectRatio: p.width && p.height ? `${p.width}/${p.height}` : '4/3', maxHeight: '80vh' }}
          onClick={() => onOpen(p)}
        />
      </div>
      {p.caption && (
        <div className="w-24 shrink-0 pb-4">
          <p className="text-xs tracking-widest uppercase opacity-50 [writing-mode:vertical-rl] rotate-180">
            {p.caption}
          </p>
        </div>
      )}
    </div>
  );
}

// Spread E: three-strip (3 photos)
function SpreadE({ photos, onOpen }) {
  const [a, b, c] = photos;
  return (
    <div className="flex gap-2 md:gap-4 px-4 md:px-8 items-stretch" style={{ height: '60vh' }}>
      {[a, b, c].map((p, i) =>
        p ? (
          <div key={p.id} className={`cursor-pointer ${i === 1 ? 'flex-[2]' : 'flex-1'}`} onClick={() => onOpen(p)}>
            <RevealImage src={p.url} alt={p.alt || ''} className="w-full h-full" />
          </div>
        ) : null
      )}
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
    spreads.push({ type, photos: chunk, flip });
    i += consume;
    patternIdx++;
    flip = !flip;
  }

  return (
    <div className="flex flex-col gap-16 md:gap-24 py-12">
      {spreads.map((s, idx) => {
        const key = s.photos[0]?.id ?? idx;
        if (s.type === 'A') return <SpreadA key={key} photos={s.photos} onOpen={onOpen} />;
        if (s.type === 'B') return <SpreadB key={key} photos={s.photos} onOpen={onOpen} flip={s.flip} />;
        if (s.type === 'C') return <SpreadC key={key} photos={s.photos} onOpen={onOpen} flip={s.flip} />;
        if (s.type === 'D') return <SpreadD key={key} photos={s.photos} onOpen={onOpen} />;
        if (s.type === 'E') return <SpreadE key={key} photos={s.photos} onOpen={onOpen} />;
        return null;
      })}
    </div>
  );
}
