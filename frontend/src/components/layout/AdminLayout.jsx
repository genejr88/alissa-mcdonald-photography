import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../lib/auth';

const adminNav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/galleries', label: 'Galleries' },
  { to: '/admin/mail', label: 'Mail' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/availability', label: 'Availability' },
  { to: '/admin/contracts', label: 'Contracts' },
  { to: '/admin/testimonials', label: 'Testimonials' },
  { to: '/admin/inquiries', label: 'Inquiries' },
  { to: '/admin/guestbook', label: 'Guest Book' },
  { to: '/admin/users', label: 'Users' },
];

function MenuIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLink = (l, mobile) => (
    <NavLink
      key={l.to}
      to={l.to}
      end={l.end}
      onClick={mobile ? () => setMenuOpen(false) : undefined}
      className={({ isActive }) =>
        `rounded-sm px-3 ${mobile ? 'py-2.5 rounded-lg' : 'py-2'} text-sm ${isActive ? 'bg-ink text-paper' : 'hover:bg-ink/5'}`
      }
    >
      {l.label}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-paper-2">
      <header className="flex items-center justify-between border-b border-ink/10 bg-paper px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="-ml-1.5 rounded-lg p-1.5 text-ink md:hidden"
            aria-label="Toggle menu"
          >
            <MenuIcon open={menuOpen} />
          </button>
          <span className="font-display text-base md:text-lg">AMP — Studio Admin</span>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <span className="meta hidden sm:inline">{user?.name}</span>
          <button
            onClick={() => { logout(); navigate('/admin/login'); }}
            className="link-draw meta"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-48 shrink-0 border-r border-ink/10 p-4 md:block">
          <nav className="flex flex-col gap-1">
            {adminNav.map((l) => navLink(l, false))}
          </nav>
        </aside>

        {/* Mobile slide-in drawer */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-ink/40 md:hidden"
                onClick={() => setMenuOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-paper p-4 shadow-xl md:hidden"
              >
                <nav className="flex flex-col gap-1">
                  {adminNav.map((l) => navLink(l, true))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* min-w-0 lets flex children actually shrink/truncate instead of
            overflowing the viewport on narrow screens */}
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
