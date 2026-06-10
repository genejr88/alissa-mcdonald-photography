import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetBookings, adminUpdateBooking } from '../../lib/api';

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const STATUS_COLORS = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-500 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-500 border-red-200',
};

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function BookingRow({ booking, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(booking.adminNotes || '');

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium text-sm">{booking.clientName}</span>
            <span className="text-xs opacity-40">{booking.service?.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[booking.status]}`}>
              {booking.status.toLowerCase()}
            </span>
            {booking.depositPaid && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                deposit paid
              </span>
            )}
          </div>
          <p className="text-xs opacity-40 mt-1" style={{ fontFamily: 'monospace' }}>
            {formatDate(booking.startsAt)}
          </p>
        </div>
        <span className="text-gray-300 text-sm">{open ? '▲' : '▼'}</span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="opacity-40 text-xs uppercase tracking-wide block mb-1">Email</span>{booking.clientEmail}</div>
            {booking.clientPhone && <div><span className="opacity-40 text-xs uppercase tracking-wide block mb-1">Phone</span>{booking.clientPhone}</div>}
            {booking.notes && <div className="col-span-2"><span className="opacity-40 text-xs uppercase tracking-wide block mb-1">Client notes</span>{booking.notes}</div>}
          </div>

          {/* Admin notes */}
          <div>
            <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">Admin notes</label>
            <textarea
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => { if (notes !== booking.adminNotes) onUpdate({ adminNotes: notes }); }}
            />
          </div>

          {/* Actions row */}
          <div className="flex flex-wrap gap-3">
            {/* Status buttons */}
            {booking.status === 'PENDING' && (
              <>
                <ActionButton
                  onClick={() => onUpdate({ status: 'CONFIRMED' })}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Confirm →
                </ActionButton>
                <ActionButton
                  onClick={() => { if (confirm('Cancel this booking?')) onUpdate({ status: 'CANCELLED' }); }}
                  className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                >
                  Cancel
                </ActionButton>
              </>
            )}
            {booking.status === 'CONFIRMED' && (
              <>
                <ActionButton
                  onClick={() => onUpdate({ status: 'COMPLETED' })}
                  className="bg-gray-800 text-white hover:bg-gray-900"
                >
                  Mark completed
                </ActionButton>
                <ActionButton
                  onClick={() => { if (confirm('Cancel this booking?')) onUpdate({ status: 'CANCELLED' }); }}
                  className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                >
                  Cancel
                </ActionButton>
              </>
            )}

            {/* Deposit toggle */}
            <ActionButton
              onClick={() => onUpdate({ depositPaid: !booking.depositPaid })}
              className={booking.depositPaid
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'border border-gray-200 text-gray-500 hover:bg-gray-100'
              }
            >
              {booking.depositPaid ? '✓ Deposit paid' : 'Mark deposit paid'}
            </ActionButton>

            {/* Contract link */}
            <a
              href="/contract"
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Share contract ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ children, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export default function AdminBookings() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('upcoming');

  const params = filter === 'upcoming'
    ? { upcoming: 'true' }
    : filter === 'all' ? {} : { status: filter };

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings', filter],
    queryFn: () => adminGetBookings(params),
    refetchInterval: 60000,
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => adminUpdateBooking(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">Bookings</h1>
        <span className="text-sm opacity-40">{bookings?.length ?? 0} shown</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[['upcoming', 'Upcoming'], ['all', 'All'], ['PENDING', 'Pending'], ['CONFIRMED', 'Confirmed'], ['COMPLETED', 'Completed'], ['CANCELLED', 'Cancelled']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`text-xs px-3 py-1.5 rounded transition-colors ${filter === v ? 'bg-black text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {isLoading && <p className="opacity-40 text-sm">Loading…</p>}

      {!isLoading && !bookings?.length && (
        <div className="text-center py-24 opacity-30">
          <p className="text-sm tracking-widest uppercase">No bookings found.</p>
        </div>
      )}

      <div className="space-y-3">
        {bookings?.map((b) => (
          <BookingRow
            key={b.id}
            booking={b}
            onUpdate={(data) => update.mutate({ id: b.id, data })}
          />
        ))}
      </div>
    </div>
  );
}
