import { useState } from 'react';
import { X, Phone, Shield, User, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AuthModal.css';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, sendOtp, verifyOtp, completeSignup, authStep, pendingMobile, resetAuthFlow, loading } = useAuth();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleaned = mobile.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    const result = await sendOtp(cleaned);
    if (!result.success) {
      setError(result.error || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    const result = await verifyOtp(otp);
    if (!result.success) {
      setError(result.error || 'Invalid OTP. Please try again.');
    }
  };

  const handleCompleteName = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Please enter your name');
      return;
    }
    completeSignup(name.trim());
    setMobile('');
    setOtp('');
    setName('');
  };

  const handleClose = () => {
    closeAuthModal();
    setMobile('');
    setOtp('');
    setName('');
    setError('');
  };

  const handleBack = () => {
    resetAuthFlow();
    setOtp('');
    setName('');
    setError('');
  };

  return (
    <div className="auth-overlay" onClick={handleClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={handleClose}><X size={20} /></button>

        <div className="auth-modal__header">
          <h2>{authStep === 'name' ? 'Complete Signup' : 'Login / Signup'}</h2>
          <p>
            {authStep === 'phone' && 'Enter your mobile number to continue'}
            {authStep === 'otp' && `We've sent an OTP to +91 ${pendingMobile}`}
            {authStep === 'name' && 'Just one more step — tell us your name'}
          </p>
        </div>

        {authStep === 'phone' && (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="auth-input-group">
              <Phone size={18} />
              <span className="auth-prefix">+91</span>
              <input
                type="tel"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                autoFocus
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <><Loader size={16} className="auth-spinner" /> Sending...</> : 'Send OTP'}
            </button>
          </form>
        )}

        {authStep === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <p className="auth-otp-info">OTP sent to your phone via SMS</p>
            <div className="auth-input-group">
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
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <><Loader size={16} className="auth-spinner" /> Verifying...</> : 'Verify OTP'}
            </button>
            <button type="button" className="auth-link-btn" onClick={handleBack}>Change number</button>
          </form>
        )}

        {authStep === 'name' && (
          <form onSubmit={handleCompleteName} className="auth-form">
            <div className="auth-input-group">
              <User size={18} />
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit-btn">Complete Signup</button>
          </form>
        )}

        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
