import { useState, useRef } from 'react';
import { LogOut, Plus, Pencil, Trash2, UtensilsCrossed, Image, Tag, X, Upload, FolderTree, ClipboardList, Check, XCircle, Truck, Bike, UserCheck, Users, Landmark } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import type { MenuItem, MenuCategory, HeroBanner, Category, Offer, Order, Rider, BillingUser, AccountHead } from '../types';
import { CATEGORY_LABELS } from '../types';
import './AdminDashboard.css';

type Tab = 'items' | 'offers' | 'banners' | 'categories' | 'orders' | 'riders' | 'billing-users' | 'account-heads';

export default function AdminDashboard() {
  const {
    adminLogout, menuItems, addMenuItem, updateMenuItem, deleteMenuItem,
    banners, addBanner, updateBanner, deleteBanner,
    offers, addOffer, updateOffer, deleteOffer,
    categories, addCategory, updateCategory, deleteCategory,
    adminOrders, acceptOrder, rejectOrder, startRide,
    riders, addRider, updateRider, deleteRider, assignRider,
    billingUsers, addBillingUser, updateBillingUser, deleteBillingUser,
    accountHeads, addAccountHead, updateAccountHead, deleteAccountHead,
    uploadMenuImage,
    uploadBannerImage,
  } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  const catLabels: Record<string, string> = { ...CATEGORY_LABELS };
  categories.forEach(c => { catLabels[c.slug] = c.name; });

  const catSlugs = categories.length > 0
    ? categories.filter(c => c.isActive).map(c => c.slug)
    : Object.keys(CATEGORY_LABELS);

  return (
    <div className="admin-dash">
      <div className="admin-dash__header">
        <h1>Admin Dashboard</h1>
        <button className="admin-dash__logout" onClick={adminLogout}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="admin-dash__tabs">
        <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
          <ClipboardList size={16} /> Orders
          {adminOrders.filter(o => o.status === 'placed').length > 0 && (
            <span className="admin-tab-badge">{adminOrders.filter(o => o.status === 'placed').length}</span>
          )}
        </button>
        <button className={activeTab === 'items' ? 'active' : ''} onClick={() => setActiveTab('items')}>
          <UtensilsCrossed size={16} /> Menu Items
        </button>
        <button className={activeTab === 'categories' ? 'active' : ''} onClick={() => setActiveTab('categories')}>
          <FolderTree size={16} /> Categories
        </button>
        <button className={activeTab === 'offers' ? 'active' : ''} onClick={() => setActiveTab('offers')}>
          <Tag size={16} /> Offers
        </button>
        <button className={activeTab === 'banners' ? 'active' : ''} onClick={() => setActiveTab('banners')}>
          <Image size={16} /> Hero Banners
        </button>
        <button className={activeTab === 'riders' ? 'active' : ''} onClick={() => setActiveTab('riders')}>
          <Bike size={16} /> Riders
          {riders.filter(r => r.isOnline).length > 0 && (
            <span className="admin-tab-badge rider-badge">{riders.filter(r => r.isOnline).length}</span>
          )}
        </button>
        <button className={activeTab === 'billing-users' ? 'active' : ''} onClick={() => setActiveTab('billing-users')}>
          <Users size={16} /> Billing Users
        </button>
        <button className={activeTab === 'account-heads' ? 'active' : ''} onClick={() => setActiveTab('account-heads')}>
          <Landmark size={16} /> Account Heads
        </button>
      </div>

      {activeTab === 'orders' && (
        <OrdersManager
          orders={adminOrders}
          onAccept={acceptOrder}
          onReject={rejectOrder}
          onStartRide={startRide}
          riders={riders}
          onAssignRider={assignRider}
        />
      )}
      {activeTab === 'items' && (
        <MenuItemsManager
          items={menuItems}
          onAdd={addMenuItem}
          onUpdate={updateMenuItem}
          onDelete={deleteMenuItem}
          offers={offers}
          catSlugs={catSlugs}
          catLabels={catLabels}
          uploadImage={uploadMenuImage}
        />
      )}
      {activeTab === 'categories' && (
        <CategoriesManager
          categories={categories}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
        />
      )}
      {activeTab === 'offers' && (
        <OffersManager offers={offers} onAdd={addOffer} onUpdate={updateOffer} onDelete={deleteOffer} />
      )}
      {activeTab === 'banners' && (
        <BannersManager banners={banners} onAdd={addBanner} onUpdate={updateBanner} onDelete={deleteBanner} uploadImage={uploadBannerImage} />
      )}
      {activeTab === 'riders' && (
        <RidersManager riders={riders} onAdd={addRider} onUpdate={updateRider} onDelete={deleteRider} />
      )}
      {activeTab === 'billing-users' && (
        <BillingUsersManager users={billingUsers} onAdd={addBillingUser} onUpdate={updateBillingUser} onDelete={deleteBillingUser} />
      )}
      {activeTab === 'account-heads' && (
        <AccountHeadsManager heads={accountHeads} onAdd={addAccountHead} onUpdate={updateAccountHead} onDelete={deleteAccountHead} />
      )}
    </div>
  );
}

