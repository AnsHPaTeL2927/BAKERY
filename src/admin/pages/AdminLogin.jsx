import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import ButtonLoader from '../../components/loading/ButtonLoader';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resetSuccess = location.state?.resetSuccess;

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
        {resetSuccess && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Password updated. Please log in with your new password.
          </p>
        )}
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
            {submitting ? <ButtonLoader label="Sending code…" /> : 'Continue'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link to="/admin/forgot-password" className="font-semibold text-rose-deep hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
