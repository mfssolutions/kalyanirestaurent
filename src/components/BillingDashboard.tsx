import { useState, useRef, useCallback } from 'react';
import { LogOut, Search, Plus, Minus, Trash2, Printer, CreditCard, Banknote, FileText, Clock, Receipt, ShoppingBag, Wallet, Users, Power } from 'lucide-react';
import { useBilling } from '../contexts/BillingContext';
import { useConfig } from '../contexts/ConfigContext';
import type { BillItem, KotItem, MenuItem } from '../types';
import './Billing.css';

type BillingTab = 'bill' | 'kot' | 'pay' | 'credits' | 'endday';

export default function BillingDashboard() {
  const { billingUser, billingLogout, session, dayStarted, startDay, closeDay } = useBilling();
  const [activeTab, setActiveTab] = useState<BillingTab>('bill');

  if (!billingUser) return null;

  // Day not started
  if (!dayStarted) {
    return (
      <div className="billing-dash">
        <div className="billing-dash__header">
          <div><h2>Hey, {billingUser.name}</h2><span className="billing-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          <button className="billing-logout" onClick={billingLogout}><LogOut size={18} /></button>
        </div>
        {session && !session.isOpen ? (
          <div className="billing-daystart">
            <Clock size={48} />
            <h3>Day Closed</h3>
            <p>Today's session has been closed. See you tomorrow!</p>
          </div>
        ) : (
          <div className="billing-daystart">
            <Power size={48} />
            <h3>Start Your Day</h3>
            <p>Click below to open today's billing session</p>
            <button className="billing-daystart__btn" onClick={startDay}>Start Day</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="billing-dash">
      <div className="billing-dash__header">
        <div><h2>{billingUser.name} - POS</h2><span className="billing-date">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</span></div>
        <button className="billing-logout" onClick={billingLogout}><LogOut size={18} /></button>
      </div>

      <div className="billing-tabs">
        <button className={activeTab === 'bill' ? 'active' : ''} onClick={() => setActiveTab('bill')}><Receipt size={16} /> New Bill</button>
        <button className={activeTab === 'kot' ? 'active' : ''} onClick={() => setActiveTab('kot')}><FileText size={16} /> KOT</button>
        <button className={activeTab === 'pay' ? 'active' : ''} onClick={() => setActiveTab('pay')}><Wallet size={16} /> Pay</button>
        <button className={activeTab === 'credits' ? 'active' : ''} onClick={() => setActiveTab('credits')}><Users size={16} /> Credits</button>
        <button className={activeTab === 'endday' ? 'active' : ''} onClick={() => setActiveTab('endday')}><Clock size={16} /> End Day</button>
      </div>

      {activeTab === 'bill' && <NewBillTab />}
      {activeTab === 'kot' && <KotTab />}
      {activeTab === 'pay' && <PayTab />}
      {activeTab === 'credits' && <CreditsTab />}
      {activeTab === 'endday' && <EndDayTab onClose={closeDay} />}
    </div>
  );
}

// ======================== NEW BILL TAB ========================
function NewBillTab() {
  const { menuItems, saveBill } = useBilling();
  const { get } = useConfig();
  const [search, setSearch] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [creditName, setCreditName] = useState('');
  const [creditPhone, setCreditPhone] = useState('');
  const [showCredit, setShowCredit] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? menuItems.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.productCode && m.productCode.includes(search))
    ).slice(0, 8)
    : [];

  const addItem = useCallback((item: MenuItem) => {
    setBillItems(prev => {
      const existing = prev.find(b => b.itemId === item.id);
      if (existing) {
        return prev.map(b => b.itemId === item.id
          ? { ...b, qty: b.qty + 1, lineTotal: (b.qty + 1) * b.price }
          : b
        );
      }
      const discountPct = item.offer ? parseFloat(item.offer) || 0 : 0;
      return [...prev, {
        itemId: item.id,
        name: item.name,
        productCode: item.productCode || '',
        price: item.price,
        qty: 1,
        tax: item.tax || 5,
        offer: item.offer || '',
        discountPercent: discountPct,
        lineTotal: item.price,
      }];
    });
    setSearch('');
    searchRef.current?.focus();
  }, []);

  const updateQty = (itemId: string, delta: number) => {
    setBillItems(prev => prev.map(b => {
      if (b.itemId !== itemId) return b;
      const nq = Math.max(1, b.qty + delta);
      return { ...b, qty: nq, lineTotal: nq * b.price };
    }));
  };

  const removeItem = (itemId: string) => {
    setBillItems(prev => prev.filter(b => b.itemId !== itemId));
  };

  // Calculations
  const subtotal = billItems.reduce((s, b) => s + b.lineTotal, 0);
  const discountAmount = billItems.reduce((s, b) => s + (b.lineTotal * b.discountPercent / 100), 0);
  const afterDiscount = subtotal - discountAmount;
  const gstAmount = billItems.reduce((s, b) => {
    const lineAfterDisc = b.lineTotal - (b.lineTotal * b.discountPercent / 100);
    return s + (lineAfterDisc * b.tax / 100);
  }, 0);
  const total = afterDiscount + gstAmount;
  const avgDiscount = subtotal > 0 ? (discountAmount / subtotal * 100) : 0;

  const handlePay = async (mode: 'cash' | 'online' | 'credit') => {
    if (billItems.length === 0) return;
    if (mode === 'credit') { setShowCredit(true); return; }
    setSaving(true);
    const bill = await saveBill(billItems, subtotal, discountAmount, avgDiscount, gstAmount, total, mode);
    setSaving(false);
    if (bill) {
      printBill(bill.billNo, billItems, subtotal, discountAmount, avgDiscount, gstAmount, total, mode, undefined, get('restaurant_name', 'KALYANI RESTAURANT').toUpperCase(), get('address', ''), get('phone', ''));
      setBillItems([]);
    }
  };

  const handleCreditPay = async () => {
    if (!creditName.trim() || !creditPhone.trim()) return;
    setSaving(true);
    const bill = await saveBill(billItems, subtotal, discountAmount, avgDiscount, gstAmount, total, 'credit', creditName, creditPhone);
    setSaving(false);
    if (bill) {
      printBill(bill.billNo, billItems, subtotal, discountAmount, avgDiscount, gstAmount, total, 'credit', creditName, get('restaurant_name', 'KALYANI RESTAURANT').toUpperCase(), get('address', ''), get('phone', ''));
      setBillItems([]);
      setShowCredit(false);
      setCreditName('');
      setCreditPhone('');
    }
  };

  return (
    <div className="billing-section">
      {/* Search */}
      <div className="billing-search">
        <Search size={18} />
        <input ref={searchRef} type="text" placeholder="Search by 3-digit code or item name..."
          value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        {search && (
          <div className="billing-search__results">
            {filtered.length === 0 && <div className="billing-search__empty">No items found</div>}
            {filtered.map(item => (
              <div key={item.id} className="billing-search__item" onClick={() => addItem(item)}>
                <span className="billing-search__code">{item.productCode || '---'}</span>
                <span className="billing-search__name">{item.name}</span>
                <span className="billing-search__price">₹{item.price}</span>
                {item.offer && <span className="billing-search__offer">{item.offer}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill Items Table */}
      {billItems.length > 0 && (
        <div className="billing-items">
          <table className="billing-table">
            <thead>
              <tr>
                <th>#</th><th>Item</th><th>Price</th><th>Qty</th><th>Disc%</th><th>Total</th><th></th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((b, i) => (
                <tr key={b.itemId}>
                  <td>{i + 1}</td>
                  <td><strong>{b.name}</strong><br /><small className="billing-code">{b.productCode}</small></td>
                  <td>₹{b.price}</td>
                  <td>
                    <div className="billing-qty">
                      <button onClick={() => updateQty(b.itemId, -1)}><Minus size={14} /></button>
                      <span>{b.qty}</span>
                      <button onClick={() => updateQty(b.itemId, 1)}><Plus size={14} /></button>
                    </div>
                  </td>
                  <td>{b.discountPercent > 0 ? `${b.discountPercent}%` : '0'}</td>
                  <td><strong>₹{b.lineTotal.toFixed(2)}</strong></td>
                  <td><button className="billing-remove" onClick={() => removeItem(b.itemId)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      {billItems.length > 0 && (
        <div className="billing-totals">
          <div className="billing-totals__row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="billing-totals__row"><span>Discount ({avgDiscount.toFixed(1)}%)</span><span>-₹{discountAmount.toFixed(2)}</span></div>
          <div className="billing-totals__row"><span>GST</span><span>+₹{gstAmount.toFixed(2)}</span></div>
          <div className="billing-totals__row billing-totals__grand"><span>TOTAL</span><span>₹{total.toFixed(2)}</span></div>

          <div className="billing-pay-actions">
            <button className="billing-pay-btn cash" onClick={() => handlePay('cash')} disabled={saving}>
              <Banknote size={18} /> Cash
            </button>
            <button className="billing-pay-btn online" onClick={() => handlePay('online')} disabled={saving}>
              <CreditCard size={18} /> Online
            </button>
            <button className="billing-pay-btn credit" onClick={() => handlePay('credit')} disabled={saving}>
              <Users size={18} /> Credit
            </button>
          </div>
        </div>
      )}

      {/* Credit Modal */}
      {showCredit && (
        <div className="billing-modal-overlay" onClick={() => setShowCredit(false)}>
          <div className="billing-modal" onClick={e => e.stopPropagation()}>
            <h3><Users size={20} /> Credit Sale</h3>
            <input placeholder="Customer Name" value={creditName} onChange={e => setCreditName(e.target.value)} autoFocus />
            <input type="tel" placeholder="Contact Number" value={creditPhone}
              onChange={e => setCreditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} />
            <div className="billing-modal__total">Total: ₹{total.toFixed(2)}</div>
            <div className="billing-modal__actions">
              <button onClick={() => setShowCredit(false)}>Cancel</button>
              <button className="primary" onClick={handleCreditPay} disabled={!creditName.trim() || !creditPhone.trim() || saving}>
                Save Credit Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {billItems.length === 0 && (
        <div className="billing-empty"><ShoppingBag size={40} /><p>Search and add items to create a bill</p></div>
      )}
    </div>
  );
}

// ======================== KOT TAB ========================
function KotTab() {
  const { menuItems, saveKot, kots } = useBilling();
  const [search, setSearch] = useState('');
  const [kotItems, setKotItems] = useState<KotItem[]>([]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = search.trim()
    ? menuItems.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.productCode && m.productCode.includes(search))
    ).slice(0, 8)
    : [];

  const addKotItem = (item: MenuItem) => {
    setKotItems(prev => {
      const exists = prev.find(k => k.name === item.name);
      if (exists) return prev.map(k => k.name === item.name ? { ...k, qty: k.qty + 1 } : k);
      return [...prev, { name: item.name, qty: 1 }];
    });
    setSearch('');
  };

  const handleSaveKot = async () => {
    if (kotItems.length === 0) return;
    setSaving(true);
    const kot = await saveKot(kotItems, description);
    setSaving(false);
    if (kot) {
      printKot(kot.kotNo, kotItems, description);
      setKotItems([]);
      setDescription('');
    }
  };

  return (
    <div className="billing-section">
      <div className="billing-search">
        <Search size={18} />
        <input type="text" placeholder="Search item for KOT..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && (
          <div className="billing-search__results">
            {filtered.map(item => (
              <div key={item.id} className="billing-search__item" onClick={() => addKotItem(item)}>
                <span className="billing-search__code">{item.productCode || '---'}</span>
                <span className="billing-search__name">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {kotItems.length > 0 && (
        <div className="billing-items">
          <table className="billing-table">
            <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Note</th><th></th></tr></thead>
            <tbody>
              {kotItems.map((k, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{k.name}</td>
                  <td>
                    <div className="billing-qty">
                      <button onClick={() => setKotItems(prev => prev.map((x, j) => j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}><Minus size={14} /></button>
                      <span>{k.qty}</span>
                      <button onClick={() => setKotItems(prev => prev.map((x, j) => j === i ? { ...x, qty: x.qty + 1 } : x))}><Plus size={14} /></button>
                    </div>
                  </td>
                  <td><input className="billing-kot-note" placeholder="Note..." value={k.description || ''} onChange={e => setKotItems(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} /></td>
                  <td><button className="billing-remove" onClick={() => setKotItems(prev => prev.filter((_, j) => j !== i))}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <textarea className="billing-kot-desc" placeholder="General description (optional)..." value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          <button className="billing-pay-btn cash" style={{ width: '100%', marginTop: 10 }} onClick={handleSaveKot} disabled={saving}>
            <Printer size={18} /> Save & Print KOT
          </button>
        </div>
      )}

      {/* Recent KOTs */}
      {kots.length > 0 && (
        <div className="billing-recent">
          <h4>Recent KOTs</h4>
          {kots.slice(0, 5).map(kot => (
            <div key={kot.id} className="billing-recent__item">
              <strong>KOT #{kot.kotNo}</strong>
              <span>{kot.items.map(i => `${i.name} x${i.qty}`).join(', ')}</span>
              <span className="billing-time">{new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ======================== PAY / EXPENSE TAB ========================
function PayTab() {
  const { accountHeads, savePayment, payments } = useBilling();
  const [form, setForm] = useState({ accountHead: '', description: '', paidTo: '', amount: '', mode: 'cash' as 'cash' | 'online' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountHead || !form.amount) return;
    setSaving(true);
    await savePayment(form.accountHead, form.description, form.paidTo, Number(form.amount), form.mode);
    setSaving(false);
    setForm({ accountHead: '', description: '', paidTo: '', amount: '', mode: 'cash' });
  };

  return (
    <div className="billing-section">
      <form className="billing-pay-form" onSubmit={handleSave}>
        <h3><Wallet size={18} /> New Payment / Expense</h3>
        <div className="billing-pay-form__grid">
          <select value={form.accountHead} onChange={e => setForm(f => ({ ...f, accountHead: e.target.value }))} required>
            <option value="">Select Account Head</option>
            {accountHeads.filter(h => h.isActive).map(h => (
              <option key={h.id} value={h.name}>{h.name}</option>
            ))}
          </select>
          <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <input placeholder="Paid To" value={form.paidTo} onChange={e => setForm(f => ({ ...f, paidTo: e.target.value }))} />
          <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required min={1} />
          <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value as 'cash' | 'online' }))}>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
          </select>
        </div>
        <button type="submit" className="billing-pay-btn cash" style={{ width: '100%', marginTop: 10 }} disabled={saving || !form.accountHead || !form.amount}>
          Save Payment
        </button>
      </form>

      {payments.length > 0 && (
        <div className="billing-recent">
          <h4>Today's Payments</h4>
          <table className="billing-table">
            <thead><tr><th>#</th><th>Head</th><th>Description</th><th>Paid To</th><th>Amount</th><th>Mode</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>P-{p.paymentNo}</td>
                  <td>{p.accountHead}</td>
                  <td>{p.description || '-'}</td>
                  <td>{p.paidTo || '-'}</td>
                  <td>₹{p.amount}</td>
                  <td className="billing-mode">{p.mode.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ======================== CREDITS TAB ========================
function CreditsTab() {
  const { credits, payCredit, settleCredit } = useBilling();
  const [searchQ, setSearchQ] = useState('');
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'online'>('cash');

  const filtered = searchQ.trim()
    ? credits.filter(c => c.name.toLowerCase().includes(searchQ.toLowerCase()) || c.phone.includes(searchQ))
    : credits;

  const handlePartialPay = async () => {
    if (!payingId || !payAmount) return;
    await payCredit(payingId, Number(payAmount), payMode);
    setPayingId(null);
    setPayAmount('');
  };

  return (
    <div className="billing-section">
      <div className="billing-search">
        <Search size={18} />
        <input placeholder="Search credit by name or phone..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="billing-empty"><Users size={40} /><p>No pending credits</p></div>
      ) : (
        <div className="billing-items">
          <table className="billing-table">
            <thead><tr><th>Name</th><th>Phone</th><th>Bill#</th><th>Total</th><th>Paid</th><th>Balance</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.phone}</td>
                  <td>{c.billNo || '-'}</td>
                  <td>₹{c.totalAmount}</td>
                  <td>₹{c.paidAmount}</td>
                  <td className="billing-balance">₹{(c.totalAmount - c.paidAmount).toFixed(2)}</td>
                  <td>
                    <div className="billing-credit-actions">
                      <button className="billing-credit-btn pay" onClick={() => { setPayingId(c.id); setPayAmount(''); }}>Pay</button>
                      <button className="billing-credit-btn settle" onClick={() => settleCredit(c.id)}>Settle</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Partial Pay Modal */}
      {payingId && (
        <div className="billing-modal-overlay" onClick={() => setPayingId(null)}>
          <div className="billing-modal" onClick={e => e.stopPropagation()}>
            <h3>Partial Payment</h3>
            <p>Balance: ₹{(credits.find(c => c.id === payingId)?.totalAmount ?? 0) - (credits.find(c => c.id === payingId)?.paidAmount ?? 0)}</p>
            <input type="number" placeholder="Amount" value={payAmount} onChange={e => setPayAmount(e.target.value)} min={1} autoFocus />
            <select value={payMode} onChange={e => setPayMode(e.target.value as 'cash' | 'online')}>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
            </select>
            <div className="billing-modal__actions">
              <button onClick={() => setPayingId(null)}>Cancel</button>
              <button className="primary" onClick={handlePartialPay} disabled={!payAmount}>Pay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== END OF DAY TAB ========================
function EndDayTab({ onClose }: { onClose: () => void }) {
  const { bills, payments, session } = useBilling();
  const [showConfirm, setShowConfirm] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!session) return null;

  // Product-wise summary
  const productMap = new Map<string, { name: string; price: number; qty: number; discount: number; subtotal: number; gst: number; total: number }>();
  bills.forEach(bill => {
    bill.items.forEach(item => {
      const key = item.itemId;
      const existing = productMap.get(key);
      const lineDisc = item.lineTotal * item.discountPercent / 100;
      const lineAfterDisc = item.lineTotal - lineDisc;
      const lineGst = lineAfterDisc * item.tax / 100;
      if (existing) {
        existing.qty += item.qty;
        existing.discount += lineDisc;
        existing.subtotal += lineAfterDisc;
        existing.gst += lineGst;
        existing.total += lineAfterDisc + lineGst;
      } else {
        productMap.set(key, {
          name: item.name,
          price: item.price,
          qty: item.qty,
          discount: lineDisc,
          subtotal: lineAfterDisc,
          gst: lineGst,
          total: lineAfterDisc + lineGst,
        });
      }
    });
  });
  const products = Array.from(productMap.values());

  const totalCash = bills.filter(b => b.paymentMode === 'cash').reduce((s, b) => s + b.total, 0);
  const totalOnline = bills.filter(b => b.paymentMode === 'online').reduce((s, b) => s + b.total, 0);
  const totalCredit = bills.filter(b => b.paymentMode === 'credit').reduce((s, b) => s + b.total, 0);
  const totalSales = totalCash + totalOnline + totalCredit;
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const grandTotal = totalSales - totalPaid;

  // Credit bills for report
  const creditBills = bills.filter(b => b.paymentMode === 'credit');

  const handlePrint = () => {
    const content = reportRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    win.document.write(`<html><head><title>End of Day Report - ${new Date().toLocaleDateString('en-IN')}</title>
      <style>body{font-family:sans-serif;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #ccc;padding:4px 8px;text-align:left}th{background:#f5f5f5}h2,h3{margin:10px 0 5px}.grand{font-size:16px;font-weight:bold;margin-top:10px}</style>
      </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  const handleDownloadPdf = () => {
    // Use print-to-PDF via browser
    handlePrint();
  };

  const handleCloseDay = async () => {
    await onClose();
    setShowConfirm(false);
  };

  return (
    <div className="billing-section">
      <div className="billing-endday-actions">
        <button className="billing-pay-btn online" onClick={handlePrint}><Printer size={16} /> Print Report</button>
        <button className="billing-pay-btn cash" onClick={handleDownloadPdf}><FileText size={16} /> Download PDF</button>
        {session.isOpen && (
          <button className="billing-pay-btn credit" onClick={() => setShowConfirm(true)}><Power size={16} /> Close Day</button>
        )}
      </div>

      <div ref={reportRef} className="billing-report">
        <h2 style={{ textAlign: 'center' }}>Kalyani Restaurant - End of Day Report</h2>
        <p style={{ textAlign: 'center' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} | Cashier: {session.userName}</p>

        <h3>Sales Summary (Product Wise)</h3>
        <table>
          <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Discount</th><th>Subtotal</th><th>GST</th><th>Total</th></tr></thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i}>
                <td>{p.name}</td><td>₹{p.price}</td><td>{p.qty}</td>
                <td>₹{p.discount.toFixed(2)}</td><td>₹{p.subtotal.toFixed(2)}</td>
                <td>₹{p.gst.toFixed(2)}</td><td>₹{p.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Payments / Expenses</h3>
        {payments.length > 0 ? (
          <table>
            <thead><tr><th>Account Head</th><th>Description</th><th>Amount</th><th>Mode</th><th>Bill#</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}><td>{p.accountHead}</td><td>{p.description || '-'}</td><td>₹{p.amount}</td><td>{p.mode.toUpperCase()}</td><td>P-{p.paymentNo}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <p>No payments today</p>}

        <h3>Credit Sales</h3>
        {creditBills.length > 0 ? (
          <table>
            <thead><tr><th>Name</th><th>Contact</th><th>Amount</th><th>Bill#</th></tr></thead>
            <tbody>
              {creditBills.map(b => (
                <tr key={b.id}><td>{b.creditName}</td><td>{b.creditPhone}</td><td>₹{b.total.toFixed(2)}</td><td>{b.billNo}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <p>No credit sales today</p>}

        <hr />
        <div className="billing-report__summary">
          <div className="billing-report__row"><span>Total Cash Received</span><span>₹{totalCash.toFixed(2)}</span></div>
          <div className="billing-report__row"><span>Total Online Pay</span><span>₹{totalOnline.toFixed(2)}</span></div>
          <div className="billing-report__row"><span>Total Credit</span><span>₹{totalCredit.toFixed(2)}</span></div>
          <div className="billing-report__row highlight"><span>Total Sales of the Day</span><span>₹{totalSales.toFixed(2)}</span></div>
          <div className="billing-report__row"><span>Total Paid (Expenses)</span><span>₹{totalPaid.toFixed(2)}</span></div>
          <div className="billing-report__row grand"><span>GRAND TOTAL</span><span>₹{grandTotal.toFixed(2)}</span></div>
        </div>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: '#888' }}>Next Day Opening Balance: ₹0.00</p>
      </div>

      {/* Confirm Close Modal */}
      {showConfirm && (
        <div className="billing-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="billing-modal" onClick={e => e.stopPropagation()}>
            <h3>Close Day?</h3>
            <p>This will end today's billing session. No more bills can be created today. Are you sure?</p>
            <div className="billing-report__summary" style={{ marginBottom: 16 }}>
              <div className="billing-report__row grand"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
            </div>
            <div className="billing-modal__actions">
              <button onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="primary danger" onClick={handleCloseDay}>Close Day</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== PRINT HELPERS ========================

function printBill(
  billNo: number, items: BillItem[], subtotal: number, discountAmount: number,
  discountPercent: number, gstAmount: number, total: number, mode: string, creditName?: string,
  restaurantName = 'KALYANI RESTAURANT', restaurantAddress = '', restaurantPhone = ''
) {
  const win = window.open('', '_blank', 'width=320,height=600');
  if (!win) return;

  const itemsHtml = items.map(i =>
    `<tr><td>${i.name}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">₹${i.lineTotal.toFixed(2)}</td></tr>`
  ).join('');

  win.document.write(`<html><head><title>Bill #${billNo}</title>
    <style>
      body{font-family:'Courier New',monospace;width:280px;margin:0 auto;padding:8px;font-size:12px}
      h3{text-align:center;margin:4px 0;font-size:14px}
      .center{text-align:center}
      .line{border-top:1px dashed #000;margin:4px 0}
      table{width:100%;border-collapse:collapse}
      td{padding:2px 0;vertical-align:top}
      .right{text-align:right}
      .bold{font-weight:bold}
    </style></head><body>
    <h3>${restaurantName}</h3>
    <p class="center" style="margin:2px 0;font-size:10px">${restaurantAddress}</p>
    <p class="center" style="margin:2px 0;font-size:10px">Ph: ${restaurantPhone}</p>
    <div class="line"></div>
    <p><strong>Bill No:</strong> ${billNo} &nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
    <p><strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
    <div class="line"></div>
    <table>
      <tr><td class="bold">Item</td><td class="bold" style="text-align:center">Qty</td><td class="bold right">Amt</td></tr>
      ${itemsHtml}
    </table>
    <div class="line"></div>
    <table>
      <tr><td>Subtotal</td><td class="right">₹${subtotal.toFixed(2)}</td></tr>
      <tr><td>Discount (${discountPercent.toFixed(1)}%)</td><td class="right">-₹${discountAmount.toFixed(2)}</td></tr>
      <tr><td>GST</td><td class="right">+₹${gstAmount.toFixed(2)}</td></tr>
    </table>
    <div class="line"></div>
    <table><tr><td class="bold" style="font-size:14px">TOTAL</td><td class="bold right" style="font-size:14px">₹${total.toFixed(2)}</td></tr></table>
    <div class="line"></div>
    <p class="center"><strong>Paid by: ${mode.toUpperCase()}</strong></p>
    ${creditName ? `<p class="center">Credit Name: ${creditName}</p>` : ''}
    <p class="center" style="margin-top:8px;font-size:10px">Thank you! Visit again.</p>
  </body></html>`);
  win.document.close();
  win.print();
}

function printKot(kotNo: number, items: KotItem[], description?: string) {
  const win = window.open('', '_blank', 'width=320,height=400');
  if (!win) return;

  const itemsHtml = items.map(i =>
    `<tr><td>${i.name}</td><td style="text-align:center">${i.qty}</td><td>${i.description || ''}</td></tr>`
  ).join('');

  win.document.write(`<html><head><title>KOT #${kotNo}</title>
    <style>
      body{font-family:'Courier New',monospace;width:280px;margin:0 auto;padding:8px;font-size:13px}
      h3{text-align:center;margin:4px 0;font-size:16px}
      .line{border-top:1px dashed #000;margin:6px 0}
      table{width:100%;border-collapse:collapse}
      td{padding:3px 0;vertical-align:top}
      .bold{font-weight:bold}
    </style></head><body>
    <h3>--- KOT ---</h3>
    <p><strong>KOT No:</strong> ${kotNo} &nbsp; <strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
    <div class="line"></div>
    <table>
      <tr><td class="bold">Item</td><td class="bold" style="text-align:center">Qty</td><td class="bold">Note</td></tr>
      ${itemsHtml}
    </table>
    <div class="line"></div>
    ${description ? `<p><strong>Note:</strong> ${description}</p>` : ''}
    <p style="text-align:center;font-size:11px">${new Date().toLocaleDateString('en-IN')}</p>
  </body></html>`);
  win.document.close();
  win.print();
}