// === Orders Manager ===
function OrdersManager({ orders, onAccept, onReject, onStartRide, riders, onAssignRider }: {
  orders: Order[];
  onAccept: (id: string) => void;
  onReject: (id: string, reason: string) => Promise<void>;
  onStartRide: (id: string) => void;
  riders: Rider[];
  onAssignRider: (orderId: string, rider: Rider) => void;
}) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    await onReject(rejectingId, rejectReason.trim());
    setRejectingId(null);
    setRejectReason('');
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      placed: '#fc8019', accepted: '#0d7a3e', rejected: '#e23744',
      confirmed: '#1565c0', preparing: '#f9a825', 'out-for-delivery': '#6a1b9a', delivered: '#2e7d32',
    };
    return map[s] || '#666';
  };

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Orders ({orders.length})</option>
          <option value="placed">New ({orders.filter(o => o.status === 'placed').length})</option>
          <option value="accepted">Accepted ({orders.filter(o => o.status === 'accepted').length})</option>
          <option value="rejected">Rejected ({orders.filter(o => o.status === 'rejected').length})</option>
          <option value="out-for-delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {rejectingId && (
        <div className="admin-modal-overlay" onClick={() => setRejectingId(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3><XCircle size={20} /> Reject Order</h3>
            <p>Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              autoFocus
            />
            <div className="admin-modal__actions">
              <button className="admin-form__cancel" onClick={() => { setRejectingId(null); setRejectReason(''); }}>Cancel</button>
              <button className="admin-form__save reject-btn" onClick={handleReject} disabled={!rejectReason.trim()}>
                Reject & Notify Customer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-orders-list">
        {filtered.length === 0 && <p className="admin-empty">No orders found</p>}
        {filtered.map(order => (
          <div className="admin-order-card" key={order.id}>
            <div className="admin-order-card__header">
              <div>
                <strong>#{order.id}</strong>
                <span className="admin-order-status" style={{ background: statusColor(order.status) }}>
                  {order.status.replace(/-/g, ' ').toUpperCase()}
                </span>
              </div>
              <span className="admin-order-time">
                {new Date(order.createdAt).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="admin-order-card__body">
              <div className="admin-order-customer">
                <span>{order.contactName}</span>
                <span>{order.contactMobile}</span>
              </div>
              <div className="admin-order-items">
                {order.items.map(({ item, quantity }) => (
                  <span key={item.id}>{item.name} x{quantity}</span>
                ))}
              </div>
              <div className="admin-order-total">
                <strong>₹{order.total}</strong>
                <span>{order.paymentMethod}</span>
              </div>
              {order.rejectionReason && (
                <p className="admin-order-reject-reason">Rejected: {order.rejectionReason}</p>
              )}
            </div>
            {order.status === 'placed' && (
              <div className="admin-order-card__actions">
                <button className="admin-order-accept" onClick={() => onAccept(order.id)}>
                  <Check size={16} /> Accept
                </button>
                <button className="admin-order-reject" onClick={() => setRejectingId(order.id)}>
                  <XCircle size={16} /> Reject
                </button>
              </div>
            )}
            {order.status === 'accepted' && (
              <div className="admin-order-card__actions">
                <select
                  className="admin-rider-select"
                  defaultValue=""
                  onChange={e => {
                    const r = riders.find(r => r.id === e.target.value);
                    if (r) onAssignRider(order.id, r);
                  }}
                >
                  <option value="" disabled>Assign Rider</option>
                  {riders.filter(r => r.isActive).map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.isOnline ? '🟢' : '⚫'} ({r.phone})
                    </option>
                  ))}
                </select>
                <button className="admin-order-ride" onClick={() => onStartRide(order.id)}>
                  <Truck size={16} /> Start Ride
                </button>
              </div>
            )}
            {order.riderName && order.status !== 'placed' && order.status !== 'rejected' && (
              <div className="admin-order-rider-info">
                <UserCheck size={14} /> {order.riderName} • {order.riderPhone}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// === Menu Items Manager ===
function MenuItemsManager({ items, onAdd, onUpdate, onDelete, offers, catSlugs, catLabels, uploadImage }: {
  items: MenuItem[];
  onAdd: (i: MenuItem) => void;
  onUpdate: (i: MenuItem) => void;
  onDelete: (id: string) => void;
  offers: Offer[];
  catSlugs: string[];
  catLabels: Record<string, string>;
  uploadImage: (file: File, onProgress: (pct: number) => void) => Promise<string | null>;
}) {
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState<MenuCategory | 'all'>('all');

  const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat);

  const emptyItem: MenuItem = {
    id: '', name: '', description: '', price: 0, category: catSlugs[0] || 'breakfast',
    image: '', isVeg: true, isAvailable: true, offer: '', qty: 100, productCode: '', tax: 5,
  };

  const handleSave = (item: MenuItem) => {
    if (editing && editing.id) {
      onUpdate(item);
    } else {
      onAdd({ ...item, id: 'item_' + Date.now() });
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value as MenuCategory | 'all')}>
          <option value="all">All Categories</option>
          {catSlugs.map(c => <option key={c} value={c}>{catLabels[c] || c}</option>)}
        </select>
        <button className="admin-add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={16} /> Add Item
        </button>
      </div>

      {showForm && (
        <ItemForm
          item={editing || emptyItem}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          offers={offers}
          catSlugs={catSlugs}
          catLabels={catLabels}
          uploadImage={uploadImage}
        />
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Tax%</th>
              <th>Qty</th>
              <th>Veg</th>
              <th>Available</th>
              <th>Offer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id}>
                <td>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="admin-item-thumb" />
                  ) : (
                    <span className="admin-item-thumb-placeholder">🍽️</span>
                  )}
                </td>
                <td><code>{item.productCode || '—'}</code></td>
                <td>{item.name}</td>
                <td><span className="admin-badge">{catLabels[item.category] || item.category}</span></td>
                <td>₹{item.price}</td>
                <td>{item.tax ?? 5}%</td>
                <td><span className={`admin-qty-badge ${(item.qty ?? 100) <= 0 ? 'out' : (item.qty ?? 100) <= 5 ? 'low' : ''}`}>{item.qty ?? 100}</span></td>
                <td><span className={item.isVeg ? 'veg-dot' : 'nonveg-dot'}>●</span></td>
                <td>{item.isAvailable && (item.qty ?? 100) > 0 ? '✅' : '❌'}</td>
                <td>{item.offer || '—'}</td>
                <td>
                  <div className="admin-actions">
                    <button onClick={() => { setEditing(item); setShowForm(true); }}><Pencil size={14} /></button>
                    <button className="delete" onClick={() => { if (confirm('Delete this item?')) onDelete(item.id); }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="admin-count">{filtered.length} items</p>
    </div>
  );
}

function ItemForm({ item, onSave, onCancel, offers, catSlugs, catLabels, uploadImage }: {
  item: MenuItem;
  onSave: (i: MenuItem) => void;
  onCancel: () => void;
  offers: Offer[];
  catSlugs: string[];
  catLabels: Record<string, string>;
  uploadImage: (file: File, onProgress: (pct: number) => void) => Promise<string | null>;
}) {
  const [form, setForm] = useState<MenuItem>({ ...item });
  const [uploadPct, setUploadPct] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadPct(0);
    const url = await uploadImage(file, (pct) => setUploadPct(pct));
    setUploading(false);
    if (url) {
      setForm(f => ({ ...f, image: url }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    onSave(form);
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <button type="button" className="admin-form__close" onClick={onCancel}><X size={18} /></button>
      <h3>{item.id ? 'Edit Item' : 'Add New Item'}</h3>
      <div className="admin-form__grid">
        <label className="admin-form__label">Product Code (3 digit)<input placeholder="e.g. 001" value={form.productCode || ''} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 3); setForm(f => ({ ...f, productCode: v })); }} maxLength={3} /></label>
        <label className="admin-form__label">Item Name<input placeholder="e.g. Masala Dosa" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></label>
        <label className="admin-form__label">Price (₹)<input type="number" placeholder="0" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} required min={1} /></label>
        <label className="admin-form__label">GST %<input type="number" placeholder="5" value={form.tax ?? 5} onChange={e => setForm(f => ({ ...f, tax: Number(e.target.value) }))} min={0} max={100} step={0.5} /></label>
        <label className="admin-form__label">Category
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as MenuCategory }))}>
          {catSlugs.map(c => <option key={c} value={c}>{catLabels[c] || c}</option>)}
        </select></label>
        <label className="admin-form__label">Stock Qty<input type="number" placeholder="100" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: Number(e.target.value) }))} min={0} /></label>
        <label className="admin-form__label">Offer
        <select value={form.offer || ''} onChange={e => setForm(f => ({ ...f, offer: e.target.value }))}>
          <option value="">No Offer</option>
          {offers.filter(o => o.isActive).map(o => (
            <option key={o.id} value={`${o.discount}% OFF - ${o.title}`}>{o.title} ({o.discount}% OFF)</option>
          ))}
        </select></label>

        <div className="admin-form__upload-area">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button type="button" className="admin-upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload size={16} /> {uploading ? `Uploading ${uploadPct}%` : 'Upload Image'}
          </button>
          {uploading && (
            <div className="admin-upload-progress">
              <div className="admin-upload-progress__bar" style={{ width: `${uploadPct}%` }} />
            </div>
          )}
          {form.image && !uploading && (
            <div className="admin-form__img-preview">
              <img src={form.image} alt="Preview" />
              <button type="button" className="admin-img-remove" onClick={() => setForm(f => ({ ...f, image: '' }))}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <label className="admin-form__label">Description<textarea placeholder="Item description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></label>
        <div className="admin-form__toggles">
          <label><input type="checkbox" checked={form.isVeg} onChange={e => setForm(f => ({ ...f, isVeg: e.target.checked }))} /> Vegetarian</label>
          <label><input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} /> Available</label>
        </div>
      </div>
      <div className="admin-form__actions">
        <button type="button" onClick={onCancel} className="admin-form__cancel">Cancel</button>
        <button type="submit" className="admin-form__save">Save Item</button>
      </div>
    </form>
  );
}

