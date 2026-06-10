import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGuestbook, signGuestbook } from '../lib/api';

// ── The guest book ────────────────────────────────────────────────────────────
// A scrapbook spread. Every note is a little card taped to the page — washi
// tape, a slight tilt, real handwriting energy. Visitors pick a pen and leave
// a note; it gets taped down right in front of them.

const PENS = [
  { hex: '#2E2C27', label: 'Ink' },
  { hex: '#A4533F', label: 'Rust' },
  { hex: '#5B6E5A', label: 'Sage' },
  { hex: '#5C6B7A', label: 'Slate' },
];

const TAPES = [
  'rgba(228, 178, 168, 0.55)', // blush
  'rgba(224, 207, 153, 0.55)', // butter
  'rgba(182, 199, 174, 0.55)', // sage
  'rgba(176, 192, 204, 0.55)', // sky
];

const STICKERS = ['♥', '✦', '☼', '✿'];

// Deterministic "randomness" from the entry id, so the page doesn't reshuffle
// on every render but still looks hand-placed.
function seedFrom(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function NoteCard({ entry, isNew = false }) {
  const seed = seedFrom(entry.id);
  const rotate = ((seed % 100) / 100) * 5 - 2.5; // -2.5°..2.5°
  const tape = TAPES[seed % TAPES.length];
  const tapeRotate = ((seed >> 4) % 100) / 100 * 8 - 4;
  const hasSticker = seed % 5 === 1;
  const sticker = STICKERS[(seed >> 8) % STICKERS.length];

  const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, y: -24, rotate: rotate - 6, scale: 1.06 } : { opacity: 0, y: 24, rotate }}
      whileInView={{ opacity: 1, y: 0, rotate, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ rotate: 0, y: -6, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 190, damping: 18 }}
      className="relative break-inside-avoid"
      style={{ rotate }}
    >
      <div
        className="relative bg-white px-6 pb-5 pt-8"
        style={{ boxShadow: '0 1px 2px rgba(35,32,25,0.08), 0 8px 24px rgba(35,32,25,0.08)' }}
      >
        {/* Washi tape */}
        <span
          aria-hidden
          className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2"
          style={{
            background: tape,
            transform: `translateX(-50%) rotate(${tapeRotate}deg)`,
            backdropFilter: 'blur(0.5px)',
            boxShadow: '0 1px 2px rgba(35,32,25,0.06)',
          }}
        />
        {/* Corner sticker, occasionally */}
        {hasSticker && (
          <span
            aria-hidden
            className="absolute right-3 top-2 font-hand text-xl"
            style={{ color: entry.inkColor, opacity: 0.55, transform: 'rotate(8deg)' }}
          >
            {sticker}
          </span>
        )}

        <p
          className="font-hand text-[1.45rem] leading-[1.35]"
          style={{ color: entry.inkColor }}
        >
          {entry.message}
        </p>
        <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-ink/[0.07] pt-3">
          <span className="font-hand text-lg" style={{ color: entry.inkColor, opacity: 0.85 }}>
            — {entry.name}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft/60">
            {date}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function WriteCard({ onSigned }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [pen, setPen] = useState(PENS[0].hex);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: signGuestbook,
    onSuccess: (entry) => {
      setName('');
      setMessage('');
      setError('');
      onSigned(entry);
    },
    onError: (err) => {
      setError(err?.response?.data?.error || 'Something went wrong — try again?');
    },
  });

  const remaining = 280 - message.length;

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: 24, rotate: -1 }}
        whileInView={{ opacity: 1, y: 0, rotate: -1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.77, 0, 0.175, 1] }}
        className="relative bg-white px-7 pb-7 pt-10 md:px-9"
        style={{ boxShadow: '0 1px 2px rgba(35,32,25,0.08), 0 12px 32px rgba(35,32,25,0.1)' }}
      >
        {/* Two tape strips — this card is pinned with care */}
        <span
          aria-hidden
          className="absolute -top-3 left-8 h-6 w-20"
          style={{ background: TAPES[0], transform: 'rotate(-5deg)' }}
        />
        <span
          aria-hidden
          className="absolute -top-3 right-8 h-6 w-20"
          style={{ background: TAPES[2], transform: 'rotate(4deg)' }}
        />

        <p className="meta mb-1">Your turn</p>
        <h2 className="font-display text-2xl font-light">
          Leave a little <em className="italic">love</em>
        </h2>

        <form
          className="mt-6 flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !message.trim()) {
              setError('A name and a note — that’s all it takes.');
              return;
            }
            mutation.mutate({ name: name.trim(), message: message.trim(), inkColor: pen });
          }}
        >
          {/* Honeypot — humans never see this */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute -left-[9999px] h-px w-px opacity-0"
            aria-hidden
          />

          {/* Pen picker */}
          <div className="flex items-center gap-3">
            <span className="meta">Pick a pen</span>
            <div className="flex gap-2.5">
              {PENS.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => setPen(p.hex)}
                  title={p.label}
                  aria-label={`${p.label} pen`}
                  className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: p.hex,
                    boxShadow: pen === p.hex ? `0 0 0 2px var(--paper), 0 0 0 4px ${p.hex}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* The note — lined paper, written in their chosen pen */}
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 280))}
              rows={4}
              placeholder="Write something sweet…"
              className="w-full resize-none border-0 bg-transparent font-hand text-[1.45rem] leading-[2.2rem] outline-none placeholder:text-ink/25"
              style={{
                color: pen,
                backgroundImage:
                  'repeating-linear-gradient(transparent, transparent calc(2.2rem - 1px), rgba(46,44,39,0.12) calc(2.2rem - 1px), rgba(46,44,39,0.12) 2.2rem)',
              }}
            />
            <p className="mt-1 text-right font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft/50">
              {remaining} left
            </p>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <label className="meta mb-1 block">Signed,</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder="Your name"
                className="w-full border-b border-ink/20 bg-transparent pb-1 font-hand text-xl outline-none transition-colors placeholder:text-ink/25 focus:border-ink/60"
                style={{ color: pen }}
              />
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="border border-ink px-6 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
            >
              {mutation.isPending ? 'Taping it down…' : 'Tape it to the page'}
            </button>
          </div>

          {error && (
            <p className="font-hand text-lg" style={{ color: '#A4533F' }}>
              {error}
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}

export default function Guestbook() {
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['guestbook'],
    queryFn: getGuestbook,
  });
  const [justSignedId, setJustSignedId] = useState(null);

  const handleSigned = (entry) => {
    setJustSignedId(entry.id);
    queryClient.setQueryData(['guestbook'], (old = []) => [entry, ...old]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Header */}
      <div className="px-6 pb-4 pt-32 md:px-12">
        <p className="meta mb-4">№ 06 — Guest book</p>
        <h1 className="font-display text-[clamp(2.5rem,8vw,7rem)] font-light leading-[0.95] tracking-[-0.03em]">
          Sign the <em className="italic">guest book</em>.
        </h1>
        <p className="mt-6 max-w-md font-body text-sm font-light leading-relaxed text-ink-soft">
          Like the one at a wedding — but it never gets boxed up in an attic. Been in front of
          my camera? Just passing through? Tape a note to the page.
        </p>
      </div>

      {/* Write card */}
      <section className="px-6 pb-20 pt-12 md:px-12">
        <WriteCard onSigned={handleSigned} />
      </section>

      {/* The spread */}
      <section className="px-6 pb-28 md:px-12">
        {isLoading ? (
          <p className="meta text-center">Opening the book…</p>
        ) : entries.length === 0 ? (
          <div className="mx-auto max-w-sm text-center">
            <p className="font-hand text-2xl text-ink-soft" style={{ transform: 'rotate(-1.5deg)' }}>
              The first page is blank — be the one who starts it ♥
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl columns-1 gap-8 sm:columns-2 lg:columns-3 [&>*]:mb-8">
            <AnimatePresence>
              {entries.map((e) => (
                <NoteCard key={e.id} entry={e} isNew={e.id === justSignedId} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </motion.div>
  );
}
