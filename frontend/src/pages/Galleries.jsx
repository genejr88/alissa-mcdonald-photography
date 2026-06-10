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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-paper"
    >
      {/* Header — matches the house editorial style */}
      <div className="px-6 pb-12 pt-32 md:px-12">
        <p className="meta mb-4">№ 01 — Galleries</p>
        <h1 className="font-display text-[clamp(2.5rem,8vw,7rem)] font-light leading-[0.95] tracking-[-0.03em]">
          The <em className="italic">galleries</em>.
        </h1>
      </div>

      {/* Gallery grid */}
      <div className="px-6 pb-24 md:px-12">
        {!galleries?.length && <p className="meta">No galleries yet.</p>}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
          {galleries?.map((gallery, i) => {
            const cover = gallery.photos?.[0];
            return (
              <Link
                key={gallery.id}
                to={`/galleries/${gallery.slug}`}
                className="group relative block overflow-hidden"
              >
                <RevealImage
                  src={cover?.url || 'https://via.placeholder.com/800x600?text='}
                  alt={gallery.title}
                  className="w-full"
                  style={{ aspectRatio: '4/3' }}
                  priority={i < 2}
                />
                {/* Title overlay */}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent p-6 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div>
                    <p className="font-display text-xl font-light text-white md:text-2xl">
                      {gallery.title}
                    </p>
                    {gallery.description && (
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
                        {gallery.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Photo count on hover */}
                <div className="absolute left-4 top-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-60">
                    {gallery._count?.photos ?? gallery.photos?.length ?? 0} photos
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
