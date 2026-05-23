import { useState, useEffect } from 'react';
import { Shield, Phone, Loader, RotateCw } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { useConfig } from '../contexts/ConfigContext';
import { useResendTimer } from '../lib/useResendTimer';
import './AdminLogin.css';

export default function AdminLogin() {
  const { adminLogin, adminVerifyOtp, adminOtpSent } = useAdmin();
  const { get } = useConfig();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { remaining, start, canResend } = useResendTimer(45);

  useEffect(() => { if (adminOtpSent) start(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [adminOtpSent]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await adminLogin(mobile);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setError('');
    setResending(true);
    const result = await adminLogin(mobile);
    setResending(false);
    if (!result.success) { setError(result.error || 'Could not resend OTP'); return; }
    setOtp('');
    start();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await adminVerifyOtp(otp);
    setLoading(false);
    if (!success) {
      setError('Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__header">
          <img src="/logo.png" alt="Kalyani" className="admin-login__logo" />
          <Shield size={32} />
          <h2>Admin Login</h2>
          <p>{get('restaurant_name', 'Kalyani Restaurant')} Management</p>
        </div>

        {!adminOtpSent ? (
          <form onSubmit={handleLogin} className="admin-login__form">
            <div className="admin-login__field">
              <Phone size={18} />
              <input
                type="tel"
                placeholder="Admin mobile number"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
              />
            </div>
            {error && <p className="admin-login__error">{error}</p>}
            <button type="submit" className="admin-login__btn" disabled={loading || mobile.length < 10}>
              {loading ? <><Loader size={16} className="admin-spinner" /> Sending OTP...</> : 'Send OTP'}
            </button>
            <p className="admin-login__hint">Only registered admin numbers can sign in</p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="admin-login__form">
            <p className="admin-login__otp-info">OTP sent to +91 {mobile} via SMS</p>
            <div className="admin-login__field">
              <Shield size={18} />
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                autoFocus
              />
            </div>
            {error && <p className="admin-login__error">{error}</p>}
            <button type="submit" className="admin-login__btn" disabled={loading}>
              {loading ? <><Loader size={16} className="admin-spinner" /> Verifying...</> : 'Verify & Login'}
            </button>
            <button
              type="button"
              className="admin-login__resend"
              onClick={handleResend}
              disabled={!canResend || resending}
            >
              {resending ? (
                <><Loader size={14} className="admin-spinner" /> Resending...</>
              ) : canResend ? (
                <><RotateCw size={14} /> Resend OTP</>
              ) : (
                <>Resend OTP in {remaining}s</>
              )}
            </button>
          </form>
        )}
        <div id="recaptcha-admin"></div>
      </div>
    </div>
  );
}
