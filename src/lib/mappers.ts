import type { MenuItem, HeroBanner, Order, Category, Offer, Rider, BillingUser, BillingSession, Bill, Kot, AccountHead, BillingPayment, Credit, CreditPayment } from '../types';

// Convert Supabase snake_case row to camelCase MenuItem
export function toMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    price: Number(row.price),
    category: row.category as MenuItem['category'],
    image: row.image as string | undefined,
    images: Array.isArray(row.images) ? (row.images as string[]) : undefined,
    sizes: Array.isArray(row.sizes) ? (row.sizes as MenuItem['sizes']) : undefined,
    keywords: Array.isArray(row.keywords) ? (row.keywords as string[]) : undefined,
    isCombo: row.is_combo as boolean | undefined,
    isVeg: row.is_veg as boolean,
    isAvailable: row.is_available as boolean,
    offer: row.offer as string | undefined,
    qty: row.qty != null ? Number(row.qty) : 100,
    productCode: (row.product_code as string) || '',
    tax: row.tax != null ? Number(row.tax) : 5,
  };
}

// Convert camelCase MenuItem to Supabase snake_case row
export function fromMenuItem(item: MenuItem) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    image: item.image || null,
    images: item.images || null,
    sizes: item.sizes || null,
    keywords: item.keywords || null,
    is_combo: item.isCombo ?? false,
    is_veg: item.isVeg,
    is_available: item.isAvailable,
    offer: item.offer || null,
    qty: item.qty,
    product_code: item.productCode || '',
    tax: item.tax ?? 5,
  };
}

// Convert Supabase row to HeroBanner
export function toBanner(row: Record<string, unknown>): HeroBanner {
  return {
    id: row.id as string,
    title: (row.title as string) || '',
    subtitle: (row.subtitle as string) || '',
    gradient: (row.gradient as string) || '',
    imageUrl: (row.image_url as string) || '',
    isActive: row.is_active as boolean,
  };
}

// Convert HeroBanner to Supabase row
export function fromBanner(banner: HeroBanner) {
  return {
    id: banner.id,
    title: banner.title || '',
    subtitle: banner.subtitle || '',
    gradient: banner.gradient || '',
    image_url: banner.imageUrl,
    is_active: banner.isActive,
  };
}

// Convert Supabase row to Order
export function toOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    items: row.items as Order['items'],
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    taxes: Number(row.taxes),
    total: Number(row.total),
    status: row.status as Order['status'],
    rejectionReason: row.rejection_reason as string | undefined,
    deliveryAddress: row.delivery_address as Order['deliveryAddress'],
    contactName: row.contact_name as string,
    contactMobile: row.contact_mobile as string,
    additionalContact: row.additional_contact as string | undefined,
    deliveryNote: row.delivery_note as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string | undefined,
    paymentMethod: row.payment_method as string,
    paymentId: row.payment_id as string | undefined,
    riderId: row.rider_id as string | undefined,
    riderName: row.rider_name as string | undefined,
    riderPhone: row.rider_phone as string | undefined,
    riderLocation: row.rider_location as Order['riderLocation'],
    customerLocation: row.customer_location as Order['customerLocation'],
    estimatedDelivery: row.estimated_delivery as string | undefined,
  };
}

// Convert Order to Supabase row
export function fromOrder(order: Order, userId?: string) {
  return {
    id: order.id,
    user_id: userId || null,
    items: order.items,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    taxes: order.taxes,
    total: order.total,
    status: order.status,
    rejection_reason: order.rejectionReason || null,
    delivery_address: order.deliveryAddress,
    contact_name: order.contactName,
    contact_mobile: order.contactMobile,
    additional_contact: order.additionalContact || null,
    delivery_note: order.deliveryNote || null,
    payment_method: order.paymentMethod,
    payment_id: order.paymentId || null,
    rider_id: order.riderId || null,
    rider_name: order.riderName || null,
    rider_phone: order.riderPhone || null,
    rider_location: order.riderLocation || null,
    customer_location: order.customerLocation || null,
    estimated_delivery: order.estimatedDelivery || null,
    created_at: order.createdAt,
    updated_at: order.updatedAt || new Date().toISOString(),
  };
}

// Category mappers
export function toCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    sortOrder: Number(row.sort_order || 0),
    isActive: row.is_active as boolean,
  };
}

export function fromCategory(cat: Category) {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    sort_order: cat.sortOrder,
    is_active: cat.isActive,
  };
}

