import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminGetInquiries, adminUpdateInquiry,
  adminGetTimeRequests, adminUpdateTimeRequest,
} from '../../lib/api';

function InquiriesTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('unhandled');

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: adminGetInquiries,
  });

  const toggle = useMutation({
    mutationFn: ({ id, handled }) => adminUpdateInquiry(id, { handled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-inquiries'] }),
  });

  const filtered =
    filter === 'all' ? inquiries : inquiries.filter((i) => !i.handled);

  const unhandledCount = inquiries.filter((i) => !i.handled).length;

  if (isLoading) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {unhandledCount > 0 ? (
          <p className="text-sm text-ink-soft">{unhandledCount} unhandled</p>
        ) : <span />}
        <div className="flex gap-2">
          {['unhandled', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1.5 text-xs capitalize ${
                filter === f ? 'bg-ink text-paper' : 'border border-ink/20 hover:bg-ink/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-ink-soft">
          {filter === 'unhandled' ? 'No unhandled inquiries.' : 'No inquiries yet.'}
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((inquiry) => (
          <div
            key={inquiry.id}
            className={`rounded border p-5 ${
              inquiry.handled ? 'border-ink/10 opacity-60' : 'border-ink/20'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-medium text-sm">{inquiry.name}</p>
                  <a
                    href={`mailto:${inquiry.email}`}
                    className="text-xs text-ink-soft hover:underline"
                  >
                    {inquiry.email}
                  </a>
                  <span className="text-xs text-ink-soft">
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">
                  {inquiry.message}
                </p>
              </div>
              <button
                onClick={() => toggle.mutate({ id: inquiry.id, handled: !inquiry.handled })}
                className={`shrink-0 rounded px-3 py-1.5 text-xs ${
                  inquiry.handled
                    ? 'border border-ink/20 hover:bg-ink/5'
                    : 'bg-ink text-paper hover:bg-ink/80'
                }`}
              >
                {inquiry.handled ? 'Re-open' : 'Mark handled'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimeRequestsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('unhandled');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-time-requests'],
    queryFn: adminGetTimeRequests,
  });

  const toggle = useMutation({
    mutationFn: ({ id, handled }) => adminUpdateTimeRequest(id, { handled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-time-requests'] }),
  });

  const filtered = filter === 'all' ? requests : requests.filter((r) => !r.handled);
  const unhandledCount = requests.filter((r) => !r.handled).length;

  if (isLoading) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {unhandledCount > 0 ? (
          <p className="text-sm text-ink-soft">{unhandledCount} unhandled</p>
        ) : <span />}
        <div className="flex gap-2">
          {['unhandled', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1.5 text-xs capitalize ${
                filter === f ? 'bg-ink text-paper' : 'border border-ink/20 hover:bg-ink/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-ink-soft">
          {filter === 'unhandled' ? 'No unhandled time requests.' : 'No time requests yet.'}
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((r) => (
          <div
            key={r.id}
            className={`rounded border p-5 ${r.handled ? 'border-ink/10 opacity-60' : 'border-ink/20'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-medium text-sm">{r.clientName}</p>
                  <a href={`mailto:${r.clientEmail}`} className="text-xs text-ink-soft hover:underline">
                    {r.clientEmail}
                  </a>
                  {r.clientPhone && <span className="text-xs text-ink-soft">{r.clientPhone}</span>}
                  <span className="text-xs text-ink-soft">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {(r.serviceName || r.preferredDate) && (
                  <p className="mt-1 text-xs text-ink-soft">
                    {r.serviceName}{r.serviceName && r.preferredDate ? ' · ' : ''}
                    {r.preferredDate && `originally tried to book ${r.preferredDate}`}
                  </p>
                )}
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                  <span className="text-ink-soft">Requested: </span>{r.requestedTime}
                </p>
                {r.notes && (
                  <p className="mt-1 text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{r.notes}</p>
                )}
              </div>
              <button
                onClick={() => toggle.mutate({ id: r.id, handled: !r.handled })}
                className={`shrink-0 rounded px-3 py-1.5 text-xs ${
                  r.handled ? 'border border-ink/20 hover:bg-ink/5' : 'bg-ink text-paper hover:bg-ink/80'
                }`}
              >
                {r.handled ? 'Re-open' : 'Mark handled'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminInquiries() {
  const [tab, setTab] = useState('inquiries');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Inquiries</h1>
        <div className="flex gap-1.5 rounded-lg bg-ink/5 p-1">
          {[['inquiries', 'Inquiries'], ['time-requests', 'Time Requests']].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                tab === v ? 'bg-paper shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'inquiries' ? <InquiriesTab /> : <TimeRequestsTab />}
    </div>
  );
}
