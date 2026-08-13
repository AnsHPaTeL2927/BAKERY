import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { forgotPassword, resetPassword } from '../services/adminApi';
import ButtonLoader from '../../components/loading/ButtonLoader';

export default function AdminForgotPassword() {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleRequestCode(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await forgotPassword(email);
      setInfo(result.message);
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword({ email, code, newPassword });
      navigate('/admin/login', { state: { resetSuccess: true } });
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
        <h1 className="mt-2 font-display text-3xl font-semibold text-cocoa">
          {step === 'request' ? 'Forgot Password' : 'Reset Password'}
        </h1>
        <p className="mt-2 text-sm text-cocoa-soft">
          {step === 'request'
            ? "Enter your admin email and we'll send you a reset code."
            : `Enter the 6-digit code sent to ${email}, along with your new password.`}
        </p>

        {error && <p className="mt-4 rounded-xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}
        {info && step === 'reset' && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {info}
          </p>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestCode} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-cocoa">Admin Email Address</label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-blush p-3 text-sm focus:border-rose-deep focus:outline-none focus:ring-2 focus:ring-rose-deep/20"
                placeholder="Admin email"
              />
              <p className="mt-1 text-[11px] text-cocoa-soft/80">Enter your registered admin email address to receive password reset OTP.</p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-rose px-4 py-3 font-semibold text-white hover:bg-rose-deep transition-colors disabled:opacity-60"
            >
              {submitting ? <ButtonLoader label="Sending code…" /> : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-cocoa uppercase tracking-wider text-center">6-Digit Reset Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                className="w-full rounded-2xl border border-blush p-3 text-center text-2xl tracking-[0.5em] focus:border-rose-deep focus:outline-none focus:ring-2 focus:ring-rose-deep/20"
                placeholder="------"
                maxLength={6}
              />
              <p className="mt-1 text-[11px] text-center text-cocoa-soft/80">6-digit reset OTP sent to {email}.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-cocoa">New Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-2xl border border-blush p-3 text-sm focus:border-rose-deep focus:outline-none focus:ring-2 focus:ring-rose-deep/20"
                placeholder="New password (min 8 chars)"
              />
              <p className="mt-1 text-[11px] text-cocoa-soft/80">Minimum 8 characters required.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-cocoa">Confirm New Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-blush p-3 text-sm focus:border-rose-deep focus:outline-none focus:ring-2 focus:ring-rose-deep/20"
                placeholder="Re-enter new password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full rounded-2xl bg-cocoa px-4 py-3 font-semibold text-white hover:bg-cocoa-soft transition-colors disabled:opacity-60"
            >
              {submitting ? <ButtonLoader label="Resetting…" /> : 'Reset Password'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('request');
                setError('');
                setInfo('');
              }}
              className="w-full text-center text-sm font-semibold text-rose-deep hover:underline"
            >
              Didn't get a code? Send again
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
          <Link to="/admin/login" className="text-cocoa-soft hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
