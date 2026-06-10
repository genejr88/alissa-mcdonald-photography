import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LOGO_DARK } from '../lib/branding';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username, password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <form onSubmit={submit} className="w-full max-w-sm">
        <img src={LOGO_DARK} alt="Alissa McDonald Photography" className="mb-8 h-16 w-auto" />
        <h1 className="font-display text-3xl">Studio sign in</h1>

        <label className="meta mt-10 block">Username or email</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 font-body outline-none focus:border-ink"
        />

        <label className="meta mt-6 block">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mt-2 w-full border-b border-ink/30 bg-transparent py-2 font-body outline-none focus:border-ink"
        />

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="link-draw meta mt-10 disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>
    </div>
  );
}
