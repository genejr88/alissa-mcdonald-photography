import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { submitInquiry } from '../lib/api';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: submitInquiry,
    onSuccess: () => setDone(true),
  });

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    mutation.mutate(form);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Header */}
      <div className="px-6 pb-12 pt-32 md:px-12">
        <p className="meta mb-4">№ 05 — Contact</p>
        <h1 className="font-display text-[clamp(2.5rem,7vw,6rem)] font-light leading-[0.95] tracking-[-0.03em]">
          Let&rsquo;s <em className="italic">talk</em>.
        </h1>
      </div>

      <div className="grid gap-16 px-6 pb-24 md:grid-cols-2 md:px-12">
        {/* Left — contact details */}
        <div>
          <p className="max-w-sm font-body text-base font-light leading-relaxed text-ink-soft">
            Have a question about sessions, pricing, or availability? Send a message and I&rsquo;ll
            get back to you within 48 hours.
          </p>

          <div className="mt-12 space-y-6">
            <div>
              <p className="meta mb-1">Instagram</p>
              <a
                href="https://www.instagram.com/alissamcdonald.photography_"
                target="_blank"
                rel="noreferrer"
                className="link-draw font-body text-sm"
              >
                @alissamcdonald.photography_
              </a>
            </div>
            <div>
              <p className="meta mb-1">Facebook</p>
              <a
                href="https://www.facebook.com/uncagedcreations.byAlissa"
                target="_blank"
                rel="noreferrer"
                className="link-draw font-body text-sm"
              >
                uncagedcreations.byAlissa
              </a>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div>
          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-12 text-center"
            >
              <p className="font-display text-3xl font-light">Message sent.</p>
              <p className="meta mt-3">I&rsquo;ll be in touch soon.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="meta mb-2 block">Your name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-ink/20 bg-transparent px-4 py-3 font-body text-sm outline-none transition focus:border-ink"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="meta mb-2 block">Email address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-ink/20 bg-transparent px-4 py-3 font-body text-sm outline-none transition focus:border-ink"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label className="meta mb-2 block">Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full border border-ink/20 bg-transparent px-4 py-3 font-body text-sm outline-none transition focus:border-ink"
                  placeholder="Tell me a little about what you have in mind…"
                />
              </div>

              {mutation.isError && (
                <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
              )}

              <button
                type="submit"
                disabled={mutation.isPending}
                className="border border-ink px-8 py-3 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
              >
                {mutation.isPending ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
