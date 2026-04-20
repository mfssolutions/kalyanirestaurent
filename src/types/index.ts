export type MenuCategory = string;

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image?: string;
  isVeg: boolean;
  isAvailable: boolean;
  offer?: string;
  qty?: number;
  productCode?: string;
  tax?: number;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  mobile: string;
  addresses: Address[];
}

export interface Address {
  id: string;
  label: string;
  fullAddress: string;
  lat?: number;
  lng?: number;
}

export type OrderStatus = 'placed' | 'accepted' | 'rejected' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered';

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
  status: OrderStatus;
  rejectionReason?: string;
  deliveryAddress: Address;
  contactName: string;
  contactMobile: string;
  additionalContact?: string;
  deliveryNote?: string;
  createdAt: string;
  updatedAt?: string;
  paymentMethod: string;
  paymentId?: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderLocation?: { lat: number; lng: number };
  customerLocation?: { lat: number; lng: number };
  estimatedDelivery?: string;
}

export interface HeroBanner {
  id: string;
  title?: string;
  subtitle?: string;
  gradient?: string;
  imageUrl: string;
  isActive: boolean;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  isActive: boolean;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber?: string;
  isOnline: boolean;
  isVerified: boolean;
  isActive: boolean;
  currentLat?: number;
  currentLng?: number;
  rating: number;
  totalDeliveries: number;
  createdAt: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  'breakfast': 'Breakfast',
  'lunch': 'Lunch',
  'snacks': 'Snacks',
  'starters': 'Starters',
  'combo': 'Combo',
  'desert': 'Desert',
  'fish-items': 'Fish Items',
  'chicken-specials': 'Chicken Specials',
  'special-items': 'Special Items',
};

// === BILLING SYSTEM TYPES ===

export interface BillingUser {
  id: string;
  name: string;
  phone: string;
  pin: string;
  isActive: boolean;
}

export interface BillingSession {
  id: string;
  userId: string;
  userName: string;
  sessionDate: string;
  openedAt: string;
  closedAt?: string;
  isOpen: boolean;
}

export interface BillItem {
  itemId: string;
  name: string;
  productCode: string;
  price: number;
  qty: number;
  tax: number;
  offer: string;
  discountPercent: number;
  lineTotal: number;
}

export interface Bill {
  id: string;
  billNo: number;
  sessionId: string;
  userId: string;
  items: BillItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  gstAmount: number;
  total: number;
  paymentMode: 'cash' | 'online' | 'credit';
  creditName?: string;
  creditPhone?: string;
  createdAt: string;
}

export interface KotItem {
  name: string;
  qty: number;
  description?: string;
}

export interface Kot {
  id: string;
  kotNo: number;
  sessionId: string;
  userId: string;
  items: KotItem[];
  description?: string;
  createdAt: string;
}

export interface AccountHead {
  id: string;
  name: string;
  isActive: boolean;
}

export interface BillingPayment {
  id: string;
  paymentNo: number;
  sessionId: string;
  userId: string;
  accountHead: string;
  description?: string;
  paidTo?: string;
  amount: number;
  mode: 'cash' | 'online';
  createdAt: string;
}

export interface Credit {
  id: string;
  billId?: string;
  billNo?: number;
  name: string;
  phone: string;
  totalAmount: number;
  paidAmount: number;
  isSettled: boolean;
  createdAt: string;
  settledAt?: string;
}

export interface CreditPayment {
  id: string;
  creditId: string;
  amount: number;
  mode: 'cash' | 'online';
  paidAt: string;
}
