import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getGallery } from '../lib/api';
import RevealImage from '../components/RevealImage';

const lineReveal = {
  hidden: { y: '110%' },
  visible: (i) => ({
    y: 0,
    transition: { duration: 0.9, ease: [0.77, 0, 0.175, 1], delay: 0.1 + 0.15 * i },
  }),
};

function HeroPhoto({ url }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.img
        src={url}
        alt="Alissa McDonald Photography"
        className="h-full w-full object-cover"
        style={{ scale }}
      />
      <motion.div
        className="absolute inset-0 bg-dark/40"
        style={{ opacity: useTransform(scrollYProgress, [0, 1], [0.4, 0.7]) }}
      />
    </div>
  );
}

export default function Home() {
  const { data: gallery } = useQuery({
    queryKey: ['gallery', 'selected-works'],
    queryFn: () => getGallery('selected-works'),
  });

  const photos = gallery?.photos ?? [];
  const heroPhoto = photos[0];
  const featurePhotos = photos.slice(1, 7);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Hero */}
      <section className="relative flex h-screen flex-col justify-end overflow-hidden">
        {heroPhoto ? (
          <HeroPhoto url={heroPhoto.url} />
        ) : (
          <div className="absolute inset-0 bg-dark" />
        )}

        <div className="relative z-10 px-6 pb-16 md:px-12">
          <h1 className="font-display font-light leading-[0.95] tracking-[-0.03em] text-paper">
            {['Moments that', 'feel like you.'].map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  className="block text-[clamp(3rem,11vw,9.5rem)]"
                  variants={lineReveal}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  {i === 1 ? (
                    <>
                      feel like <em className="italic">you</em>.
                    </>
                  ) : (
                    line
                  )}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div
            className="mt-10 flex items-end justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <p className="max-w-md font-body text-sm font-light leading-relaxed text-paper/70">
              Natural-light photography for families, couples, maternity, seniors, and the
              milestones in between.
            </p>
            <span className="hidden flex-col items-center gap-2 md:flex">
              <span className="meta text-paper/60">scroll</span>
              <span className="relative h-12 w-px overflow-hidden bg-paper/20">
                <motion.span
                  className="absolute inset-x-0 top-0 h-1/2 bg-paper/80"
                  animate={{ y: ['-100%', '200%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              </span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Session-type marquee — quiet editorial ticker */}
      <div className="overflow-hidden border-b border-ink/10 py-3 opacity-60" aria-hidden>
        <div className="marquee-track">
          {[0, 1].map((dup) => (
            <span key={dup} className="meta inline-flex items-center gap-10 pr-10 text-[11px]">
              {['Families', 'Couples', 'Maternity', 'Seniors', 'Milestones'].map((word) => (
                <span key={word} className="inline-flex items-center gap-10">
                  {word} <span className="opacity-40">·</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Selected work — staggered reveal grid */}
      {featurePhotos.length > 0 && (
        <section className="px-6 py-24 md:px-12">
          <div className="mb-12 flex items-end justify-between">
            <p className="meta">Selected work</p>
            <Link to="/galleries" className="link-draw meta">
              View all galleries →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
            {featurePhotos.map((photo, i) => (
              <RevealImage
                key={photo.id}
                src={photo.url}
                alt={photo.alt || ''}
                className="w-full object-cover"
                style={{
                  aspectRatio: photo.height > photo.width ? '2/3' : '3/2',
                }}
                priority={i < 2}
              />
            ))}
          </div>
        </section>
      )}

      {/* Intro statement */}
      <section className="border-t border-ink/10 px-6 py-24 md:px-12">
        <div className="relative max-w-3xl">
          <p className="meta mb-6">№ 01 — The work</p>
          <p className="font-display text-3xl font-light leading-snug md:text-5xl">
            Real, unscripted moments that look and{' '}
            <em className="italic">feel exactly like you</em>.
          </p>
          <p className="mt-8 max-w-xl font-body text-base font-light leading-relaxed text-ink-soft">
            I photograph families, couples, maternity, seniors, and the small milestones that
            deserve to be remembered. No stiff posing — just light, connection, and the way you
            actually are with each other.
          </p>
          <div className="mt-10 flex gap-8">
            <Link to="/galleries" className="link-draw meta">
              See the galleries →
            </Link>
            <Link to="/experience" className="link-draw meta">
              How it works →
            </Link>
          </div>
        </div>
      </section>

      {/* Tall hero photo strip */}
      {photos[7] && (
        <section className="relative h-[70vh] overflow-hidden">
          <RevealImage
            src={photos[7].url}
            alt=""
            className="h-full w-full object-cover"
            style={{ aspectRatio: 'unset' }}
          />
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-28 text-center md:px-12">
        <p className="meta mb-4">Ready when you are</p>
        <h2 className="font-display text-4xl font-light leading-tight md:text-6xl">
          Let&rsquo;s make something{' '}
          <em className="italic">beautiful</em>.
        </h2>
        <Link
          to="/book"
          className="mt-10 inline-block border border-ink px-8 py-3 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-ink hover:text-paper"
        >
          Book a session
        </Link>
      </section>
    </motion.div>
  );
}
