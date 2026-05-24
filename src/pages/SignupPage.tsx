import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, Shield, User as UserIcon, MapPin, Home, Loader, Locate, RotateCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useResendTimer } from '../lib/useResendTimer';
import { isNative, resetNativeLanding } from '../native/initNative';
import './AuthPages.css';

type Step = 'phone' | 'otp' | 'details';

interface NavState {
  phone?: string;
  verified?: boolean;
  from?: string;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const nav = (location.state as NavState | null) || {};
  const { isAuthenticated, sendOtp, verifyOtp, completeSignup, resetAuthFlow } = useAuth();

  const [step, setStep] = useState<Step>(nav.verified ? 'details' : 'phone');
  const [mobile, setMobile] = useState(nav.phone || '');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { remaining, start, canResend } = useResendTimer(45);

  const redirectTo = nav.from || '/';

  useEffect(() => {
    if (isAuthenticated && step !== 'details') navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo, step]);

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
    if (!res.isNewUser) {
      // already a customer — just go in
      navigate(redirectTo, { replace: true });
      return;
    }
    setStep('details');
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLocLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, { headers: { 'Accept-Language': 'en' } });
          const d = await r.json();
          const a = d.address || {};
          const parts = [a.house_number, a.road, a.suburb, a.city || a.town || a.village, a.state].filter(Boolean);
          if (parts.length) setAddress(parts.join(', '));
          if (a.postcode) setPincode(String(a.postcode).slice(0, 6));
        } catch { /* ignore */ }
        setLocLoading(false);
      },
      err => { setLocLoading(false); setError(err.message || 'Unable to fetch location'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) { setError('Enter your name'); return; }
    if (address.trim().length < 5) { setError('Enter your address'); return; }
    if (pincode.length !== 6) { setError('Enter a valid 6-digit pincode'); return; }
    setLoading(true);
    const res = await completeSignup({
      name: name.trim(),
      address: { label: 'Home', fullAddress: address.trim(), pincode, lat: coords?.lat, lng: coords?.lng },
    });
    setLoading(false);
    if (!res.success) { setError(res.error || 'Could not create account'); return; }
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
        <h1>Create account</h1>
      </div>

      <div className="auth-page__body">
        <div className="auth-page__card">
          <img src="/logo.png" alt="Kalyani" className="auth-page__brand-logo" />
          <h2 className="auth-page__title">
            {step === 'phone' && 'Sign up'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'details' && 'Your details'}
          </h2>
          <p className="auth-page__subtitle">
            {step === 'phone' && 'Enter your mobile to receive an OTP'}
            {step === 'otp' && `OTP sent to +91 ${mobile}`}
            {step === 'details' && 'Tell us about you and where to deliver'}
          </p>

          {step === 'phone' && (
            <form className="auth-form" onSubmit={handleSendOtp}>
              <div className="auth-field">
                <Phone size={18} />
                <span className="auth-prefix">+91</span>
                <input type="tel" inputMode="numeric" placeholder="Mobile number" value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} autoFocus />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-submit" disabled={loading || mobile.length < 10}>
                {loading ? <><Loader size={16} className="auth-spinner" /> Sending...</> : 'Send OTP'}
              </button>
              <p className="auth-footer-link">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form className="auth-form" onSubmit={handleVerify}>
              <div className="auth-field">
                <Shield size={18} />
                <input type="text" inputMode="numeric" placeholder="6-digit OTP" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} autoFocus />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-submit" disabled={loading || otp.length < 6}>
                {loading ? <><Loader size={16} className="auth-spinner" /> Verifying...</> : 'Verify OTP'}
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

          {step === 'details' && (
            <form className="auth-form" onSubmit={handleSave}>
              <div className="auth-field">
                <UserIcon size={18} />
                <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>

              <button type="button" className="location-btn" onClick={handleFetchLocation} disabled={locLoading}>
                {locLoading ? <><Loader size={16} className="auth-spinner" /> Fetching location...</> : <><Locate size={16} /> Use my current location</>}
              </button>
              {coords && <p className="location-success"><MapPin size={12} /> Location captured</p>}

              <div className="auth-field">
                <Home size={18} />
                <textarea placeholder="House, street, area, city, state" value={address}
                  onChange={e => setAddress(e.target.value)} rows={3} />
              </div>

              <div className="auth-field">
                <MapPin size={18} />
                <input type="text" inputMode="numeric" placeholder="Pincode" value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
              </div>

              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <><Loader size={16} className="auth-spinner" /> Saving...</> : 'Save & Continue'}
              </button>
            </form>
          )}

          <div id="recaptcha-customer"></div>
        </div>
      </div>
    </div>
  );
}
