import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { getGallery } from '../lib/api';
import EditorialGrid from '../components/EditorialGrid';
import Lightbox from '../components/Lightbox';

// ── Password gate for locked galleries ────────────────────────────────────────
function PasswordGate({ slug, lockedInfo, wrongPassword, onSubmit, checking }) {
  const [pw, setPw] = useState('');
  const isDark = lockedInfo?.mood === 'DARK';
  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center px-6 ${
        isDark ? 'bg-dark text-paper' : 'bg-paper text-ink'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm text-center"
      >
        {/* A little film canister of a lock */}
        <div
          className={`mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full border ${
            isDark ? 'border-paper/30' : 'border-ink/25'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M7.2,10.4 C7,7.2 8.6,4.6 12,4.5 C15.4,4.6 17,7.1 16.8,10.4" />
            <path d="M6.5,10.5 C10.1,10.2 13.9,10.2 17.5,10.5 C17.8,13.4 17.8,16.4 17.5,19.2 C13.9,19.6 10.1,19.6 6.5,19.2 C6.2,16.4 6.2,13.4 6.5,10.5 Z" />
            <circle cx="12" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
          </svg>
        </div>

        <p className={`meta mb-3 ${isDark ? 'text-paper/50' : ''}`}>Private roll</p>
        <h1 className="font-display text-3xl font-light md:text-4xl">
          {lockedInfo?.title || 'This gallery'}
        </h1>
        <p className={`mt-4 font-body text-sm font-light leading-relaxed ${isDark ? 'text-paper/60' : 'text-ink-soft'}`}>
          This gallery is just for the people in it. Enter the password Alissa shared with you.
        </p>

        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (pw.trim()) onSubmit(pw.trim());
          }}
        >
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Gallery password"
            autoFocus
            className={`w-full border-b bg-transparent pb-2 text-center text-lg outline-none transition-colors ${
              isDark
                ? 'border-paper/30 placeholder:text-paper/30 focus:border-paper/70'
                : 'border-ink/25 placeholder:text-ink/30 focus:border-ink/70'
            }`}
          />
          <button
            type="submit"
            disabled={!pw.trim() || checking}
            className={`mt-8 border px-8 py-3 font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-40 ${
              isDark
                ? 'border-paper/60 hover:bg-paper hover:text-dark'
                : 'border-ink hover:bg-ink hover:text-paper'
            }`}
          >
            {checking ? 'Checking…' : 'Open the gallery'}
          </button>
        </form>

        {wrongPassword && !checking && (
          <p className="mt-5 font-hand text-xl" style={{ color: '#A4533F' }}>
            Hmm, that&rsquo;s not it — double-check with Alissa?
          </p>
        )}
      </motion.div>
    </div>
  );
}

const pwKey = (slug) => `amp_gpw_${slug}`;

export default function GalleryDetail() {
  const { slug } = useParams();
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [password, setPassword] = useState(() => sessionStorage.getItem(pwKey(slug)) || '');

  const { data: gallery, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['gallery', slug, password],
    queryFn: () => getGallery(slug, password || undefined),
    retry: false,
  });

  const openLightbox = useCallback((photo) => {
    const idx = gallery?.photos?.findIndex((p) => p.id === photo.id) ?? 0;
    const open = () => setLightboxIdx(idx);
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(open);
    } else {
      open();
    }
  }, [gallery]);

  if (isLoading) return null;

  // Locked gallery — show the password gate
  if (isError && error?.response?.status === 401 && error.response.data?.locked) {
    return (
      <PasswordGate
        slug={slug}
        lockedInfo={error.response.data}
        wrongPassword={error.response.data.wrongPassword}
        checking={isFetching}
        onSubmit={(pw) => {
          sessionStorage.setItem(pwKey(slug), pw);
          setPassword(pw);
        }}
      />
    );
  }

  if (isError)
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="meta">Gallery not found.</p>
      </div>
    );

  const isDark = gallery.mood === 'DARK';

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${
        isDark ? 'bg-dark text-paper' : 'bg-paper text-ink'
      }`}
    >
      {/* Header */}
      <div className="px-6 pb-12 pt-32 md:px-12">
        <p className={`meta mb-4 ${isDark ? 'text-paper/50' : ''}`}>
          Contact sheet · {gallery.photos?.length ?? 0} frames
        </p>
        <h1 className="font-display text-[clamp(2.5rem,8vw,7rem)] font-light leading-[0.95] tracking-[-0.03em]">
          {gallery.title.split(' ').map((word, i, arr) => (
            <span
              key={i}
              className={`inline-block overflow-hidden align-bottom ${i < arr.length - 1 ? 'mr-[0.22em]' : ''}`}
            >
              <motion.span
                className="inline-block"
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: [0.77, 0, 0.175, 1] }}
              >
                {i === arr.length - 1 ? <em className="italic">{word}</em> : word}
              </motion.span>
            </span>
          ))}
        </h1>

        {gallery.description && (
          <motion.p
            className={`mt-6 max-w-md font-body text-sm font-light leading-relaxed ${
              isDark ? 'text-paper/60' : 'text-ink-soft'
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {gallery.description}
          </motion.p>
        )}
      </div>

      {/* Editorial grid */}
      <EditorialGrid photos={gallery.photos ?? []} onOpen={openLightbox} />

      {/* Footer nav */}
      <div className="px-6 pb-24 pt-8 md:px-12">
        <Link to="/galleries" className={`link-draw meta ${isDark ? 'text-paper/50' : ''}`}>
          ← All galleries
        </Link>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            photos={gallery.photos ?? []}
            currentIndex={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
            onNavigate={setLightboxIdx}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