// Offer mappers
export function toOffer(row: Record<string, unknown>): Offer {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    discount: Number(row.discount),
    isActive: row.is_active as boolean,
  };
}

export function fromOffer(offer: Offer) {
  return {
    id: offer.id,
    title: offer.title,
    description: offer.description,
    discount: offer.discount,
    is_active: offer.isActive,
  };
}

// Rider mappers
export function toRider(row: Record<string, unknown>): Rider {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    vehicleType: (row.vehicle_type as string) || 'bike',
    vehicleNumber: row.vehicle_number as string | undefined,
    isOnline: row.is_online as boolean,
    isVerified: row.is_verified as boolean,
    isActive: row.is_active as boolean,
    currentLat: row.current_lat as number | undefined,
    currentLng: row.current_lng as number | undefined,
    rating: Number(row.rating || 5),
    totalDeliveries: Number(row.total_deliveries || 0),
    createdAt: row.created_at as string,
  };
}

export function fromRider(rider: Rider) {
  return {
    id: rider.id,
    name: rider.name,
    phone: rider.phone,
    vehicle_type: rider.vehicleType,
    vehicle_number: rider.vehicleNumber || null,
    is_online: rider.isOnline,
    is_verified: rider.isVerified,
    is_active: rider.isActive,
    current_lat: rider.currentLat || null,
    current_lng: rider.currentLng || null,
    rating: rider.rating,
    total_deliveries: rider.totalDeliveries,
  };
}

// === BILLING MAPPERS ===

export function toBillingUser(row: Record<string, unknown>): BillingUser {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    pin: row.pin as string,
    isActive: row.is_active as boolean,
  };
}

export function fromBillingUser(u: BillingUser) {
  return { id: u.id, name: u.name, phone: u.phone, pin: u.pin, is_active: u.isActive };
}

export function toBillingSession(row: Record<string, unknown>): BillingSession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userName: row.user_name as string,
    sessionDate: row.session_date as string,
    openedAt: row.opened_at as string,
    closedAt: row.closed_at as string | undefined,
    isOpen: row.is_open as boolean,
  };
}

export function toBill(row: Record<string, unknown>): Bill {
  return {
    id: row.id as string,
    billNo: Number(row.bill_no),
    sessionId: row.session_id as string,
    userId: row.user_id as string,
    items: row.items as Bill['items'],
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discount_amount),
    discountPercent: Number(row.discount_percent),
    gstAmount: Number(row.gst_amount),
    total: Number(row.total),
    paymentMode: row.payment_mode as Bill['paymentMode'],
    creditName: row.credit_name as string | undefined,
    creditPhone: row.credit_phone as string | undefined,
    createdAt: row.created_at as string,
  };
}

export function toKot(row: Record<string, unknown>): Kot {
  return {
    id: row.id as string,
    kotNo: Number(row.kot_no),
    sessionId: row.session_id as string,
    userId: row.user_id as string,
    items: row.items as Kot['items'],
    description: row.description as string | undefined,
    createdAt: row.created_at as string,
  };
}

export function toAccountHead(row: Record<string, unknown>): AccountHead {
  return {
    id: row.id as string,
    name: row.name as string,
    isActive: row.is_active as boolean,
  };
}

export function fromAccountHead(h: AccountHead) {
  return { id: h.id, name: h.name, is_active: h.isActive };
}

export function toBillingPayment(row: Record<string, unknown>): BillingPayment {
  return {
    id: row.id as string,
    paymentNo: Number(row.payment_no),
    sessionId: row.session_id as string,
    userId: row.user_id as string,
    accountHead: row.account_head as string,
    description: row.description as string | undefined,
    paidTo: row.paid_to as string | undefined,
    amount: Number(row.amount),
    mode: row.mode as BillingPayment['mode'],
    createdAt: row.created_at as string,
  };
}

export function toCredit(row: Record<string, unknown>): Credit {
  return {
    id: row.id as string,
    billId: row.bill_id as string | undefined,
    billNo: row.bill_no != null ? Number(row.bill_no) : undefined,
    name: row.name as string,
    phone: row.phone as string,
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    isSettled: row.is_settled as boolean,
    createdAt: row.created_at as string,
    settledAt: row.settled_at as string | undefined,
  };
}

export function toCreditPayment(row: Record<string, unknown>): CreditPayment {
  return {
    id: row.id as string,
    creditId: row.credit_id as string,
    amount: Number(row.amount),
    mode: row.mode as CreditPayment['mode'],
    paidAt: row.paid_at as string,
  };
}
