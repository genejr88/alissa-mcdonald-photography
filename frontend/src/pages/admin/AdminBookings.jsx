import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetBookings, adminCreateBooking, adminUpdateBooking, adminCreateDepositLink, adminGetServices } from '../../lib/api';

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

function EditBookingForm({ booking, onClose, onSaved }) {
  const { data: services } = useQuery({ queryKey: ['admin-services'], queryFn: adminGetServices });

  const d = new Date(booking.startsAt);
  const pad = (n) => String(n).padStart(2, '0');

  const [f, setF] = useState({
    serviceId: booking.serviceId,
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    clientName: booking.clientName,
    clientEmail: booking.clientEmail,
    clientPhone: booking.clientPhone || '',
    notes: booking.notes || '',
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: () => adminUpdateBooking(booking.id, f),
    onSuccess: onSaved,
  });

  const valid = f.serviceId && f.date && f.time && f.clientName.trim() && f.clientEmail.includes('@');
  const input = 'w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white';
  const label = 'block text-xs uppercase tracking-wide opacity-40 mb-1';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Service *</label>
          <select className={input} value={f.serviceId} onChange={(e) => set('serviceId', e.target.value)}>
            {services?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div />
        <div>
          <label className={label}>Date *</label>
          <input type="date" className={input} value={f.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div>
          <label className={label}>Time *</label>
          <input type="time" className={input} value={f.time} onChange={(e) => set('time', e.target.value)} />
        </div>
        <div>
          <label className={label}>Client name *</label>
          <input className={input} value={f.clientName} onChange={(e) => set('clientName', e.target.value)} />
        </div>
        <div>
          <label className={label}>Client email *</label>
          <input type="email" className={input} value={f.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} />
        </div>
        <div>
          <label className={label}>Client phone</label>
          <input className={input} value={f.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} placeholder="Optional" />
        </div>
      </div>
      <div>
        <label className={label}>Client notes</label>
        <textarea className={`${input} resize-none`} rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional" />
      </div>
      {save.isError && (
        <p className="text-red-500 text-sm">{save.error?.response?.data?.error || 'Failed to save changes.'}</p>
      )}
      <div className="flex gap-3">
        <button
          disabled={!valid || save.isPending}
          onClick={() => save.mutate()}
          className="bg-black text-white px-5 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          {save.isPending ? 'Saving…' : 'Save Changes'}
        </button>
        <button onClick={onClose} className="border border-gray-200 px-5 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

function BookingRow({ booking, onUpdate }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(booking.adminNotes || '');
  const [copied, setCopied] = useState(false);

  const createLink = useMutation({
    mutationFn: () => adminCreateDepositLink(booking.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });

  const copyLink = async () => {
    await navigator.clipboard.writeText(booking.squarePaymentLinkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
      {open && editing && (
        <div className="border-t border-gray-100 p-5 bg-gray-50">
          <EditBookingForm
            booking={booking}
            onClose={() => setEditing(false)}
            onSaved={() => { setEditing(false); qc.invalidateQueries({ queryKey: ['admin-bookings'] }); }}
          />
        </div>
      )}
      {open && !editing && (
        <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="grid grid-cols-2 gap-4 text-sm flex-1">
              <div><span className="opacity-40 text-xs uppercase tracking-wide block mb-1">Email</span>{booking.clientEmail}</div>
              {booking.clientPhone && <div><span className="opacity-40 text-xs uppercase tracking-wide block mb-1">Phone</span>{booking.clientPhone}</div>}
              {booking.notes && <div className="col-span-2"><span className="opacity-40 text-xs uppercase tracking-wide block mb-1">Client notes</span>{booking.notes}</div>}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Edit
            </button>
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

            {/* Square deposit link */}
            {booking.service?.depositAmount && !booking.depositPaid && (
              booking.squarePaymentLinkUrl ? (
                <ActionButton
                  onClick={copyLink}
                  className="border border-gray-200 text-gray-500 hover:bg-gray-100"
                >
                  {copied ? 'Copied ✓' : 'Copy deposit link'}
                </ActionButton>
              ) : (
                <ActionButton
                  onClick={() => createLink.mutate()}
                  className="border border-gray-200 text-gray-500 hover:bg-gray-100"
                >
                  {createLink.isPending ? 'Creating…' : 'Create deposit link'}
                </ActionButton>
              )
            )}
            {createLink.isError && (
              <span className="text-xs text-red-500 self-center">{createLink.error?.response?.data?.error || 'Could not create link.'}</span>
            )}

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

const BLANK_BOOKING = {
  serviceId: '', date: '', time: '', clientName: '', clientEmail: '', clientPhone: '',
  notes: '', status: 'CONFIRMED', skipAvailabilityCheck: false, sendConfirmationEmail: true,
};

function NewBookingForm({ onClose, onCreated }) {
  const [f, setF] = useState(BLANK_BOOKING);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const { data: services } = useQuery({ queryKey: ['admin-services'], queryFn: adminGetServices });

  const create = useMutation({
    mutationFn: () => adminCreateBooking(f),
    onSuccess: onCreated,
  });

  const valid = f.serviceId && f.date && f.time && f.clientName.trim() && f.clientEmail.includes('@');
  const input = 'w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400';
  const label = 'block text-xs uppercase tracking-wide opacity-40 mb-1';

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5 mb-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Service *</label>
          <select className={input} value={f.serviceId} onChange={(e) => set('serviceId', e.target.value)}>
            <option value="">Select a service…</option>
            {services?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Status</label>
          <select className={input} value={f.status} onChange={(e) => set('status', e.target.value)}>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
        <div>
          <label className={label}>Date *</label>
          <input type="date" className={input} value={f.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div>
          <label className={label}>Time *</label>
          <input type="time" className={input} value={f.time} onChange={(e) => set('time', e.target.value)} />
        </div>
        <div>
          <label className={label}>Client name *</label>
          <input className={input} value={f.clientName} onChange={(e) => set('clientName', e.target.value)} />
        </div>
        <div>
          <label className={label}>Client email *</label>
          <input type="email" className={input} value={f.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} />
        </div>
        <div>
          <label className={label}>Client phone</label>
          <input className={input} value={f.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} placeholder="Optional" />
        </div>
      </div>
      <div>
        <label className={label}>Notes</label>
        <textarea className={`${input} resize-none`} rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={f.skipAvailabilityCheck} onChange={(e) => set('skipAvailabilityCheck', e.target.checked)} />
          Override availability check (book this time even if it conflicts)
        </label>
        {f.status === 'CONFIRMED' && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={f.sendConfirmationEmail} onChange={(e) => set('sendConfirmationEmail', e.target.checked)} />
            Email confirmation to client
          </label>
        )}
      </div>
      {create.isError && (
        <p className="text-red-500 text-sm">{create.error?.response?.data?.error || 'Failed to create booking.'}</p>
      )}
      <div className="flex gap-3 pt-1">
        <button
          disabled={!valid || create.isPending}
          onClick={() => create.mutate()}
          className="bg-black text-white px-5 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          {create.isPending ? 'Creating…' : 'Create Booking'}
        </button>
        <button onClick={onClose} className="border border-gray-200 px-5 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
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
  const [creating, setCreating] = useState(false);

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
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-40">{bookings?.length ?? 0} shown</span>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="bg-black text-white px-4 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-800 transition-colors"
            >
              + New Booking
            </button>
          )}
        </div>
      </div>

      {creating && (
        <NewBookingForm
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); qc.invalidateQueries({ queryKey: ['admin-bookings'] }); }}
        />
      )}

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
