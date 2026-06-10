import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

const adminNav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/galleries', label: 'Galleries' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/availability', label: 'Availability' },
  { to: '/admin/contracts', label: 'Contracts' },
  { to: '/admin/testimonials', label: 'Testimonials' },
  { to: '/admin/inquiries', label: 'Inquiries' },
  { to: '/admin/guestbook', label: 'Guest Book' },
  { to: '/admin/users', label: 'Users' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper-2">
      <header className="flex items-center justify-between border-b border-ink/10 bg-paper px-6 py-3">
        <span className="font-display text-lg">AMP — Studio Admin</span>
        <div className="flex items-center gap-4">
          <span className="meta">{user?.name}</span>
          <button
            onClick={() => { logout(); navigate('/admin/login'); }}
            className="link-draw meta"
          >
            Sign out
          </button>
        </div>
      </header>
      <div className="flex">
        <aside className="w-48 shrink-0 border-r border-ink/10 p-4">
          <nav className="flex flex-col gap-1">
            {adminNav.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-sm px-3 py-2 text-sm ${isActive ? 'bg-ink text-paper' : 'hover:bg-ink/5'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
