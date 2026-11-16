import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetPayments, adminRecordPayment, adminDeletePayment, adminGetBookings } from '../../lib/api';

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function RecordPaymentModal({ bookings, onClose, onRecorded }) {
  const [bookingId, setBookingId] = useState('');
  const [type, setType] = useState('BALANCE');
  const [method, setMethod] = useState('CASH');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const record = useMutation({
    mutationFn: () => adminRecordPayment({ bookingId, type, method, amount, note }),
    onSuccess: onRecorded,
  });

  const valid = bookingId && type && method && parseFloat(amount) > 0;
  const input = 'w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400';
  const label = 'block text-xs uppercase tracking-wide opacity-40 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl mb-6">Record a Payment</h2>
        <div className="space-y-4">
          <div>
            <label className={label}>Session *</label>
            <select className={input} value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
              <option value="">Select a session…</option>
              {bookings?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.clientName} — {b.service?.name} — {new Date(b.startsAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Type *</label>
              <select className={input} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="DEPOSIT">Deposit</option>
                <option value="BALANCE">Balance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className={label}>Method *</label>
              <select className={input} value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="CHECK">Check</option>
                <option value="SQUARE">Square</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Amount ($) *</label>
            <input type="number" className={input} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150" />
          </div>
          <div>
            <label className={label}>Note</label>
            <input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        {record.isError && (
          <p className="text-red-500 text-sm mt-3">{record.error?.response?.data?.error || 'Failed to record payment.'}</p>
        )}
        <div className="flex gap-3 mt-6">
          <button
            disabled={!valid || record.isPending}
            onClick={() => record.mutate()}
            className="flex-1 bg-black text-white rounded py-2 text-xs tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            {record.isPending ? 'Saving…' : 'Record Payment'}
          </button>
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded py-2 text-xs tracking-widest uppercase hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentsTab() {
  const qc = useQueryClient();
  const { data: payments = [], isLoading } = useQuery({ queryKey: ['admin-payments'], queryFn: () => adminGetPayments({}) });

  const del = useMutation({
    mutationFn: adminDeletePayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  if (isLoading) return <p className="opacity-40 text-sm">Loading…</p>;

  return (
    <div>
      <p className="mb-4 text-sm opacity-60">
        {payments.length} payment{payments.length === 1 ? '' : 's'} · <span className="font-medium opacity-100">{money(total)} total</span>
      </p>

      {!payments.length && <p className="text-sm opacity-30 py-12 text-center">No payments recorded yet.</p>}

      <div className="space-y-2">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 bg-white border border-gray-100 rounded-lg p-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-medium text-sm">{p.booking?.clientName}</span>
                <span className="text-xs opacity-40">{p.booking?.service?.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{p.type.toLowerCase()}</span>
                <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200">{p.method.toLowerCase()}</span>
              </div>
              <p className="text-xs opacity-30 font-mono mt-1">
                {new Date(p.paidAt).toLocaleDateString()}
                {p.note ? ` · ${p.note}` : ''}
                {p.recordedByName ? ` · logged by ${p.recordedByName}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="font-serif text-lg">{money(p.amount)}</span>
              <button
                onClick={() => { if (confirm('Delete this payment record?')) del.mutate(p.id); }}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionsTab() {
  const { data: bookings = [], isLoading } = useQuery({ queryKey: ['admin-bookings', 'all'], queryFn: () => adminGetBookings({}) });

  if (isLoading) return <p className="opacity-40 text-sm">Loading…</p>;

  const rows = bookings
    .filter((b) => b.status !== 'CANCELLED')
    .map((b) => {
      const paid = (b.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const price = Number(b.service?.price || 0);
      return { ...b, paid, balance: price - paid };
    });

  if (!rows.length) return <p className="text-sm opacity-30 py-12 text-center">No sessions yet.</p>;

  return (
    <div className="space-y-2">
      {rows.map((b) => (
        <div key={b.id} className="bg-white border border-gray-100 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-medium text-sm">{b.clientName}</span>
              <span className="text-xs opacity-40">{b.service?.name}</span>
              <span className="text-xs opacity-30 font-mono">{new Date(b.startsAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm shrink-0">
            <span className="opacity-40">Price <span className="font-medium opacity-100 text-black">{money(b.service?.price)}</span></span>
            <span className="opacity-40">Paid <span className="font-medium opacity-100 text-green-600">{money(b.paid)}</span></span>
            <span className={`font-medium ${b.balance > 0.004 ? 'text-amber-600' : 'text-gray-400'}`}>
              {b.balance > 0.004 ? `Balance ${money(b.balance)}` : 'Paid in full'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAccounting() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('payments');
  const [recording, setRecording] = useState(false);

  const { data: bookings = [] } = useQuery({ queryKey: ['admin-bookings', 'all'], queryFn: () => adminGetBookings({}) });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">Accounting</h1>
        <button
          onClick={() => setRecording(true)}
          className="bg-black text-white px-4 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-800 transition-colors"
        >
          + Record Payment
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {[['payments', 'Payments'], ['sessions', 'Sessions']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`text-xs px-4 py-2 rounded transition-colors ${tab === v ? 'bg-black text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'payments' ? <PaymentsTab /> : <SessionsTab />}

      {recording && (
        <RecordPaymentModal
          bookings={bookings}
          onClose={() => setRecording(false)}
          onRecorded={() => {
            setRecording(false);
            qc.invalidateQueries({ queryKey: ['admin-payments'] });
            qc.invalidateQueries({ queryKey: ['admin-bookings'] });
          }}
        />
      )}
    </div>
  );
}
