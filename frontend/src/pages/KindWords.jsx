import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTestimonials, getGallery } from '../lib/api';
import RevealImage from '../components/RevealImage';
import { HAND_PERFECT } from '../lib/branding';

export default function KindWords() {
  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials'],
    queryFn: getTestimonials,
  });
  const { data: gallery } = useQuery({
    queryKey: ['gallery', 'selected-works'],
    queryFn: () => getGallery('selected-works'),
  });

  const photos = gallery?.photos ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Header */}
      <div className="px-6 pb-12 pt-32 md:px-12">
        <p className="meta mb-4">№ 03 — Kind words</p>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <h1 className="font-display text-[clamp(2.5rem,8vw,7rem)] font-light leading-[0.95] tracking-[-0.03em]">
            What clients <em className="italic">say</em>.
          </h1>
          {/* "Perfect !" — her own handwriting, like a note on the margin */}
          <motion.img
            src={HAND_PERFECT}
            alt="Perfect!"
            className="mb-2 h-10 w-auto md:h-12"
            style={{ transform: 'rotate(-4deg)' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.75, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          />
        </div>
      </div>

      {/* Testimonials */}
      {testimonials.length === 0 ? (
        <section className="px-6 pb-24 md:px-12">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Placeholder cards when no testimonials exist yet */}
            {[
              {
                pullQuote: 'She made us feel so comfortable — the photos are everything we hoped for.',
                attribution: 'The Johnson Family',
              },
              {
                pullQuote: "I've never loved photos of myself until Alissa took them.",
                attribution: 'Sara M.',
              },
              {
                pullQuote: 'Worth every penny. We cried when we saw the gallery.',
                attribution: 'The Williams Family',
              },
              {
                pullQuote: 'She captured our family perfectly. We\'ll be back every year.',
                attribution: 'The Martinez Family',
              },
            ].map((t, i) => (
              <TestimonialCard key={i} testimonial={t} photo={photos[i + 2]} />
            ))}
          </div>
        </section>
      ) : (
        <section className="px-6 pb-24 md:px-12">
          <div className="grid gap-8 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.id} testimonial={t} photo={t.photo ?? photos[i + 2]} />
            ))}
          </div>
        </section>
      )}

      {/* Full-bleed photo */}
      {photos[6] && (
        <div className="relative h-[60vh] overflow-hidden">
          <RevealImage
            src={photos[6].url}
            alt=""
            className="h-full w-full object-cover"
            style={{ aspectRatio: 'unset' }}
          />
        </div>
      )}

      {/* CTA */}
      <section className="px-6 py-24 text-center md:px-12">
        <h2 className="font-display text-4xl font-light">
          Ready to add your <em className="italic">story</em>?
        </h2>
        <Link
          to="/book"
          className="mt-8 inline-block border border-ink px-8 py-3 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-ink hover:text-paper"
        >
          Book a session
        </Link>
        <p className="mt-10">
          <Link
            to="/guest-book"
            className="font-hand text-2xl text-ink-soft transition-colors hover:text-ink"
            style={{ display: 'inline-block', transform: 'rotate(-1.5deg)' }}
          >
            …or just leave a little note in the guest book →
          </Link>
        </p>
      </section>
    </motion.div>
  );
}

function TestimonialCard({ testimonial, photo }) {
  return (
    <motion.div
      className="flex flex-col gap-6 border border-ink/10 p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.77, 0, 0.175, 1] }}
    >
      {photo && (
        <img
          src={photo.url}
          alt=""
          className="h-48 w-full object-cover"
        />
      )}
      <blockquote>
        <p className="font-display text-xl font-light leading-snug">
          &ldquo;{testimonial.pullQuote}&rdquo;
        </p>
        {testimonial.quote && testimonial.quote !== testimonial.pullQuote && (
          <p className="mt-3 font-body text-sm font-light leading-relaxed text-ink-soft">
            {testimonial.quote}
          </p>
        )}
        <footer className="meta mt-4">&mdash; {testimonial.attribution}</footer>
      </blockquote>
    </motion.div>
  );
}
