import { Outlet, NavLink, Link } from 'react-router-dom';

const navLinks = [
  { to: '/galleries', label: 'Galleries' },
  { to: '/experience', label: 'The Experience' },
  { to: '/kind-words', label: 'Kind Words' },
  { to: '/about', label: 'About' },
  { to: '/book', label: 'Book a Session' },
];

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
        <nav className="flex items-baseline justify-between px-6 py-5 md:px-12">
          <Link to="/" className="font-display text-lg tracking-tight text-white">
            Alissa McDonald
          </Link>
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
          {/* Mobile menu — phase 5 polish */}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="px-6 pb-10 pt-24 md:px-12">
        <div className="flex flex-col gap-6 border-t border-ink/10 pt-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-2xl">Alissa McDonald</p>
            <p className="meta mt-1">Moments that feel like you</p>
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
          </div>
          <p className="meta">© {new Date().getFullYear()} Alissa McDonald Photography</p>
        </div>
      </footer>
    </div>
  );
}
