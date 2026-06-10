import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminGetBookings, adminGetInquiries, adminGetContracts } from '../../lib/api';

function StatCard({ label, value, to }) {
  return (
    <Link
      to={to}
      className="block rounded border border-ink/10 p-5 hover:border-ink/30 transition-colors"
    >
      <p className="text-xs uppercase tracking-widest text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-4xl font-light">{value ?? '—'}</p>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: bookings = [] } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => adminGetBookings({}) });
  const { data: inquiries = [] } = useQuery({ queryKey: ['admin-inquiries'], queryFn: adminGetInquiries });
  const { data: contracts = [] } = useQuery({ queryKey: ['admin-contracts'], queryFn: adminGetContracts });

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'PENDING' || b.status === 'CONFIRMED'
  );
  const unhandledInquiries = inquiries.filter((i) => !i.handled);
  const pendingSignatures = contracts.filter((c) => !c.signedAt && new Date(c.expiresAt) > new Date());

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Upcoming sessions" value={upcomingBookings.length} to="/admin/bookings" />
        <StatCard label="New inquiries" value={unhandledInquiries.length} to="/admin/inquiries" />
        <StatCard label="Awaiting signature" value={pendingSignatures.length} to="/admin/contracts" />
        <StatCard label="Total bookings" value={bookings.length} to="/admin/bookings" />
      </div>

      {/* Recent inquiries */}
      {unhandledInquiries.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium">Recent inquiries</p>
            <Link to="/admin/inquiries" className="text-xs text-ink-soft hover:text-ink">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {unhandledInquiries.slice(0, 5).map((inq) => (
              <div
                key={inq.id}
                className="flex items-start justify-between gap-4 rounded border border-ink/10 p-4"
              >
                <div>
                  <p className="text-sm font-medium">{inq.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">{inq.message}</p>
                </div>
                <span className="shrink-0 text-xs text-ink-soft">
                  {new Date(inq.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium">Upcoming sessions</p>
            <Link to="/admin/bookings" className="text-xs text-ink-soft hover:text-ink">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingBookings.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded border border-ink/10 p-4"
              >
                <div>
                  <p className="text-sm font-medium">{b.clientName}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {b.service?.name} · {new Date(b.startsAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    b.status === 'CONFIRMED'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
