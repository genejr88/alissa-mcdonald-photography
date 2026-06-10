import { motion } from 'framer-motion';

const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeC8ZSlBbUbvDeiZlUeA2zwmeyJgJb3Ak5a-n2y-PZLwOZhAA/viewform?embedded=true';

export default function Contract() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      {/* Header */}
      <div className="pt-24 pb-10 px-6 md:px-16 max-w-3xl mx-auto">
        <motion.p
          className="text-xs tracking-widest uppercase mb-4"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono, monospace)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Alissa McDonald Photography — Client Agreement
        </motion.p>
        <motion.h1
          className="font-serif"
          style={{
            fontSize: 'clamp(2rem, 6vw, 4.5rem)',
            lineHeight: 1,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.77, 0, 0.175, 1] }}
        >
          Photography Contract
        </motion.h1>
        <motion.p
          className="mt-4 text-sm leading-relaxed max-w-lg"
          style={{ color: 'var(--ink-soft)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Please read through and complete all fields below. Your signature confirms that you've read and agree to the session agreement.
        </motion.p>
      </div>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6 md:px-16 mb-8">
        <div style={{ height: '1px', background: 'var(--ink)', opacity: 0.08 }} />
      </div>

      {/* Embedded form */}
      <motion.div
        className="max-w-3xl mx-auto px-0 md:px-8 pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <iframe
          src={FORM_URL}
          title="Photography Contract"
          width="100%"
          height="2200"
          frameBorder="0"
          marginHeight="0"
          marginWidth="0"
          style={{ display: 'block' }}
        >
          Loading…
        </iframe>
      </motion.div>
    </div>
  );
}
