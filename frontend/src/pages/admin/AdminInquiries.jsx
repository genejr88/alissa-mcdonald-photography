import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetInquiries, adminUpdateInquiry } from '../../lib/api';

export default function AdminInquiries() {
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Inquiries</h1>
          {unhandledCount > 0 && (
            <p className="mt-1 text-sm text-ink-soft">
              {unhandledCount} unhandled
            </p>
          )}
        </div>
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
