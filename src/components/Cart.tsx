import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

export default function Cart() {
  const { items, isCartOpen, closeCart, addItem, removeItem, totalItems, subtotal, deliveryFee, taxes, total } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  return (
    <>
      {isCartOpen && <div className="cart-overlay" onClick={closeCart} />}
      <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2><ShoppingBag size={20} /> Your Cart ({totalItems})</h2>
          <button className="cart-close" onClick={closeCart}><X size={22} /></button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={48} strokeWidth={1} />
            <p>Your cart is empty</p>
            <span>Add items from the menu to get started</span>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(({ item, quantity }) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item__info">
                    <span className={`cart-item__veg ${item.isVeg ? 'veg' : 'non-veg'}`}>●</span>
                    <div>
                      <p className="cart-item__name">{item.name}</p>
                      <p className="cart-item__price">₹{item.price}</p>
                    </div>
                  </div>
                  <div className="cart-item__controls">
                    <div className="cart-item__qty">
                      <button onClick={() => removeItem(item.id)}><Minus size={14} /></button>
                      <span>{quantity}</span>
                      <button onClick={() => addItem(item)}><Plus size={14} /></button>
                    </div>
                    <p className="cart-item__total">₹{item.price * quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="cart-summary__row">
                <span>Subtotal</span><span>₹{subtotal}</span>
              </div>
              <div className="cart-summary__row">
                <span>Delivery Fee</span><span>₹{deliveryFee}</span>
              </div>
              <div className="cart-summary__row">
                <span>Taxes (GST)</span><span>₹{taxes}</span>
              </div>
              <div className="cart-summary__row total">
                <span>Total</span><span>₹{total}</span>
              </div>
              <button className="cart-checkout-btn" onClick={handleCheckout}>
                {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
