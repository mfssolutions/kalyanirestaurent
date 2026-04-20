import { useState } from 'react';
import { Receipt, Phone, Lock, Loader } from 'lucide-react';
import { useBilling } from '../contexts/BillingContext';
import { useConfig } from '../contexts/ConfigContext';
import './Billing.css';

export default function BillingLogin() {
  const { billingLogin } = useBilling();
  const { get } = useConfig();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await billingLogin(phone, pin);
    setLoading(false);
    if (!result.success) setError(result.error || 'Login failed');
  };

  return (
    <div className="billing-login">
      <div className="billing-login__card">
        <div className="billing-login__header">
          <Receipt size={36} />
          <h2>Billing Login</h2>
          <p>{get('restaurant_name', 'Kalyani Restaurant')} POS</p>
        </div>
        <form onSubmit={handleLogin} className="billing-login__form">
          <div className="billing-login__field">
            <Phone size={18} />
            <input type="tel" placeholder="Mobile number" value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} />
          </div>
          <div className="billing-login__field">
            <Lock size={18} />
            <input type="password" placeholder="PIN" value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
          </div>
          {error && <p className="billing-login__error">{error}</p>}
          <button type="submit" className="billing-login__btn" disabled={loading || phone.length < 10 || pin.length < 4}>
            {loading ? <><Loader size={16} className="billing-spinner" /> Logging in...</> : 'Login'}
          </button>
          <p className="billing-login__hint">Contact admin for billing access</p>
        </form>
      </div>
    </div>
  );
}
