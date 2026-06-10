import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LOGO_DARK, LOGO_WHITE } from '../../lib/branding';

const navLinks = [
  { to: '/galleries', label: 'Galleries' },
  { to: '/experience', label: 'The Experience' },
  { to: '/kind-words', label: 'Kind Words' },
  { to: '/about', label: 'About' },
  { to: '/book', label: 'Book a Session' },
];

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Film grain — the analog texture layer over everything */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[90] opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
        <nav className="flex items-center justify-between px-6 py-5 md:px-12">
          <Link to="/" className="block">
            <img
              src={LOGO_WHITE}
              alt="Alissa McDonald Photography"
              className="h-9 w-auto md:h-10"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-baseline gap-8 md:flex">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className="link-draw font-mono text-[11px] uppercase tracking-[0.18em] text-white"
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex flex-col gap-1.5 p-1 md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <motion.span
              className="block h-px w-6 bg-white"
              animate={menuOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.span
              className="block h-px w-6 bg-white"
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.15 }}
            />
            <motion.span
              className="block h-px w-6 bg-white"
              animate={menuOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
            />
          </button>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-dark/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-dark px-8 py-16 md:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: [0.77, 0, 0.175, 1] }}
            >
              <img
                src={LOGO_WHITE}
                alt="Alissa McDonald Photography"
                className="mb-10 h-12 w-auto self-start opacity-90"
              />
              <nav className="flex flex-col gap-6">
                {navLinks.map((l, i) => (
                  <motion.div
                    key={l.to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 * i, duration: 0.3 }}
                  >
                    <NavLink
                      to={l.to}
                      className={({ isActive }) =>
                        `font-display text-2xl font-light text-paper transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`
                      }
                    >
                      {l.label}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto flex gap-6">
                <a
                  href="https://www.instagram.com/alissamcdonald.photography_"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] uppercase tracking-widest text-paper/50 hover:text-paper/80"
                >
                  Instagram
                </a>
                <a
                  href="https://www.facebook.com/uncagedcreations.byAlissa"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] uppercase tracking-widest text-paper/50 hover:text-paper/80"
                >
                  Facebook
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="px-6 pb-10 pt-24 md:px-12">
        <div className="flex flex-col gap-6 border-t border-ink/10 pt-8 md:flex-row md:items-end md:justify-between">
          <div>
            <img
              src={LOGO_DARK}
              alt="Alissa McDonald Photography"
              className="h-14 w-auto"
            />
            <p className="meta mt-2">Moments that feel like you</p>
          </div>
          <div className="flex gap-8">
            <a
              href="https://www.instagram.com/alissamcdonald.photography_"
              target="_blank"
              rel="noreferrer"
              className="link-draw meta"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/uncagedcreations.byAlissa"
              target="_blank"
              rel="noreferrer"
              className="link-draw meta"
            >
              Facebook
            </a>
            <Link to="/contact" className="link-draw meta">
              Contact
            </Link>
          </div>
          <p className="meta">© {new Date().getFullYear()} Alissa McDonald Photography</p>
        </div>
      </footer>
    </div>
  );
}
