import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGallery } from '../lib/api';
import RevealImage from '../components/RevealImage';

const steps = [
  {
    n: '01',
    title: 'Reach out',
    body: 'Fill out the booking form with your session type, preferred dates, and a little about what you have in mind. I\'ll get back to you within 48 hours.',
  },
  {
    n: '02',
    title: 'We plan together',
    body: 'Once we lock in a date, I\'ll send over everything you need — location ideas, what to wear, how to prep the kids (or the dog). Nothing is left to guess.',
  },
  {
    n: '03',
    title: 'Your session',
    body: 'Sessions are relaxed and low-pressure. We wander, we talk, and I make pictures while you just exist. Most sessions run 60–90 minutes.',
  },
  {
    n: '04',
    title: 'Your gallery',
    body: 'Your fully edited gallery arrives within 2–3 weeks, delivered through a private online gallery. Print-ready, high-resolution, and all yours.',
  },
];

const faqs = [
  {
    q: 'What should we wear?',
    a: 'Coordinating, not matching. Reach for neutrals, earth tones, and textures. Avoid busy patterns or logos. I\'ll send a full style guide after booking.',
  },
  {
    q: 'What if it rains?',
    a: 'Light rain can be beautiful — we roll with it. For heavy rain, we reschedule at no charge. I\'ll always communicate early so you have time to plan.',
  },
  {
    q: 'How many photos do I get?',
    a: 'It depends on the session, but most galleries include 60–100 fully edited images. You\'ll see the count in the service details when you book.',
  },
  {
    q: 'Do you travel for sessions?',
    a: 'Yes — I love to travel. A travel fee applies for sessions more than 30 miles out. Reach out and we\'ll figure out the details together.',
  },
  {
    q: 'When do I pay the deposit?',
    a: 'A deposit is due at booking to hold your date. The remaining balance is due the week of your session. Payment details are included in your contract.',
  },
  {
    q: 'Can I print from my gallery?',
    a: 'Absolutely. All images are delivered at full resolution and print-ready. I also offer print ordering through the gallery — archival quality, delivered to your door.',
  },
];

export default function Experience() {
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
        <p className="meta mb-4">№ 02 — The experience</p>
        <h1 className="max-w-2xl font-display text-[clamp(2.5rem,7vw,6rem)] font-light leading-[0.95] tracking-[-0.03em]">
          Here&rsquo;s what to <em className="italic">expect</em>.
        </h1>
      </div>

      {/* Steps */}
      <section className="px-6 pb-24 md:px-12">
        <div className="grid gap-0 divide-y divide-ink/10">
          {steps.map((step, i) => (
            <div
              key={step.n}
              className="group grid grid-cols-[3rem_1fr] gap-8 py-10 transition-colors duration-300 hover:bg-ink/[0.02] md:grid-cols-[6rem_1fr_1fr]"
            >
              <p className="pt-1 font-serif text-2xl opacity-25 transition-opacity duration-300 group-hover:opacity-60">
                {step.n}
              </p>
              <h3 className="font-display text-2xl font-light md:text-3xl">
                {step.title}
                {step.n === '03' && (
                  <span className="ml-4 inline-block align-middle font-hand text-xl" style={{ color: '#B3402E', rotate: '-2deg' }}>
                    the fun part!
                  </span>
                )}
              </h3>
              <p className="col-start-2 mt-2 font-body text-sm font-light leading-relaxed text-ink-soft md:col-start-3 md:mt-0">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Photo pair */}
      {photos.length >= 2 && (
        <section className="grid grid-cols-2 gap-2 px-6 pb-24 md:px-12">
          <RevealImage
            src={photos[4]?.url ?? photos[0].url}
            alt=""
            className="w-full object-cover"
            style={{ aspectRatio: '2/3' }}
          />
          <RevealImage
            src={photos[5]?.url ?? photos[1].url}
            alt=""
            className="w-full object-cover"
            style={{ aspectRatio: '2/3' }}
          />
        </section>
      )}

      {/* FAQ */}
      <section className="border-t border-ink/10 px-6 py-24 md:px-12">
        <p className="meta mb-12">Common questions</p>
        <div className="grid gap-8 md:grid-cols-2 md:gap-x-16 md:gap-y-10">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <h4 className="font-display text-lg font-light">{faq.q}</h4>
              <p className="mt-2 font-body text-sm font-light leading-relaxed text-ink-soft">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-ink/10 px-6 py-24 text-center md:px-12">
        <h2 className="font-display text-4xl font-light">
          Sounds good? Let&rsquo;s <em className="italic">do it</em>.
        </h2>
        <div className="mt-8 flex justify-center gap-8">
          <Link
            to="/book"
            className="inline-block border border-ink px-8 py-3 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-ink hover:text-paper"
          >
            Book a session
          </Link>
          <Link to="/contact" className="link-draw meta self-center">
            Ask a question →
          </Link>
        </div>
      </section>
    </motion.div>
  );
}
