import { useState } from 'react';
import { Receipt, Phone, Shield, Loader } from 'lucide-react';
import { useBilling } from '../contexts/BillingContext';
import { useConfig } from '../contexts/ConfigContext';
import './Billing.css';

export default function BillingLogin() {
  const { billingLogin, billingVerifyOtp, billingOtpSent } = useBilling();
  const { get } = useConfig();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await billingLogin(phone);
    setLoading(false);
    if (!result.success) setError(result.error || 'Login failed');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await billingVerifyOtp(otp);
    setLoading(false);
    if (!result.success) setError(result.error || 'Invalid OTP');
  };

  return (
    <div className="billing-login">
      <div className="billing-login__card">
        <div className="billing-login__header">
          <Receipt size={36} />
          <h2>Billing Login</h2>
          <p>{get('restaurant_name', 'Kalyani Restaurant')} POS</p>
        </div>
        {!billingOtpSent ? (
          <form onSubmit={handleLogin} className="billing-login__form">
            <div className="billing-login__field">
              <Phone size={18} />
              <input type="tel" placeholder="Mobile number" value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} />
            </div>
            {error && <p className="billing-login__error">{error}</p>}
            <button type="submit" className="billing-login__btn" disabled={loading || phone.length < 10}>
              {loading ? <><Loader size={16} className="billing-spinner" /> Sending OTP...</> : 'Send OTP'}
            </button>
            <p className="billing-login__hint">Contact admin for billing access</p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="billing-login__form">
            <p className="billing-login__hint">OTP sent to +91 {phone} via SMS</p>
            <div className="billing-login__field">
              <Shield size={18} />
              <input type="text" placeholder="Enter 6-digit OTP" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} autoFocus />
            </div>
            {error && <p className="billing-login__error">{error}</p>}
            <button type="submit" className="billing-login__btn" disabled={loading || otp.length < 6}>
              {loading ? <><Loader size={16} className="billing-spinner" /> Verifying...</> : 'Verify & Login'}
            </button>
          </form>
        )}
        <div id="recaptcha-billing"></div>
      </div>
    </div>
  );
}
