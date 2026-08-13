import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import ButtonLoader from '../../components/loading/ButtonLoader';

export default function AdminVerify() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { verifyOtp, resendOtp } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await verifyOtp(otp);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    try {
      const result = await resendOtp();
      setInfo(result.message || 'A new code has been sent.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8f4] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-blush/70 bg-white p-8 shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-rose-deep">Verification</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-cocoa">Enter Verification Code</h1>
        <p className="mt-2 text-sm text-cocoa-soft">
          {email ? `We've sent a 6-digit code to ${email}.` : "We've sent a 6-digit code to your email."}
        </p>
        {error && <p className="mt-4 rounded-xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}
        {info && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{info}</p>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-cocoa uppercase tracking-wider text-center">6-Digit Verification Code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              className="w-full rounded-2xl border border-blush p-3 text-center text-2xl tracking-[0.5em] focus:border-rose-deep focus:outline-none focus:ring-2 focus:ring-rose-deep/20"
              placeholder="------"
              maxLength={6}
            />
            <p className="mt-1 text-[11px] text-center text-cocoa-soft/80">Check your email inbox for the 6-digit verification code.</p>
          </div>
          <button
            type="submit"
            disabled={submitting || otp.length !== 6}
            className="w-full rounded-2xl bg-cocoa px-4 py-3 font-semibold text-white hover:bg-cocoa-soft transition-colors disabled:opacity-60"
          >
            {submitting ? <ButtonLoader label="Verifying…" /> : 'Verify'}
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <button type="button" onClick={handleResend} className="font-semibold text-rose-deep hover:underline">
            Resend code
          </button>
          <Link to="/admin/login" className="text-cocoa-soft hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
