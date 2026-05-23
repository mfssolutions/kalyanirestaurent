import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import './CartButton.css';

export default function CartButton() {
  const { totalItems, total } = useCart();
  const navigate = useNavigate();

  if (totalItems === 0) return null;

  return (
    <button className="cart-float-btn" onClick={() => navigate('/cart')}>
      <div className="cart-float-btn__left">
        <ShoppingCart size={18} />
        <span>{totalItems} item{totalItems > 1 ? 's' : ''}</span>
      </div>
      <div className="cart-float-btn__right">
        ₹{total} <span className="cart-float-btn__arrow">→</span>
      </div>
    </button>
  );
}
