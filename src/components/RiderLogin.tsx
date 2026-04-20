import { useState } from 'react';
import { Bike, Phone, Shield, Loader } from 'lucide-react';
import { useRider } from '../contexts/RiderContext';
import { useConfig } from '../contexts/ConfigContext';
import './RiderLogin.css';

export default function RiderLogin() {
  const { riderLogin, riderVerifyOtp, riderOtpSent } = useRider();
  const { get } = useConfig();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    const result = await riderLogin(phone);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await riderVerifyOtp(otp, phone);
    setLoading(false);
    if (!success) {
      setError('Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="rider-login">
      <div className="rider-login__card">
        <div className="rider-login__header">
          <Bike size={36} />
          <h2>Rider Login</h2>
          <p>{get('restaurant_name', 'Kalyani Restaurant')} Delivery Partner</p>
        </div>

        {!riderOtpSent ? (
          <form onSubmit={handleLogin} className="rider-login__form">
            <div className="rider-login__field">
              <Phone size={18} />
              <input
                type="tel"
                placeholder="Mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
              />
            </div>
            {error && <p className="rider-login__error">{error}</p>}
            <button type="submit" className="rider-login__btn" disabled={loading}>
              {loading ? <><Loader size={16} className="rider-spinner" /> Verifying...</> : 'Send OTP'}
            </button>
            <p className="rider-login__hint">Only registered riders can login. Contact admin to register.</p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="rider-login__form">
            <p className="rider-login__otp-info">OTP sent to +91 {phone} via SMS</p>
            <div className="rider-login__field">
              <Shield size={18} />
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
            </div>
            {error && <p className="rider-login__error">{error}</p>}
            <button type="submit" className="rider-login__btn" disabled={loading || otp.length < 6}>
              {loading ? <><Loader size={16} className="rider-spinner" /> Verifying...</> : 'Verify OTP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
