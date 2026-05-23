import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { ConfirmationResult } from 'firebase/auth';
import type { MenuItem, HeroBanner, Category, Offer, Order, OrderStatus, Rider, BillingUser, AccountHead } from '../types';
import { supabase } from '../lib/supabase';
import { sendPhoneOtp, resetRecaptcha } from '../lib/firebase';
import { toMenuItem, fromMenuItem, toBanner, fromBanner, toCategory, fromCategory, toOffer, fromOffer, toOrder, toRider, fromRider, toBillingUser, fromBillingUser, toAccountHead, fromAccountHead } from '../lib/mappers';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  adminLogin: (mobile: string) => Promise<{ success: boolean; error?: string }>;
  adminVerifyOtp: (otp: string) => Promise<boolean>;
  adminLogout: () => void;
  adminOtpSent: boolean;
  menuItems: MenuItem[];
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  banners: HeroBanner[];
  addBanner: (banner: HeroBanner) => void;
  updateBanner: (banner: HeroBanner) => void;
  deleteBanner: (id: string) => void;
  offers: Offer[];
  addOffer: (offer: Offer) => void;
  updateOffer: (offer: Offer) => void;
  deleteOffer: (id: string) => void;
  categories: Category[];
  addCategory: (cat: Category) => void;
  updateCategory: (cat: Category) => void;
  deleteCategory: (id: string) => void;
  adminOrders: Order[];
  acceptOrder: (orderId: string) => void;
  rejectOrder: (orderId: string, reason: string) => Promise<void>;
  startRide: (orderId: string) => void;
  riders: Rider[];
  addRider: (rider: Rider) => void;
  updateRider: (rider: Rider) => void;
  deleteRider: (id: string) => void;
  assignRider: (orderId: string, rider: Rider) => void;
  billingUsers: BillingUser[];
  addBillingUser: (user: BillingUser) => void;
  updateBillingUser: (user: BillingUser) => void;
  deleteBillingUser: (id: string) => void;
  accountHeads: AccountHead[];
  addAccountHead: (head: AccountHead) => void;
  updateAccountHead: (head: AccountHead) => void;
  deleteAccountHead: (id: string) => void;
  uploadMenuImage: (file: File, onProgress: (pct: number) => void) => Promise<string | null>;
  uploadBannerImage: (file: File, onProgress: (pct: number) => void) => Promise<string | null>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('kalyani_admin_auth') === 'true';
  });
  const [adminOtpSent, setAdminOtpSent] = useState(false);

  const reportError = (label: string, error: { message?: string } | null) => {
    if (!error) return;
    console.error(`${label}:`, error.message);
    if (typeof window !== 'undefined') alert(`${label}: ${error.message || 'unknown error'}`);
  };

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [billingUsers, setBillingUsers] = useState<BillingUser[]>([]);
  const [accountHeads, setAccountHeads] = useState<AccountHead[]>([]);

  // Fetch data from Supabase on mount
  useEffect(() => {
    supabase.from('menu_items').select('*').then(({ data, error }) => {
      if (!error && data && data.length > 0) setMenuItems(data.map(toMenuItem));
    });
    supabase.from('banners').select('*').then(({ data, error }) => {
      if (!error && data && data.length > 0) setBanners(data.map(toBanner));
    });
    supabase.from('offers').select('*').then(({ data, error }) => {
      if (!error && data && data.length > 0) setOffers(data.map(toOffer));
    });
    supabase.from('categories').select('*').order('sort_order').then(({ data, error }) => {
      if (!error && data && data.length > 0) setCategories(data.map(toCategory));
    });
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data) setAdminOrders(data.map(toOrder));
    });
    supabase.from('riders').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data) setRiders(data.map(toRider));
    });
    supabase.from('billing_users').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data) setBillingUsers(data.map(toBillingUser));
    });
    supabase.from('account_heads').select('*').order('name').then(({ data, error }) => {
      if (!error && data) setAccountHeads(data.map(toAccountHead));
    });
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const menuChannel = supabase
      .channel('menu_items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        supabase.from('menu_items').select('*').then(({ data }) => {
          if (data) setMenuItems(data.map(toMenuItem));
        });
      })
      .subscribe();

    const bannersChannel = supabase
      .channel('banners_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
        supabase.from('banners').select('*').then(({ data }) => {
          if (data) setBanners(data.map(toBanner));
        });
      })
      .subscribe();

    const offersChannel = supabase
      .channel('offers_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        supabase.from('offers').select('*').then(({ data }) => {
          if (data) setOffers(data.map(toOffer));
        });
      })
      .subscribe();

    const catsChannel = supabase
      .channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
          if (data) setCategories(data.map(toCategory));
        });
      })
      .subscribe();

    const ordersChannel = supabase
      .channel('admin_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setAdminOrders(data.map(toOrder));
        });
      })
      .subscribe();

    const ridersChannel = supabase
      .channel('admin_riders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'riders' }, () => {
        supabase.from('riders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setRiders(data.map(toRider));
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(bannersChannel);
      supabase.removeChannel(offersChannel);
      supabase.removeChannel(catsChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(ridersChannel);
    };
  }, []);

  const adminConfirmationRef = useRef<ConfirmationResult | null>(null);
  const ADMIN_RECAPTCHA = 'recaptcha-admin';

  const adminLogin = useCallback(async (mobile: string): Promise<{ success: boolean; error?: string }> => {
    // Verify phone belongs to an admin via SECURITY DEFINER RPC
    const { data: isAdmin, error } = await supabase.rpc('is_admin_phone', { p_phone: mobile });
    if (error) return { success: false, error: error.message };
    if (!isAdmin) return { success: false, error: 'This number is not registered as an admin' };

    try {
      const confirmation = await sendPhoneOtp(`+91${mobile}`, ADMIN_RECAPTCHA);
      adminConfirmationRef.current = confirmation;
      setAdminOtpSent(true);
      return { success: true };
    } catch (err) {
      resetRecaptcha(ADMIN_RECAPTCHA);
      return { success: false, error: (err as Error).message || 'Failed to send OTP' };
    }
  }, []);

  const adminVerifyOtp = useCallback(async (otp: string): Promise<boolean> => {
    if (!adminConfirmationRef.current) return false;
    try {
      await adminConfirmationRef.current.confirm(otp);
      setIsAdminAuthenticated(true);
      localStorage.setItem('kalyani_admin_auth', 'true');
      setAdminOtpSent(false);
      adminConfirmationRef.current = null;
      return true;
    } catch {
      return false;
    }
  }, []);

  const adminLogout = useCallback(() => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('kalyani_admin_auth');
    resetRecaptcha(ADMIN_RECAPTCHA);
    adminConfirmationRef.current = null;
  }, []);

  // Menu Items CRUD
  const addMenuItem = useCallback((item: MenuItem) => {
    setMenuItems(prev => [...prev, item]);
    supabase.from('menu_items').insert(fromMenuItem(item)).then(({ error }) => {
      reportError('Add menu item', error);
    });
  }, []);

  const updateMenuItem = useCallback((item: MenuItem) => {
    setMenuItems(prev => prev.map(m => m.id === item.id ? item : m));
    supabase.from('menu_items').update(fromMenuItem(item)).eq('id', item.id).then(({ error }) => {
      reportError('Update menu item', error);
    });
  }, []);

  const deleteMenuItem = useCallback((id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
    supabase.from('menu_items').delete().eq('id', id).then(({ error }) => {
      reportError('Delete menu item', error);
    });
  }, []);

  // Banners CRUD
  const addBanner = useCallback((banner: HeroBanner) => {
    setBanners(prev => [...prev, banner]);
    supabase.from('banners').insert(fromBanner(banner)).then(({ error }) => {
      reportError('Add banner', error);
    });
  }, []);

  const updateBanner = useCallback((banner: HeroBanner) => {
    setBanners(prev => prev.map(b => b.id === banner.id ? banner : b));
    supabase.from('banners').update(fromBanner(banner)).eq('id', banner.id).then(({ error }) => {
      reportError('Update banner', error);
    });
  }, []);

  const deleteBanner = useCallback((id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
    supabase.from('banners').delete().eq('id', id).then(({ error }) => {
      reportError('Delete banner', error);
    });
  }, []);

  // Offers CRUD
  const addOffer = useCallback((offer: Offer) => {
    setOffers(prev => [...prev, offer]);
    supabase.from('offers').insert(fromOffer(offer)).then(({ error }) => {
      reportError('Add offer', error);
    });
  }, []);

  const updateOffer = useCallback((offer: Offer) => {
    setOffers(prev => prev.map(o => o.id === offer.id ? offer : o));
    supabase.from('offers').update(fromOffer(offer)).eq('id', offer.id).then(({ error }) => {
      reportError('Update offer', error);
    });
  }, []);

  const deleteOffer = useCallback((id: string) => {
    setOffers(prev => prev.filter(o => o.id !== id));
    supabase.from('offers').delete().eq('id', id).then(({ error }) => {
      reportError('Delete offer', error);
    });
  }, []);

  // Categories CRUD
  const addCategory = useCallback((cat: Category) => {
    setCategories(prev => [...prev, cat]);
    supabase.from('categories').insert(fromCategory(cat)).then(({ error }) => {
      reportError('Add category', error);
    });
  }, []);

  const updateCategory = useCallback((cat: Category) => {
    setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
    supabase.from('categories').update(fromCategory(cat)).eq('id', cat.id).then(({ error }) => {
      reportError('Update category', error);
    });
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    supabase.from('categories').delete().eq('id', id).then(({ error }) => {
      reportError('Delete category', error);
    });
  }, []);

  // Order management
  const acceptOrder = useCallback((orderId: string) => {
    setAdminOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'accepted' as OrderStatus } : o));
    supabase.from('orders').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', orderId).then(({ error }) => {
      if (error) console.error('Accept order error:', error.message);
    });
  }, []);

  const rejectOrder = useCallback(async (orderId: string, reason: string) => {
    setAdminOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected' as OrderStatus, rejectionReason: reason } : o));
    const { error: rejectError } = await supabase.from('orders').update({
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);
    if (rejectError) console.error('Reject order error:', rejectError.message);

    // Send SMS notification via server-side Edge Function
    const order = adminOrders.find(o => o.id === orderId);
    if (order?.contactMobile) {
      try {
        await supabase.functions.invoke('send-sms', {
          body: {
            to: order.contactMobile,
            message: `ORDER CANCELLED DUE TO ${reason}. Sorry for the inconvenience. - Kalyani Restaurant`,
          },
        });
      } catch (e) {
        console.error('SMS send error:', e);
      }
    }
  }, [adminOrders]);

  const startRide = useCallback((orderId: string) => {
    setAdminOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'out-for-delivery' as OrderStatus } : o));
    supabase.from('orders').update({
      status: 'out-for-delivery',
      updated_at: new Date().toISOString(),
    }).eq('id', orderId).then(({ error }) => {
      if (error) console.error('Start ride error:', error.message);
    });
  }, []);

  // Riders CRUD
  const addRider = useCallback((rider: Rider) => {
    setRiders(prev => [rider, ...prev]);
    supabase.from('riders').insert(fromRider(rider)).then(({ error }) => {
      reportError('Add rider', error);
    });
  }, []);

  const updateRider = useCallback((rider: Rider) => {
    setRiders(prev => prev.map(r => r.id === rider.id ? rider : r));
    supabase.from('riders').update(fromRider(rider)).eq('id', rider.id).then(({ error }) => {
      reportError('Update rider', error);
    });
  }, []);

  const deleteRider = useCallback((id: string) => {
    setRiders(prev => prev.filter(r => r.id !== id));
    supabase.from('riders').delete().eq('id', id).then(({ error }) => {
      reportError('Delete rider', error);
    });
  }, []);

  // Assign rider to order
  const assignRider = useCallback((orderId: string, rider: Rider) => {
    setAdminOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      riderId: rider.id,
      riderName: rider.name,
      riderPhone: rider.phone,
      riderLocation: rider.currentLat && rider.currentLng
        ? { lat: rider.currentLat, lng: rider.currentLng }
        : undefined,
    } : o));
    supabase.from('orders').update({
      rider_id: rider.id,
      rider_name: rider.name,
      rider_phone: rider.phone,
      rider_location: rider.currentLat && rider.currentLng
        ? { lat: rider.currentLat, lng: rider.currentLng }
        : null,
      updated_at: new Date().toISOString(),
    }).eq('id', orderId).then(({ error }) => {
      if (error) console.error('Assign rider error:', error.message);
    });
  }, []);

  // Billing Users CRUD
  const addBillingUser = useCallback((user: BillingUser) => {
    setBillingUsers(prev => [user, ...prev]);
    supabase.from('billing_users').insert(fromBillingUser(user)).then(({ error }) => {
      if (error) console.error('Add billing user error:', error.message);
    });
  }, []);

  const updateBillingUser = useCallback((user: BillingUser) => {
    setBillingUsers(prev => prev.map(u => u.id === user.id ? user : u));
    supabase.from('billing_users').update(fromBillingUser(user)).eq('id', user.id).then(({ error }) => {
      if (error) console.error('Update billing user error:', error.message);
    });
  }, []);

  const deleteBillingUser = useCallback((id: string) => {
    setBillingUsers(prev => prev.filter(u => u.id !== id));
    supabase.from('billing_users').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Delete billing user error:', error.message);
    });
  }, []);

  // Account Heads CRUD
  const addAccountHead = useCallback((head: AccountHead) => {
    setAccountHeads(prev => [...prev, head]);
    supabase.from('account_heads').insert(fromAccountHead(head)).then(({ error }) => {
      if (error) console.error('Add account head error:', error.message);
    });
  }, []);

  const updateAccountHead = useCallback((head: AccountHead) => {
    setAccountHeads(prev => prev.map(h => h.id === head.id ? head : h));
    supabase.from('account_heads').update(fromAccountHead(head)).eq('id', head.id).then(({ error }) => {
      if (error) console.error('Update account head error:', error.message);
    });
  }, []);

  const deleteAccountHead = useCallback((id: string) => {
    setAccountHeads(prev => prev.filter(h => h.id !== id));
    supabase.from('account_heads').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Delete account head error:', error.message);
    });
  }, []);

  // Image upload to Supabase Storage
  const uploadMenuImage = useCallback(async (file: File, onProgress: (pct: number) => void): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `menu_${Date.now()}.${ext}`;

    // Simulate progress since Supabase JS client doesn't expose upload progress
    let progressInterval: ReturnType<typeof setInterval>;
    let currentPct = 0;
    const startProgress = () => {
      progressInterval = setInterval(() => {
        currentPct = Math.min(currentPct + Math.random() * 15, 90);
        onProgress(Math.round(currentPct));
      }, 200);
    };
    startProgress();

    const { error } = await supabase.storage.from('menu-images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

    clearInterval(progressInterval!);

    if (error) {
      onProgress(0);
      console.error('Upload error:', error.message);
      return null;
    }

    onProgress(100);
    const { data: publicUrl } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    return publicUrl.publicUrl;
  }, []);

  // Banner image upload to Supabase Storage
  const uploadBannerImage = useCallback(async (file: File, onProgress: (pct: number) => void): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `banner_${Date.now()}.${ext}`;

    let progressInterval: ReturnType<typeof setInterval>;
    let currentPct = 0;
    progressInterval = setInterval(() => {
      currentPct = Math.min(currentPct + Math.random() * 15, 90);
      onProgress(Math.round(currentPct));
    }, 200);

    const { error } = await supabase.storage.from('menu-images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

    clearInterval(progressInterval!);

    if (error) {
      onProgress(0);
      console.error('Banner upload error:', error.message);
      return null;
    }

    onProgress(100);
    const { data: publicUrl } = supabase.storage.from('menu-images').getPublicUrl(fileName);
    return publicUrl.publicUrl;
  }, []);

  return (
    <AdminContext.Provider value={{
      isAdminAuthenticated, adminLogin, adminVerifyOtp, adminLogout, adminOtpSent,
      menuItems, addMenuItem, updateMenuItem, deleteMenuItem,
      banners, addBanner, updateBanner, deleteBanner,
      offers, addOffer, updateOffer, deleteOffer,
      categories, addCategory, updateCategory, deleteCategory,
      adminOrders, acceptOrder, rejectOrder, startRide,
      riders, addRider, updateRider, deleteRider, assignRider,
      billingUsers, addBillingUser, updateBillingUser, deleteBillingUser,
      accountHeads, addAccountHead, updateAccountHead, deleteAccountHead,
      uploadMenuImage,
      uploadBannerImage,
    }}>
      {children}
    </AdminContext.Provider>
  );
}
