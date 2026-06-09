import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Phase 1 placeholder hero — phase 2 replaces the background with her
// featured photograph and the scroll-settle effect (see BLUEPRINT.md §9).
const lineReveal = {
  hidden: { y: '110%' },
  visible: (i) => ({
    y: 0,
    transition: { duration: 0.9, ease: [0.77, 0, 0.175, 1], delay: 0.15 * i },
  }),
};

export default function Home() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <section className="relative flex h-screen flex-col justify-end bg-dark px-6 pb-16 md:px-12">
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
        <div className="mt-10 flex items-end justify-between">
          <p className="max-w-md font-body text-sm font-light leading-relaxed text-paper/70">
            Natural-light photography for families, couples, maternity, seniors, and the
            milestones in between.
          </p>
          <span className="meta hidden text-paper/60 md:block">( scroll )</span>
        </div>
      </section>

      <section className="px-6 py-32 md:px-12">
        <p className="meta mb-6">№ 00 — Phase one</p>
        <p className="max-w-xl font-display text-2xl font-light leading-snug">
          The galleries, booking, and signing experiences are built in the next phases.
        </p>
        <Link to="/book" className="link-draw meta mt-10 inline-block">
          Book a session →
        </Link>
      </section>
    </motion.div>
  );
}
