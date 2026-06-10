import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import {
  adminGetUsers,
  adminCreateUser,
  adminResetUserPassword,
  adminDeleteUser,
  changePassword,
} from '../../lib/api';

function errMsg(e) {
  return e?.response?.data?.error || 'Something went wrong';
}

// ── Change my password ────────────────────────────────────────────────────────
function ChangeMyPassword() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [msg, setMsg] = useState(null); // { ok, text }

  const mutation = useMutation({
    mutationFn: () => changePassword(form.current, form.next),
    onSuccess: () => {
      setMsg({ ok: true, text: 'Password updated.' });
      setForm({ current: '', next: '', confirm: '' });
    },
    onError: (e) => setMsg({ ok: false, text: errMsg(e) }),
  });

  function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (form.next.length < 8) return setMsg({ ok: false, text: 'New password must be at least 8 characters' });
    if (form.next !== form.confirm) return setMsg({ ok: false, text: 'Passwords do not match' });
    mutation.mutate();
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const input = 'w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink';

  return (
    <div className="rounded border border-ink/10 bg-paper p-6">
      <h2 className="mb-4 text-sm font-medium">Change my password</h2>
      <form onSubmit={submit} className="max-w-sm space-y-3">
        <input type="password" placeholder="Current password" value={form.current} onChange={set('current')} required className={input} />
        <input type="password" placeholder="New password (min 8 characters)" value={form.next} onChange={set('next')} required className={input} />
        <input type="password" placeholder="Confirm new password" value={form.confirm} onChange={set('confirm')} required className={input} />
        {msg && <p className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}
        <button type="submit" disabled={mutation.isPending} className="rounded bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50">
          {mutation.isPending ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

// ── Add user ──────────────────────────────────────────────────────────────────
function AddUser({ onDone }) {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: () => adminCreateUser(form),
    onSuccess: () => {
      setForm({ name: '', username: '', email: '', password: '' });
      setError(null);
      onDone();
    },
    onError: (e) => setError(errMsg(e)),
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const input = 'w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink';

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="grid max-w-2xl gap-3 sm:grid-cols-2"
    >
      <input placeholder="Full name" value={form.name} onChange={set('name')} required className={input} />
      <input placeholder="Username" value={form.username} onChange={set('username')} required className={input} />
      <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required className={input} />
      <input type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={set('password')} required className={input} />
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={mutation.isPending} className="rounded bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50">
          {mutation.isPending ? 'Creating…' : 'Create user'}
        </button>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [resetFor, setResetFor] = useState(null); // user id
  const [resetPw, setResetPw] = useState('');
  const [resetMsg, setResetMsg] = useState(null);

  const { data: users = [], isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: adminGetUsers });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-users'] });

  const reset = useMutation({
    mutationFn: ({ id, pw }) => adminResetUserPassword(id, pw),
    onSuccess: () => {
      setResetMsg({ ok: true, text: 'Password reset.' });
      setResetPw('');
      setTimeout(() => { setResetFor(null); setResetMsg(null); }, 1200);
    },
    onError: (e) => setResetMsg({ ok: false, text: errMsg(e) }),
  });

  const remove = useMutation({
    mutationFn: adminDeleteUser,
    onSuccess: invalidate,
    onError: (e) => alert(errMsg(e)),
  });

  if (isLoading) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Users</h1>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="rounded bg-ink px-4 py-2 text-sm text-paper"
        >
          {showAdd ? 'Close' : '+ Add user'}
        </button>
      </div>

      {showAdd && (
        <div className="rounded border border-ink/20 bg-paper p-6">
          <h2 className="mb-4 text-sm font-medium">New user</h2>
          <AddUser onDone={() => { setShowAdd(false); invalidate(); }} />
        </div>
      )}

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="rounded border border-ink/10 bg-paper p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {u.name}
                  {u.id === me?.id && <span className="ml-2 text-xs text-ink-soft">(you)</span>}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {u.username} · {u.email}
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                {u.id !== me?.id && (
                  <>
                    <button
                      onClick={() => { setResetFor(resetFor === u.id ? null : u.id); setResetPw(''); setResetMsg(null); }}
                      className="text-xs text-ink-soft hover:text-ink"
                    >
                      Reset password
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete ${u.name}? This cannot be undone.`)) remove.mutate(u.id); }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {resetFor === u.id && (
              <form
                onSubmit={(e) => { e.preventDefault(); reset.mutate({ id: u.id, pw: resetPw }); }}
                className="mt-4 flex max-w-sm gap-2 border-t border-ink/10 pt-4"
              >
                <input
                  type="password"
                  placeholder="New password (min 8 characters)"
                  value={resetPw}
                  onChange={(e) => setResetPw(e.target.value)}
                  required
                  className="flex-1 border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-ink"
                />
                <button type="submit" disabled={reset.isPending || resetPw.length < 8} className="rounded bg-ink px-3 py-2 text-sm text-paper disabled:opacity-50">
                  Reset
                </button>
                {resetMsg && (
                  <span className={`self-center text-xs ${resetMsg.ok ? 'text-green-700' : 'text-red-600'}`}>
                    {resetMsg.text}
                  </span>
                )}
              </form>
            )}
          </div>
        ))}
      </div>

      <ChangeMyPassword />
    </div>
  );
}
