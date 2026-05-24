import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, Shield, Loader, RotateCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useResendTimer } from '../lib/useResendTimer';
import { isNative, resetNativeLanding } from '../native/initNative';
import './AuthPages.css';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, sendOtp, verifyOtp, resetAuthFlow } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { remaining, start, canResend } = useResendTimer(45);

  const redirectTo = (location.state as { from?: string } | null)?.from || '/';

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  useEffect(() => {
    return () => { resetAuthFlow('recaptcha-customer'); };
  }, [resetAuthFlow]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mobile.length !== 10) { setError('Enter a valid 10-digit number'); return; }
    setLoading(true);
    const res = await sendOtp(mobile, 'recaptcha-customer');
    setLoading(false);
    if (!res.success) { setError(res.error || 'Failed to send OTP'); return; }
    setStep('otp');
    start();
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setError('');
    setResending(true);
    resetAuthFlow('recaptcha-customer');
    const res = await sendOtp(mobile, 'recaptcha-customer');
    setResending(false);
    if (!res.success) { setError(res.error || 'Could not resend OTP'); return; }
    setOtp('');
    start();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true);
    const res = await verifyOtp(otp);
    setLoading(false);
    if (!res.success) { setError(res.error || 'Invalid OTP'); return; }
    if (res.isNewUser) {
      navigate('/signup', { state: { phone: mobile, verified: true, from: redirectTo }, replace: true });
      return;
    }
    navigate(redirectTo, { replace: true });
  };

  const handleBack = () => {
    if (isNative()) {
      resetNativeLanding();
      navigate('/', { replace: true });
      return;
    }
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-page__topbar">
        <button className="auth-page__back" onClick={handleBack} aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <img src="/logo.png" alt="Kalyani" className="auth-page__logo" />
        <h1>Login</h1>
      </div>
      <div className="auth-page__body">
        <div className="auth-page__card">
          <img src="/logo.png" alt="Kalyani" className="auth-page__brand-logo" />
          <h2 className="auth-page__title">{step === 'phone' ? 'Welcome back' : 'Verify OTP'}</h2>
          <p className="auth-page__subtitle">
            {step === 'phone' ? 'Enter your mobile number to continue' : `OTP sent to +91 ${mobile}`}
          </p>

          {step === 'phone' ? (
            <form className="auth-form" onSubmit={handleSendOtp}>
              <div className="auth-field">
                <Phone size={18} />
                <span className="auth-prefix">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Mobile number"
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  autoFocus
                />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-submit" disabled={loading || mobile.length < 10}>
                {loading ? <><Loader size={16} className="auth-spinner" /> Sending...</> : 'Send OTP'}
              </button>
              <div className="auth-divider">or</div>
              <p className="auth-footer-link">
                New to Kalyani? <Link to="/signup">Create an account</Link>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleVerify}>
              <div className="auth-field">
                <Shield size={18} />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoFocus
                />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-submit" disabled={loading || otp.length < 6}>
                {loading ? <><Loader size={16} className="auth-spinner" /> Verifying...</> : 'Verify & Login'}
              </button>

              <button
                type="button"
                className="auth-resend"
                onClick={handleResend}
                disabled={!canResend || resending}
              >
                {resending ? (
                  <><Loader size={14} className="auth-spinner" /> Resending...</>
                ) : canResend ? (
                  <><RotateCw size={14} /> Resend OTP</>
                ) : (
                  <>Resend OTP in {remaining}s</>
                )}
              </button>

              <button type="button" className="auth-secondary" onClick={() => { setStep('phone'); setOtp(''); resetAuthFlow('recaptcha-customer'); }}>
                Change number
              </button>
            </form>
          )}

          <div id="recaptcha-customer"></div>
        </div>
      </div>
    </div>
  );
}
