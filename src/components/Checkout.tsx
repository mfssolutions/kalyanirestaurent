import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, User, FileText, Navigation, Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrderContext';
import './Checkout.css';

interface CheckoutData {
  name: string;
  mobile: string;
  address: string;
  additionalAddress: string;
  additionalContact: string;
  deliveryNote: string;
  lat: number | null;
  lng: number | null;
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, deliveryFee, taxes, total } = useCart();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [form, setForm] = useState<CheckoutData>({
    name: user?.name || '',
    mobile: user?.mobile || '',
    address: '',
    additionalAddress: '',
    additionalContact: '',
    deliveryNote: '',
    lat: null,
    lng: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutData, string>>>({});

  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, name: user.name, mobile: user.mobile }));
    }
  }, [user]);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm(f => ({ ...f, lat: latitude, lng: longitude }));
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await resp.json();
          if (data.display_name) {
            setForm(f => ({ ...f, address: data.display_name }));
          }
        } catch {
          // Keep coordinates even if reverse geocoding fails
        }
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true }
    );
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.mobile || form.mobile.replace(/\D/g, '').length !== 10) newErrors.mobile = 'Valid mobile number required';
    if (!form.address.trim()) newErrors.address = 'Delivery address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setShowPayment(true);
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <p>Add items from the menu to proceed with checkout</p>
        <button onClick={() => navigate('/')}>Browse Menu</button>
      </div>
    );
  }

  if (showPayment) {
    return <PaymentSection form={form} />;
  }

  return (
    <div className="checkout">
      <div className="checkout__header">
        <button className="checkout__back" onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }}><ArrowLeft size={20} /> Back</button>
        <h1>Checkout</h1>
      </div>

      <div className="checkout__content">
        <form className="checkout__form" onSubmit={handleSubmit}>
          <div className="checkout__section">
            <h3>Delivery Details</h3>

            <div className="checkout__field">
              <label><User size={16} /> Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
              />
              {errors.name && <span className="checkout__error">{errors.name}</span>}
            </div>

            <div className="checkout__field">
              <label><Phone size={16} /> Mobile Number</label>
              <input
                type="tel"
                value={form.mobile}
                onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="10-digit mobile number"
              />
              {errors.mobile && <span className="checkout__error">{errors.mobile}</span>}
            </div>

            <div className="checkout__field">
              <label><MapPin size={16} /> Delivery Address</label>
              <div className="checkout__address-row">
                <textarea
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Enter delivery address"
                  rows={3}
                />
                <button
                  type="button"
                  className="checkout__locate-btn"
                  onClick={fetchCurrentLocation}
                  disabled={locationLoading}
                >
                  <Navigation size={16} />
                  {locationLoading ? 'Locating...' : 'Use Current'}
                </button>
              </div>
              {errors.address && <span className="checkout__error">{errors.address}</span>}
              {form.lat && form.lng && (
                <small className="checkout__coords">📍 {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</small>
              )}
            </div>

            <div className="checkout__field">
              <label><Plus size={16} /> Additional Address (optional)</label>
              <input
                type="text"
                value={form.additionalAddress}
                onChange={e => setForm(f => ({ ...f, additionalAddress: e.target.value }))}
                placeholder="Flat/Floor/Landmark"
              />
            </div>

            <div className="checkout__field">
              <label><Phone size={16} /> Additional Contact (optional)</label>
              <input
                type="tel"
                value={form.additionalContact}
                onChange={e => setForm(f => ({ ...f, additionalContact: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="Alternate phone number"
              />
            </div>

            <div className="checkout__field">
              <label><FileText size={16} /> Delivery Note (optional)</label>
              <textarea
                value={form.deliveryNote}
                onChange={e => setForm(f => ({ ...f, deliveryNote: e.target.value }))}
                placeholder="E.g., Ring the bell, leave at door"
                rows={2}
              />
            </div>
          </div>

          <button type="submit" className="checkout__pay-btn">
            Proceed to Payment — ₹{total}
          </button>
        </form>

        <div className="checkout__order-summary">
          <h3>Order Summary</h3>
          <div className="checkout__items">
            {items.map(({ item, quantity }) => (
              <div className="checkout__item" key={item.id}>
                <span className={`checkout__item-veg ${item.isVeg ? 'veg' : 'non-veg'}`}>●</span>
                <span className="checkout__item-name">{item.name} × {quantity}</span>
                <span className="checkout__item-price">₹{item.price * quantity}</span>
              </div>
            ))}
          </div>
          <div className="checkout__totals">
            <div><span>Subtotal</span><span>₹{subtotal}</span></div>
            <div><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
            <div><span>GST</span><span>₹{taxes}</span></div>
            <div className="checkout__grand-total"><span>Total</span><span>₹{total}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Payment section within checkout
function PaymentSection({ form }: { form: CheckoutData }) {
  const { items, subtotal, deliveryFee, taxes, total, clearCart } = useCart();
  const navigate = useNavigate();
  const { placeOrder } = useOrders();
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    try {
      const order = {
        id: crypto.randomUUID(),
        items: [...items],
        subtotal,
        deliveryFee,
        taxes,
        total,
        status: 'placed' as const,
        deliveryAddress: {
          id: crypto.randomUUID(),
          label: 'Delivery',
          fullAddress: form.address + (form.additionalAddress ? ', ' + form.additionalAddress : ''),
          lat: form.lat || undefined,
          lng: form.lng || undefined,
        },
        contactName: form.name,
        contactMobile: form.mobile,
        additionalContact: form.additionalContact || undefined,
        deliveryNote: form.deliveryNote || undefined,
        createdAt: new Date().toISOString(),
        paymentMethod: 'Cash on Delivery',
        customerLocation: form.lat && form.lng
          ? { lat: form.lat, lng: form.lng }
          : undefined,
      };
      placeOrder(order);
      clearCart();
      navigate('/order/' + order.id);
    } catch {
      setProcessing(false);
    }
  };

  return (
    <div className="payment-section">
      <h2>Confirm Your Order</h2>

      <div className="payment-methods">
        <label className="payment-method active">
          <input type="radio" name="payment" checked readOnly />
          <span>Cash on Delivery</span>
        </label>
      </div>

      <div className="payment-total">
        <span>Amount to Pay</span>
        <span>₹{total}</span>
      </div>

      <button className="payment-pay-btn" onClick={handlePay} disabled={processing}>
        {processing ? 'Placing Order...' : `Place Order — ₹${total}`}
      </button>
    </div>
  );
}
