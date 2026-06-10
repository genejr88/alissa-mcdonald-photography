import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getGalleries } from '../lib/api';
import RevealImage from '../components/RevealImage';

export default function Galleries() {
  const { data: galleries, isLoading } = useQuery({
    queryKey: ['galleries'],
    queryFn: getGalleries,
  });

  if (isLoading) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      {/* Header */}
      <div className="pt-24 pb-12 px-8 md:px-16">
        <motion.h1
          className="font-serif uppercase tracking-widest"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 7rem)',
            lineHeight: 1,
            color: 'var(--ink)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.77, 0, 0.175, 1] }}
        >
          Galleries
        </motion.h1>
      </div>

      {/* Gallery grid */}
      <div className="px-4 md:px-8 pb-24">
        {!galleries?.length && (
          <p className="opacity-40 text-sm tracking-widest uppercase">No galleries yet.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          {galleries?.map((gallery, i) => {
            const cover = gallery.photos?.[0];
            return (
              <Link key={gallery.id} to={`/galleries/${gallery.slug}`} className="group block relative overflow-hidden">
                <RevealImage
                  src={cover?.url || 'https://via.placeholder.com/800x600?text='}
                  alt={gallery.title}
                  className="w-full"
                  style={{ aspectRatio: '4/3' }}
                  priority={i < 2}
                />
                {/* Title overlay */}
                <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div>
                    <p className="text-white font-serif text-xl md:text-2xl tracking-wide">{gallery.title}</p>
                    {gallery.description && (
                      <p className="text-white/60 text-xs tracking-widest uppercase mt-1">{gallery.description}</p>
                    )}
                  </div>
                </div>

                {/* Always-visible mood badge */}
                <div className="absolute top-4 left-4">
                  <span className="text-xs tracking-widest uppercase opacity-0 group-hover:opacity-60 text-white transition-opacity duration-300">
                    {gallery._count?.photos ?? gallery.photos?.length ?? 0} photos
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
