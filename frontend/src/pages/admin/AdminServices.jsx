import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetServices, adminCreateService, adminUpdateService, adminDeleteService } from '../../lib/api';

const BLANK = {
  name: '', number: '', description: '', includes: '',
  durationMin: 60, price: '', depositAmount: '', bufferMin: 30, active: true,
};

function ServiceForm({ initial, onSave, onCancel, isPending }) {
  const [f, setF] = useState(initial);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valid = f.name && f.description && f.price && f.durationMin;

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name *" value={f.name} onChange={(v) => set('name', v)} placeholder="The Mini" />
        <Field label="№ Display number" value={f.number} onChange={(v) => set('number', v)} placeholder="1" type="number" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">What it feels like *</label>
        <textarea
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none"
          rows={3}
          value={f.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Warm, descriptive copy about the session experience…"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">What's included (one per line)</label>
        <textarea
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none"
          rows={3}
          value={f.includes}
          onChange={(e) => set('includes', e.target.value)}
          placeholder="One location&#10;30 minutes&#10;Online gallery"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Duration (min) *" value={f.durationMin} onChange={(v) => set('durationMin', v)} type="number" />
        <Field label="Price ($) *" value={f.price} onChange={(v) => set('price', v)} type="number" placeholder="175" />
        <Field label="Deposit ($)" value={f.depositAmount} onChange={(v) => set('depositAmount', v)} type="number" placeholder="Optional" />
        <Field label="Buffer (min)" value={f.bufferMin} onChange={(v) => set('bufferMin', v)} type="number" />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} />
        Active (visible on booking page)
      </label>
      <div className="flex gap-3 pt-2">
        <button
          disabled={!valid || isPending}
          onClick={() => onSave(f)}
          className="bg-black text-white px-5 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="border border-gray-200 px-5 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide opacity-40 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
    </div>
  );
}

export default function AdminServices() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: adminGetServices,
  });

  const create = useMutation({
    mutationFn: adminCreateService,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-services'] }); setCreating(false); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => adminUpdateService(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-services'] }); setEditId(null); },
  });

  const del = useMutation({
    mutationFn: adminDeleteService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-services'] }),
    onError: (e) => alert(e.response?.data?.error || 'Delete failed'),
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl">Services</h1>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="bg-black text-white px-5 py-2 text-xs tracking-widest uppercase rounded hover:bg-gray-800 transition-colors"
          >
            + New Service
          </button>
        )}
      </div>

      {isLoading && <p className="opacity-40 text-sm">Loading…</p>}

      {creating && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest opacity-40 mb-3">New service</p>
          <ServiceForm
            initial={BLANK}
            onSave={(f) => create.mutate(f)}
            onCancel={() => setCreating(false)}
            isPending={create.isPending}
          />
        </div>
      )}

      <div className="space-y-4">
        {services?.map((s) => (
          <div key={s.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
            {editId === s.id ? (
              <div className="p-4">
                <ServiceForm
                  initial={{ ...s, includes: s.includes || '', depositAmount: s.depositAmount || '' }}
                  onSave={(f) => update.mutate({ id: s.id, data: f })}
                  onCancel={() => setEditId(null)}
                  isPending={update.isPending}
                />
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs opacity-30" style={{ fontFamily: 'monospace' }}>№ {String(s.number).padStart(2, '0')}</span>
                      <h3 className="font-serif text-xl">{s.name}</h3>
                      {!s.active && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-400">inactive</span>}
                    </div>
                    <p className="text-sm opacity-50 leading-relaxed mb-3">{s.description}</p>
                    <div className="flex gap-4 text-xs opacity-40" style={{ fontFamily: 'monospace' }}>
                      <span>{s.durationMin} min</span>
                      <span>${parseFloat(s.price).toFixed(0)}</span>
                      {s.depositAmount && <span>${parseFloat(s.depositAmount).toFixed(0)} deposit</span>}
                      <span>{s.bufferMin} min buffer</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditId(s.id)}
                      className="text-xs px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${s.name}"?`)) del.mutate(s.id);
                      }}
                      className="text-xs px-3 py-1.5 rounded border border-red-100 text-red-400 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
