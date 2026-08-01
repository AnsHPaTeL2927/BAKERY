import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin/verify', { state: { email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f4] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-blush/70 bg-white p-8 shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-rose-deep">Admin Access</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-cocoa">Secure Login</h1>
        <p className="mt-2 text-sm text-cocoa-soft">
          Enter your admin email and password to receive a one-time verification code.
        </p>
        {error && <p className="mt-4 rounded-xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-blush p-3"
            placeholder="Email"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-blush p-3"
            placeholder="Password"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-rose px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Sending code…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
