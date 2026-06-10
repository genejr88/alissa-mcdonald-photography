import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminGetGuestbook,
  adminUpdateGuestbookEntry,
  adminDeleteGuestbookEntry,
} from '../../lib/api';

export default function AdminGuestbook() {
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['admin-guestbook'],
    queryFn: adminGetGuestbook,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-guestbook'] });
    queryClient.invalidateQueries({ queryKey: ['guestbook'] });
  };

  const toggleHidden = useMutation({
    mutationFn: ({ id, hidden }) => adminUpdateGuestbookEntry(id, { hidden }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id) => adminDeleteGuestbookEntry(id),
    onSuccess: invalidate,
  });

  if (isLoading) return <p className="meta">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-2xl">Guest Book</h1>
        <span className="meta">
          {entries.length} note{entries.length === 1 ? '' : 's'} —{' '}
          {entries.filter((e) => e.hidden).length} hidden
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-ink-soft">No notes yet. The page is waiting.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className={`flex items-start justify-between gap-4 rounded-sm border border-ink/10 bg-paper p-4 ${e.hidden ? 'opacity-50' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-hand text-xl leading-snug" style={{ color: e.inkColor }}>
                  {e.message}
                </p>
                <p className="meta mt-2">
                  — {e.name} ·{' '}
                  {new Date(e.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {e.hidden && ' · HIDDEN'}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => toggleHidden.mutate({ id: e.id, hidden: !e.hidden })}
                  className="rounded-sm border border-ink/20 px-3 py-1.5 text-xs hover:bg-ink/5"
                >
                  {e.hidden ? 'Show' : 'Hide'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete the note from "${e.name}"? This can't be undone.`)) {
                      remove.mutate(e.id);
                    }
                  }}
                  className="rounded-sm border border-red-800/30 px-3 py-1.5 text-xs text-red-900 hover:bg-red-900/5"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
