import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { getGallery } from '../lib/api';
import EditorialGrid from '../components/EditorialGrid';
import Lightbox from '../components/Lightbox';

export default function GalleryDetail() {
  const { slug } = useParams();
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const { data: gallery, isLoading, isError } = useQuery({
    queryKey: ['gallery', slug],
    queryFn: () => getGallery(slug),
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
