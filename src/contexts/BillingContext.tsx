import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { BillingUser, BillingSession, Bill, BillItem, Kot, KotItem, BillingPayment, Credit, MenuItem, AccountHead } from '../types';
import { supabase } from '../lib/supabase';
import { toMenuItem, toBillingUser, toBillingSession, toBill, toKot, toAccountHead, toBillingPayment, toCredit } from '../lib/mappers';

interface BillingContextType {
  // Auth
  billingUser: BillingUser | null;
  isBillingAuth: boolean;
  billingLogin: (phone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  billingLogout: () => void;
  // Session
  session: BillingSession | null;
  dayStarted: boolean;
  startDay: () => Promise<void>;
  closeDay: () => Promise<void>;
  // Menu
  menuItems: MenuItem[];
  // Bills
  bills: Bill[];
  saveBill: (items: BillItem[], subtotal: number, discountAmount: number, discountPercent: number, gstAmount: number, total: number, paymentMode: 'cash' | 'online' | 'credit', creditName?: string, creditPhone?: string) => Promise<Bill | null>;
  // KOT
  kots: Kot[];
  saveKot: (items: KotItem[], description?: string) => Promise<Kot | null>;
  // Payments
  payments: BillingPayment[];
  accountHeads: AccountHead[];
  savePayment: (accountHead: string, description: string, paidTo: string, amount: number, mode: 'cash' | 'online') => Promise<BillingPayment | null>;
  // Credits
  credits: Credit[];
  payCredit: (creditId: string, amount: number, mode: 'cash' | 'online') => Promise<void>;
  settleCredit: (creditId: string) => Promise<void>;
}

const BillingContext = createContext<BillingContextType | null>(null);

export const useBilling = () => {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used within BillingProvider');
  return ctx;
};

const BILLING_STORAGE = 'kalyani_billing_user';

export function BillingProvider({ children }: { children: ReactNode }) {
  const [billingUser, setBillingUser] = useState<BillingUser | null>(() => {
    const saved = localStorage.getItem(BILLING_STORAGE);
    return saved ? JSON.parse(saved) : null;
  });
  const isBillingAuth = !!billingUser;

  // Persist billing user to localStorage (exclude PIN for security)
  useEffect(() => {
    if (billingUser) {
      const { pin: _, ...safeUser } = billingUser;
      void _;
      localStorage.setItem(BILLING_STORAGE, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(BILLING_STORAGE);
    }
  }, [billingUser]);

  const [session, setSession] = useState<BillingSession | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [kots, setKots] = useState<Kot[]>([]);
  const [payments, setPayments] = useState<BillingPayment[]>([]);
  const [accountHeads, setAccountHeads] = useState<AccountHead[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);

  const dayStarted = !!session?.isOpen;
  const today = new Date().toISOString().slice(0, 10);

  // Load menu items + subscribe to realtime stock changes
  useEffect(() => {
    const fetchMenuItems = () => {
      supabase.from('menu_items').select('*').then(({ data }) => {
        if (data) setMenuItems(data.map(toMenuItem));
      });
    };
    fetchMenuItems();

    const ch = supabase.channel('billing_menu_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchMenuItems();
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  // Load account heads
  useEffect(() => {
    supabase.from('account_heads').select('*').order('name').then(({ data }) => {
      if (data) setAccountHeads(data.map(toAccountHead));
    });
  }, []);

  // Load all credits (unsettled) + subscribe to changes
  useEffect(() => {
    const fetchCredits = () => {
      supabase.from('credits').select('*').eq('is_settled', false).order('created_at', { ascending: false }).then(({ data }) => {
        if (data) setCredits(data.map(toCredit));
      });
    };
    fetchCredits();

    const ch = supabase.channel('credits_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credits' }, () => {
        fetchCredits();
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  // Load session for today when user is authenticated
  useEffect(() => {
    if (!billingUser) { setSession(null); return; }

    supabase
      .from('billing_sessions')
      .select('*')
      .eq('user_id', billingUser.id)
      .eq('session_date', today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSession(toBillingSession(data));
        else setSession(null);
      });
  }, [billingUser, today]);

  // Load bills, kots, payments for current session
  useEffect(() => {
    if (!session) { setBills([]); setKots([]); setPayments([]); return; }

    supabase.from('bills').select('*').eq('session_id', session.id).order('bill_no', { ascending: false }).then(({ data }) => {
      if (data) setBills(data.map(toBill));
    });
    supabase.from('kots').select('*').eq('session_id', session.id).order('kot_no', { ascending: false }).then(({ data }) => {
      if (data) setKots(data.map(toKot));
    });
    supabase.from('billing_payments').select('*').eq('session_id', session.id).order('payment_no', { ascending: false }).then(({ data }) => {
      if (data) setPayments(data.map(toBillingPayment));
    });

    // Realtime for bills
    const ch = supabase.channel(`billing_${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills', filter: `session_id=eq.${session.id}` }, () => {
        supabase.from('bills').select('*').eq('session_id', session.id).order('bill_no', { ascending: false }).then(({ data }) => {
          if (data) setBills(data.map(toBill));
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kots', filter: `session_id=eq.${session.id}` }, () => {
        supabase.from('kots').select('*').eq('session_id', session.id).order('kot_no', { ascending: false }).then(({ data }) => {
          if (data) setKots(data.map(toKot));
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billing_payments', filter: `session_id=eq.${session.id}` }, () => {
        supabase.from('billing_payments').select('*').eq('session_id', session.id).order('payment_no', { ascending: false }).then(({ data }) => {
          if (data) setPayments(data.map(toBillingPayment));
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [session]);

  const billingLogin = useCallback(async (phone: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    // Use server-side RPC to bypass RLS for login check
    const { data, error } = await supabase.rpc('billing_login_check', {
      p_phone: phone,
      p_pin: pin,
    });

    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: 'Invalid phone or PIN' };
    setBillingUser(toBillingUser(data as Record<string, unknown>));
    return { success: true };
  }, []);

  const billingLogout = useCallback(() => {
    setBillingUser(null);
    setSession(null);
    setBills([]);
    setKots([]);
    setPayments([]);
  }, []);

  const startDay = useCallback(async () => {
    if (!billingUser) return;
    const { data, error } = await supabase
      .from('billing_sessions')
      .insert({
        user_id: billingUser.id,
        user_name: billingUser.name,
        session_date: today,
        is_open: true,
      })
      .select()
      .single();

    if (!error && data) setSession(toBillingSession(data));
  }, [billingUser, today]);

  const closeDay = useCallback(async () => {
    if (!session) return;
    await supabase.from('billing_sessions').update({
      is_open: false,
      closed_at: new Date().toISOString(),
    }).eq('id', session.id);
    setSession(prev => prev ? { ...prev, isOpen: false, closedAt: new Date().toISOString() } : null);
  }, [session]);

  const saveBill = useCallback(async (
    items: BillItem[], subtotal: number, discountAmount: number, discountPercent: number,
    gstAmount: number, total: number, paymentMode: 'cash' | 'online' | 'credit',
    creditName?: string, creditPhone?: string
  ): Promise<Bill | null> => {
    if (!session || !billingUser) return null;

    const { data, error } = await supabase
      .from('bills')
      .insert({
        session_id: session.id,
        user_id: billingUser.id,
        items,
        subtotal,
        discount_amount: discountAmount,
        discount_percent: discountPercent,
        gst_amount: gstAmount,
        total,
        payment_mode: paymentMode,
        credit_name: creditName || null,
        credit_phone: creditPhone || null,
      })
      .select()
      .single();

    if (error || !data) { console.error('Save bill error:', error?.message); return null; }

    const bill = toBill(data);
    setBills(prev => [bill, ...prev]);

    // Deduct stock from menu_items
    for (const item of items) {
      const { error: rpcError } = await supabase.rpc('decrement_qty', { item_id: item.itemId, amount: item.qty });
      if (rpcError) {
        // Fallback: manual update if RPC not available
        const { data: row } = await supabase.from('menu_items').select('qty').eq('id', item.itemId).single();
        if (row) {
          const newQty = Math.max(0, (Number(row.qty) || 0) - item.qty);
          await supabase.from('menu_items').update({ qty: newQty }).eq('id', item.itemId);
        }
      }
    }

    // If credit, save credit record
    if (paymentMode === 'credit' && creditName && creditPhone) {
      const { data: cData } = await supabase.from('credits').insert({
        bill_id: bill.id,
        bill_no: bill.billNo,
        name: creditName,
        phone: creditPhone,
        total_amount: total,
        paid_amount: 0,
        is_settled: false,
      }).select().single();

      if (cData) setCredits(prev => [toCredit(cData), ...prev]);
    }

    return bill;
  }, [session, billingUser]);

  const saveKot = useCallback(async (items: KotItem[], description?: string): Promise<Kot | null> => {
    if (!session || !billingUser) return null;

    const { data, error } = await supabase
      .from('kots')
      .insert({
        session_id: session.id,
        user_id: billingUser.id,
        items,
        description: description || null,
      })
      .select()
      .single();

    if (error || !data) return null;
    const kot = toKot(data);
    setKots(prev => [kot, ...prev]);
    return kot;
  }, [session, billingUser]);

  const savePayment = useCallback(async (
    accountHead: string, description: string, paidTo: string, amount: number, mode: 'cash' | 'online'
  ): Promise<BillingPayment | null> => {
    if (!session || !billingUser) return null;

    const { data, error } = await supabase
      .from('billing_payments')
      .insert({
        session_id: session.id,
        user_id: billingUser.id,
        account_head: accountHead,
        description: description || null,
        paid_to: paidTo || null,
        amount,
        mode,
      })
      .select()
      .single();

    if (error || !data) return null;
    const pmt = toBillingPayment(data);
    setPayments(prev => [pmt, ...prev]);
    return pmt;
  }, [session, billingUser]);

  const payCredit = useCallback(async (creditId: string, amount: number, mode: 'cash' | 'online') => {
    // Insert credit payment
    await supabase.from('credit_payments').insert({
      credit_id: creditId,
      amount,
      mode,
    });

    // Update credit's paid_amount
    const credit = credits.find(c => c.id === creditId);
    if (credit) {
      const newPaid = credit.paidAmount + amount;
      const settled = newPaid >= credit.totalAmount;
      await supabase.from('credits').update({
        paid_amount: newPaid,
        is_settled: settled,
        settled_at: settled ? new Date().toISOString() : null,
      }).eq('id', creditId);

      setCredits(prev => prev.map(c => c.id === creditId
        ? { ...c, paidAmount: newPaid, isSettled: settled, settledAt: settled ? new Date().toISOString() : undefined }
        : c
      ).filter(c => !c.isSettled));
    }
  }, [credits]);

  const settleCredit = useCallback(async (creditId: string) => {
    const credit = credits.find(c => c.id === creditId);
    if (!credit) return;
    const remaining = credit.totalAmount - credit.paidAmount;
    if (remaining > 0) {
      await supabase.from('credit_payments').insert({
        credit_id: creditId,
        amount: remaining,
        mode: 'cash',
      });
    }
    await supabase.from('credits').update({
      paid_amount: credit.totalAmount,
      is_settled: true,
      settled_at: new Date().toISOString(),
    }).eq('id', creditId);

    setCredits(prev => prev.filter(c => c.id !== creditId));
  }, [credits]);

  return (
    <BillingContext.Provider value={{
      billingUser, isBillingAuth, billingLogin, billingLogout,
      session, dayStarted, startDay, closeDay,
      menuItems,
      bills, saveBill,
      kots, saveKot,
      payments, accountHeads, savePayment,
      credits, payCredit, settleCredit,
    }}>
      {children}
    </BillingContext.Provider>
  );
}
