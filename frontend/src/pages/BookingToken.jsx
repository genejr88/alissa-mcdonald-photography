import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getBookingByToken, cancelBookingByToken } from '../lib/api';

const STATUS_LABELS = {
  PENDING: 'Pending confirmation',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS = {
  PENDING: '#8A7C2E',
  CONFIRMED: '#2E7C4A',
  COMPLETED: '#6B655A',
  CANCELLED: '#C0392B',
};

function formatDate(isoString) {
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function BookingToken() {
  const { token } = useParams();
  const [cancelled, setCancelled] = useState(false);

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking-token', token],
    queryFn: () => getBookingByToken(token),
  });

  const cancel = useMutation({
    mutationFn: () => cancelBookingByToken(token),
    onSuccess: () => setCancelled(true),
  });

  if (isLoading) return null;
  if (isError) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
      <p className="opacity-40 text-sm tracking-widest uppercase">Booking not found.</p>
    </div>
  );

  const status = cancelled ? 'CANCELLED' : booking.status;

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <div className="max-w-xl mx-auto px-6 pt-24 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs tracking-widest uppercase opacity-40 mb-6" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
            Your session
          </p>
          <h1 className="font-serif mb-8" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', lineHeight: 1 }}>
            Booking Details
          </h1>

          {/* Status */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: STATUS_COLORS[status] }}
            />
            <span className="text-sm tracking-widest uppercase" style={{ color: STATUS_COLORS[status], fontFamily: 'var(--font-mono, monospace)' }}>
              {STATUS_LABELS[status]}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-4 border-t border-b border-current/10 py-8 mb-8">
            <Row label="Session" value={booking.service?.name} />
            <Row label="Date & time" value={formatDate(booking.startsAt)} />
            <Row label="Name" value={booking.clientName} />
            <Row label="Email" value={booking.clientEmail} />
            {booking.clientPhone && <Row label="Phone" value={booking.clientPhone} />}
            {booking.notes && <Row label="Notes" value={booking.notes} />}
          </div>

          {/* Actions */}
          {status === 'PENDING' && (
            <div className="space-y-4">
              <a href="/contract" className="block text-sm opacity-60 hover:opacity-90 transition-opacity underline">
                Complete your photography contract →
              </a>
              <button
                className="text-sm opacity-30 hover:opacity-60 transition-opacity"
                onClick={() => {
                  if (confirm('Cancel this booking?')) cancel.mutate();
                }}
              >
                Cancel this booking
              </button>
            </div>
          )}

          {status === 'CONFIRMED' && (
            <div className="space-y-4">
              <p className="text-sm opacity-60 leading-relaxed">
                Your session is confirmed! If you haven't already, please complete your photography contract before your session.
              </p>
              <a href="/contract" className="block text-sm opacity-80 hover:opacity-100 transition-opacity underline">
                Complete contract →
              </a>
            </div>
          )}

          {status === 'CANCELLED' && (
            <div>
              <p className="text-sm opacity-50">This booking has been cancelled.</p>
              <Link to="/book" className="mt-4 block text-sm opacity-70 hover:opacity-100 underline transition-opacity">
                Book a new session →
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-4">
      <span className="text-xs tracking-widest uppercase opacity-40 w-28 shrink-0 pt-0.5" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        {label}
      </span>
      <span className="text-sm opacity-80">{value}</span>
    </div>
  );
}
