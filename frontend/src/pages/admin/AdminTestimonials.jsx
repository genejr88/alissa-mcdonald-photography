import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminGetTestimonials,
  adminCreateTestimonial,
  adminUpdateTestimonial,
  adminDeleteTestimonial,
} from '../../lib/api';

const blank = { quote: '', pullQuote: '', attribution: '', featured: true, sortOrder: 0 };

export default function AdminTestimonials() {
  const qc = useQueryClient();
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: adminGetTestimonials,
  });

  const [editing, setEditing] = useState(null); // null | 'new' | testimonial object
  const [form, setForm] = useState(blank);

  function openNew() {
    setForm(blank);
    setEditing('new');
  }
  function openEdit(t) {
    setForm({ quote: t.quote, pullQuote: t.pullQuote, attribution: t.attribution, featured: t.featured, sortOrder: t.sortOrder });
    setEditing(t);
  }
  function closeForm() {
    setEditing(null);
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-testimonials'] });
    qc.invalidateQueries({ queryKey: ['testimonials'] });
  };

  const create = useMutation({ mutationFn: adminCreateTestimonial, onSuccess: () => { invalidate(); closeForm(); } });
  const update = useMutation({ mutationFn: ({ id, data }) => adminUpdateTestimonial(id, data), onSuccess: () => { invalidate(); closeForm(); } });
  const remove = useMutation({ mutationFn: adminDeleteTestimonial, onSuccess: invalidate });

  function handleSubmit(e) {
    e.preventDefault();
    const data = { ...form, sortOrder: Number(form.sortOrder) };
    if (editing === 'new') {
      create.mutate(data);
    } else {
      update.mutate({ id: editing.id, data });
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  if (isLoading) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Testimonials</h1>
        <button onClick={openNew} className="rounded bg-ink px-4 py-2 text-sm text-paper">
          + Add testimonial
        </button>
      </div>

      {editing && (
        <div className="mb-8 rounded border border-ink/20 bg-paper p-6">
          <h2 className="mb-4 text-sm font-medium">
            {editing === 'new' ? 'New testimonial' : 'Edit testimonial'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Pull quote (shown large)</label>
              <input
                name="pullQuote"
                value={form.pullQuote}
                onChange={handleChange}
                required
                className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
                placeholder="The one killer sentence"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-soft">Full quote (optional)</label>
              <textarea
                name="quote"
                value={form.quote}
                onChange={handleChange}
                rows={3}
                className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
                placeholder="Full review text (shown below the pull quote)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-ink-soft">Attribution</label>
                <input
                  name="attribution"
                  value={form.attribution}
                  onChange={handleChange}
                  required
                  className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
                  placeholder="The Johnson Family"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink-soft">Sort order</label>
                <input
                  name="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={handleChange}
                  className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
              />
              Show on Kind Words page
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="rounded bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50"
              >
                {create.isPending || update.isPending ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={closeForm} className="text-sm text-ink-soft hover:text-ink">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {testimonials.length === 0 && (
        <p className="text-sm text-ink-soft">No testimonials yet. Add your first one above.</p>
      )}

      <div className="space-y-3">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="flex items-start justify-between gap-4 rounded border border-ink/10 p-4"
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">&ldquo;{t.pullQuote}&rdquo;</p>
              <p className="mt-0.5 text-xs text-ink-soft">— {t.attribution} {t.featured ? '· Featured' : ''}</p>
            </div>
            <div className="flex shrink-0 gap-3">
              <button onClick={() => openEdit(t)} className="text-xs text-ink-soft hover:text-ink">
                Edit
              </button>
              <button
                onClick={() => { if (confirm('Delete this testimonial?')) remove.mutate(t.id); }}
                className="text-xs text-red-500 hover:text-red-700"
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
