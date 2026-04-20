import { useState } from 'react';
import { Shield, Phone, KeyRound, Loader } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { useConfig } from '../contexts/ConfigContext';
import './AdminLogin.css';

export default function AdminLogin() {
  const { adminLogin, adminVerifyOtp, adminOtpSent } = useAdmin();
  const { get } = useConfig();
  const [mobile, setMobile] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await adminLogin(mobile, accessKey);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await adminVerifyOtp(otp, mobile);
    setLoading(false);
    if (!success) {
      setError('Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__header">
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
            <div className="admin-login__field">
              <KeyRound size={18} />
              <input
                type="password"
                placeholder="Access Key"
                value={accessKey}
                onChange={e => setAccessKey(e.target.value)}
              />
            </div>
            {error && <p className="admin-login__error">{error}</p>}
            <button type="submit" className="admin-login__btn" disabled={loading}>
              {loading ? <><Loader size={16} className="admin-spinner" /> Verifying...</> : 'Verify & Send OTP'}
            </button>
            <p className="admin-login__hint">Admin access is managed by backend only</p>
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
          </form>
        )}
      </div>
    </div>
  );
}
