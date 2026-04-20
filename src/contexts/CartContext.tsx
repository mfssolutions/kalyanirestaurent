import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CartItem, MenuItem } from '../types';
import { useConfig } from './ConfigContext';

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getItemQuantity: (itemId: string) => number;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

const CART_STORAGE_KEY = 'kalyani_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { get } = useConfig();
  const DELIVERY_FEE = Number(get('delivery_fee', '30'));
  const DEFAULT_TAX_RATE = Number(get('default_tax_rate', '5'));
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: MenuItem) => {
    setItems(prev => {
      const existing = prev.find(ci => ci.item.id === item.id);
      if (existing) {
        return prev.map(ci => ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => {
      const existing = prev.find(ci => ci.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(ci => ci.item.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci);
      }
      return prev.filter(ci => ci.item.id !== itemId);
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(ci => ci.item.id !== itemId));
    } else {
      setItems(prev => prev.map(ci => ci.item.id === itemId ? { ...ci, quantity } : ci));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen(p => !p), []);

  const getItemQuantity = useCallback((itemId: string) => {
    return items.find(ci => ci.item.id === itemId)?.quantity || 0;
  }, [items]);

  const totalItems = items.reduce((acc, ci) => acc + ci.quantity, 0);
  const subtotal = items.reduce((acc, ci) => acc + ci.item.price * ci.quantity, 0);
  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
  const taxes = Math.round(items.reduce((acc, ci) => {
    const rate = (ci.item.tax ?? DEFAULT_TAX_RATE) / 100;
    return acc + ci.item.price * ci.quantity * rate;
  }, 0));
  const total = subtotal + deliveryFee + taxes;

  return (
    <CartContext.Provider value={{
      items, isCartOpen, addItem, removeItem, updateQuantity, clearCart,
      openCart, closeCart, toggleCart, getItemQuantity,
      totalItems, subtotal, deliveryFee, taxes, total,
    }}>
      {children}
    </CartContext.Provider>
  );
}
