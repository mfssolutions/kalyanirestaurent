import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import NativeTopBar from '../native/NativeTopBar';
import { isNative } from '../native/initNative';
import './CartPage.css';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, addItem, removeItem, updateQuantity, totalItems, subtotal, deliveryFee, taxes, total } = useCart();
  const { isAuthenticated } = useAuth();
  const native = isNative();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="cart-page">
      {native ? (
        <NativeTopBar title={`Your Cart${totalItems > 0 ? ` (${totalItems})` : ''}`} />
      ) : (
        <div className="cart-page__topbar">
          <button className="cart-page__back" onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }} aria-label="Back">
            <ArrowLeft size={22} />
          </button>
          <h1>Your Cart {totalItems > 0 && <span className="cart-page__count">({totalItems})</span>}</h1>
        </div>
      )}

      <div className="cart-page__body">
        {items.length === 0 ? (
          <div className="cart-page__empty">
            <ShoppingBag size={64} strokeWidth={1} />
            <p>Your cart is empty</p>
            <span>Add items from the menu to get started</span>
            <button className="cart-page__shop-btn" onClick={() => navigate('/')}>Browse Menu</button>
          </div>
        ) : (
          <>
            <div className="cart-page__items">
              {items.map(({ item, quantity }) => (
                <div className="cart-page__item" key={item.id}>
                  <div className="cart-page__item-info">
                    <span className={`cart-page__veg ${item.isVeg ? 'veg' : 'non-veg'}`}>●</span>
                    <div>
                      <p className="cart-page__item-name">{item.name}</p>
                      <p className="cart-page__item-price">₹{item.price}</p>
                    </div>
                  </div>
                  <div className="cart-page__item-controls">
                    <div className="cart-page__qty">
                      <button onClick={() => removeItem(item.id)} aria-label="Decrease"><Minus size={14} /></button>
                      <span>{quantity}</span>
                      <button onClick={() => addItem(item)} aria-label="Increase"><Plus size={14} /></button>
                    </div>
                    <p className="cart-page__item-total">₹{item.price * quantity}</p>
                    <button className="cart-page__remove" onClick={() => updateQuantity(item.id, 0)} aria-label="Remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-page__summary">
              <div className="cart-page__row"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="cart-page__row"><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
              <div className="cart-page__row"><span>Taxes (GST)</span><span>₹{taxes}</span></div>
              <div className="cart-page__row total"><span>Total</span><span>₹{total}</span></div>
              <button className="cart-page__checkout" onClick={handleCheckout}>
                {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
