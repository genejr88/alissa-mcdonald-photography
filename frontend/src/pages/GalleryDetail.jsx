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
  if (isError) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
      <p className="opacity-40 text-sm tracking-widest uppercase">Gallery not found.</p>
    </div>
  );

  const isDark = gallery.mood === 'DARK';

  return (
    <div
      className="min-h-screen transition-colors duration-700"
      style={{ background: isDark ? 'var(--ink)' : 'var(--paper)', color: isDark ? 'var(--paper)' : 'var(--ink)' }}
    >
      {/* Hero / Title area */}
      <div className="relative pt-20 pb-8 px-8 md:px-16 overflow-hidden">
        <motion.h1
          className="font-serif uppercase relative z-10"
          style={{
            fontSize: 'clamp(3rem, 12vw, 11rem)',
            lineHeight: 0.9,
            mixBlendMode: 'difference',
            color: 'white',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1] }}
        >
          {gallery.title.split('').map((char, i) => (
            <motion.span
              key={i}
              style={{ display: 'inline-block', overflow: 'hidden' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.025, ease: [0.77, 0, 0.175, 1] }}
            >
              {char === ' ' ? ' ' : char}
            </motion.span>
          ))}
        </motion.h1>

        {gallery.description && (
          <motion.p
            className="mt-6 text-sm tracking-widest uppercase opacity-40 max-w-md"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.4, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {gallery.description}
          </motion.p>
        )}
      </div>

      {/* Editorial grid */}
      <EditorialGrid photos={gallery.photos ?? []} onOpen={openLightbox} />

      {/* Footer nav */}
      <div className="px-8 md:px-16 pb-24 pt-8">
        <Link
          to="/galleries"
          className="text-xs tracking-widest uppercase opacity-40 hover:opacity-80 transition-opacity"
        >
          ← All Galleries
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
