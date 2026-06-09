import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

// Admin stays plain, fast, and dense — the polish budget is spent on the public site.
const adminNav = [
  { to: '/admin', label: 'Dashboard', end: true },
  // Phase 2+: Galleries, Services, Availability, Bookings, Contracts,
  // Testimonials, Inquiries, Settings
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
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="link-draw meta"
          >
            Sign out
          </button>
        </div>
      </header>
      <div className="flex">
        <aside className="w-48 shrink-0 border-r border-ink/10 p-4">
          <nav className="flex flex-col gap-2">
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
