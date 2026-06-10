import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Lightbox({ photos, currentIndex, onClose, onNavigate }) {
  const touchStartX = useRef(null);
  const photo = photos[currentIndex];

  const prev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  const next = useCallback(() => {
    if (currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, photos.length, onNavigate]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  // prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!photo) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.96)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (dx > 60) prev();
        else if (dx < -60) next();
      }}
    >
      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={photo.id}
          src={photo.url}
          alt={photo.alt || photo.caption || ''}
          className="max-h-[90vh] max-w-[90vw] object-contain"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.3, ease: [0.77, 0, 0.175, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{ viewTransitionName: 'lightbox-photo' }}
        />
      </AnimatePresence>

      {/* Film edge — sprocket holes along the top */}
      <div aria-hidden className="absolute inset-x-0 top-0 flex items-center justify-center gap-3 py-2.5 opacity-25">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="h-2 w-3 rounded-[2px] border border-white/60" />
        ))}
      </div>

      {/* Caption */}
      {photo.caption && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50"
          onClick={(e) => e.stopPropagation()}
        >
          {photo.caption}
        </div>
      )}

      {/* Frame counter — contact-sheet style */}
      <div className="absolute left-6 top-8 font-mono text-[11px] tracking-[0.2em] text-white/40">
        FR.{String(currentIndex + 1).padStart(2, '0')}
        <span className="text-white/20"> — {String(photos.length).padStart(2, '0')}</span>
      </div>

      {/* Close */}
      <button
        className="absolute top-5 right-6 text-white/40 hover:text-white text-2xl leading-none transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      {/* Prev */}
      {currentIndex > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-3xl leading-none transition-colors p-4"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      {/* Next */}
      {currentIndex < photos.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-3xl leading-none transition-colors p-4"
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Next"
        >
          ›
        </button>
      )}
    </motion.div>
  );
}