// === Categories Manager ===
function CategoriesManager({ categories, onAdd, onUpdate, onDelete }: {
  categories: Category[];
  onAdd: (c: Category) => void;
  onUpdate: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const emptyCategory: Category = { id: '', name: '', slug: '', sortOrder: categories.length + 1, isActive: true };

  const handleSave = (cat: Category) => {
    if (editing && editing.id) {
      onUpdate(cat);
    } else {
      onAdd({ ...cat, id: crypto.randomUUID() });
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <span>{categories.length} categories</span>
        <button className="admin-add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={16} /> Add Category
        </button>
      </div>
      {showForm && (
        <CategoryForm category={editing || emptyCategory} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Order</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td><strong>{cat.name}</strong></td>
                <td><code>{cat.slug}</code></td>
                <td>{cat.sortOrder}</td>
                <td>{cat.isActive ? '✅' : '❌'}</td>
                <td>
                  <div className="admin-actions">
                    <button onClick={() => { setEditing(cat); setShowForm(true); }}><Pencil size={14} /></button>
                    <button className="delete" onClick={() => { if (confirm('Delete this category?')) onDelete(cat.id); }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryForm({ category, onSave, onCancel }: {
  category: Category; onSave: (c: Category) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...category });

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setForm(f => ({ ...f, name, slug: f.id ? f.slug : slug }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) return;
    onSave(form);
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <button type="button" className="admin-form__close" onClick={onCancel}><X size={18} /></button>
      <h3>{category.id ? 'Edit Category' : 'Add Category'}</h3>
      <div className="admin-form__grid">
        <input placeholder="Category Name" value={form.name} onChange={e => handleNameChange(e.target.value)} required />
        <input placeholder="Slug (auto-generated)" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required />
        <input type="number" placeholder="Sort Order" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} min={0} />
        <label><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
      </div>
      <div className="admin-form__actions">
        <button type="button" onClick={onCancel} className="admin-form__cancel">Cancel</button>
        <button type="submit" className="admin-form__save">Save Category</button>
      </div>
    </form>
  );
}

// === Offers Manager ===
function OffersManager({ offers, onAdd, onUpdate, onDelete }: {
  offers: Offer[];
  onAdd: (o: Offer) => void; onUpdate: (o: Offer) => void; onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const emptyOffer: Offer = { id: '', title: '', description: '', discount: 0, isActive: true };

  const handleSave = (offer: Offer) => {
    if (editing && editing.id) {
      onUpdate(offer);
    } else {
      onAdd({ ...offer, id: 'of_' + Date.now() });
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <span>{offers.length} offers</span>
        <button className="admin-add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={16} /> Add Offer
        </button>
      </div>
      {showForm && (
        <OfferForm offer={editing || emptyOffer} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}
      <div className="admin-cards">
        {offers.map(offer => (
          <div className="admin-card" key={offer.id}>
            <div className="admin-card__body">
              <h4>{offer.title}</h4>
              <p>{offer.description}</p>
              <span className="admin-badge">{offer.discount}% OFF</span>
              {!offer.isActive && <span className="admin-badge inactive">Inactive</span>}
            </div>
            <div className="admin-actions">
              <button onClick={() => { setEditing(offer); setShowForm(true); }}><Pencil size={14} /></button>
              <button className="delete" onClick={() => { if (confirm('Delete this offer?')) onDelete(offer.id); }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OfferForm({ offer, onSave, onCancel }: {
  offer: Offer; onSave: (o: Offer) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...offer });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <button type="button" className="admin-form__close" onClick={onCancel}><X size={18} /></button>
      <h3>{offer.id ? 'Edit Offer' : 'Add Offer'}</h3>
      <div className="admin-form__grid">
        <label className="admin-form__label">Offer Title<input placeholder="e.g. Weekend Special" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></label>
        <label className="admin-form__label">Discount %<input type="number" placeholder="10" value={form.discount || ''} onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))} required min={1} max={100} /></label>
        <label className="admin-form__label">Description<textarea placeholder="Offer description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></label>
        <label><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
      </div>
      <div className="admin-form__actions">
        <button type="button" onClick={onCancel} className="admin-form__cancel">Cancel</button>
        <button type="submit" className="admin-form__save">Save Offer</button>
      </div>
    </form>
  );
}

// === Banners Manager ===
function BannersManager({ banners, onAdd, onUpdate, onDelete, uploadImage }: {
  banners: HeroBanner[]; onAdd: (b: HeroBanner) => void; onUpdate: (b: HeroBanner) => void; onDelete: (id: string) => void;
  uploadImage: (file: File, onProgress: (pct: number) => void) => Promise<string | null>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HeroBanner | null>(null);
  const emptyBanner: HeroBanner = { id: '', imageUrl: '', isActive: true };

  const handleSave = (banner: HeroBanner) => {
    if (editing && editing.id) {
      onUpdate(banner);
    } else {
      onAdd({ ...banner, id: 'hb_' + Date.now() });
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <span>{banners.length} banners</span>
        <button className="admin-add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={16} /> Add Banner
        </button>
      </div>
      {showForm && (
        <BannerForm banner={editing || emptyBanner} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} uploadImage={uploadImage} />
      )}
      <div className="admin-banner-grid">
        {banners.map(banner => (
          <div className="admin-banner-card" key={banner.id}>
            {banner.imageUrl ? (
              <img src={banner.imageUrl} alt="Banner" className="admin-banner-img" />
            ) : (
              <div className="admin-banner-placeholder">No Image</div>
            )}
            <div className="admin-banner-card__overlay">
              {!banner.isActive && <span className="admin-badge inactive">Inactive</span>}
              <div className="admin-actions">
                <button onClick={() => { setEditing(banner); setShowForm(true); }}><Pencil size={14} /></button>
                <button className="delete" onClick={() => { if (confirm('Delete this banner?')) onDelete(banner.id); }}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BannerForm({ banner, onSave, onCancel, uploadImage }: {
  banner: HeroBanner; onSave: (b: HeroBanner) => void; onCancel: () => void;
  uploadImage: (file: File, onProgress: (pct: number) => void) => Promise<string | null>;
}) {
  const [form, setForm] = useState({ ...banner });
  const [uploadPct, setUploadPct] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadPct(0);
    const url = await uploadImage(file, (pct) => setUploadPct(pct));
    setUploading(false);
    if (url) {
      setForm(f => ({ ...f, imageUrl: url }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl) return;
    onSave(form);
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <button type="button" className="admin-form__close" onClick={onCancel}><X size={18} /></button>
      <h3>{banner.id ? 'Edit Banner' : 'Add Banner'}</h3>
      <div className="admin-form__grid">
        <div className="admin-form__upload-area">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button type="button" className="admin-upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload size={16} /> {uploading ? `Uploading ${uploadPct}%` : 'Upload Banner Image (500px height recommended)'}
          </button>
          {uploading && (
            <div className="admin-upload-progress">
              <div className="admin-upload-progress__bar" style={{ width: `${uploadPct}%` }} />
            </div>
          )}
          {form.imageUrl && !uploading && (
            <div className="admin-banner-preview">
              <img src={form.imageUrl} alt="Preview" />
              <button type="button" className="admin-img-remove" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        <label><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
      </div>
      <div className="admin-form__actions">
        <button type="button" onClick={onCancel} className="admin-form__cancel">Cancel</button>
        <button type="submit" className="admin-form__save" disabled={!form.imageUrl}>Save Banner</button>
      </div>
    </form>
  );
}

// === Riders Manager ===
function RidersManager({ riders, onAdd, onUpdate, onDelete }: {
  riders: Rider[];
  onAdd: (r: Rider) => void;
  onUpdate: (r: Rider) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Rider | null>(null);

  const emptyRider: Rider = {
    id: '', name: '', phone: '', vehicleType: 'bike', vehicleNumber: '',
    isOnline: false, isVerified: true, isActive: true,
    rating: 5.0, totalDeliveries: 0, createdAt: new Date().toISOString(),
  };

  const handleSave = (rider: Rider) => {
    if (editing && editing.id) {
      onUpdate(rider);
    } else {
      onAdd({ ...rider, id: crypto.randomUUID() });
    }
    setShowForm(false);
    setEditing(null);
  };

  const onlineCount = riders.filter(r => r.isOnline).length;

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <span>{riders.length} riders ({onlineCount} online)</span>
        <button className="admin-add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={16} /> Add Rider
        </button>
      </div>
      {showForm && (
        <RiderForm rider={editing || emptyRider} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Vehicle</th>
              <th>Rating</th>
              <th>Deliveries</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {riders.map(rider => (
              <tr key={rider.id}>
                <td><span className={`rider-status-dot ${rider.isOnline ? 'online' : 'offline'}`}>{rider.isOnline ? '🟢' : '⚫'}</span></td>
                <td><strong>{rider.name}</strong></td>
                <td>{rider.phone}</td>
                <td>{rider.vehicleType} {rider.vehicleNumber && `(${rider.vehicleNumber})`}</td>
                <td>⭐ {rider.rating.toFixed(1)}</td>
                <td>{rider.totalDeliveries}</td>
                <td>{rider.isActive ? '✅' : '❌'}</td>
                <td>
                  <div className="admin-actions">
                    <button onClick={() => { setEditing(rider); setShowForm(true); }}><Pencil size={14} /></button>
                    <button className="delete" onClick={() => { if (confirm('Delete this rider?')) onDelete(rider.id); }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiderForm({ rider, onSave, onCancel }: {
  rider: Rider; onSave: (r: Rider) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...rider });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    onSave(form);
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <button type="button" className="admin-form__close" onClick={onCancel}><X size={18} /></button>
      <h3>{rider.id ? 'Edit Rider' : 'Add New Rider'}</h3>
      <div className="admin-form__grid">
        <input placeholder="Rider Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        <input type="tel" placeholder="Phone (10 digits)" value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
          maxLength={10} required />
        <select value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}>
          <option value="bike">Bike</option>
          <option value="cycle">Cycle</option>
          <option value="scooter">Scooter</option>
          <option value="car">Car</option>
        </select>
        <input placeholder="Vehicle Number (optional)" value={form.vehicleNumber || ''}
          onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} />
        <div className="admin-form__toggles">
          <label><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
          <label><input type="checkbox" checked={form.isVerified} onChange={e => setForm(f => ({ ...f, isVerified: e.target.checked }))} /> Verified</label>
        </div>
      </div>
      <div className="admin-form__actions">
        <button type="button" onClick={onCancel} className="admin-form__cancel">Cancel</button>
        <button type="submit" className="admin-form__save">Save Rider</button>
      </div>
    </form>
  );
}

// === Billing Users Manager ===
function BillingUsersManager({ users, onAdd, onUpdate, onDelete }: {
  users: BillingUser[];
  onAdd: (user: BillingUser) => void;
  onUpdate: (user: BillingUser) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BillingUser | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', pin: '', isActive: true });

  const resetForm = () => { setForm({ name: '', phone: '', pin: '', isActive: true }); setShowForm(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      onUpdate({ ...editing, ...form });
    } else {
      onAdd({ id: crypto.randomUUID(), ...form });
    }
    resetForm();
  };

  const startEdit = (user: BillingUser) => {
    setEditing(user);
    setForm({ name: user.name, phone: user.phone, pin: user.pin, isActive: user.isActive });
    setShowForm(true);
  };

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h3>Billing Users ({users.length})</h3>
        <button className="admin-add-btn" onClick={() => { resetForm(); setShowForm(true); }}><Plus size={16} /> Add User</button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form__grid">
            <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <input type="tel" placeholder="Phone (10 digits)" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} required maxLength={10} />
            <input placeholder="PIN (4-6 digits)" value={form.pin}
              onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))} required maxLength={6} />
            <label><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
          </div>
          <div className="admin-form__actions">
            <button type="button" onClick={resetForm} className="admin-form__cancel">Cancel</button>
            <button type="submit" className="admin-form__save">{editing ? 'Update' : 'Add'} User</button>
          </div>
        </form>
      )}

      <div className="admin-items">
        {users.map(user => (
          <div key={user.id} className="admin-item">
            <div className="admin-item__info">
              <strong>{user.name}</strong>
              <span>{user.phone} · PIN: {user.pin}</span>
              <span className={`admin-badge ${user.isActive ? 'active' : 'inactive'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="admin-item__actions">
              <button onClick={() => startEdit(user)}><Pencil size={14} /></button>
              <button onClick={() => onDelete(user.id)} className="delete"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="admin-empty">No billing users yet.</p>}
      </div>
    </div>
  );
}

// === Account Heads Manager ===
function AccountHeadsManager({ heads, onAdd, onUpdate, onDelete }: {
  heads: AccountHead[];
  onAdd: (head: AccountHead) => void;
  onUpdate: (head: AccountHead) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AccountHead | null>(null);
  const [form, setForm] = useState({ name: '', isActive: true });

  const resetForm = () => { setForm({ name: '', isActive: true }); setShowForm(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      onUpdate({ ...editing, ...form });
    } else {
      onAdd({ id: crypto.randomUUID(), ...form });
    }
    resetForm();
  };

  const startEdit = (head: AccountHead) => {
    setEditing(head);
    setForm({ name: head.name, isActive: head.isActive });
    setShowForm(true);
  };

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h3>Account Heads ({heads.length})</h3>
        <button className="admin-add-btn" onClick={() => { resetForm(); setShowForm(true); }}><Plus size={16} /> Add Head</button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form__grid">
            <input placeholder="Account Head Name (e.g., Salary, Rent, Supplies)" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <label><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
          </div>
          <div className="admin-form__actions">
            <button type="button" onClick={resetForm} className="admin-form__cancel">Cancel</button>
            <button type="submit" className="admin-form__save">{editing ? 'Update' : 'Add'} Head</button>
          </div>
        </form>
      )}

      <div className="admin-items">
        {heads.map(head => (
          <div key={head.id} className="admin-item">
            <div className="admin-item__info">
              <strong>{head.name}</strong>
              <span className={`admin-badge ${head.isActive ? 'active' : 'inactive'}`}>{head.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="admin-item__actions">
              <button onClick={() => startEdit(head)}><Pencil size={14} /></button>
              <button onClick={() => onDelete(head.id)} className="delete"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {heads.length === 0 && <p className="admin-empty">No account heads yet.</p>}
      </div>
    </div>
  );
}
