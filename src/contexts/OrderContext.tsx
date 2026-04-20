import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Order, OrderStatus } from '../types';
import { supabase } from '../lib/supabase';
import { toOrder, fromOrder } from '../lib/mappers';

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  placeOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  setCurrentOrder: (order: Order | null) => void;
  getOrderById: (orderId: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | null>(null);

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
};

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get the authenticated user's ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch orders scoped to authenticated user
  useEffect(() => {
    if (!userId) {
      setOrders([]);
      return;
    }
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setOrders(data.map(toOrder));
        }
      });
  }, [userId]);

  // Subscribe to realtime order updates scoped to current user
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('orders_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = toOrder(payload.new);
          setOrders(prev => {
            if (prev.find(o => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = toOrder(payload.new);
          setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
          setCurrentOrder(prev => prev?.id === updated.id ? updated : prev);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Rider GPS is pushed to Supabase by the rider app (RiderContext),
  // and the realtime subscription above updates the order automatically.

  const placeOrder = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev]);
    setCurrentOrder(order);

    // Save to Supabase with user_id
    supabase
      .from('orders')
      .insert(fromOrder(order, userId ?? undefined))
      .then(({ error }) => {
        if (error) console.error('Place order error:', error.message);
      });
  }, [userId]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    setCurrentOrder(prev => prev?.id === orderId ? { ...prev, status } : prev);

    supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .then(({ error }) => {
        if (error) console.error('Update order status error:', error.message);
      });
  }, []);

  const getOrderById = useCallback((orderId: string) => {
    return orders.find(o => o.id === orderId);
  }, [orders]);

  return (
    <OrderContext.Provider value={{ orders, currentOrder, placeOrder, updateOrderStatus, setCurrentOrder, getOrderById }}>
      {children}
    </OrderContext.Provider>
  );
}
