import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGallery, getPublicSettings } from '../lib/api';
import RevealImage from '../components/RevealImage';
import { SIGNATURE } from '../lib/branding';

export default function About() {
  const { data: gallery } = useQuery({
    queryKey: ['gallery', 'selected-works'],
    queryFn: () => getGallery('selected-works'),
  });
  const { data: settings } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: getPublicSettings,
  });

  const photos = gallery?.photos ?? [];
  const portraitPhoto = photos[3] ?? photos[0];
  const secondPhoto = photos[8] ?? photos[1];

  const aboutText =
    settings?.aboutText ||
    `I'm Alissa — a natural-light photographer with a thing for in-between moments. The laugh that catches you off guard. The way a kid reaches for their parent's hand without thinking. The glance across the room that says everything without a word.

I started this work because I believe photographs should feel like *you* — not a version of you that spent an hour getting posed. My sessions are relaxed, low-pressure, and honestly kind of fun. We wander, we talk, and somewhere along the way I make pictures.

I'm based out of the Midwest and travel for sessions — reach out and let's figure it out together.`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Page header */}
      <div className="px-6 pb-12 pt-32 md:px-12">
        <p className="meta mb-4">№ 04 — About</p>
        <h1 className="font-display text-[clamp(3rem,8vw,7rem)] font-light leading-[0.95] tracking-[-0.03em]">
          Hi, I&rsquo;m <em className="italic">Alissa</em>.
        </h1>
      </div>

      {/* Two-column — text + portrait */}
      <div className="grid gap-12 px-6 pb-24 md:grid-cols-2 md:gap-16 md:px-12">
        <div className="order-2 md:order-1">
          <div className="space-y-5 font-body text-base font-light leading-relaxed text-ink-soft max-w-lg">
            {aboutText.split('\n\n').map((para, i) => (
              <p key={i}>
                {para.replace(/\*([^*]+)\*/g, '$1')}
              </p>
            ))}
          </div>

          {/* Her real signature */}
          <motion.img
            src={SIGNATURE}
            alt="Alissa"
            className="mt-10 h-16 w-auto md:h-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />

          <div className="mt-12 flex gap-8">
            <Link to="/experience" className="link-draw meta">
              How sessions work →
            </Link>
            <Link to="/book" className="link-draw meta">
              Book with me →
            </Link>
          </div>
        </div>

        <div className="order-1 md:order-2">
          {portraitPhoto && (
            <RevealImage
              src={portraitPhoto.url}
              alt="Alissa McDonald"
              className="w-full object-cover"
              style={{ aspectRatio: '3/4', maxHeight: '75vh' }}
            />
          )}
        </div>
      </div>

      {/* Full-bleed photo strip */}
      {secondPhoto && (
        <div className="relative h-[60vh] overflow-hidden">
          <RevealImage
            src={secondPhoto.url}
            alt=""
            className="h-full w-full object-cover"
            style={{ aspectRatio: 'unset' }}
          />
        </div>
      )}

      {/* Values */}
      <section className="px-6 py-24 md:px-12">
        <div className="grid gap-12 md:grid-cols-3">
          {[
            {
              n: '01',
              title: 'Natural light, always',
              body: 'No strobes, no studio setups — just open shade, golden hour, and the light that already exists in your life.',
            },
            {
              n: '02',
              title: 'Low pressure, high feeling',
              body: "Sessions are relaxed by design. The less you're thinking about posing, the more real the photos look.",
            },
            {
              n: '03',
              title: 'Delivered with care',
              body: 'Your gallery arrives fully edited, color-corrected, and ready to print — usually within two to three weeks.',
            },
          ].map((v) => (
            <div key={v.n}>
              <p className="meta mb-3">{v.n}</p>
              <h3 className="font-display text-xl font-light">{v.title}</h3>
              <p className="mt-3 font-body text-sm font-light leading-relaxed text-ink-soft">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
