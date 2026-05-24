import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ShoppingBag, MapPin, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { useCart } from '../contexts/CartContext';
import { useConfig } from '../contexts/ConfigContext';
import type { MenuCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import './NativeHome.css';

interface NativeHomeProps {
  location: string | null;
}

// Emoji icons for the round category chips (mock-accurate).
const CAT_EMOJI: Record<string, string> = {
  breakfast: '🥞',
  lunch: '🍱',
  snacks: '🥪',
  starters: '🍢',
  combo: '🍽️',
  desert: '🍰',
  dessert: '🍰',
  'fish-items': '🐟',
  'chicken-specials': '🍗',
  'special-items': '⭐',
  healthy: '🥗',
  meal: '🍔',
  pizza: '🍕',
};

const OFFERS = [
  {
    cls: 'nh-offer-1',
    up: 'UPTO',
    headline: '20% OFF',
    sub: 'On your first order',
    emoji: '🍝',
  },
  {
    cls: 'nh-offer-2',
    up: 'WEEKEND',
    headline: '15% OFF',
    sub: 'Special weekend combo',
    emoji: '🍔',
  },
  {
    cls: 'nh-offer-3',
    up: 'FRESH',
    headline: 'Free Delivery',
    sub: 'On orders above ₹299',
    emoji: '🥗',
  },
];

export default function NativeHome({ location }: NativeHomeProps) {
  const { menuItems, categories } = useAdmin();
  const { addItem, removeItem, getItemQuantity, totalItems } = useCart();
  const { get } = useConfig();
  const navigate = useNavigate();

  const catSlugs = categories.length > 0
    ? categories.filter(c => c.isActive).map(c => c.slug)
    : ['breakfast', 'lunch', 'snacks', 'starters', 'combo', 'desert'];

  const catLabels: Record<string, string> = { ...CATEGORY_LABELS };
  categories.forEach(c => { catLabels[c.slug] = c.name; });

  const [activeCategory, setActiveCategory] = useState<MenuCategory>(catSlugs[0] || 'breakfast');
  const [query, setQuery] = useState('');
  const [activeOffer, setActiveOffer] = useState(0);

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const filteredItems = useMemo(() => {
    if (isSearching) {
      return menuItems
        .filter(it => it.isAvailable !== false)
        .filter(it => {
          const hay = [
            it.name,
            it.description,
            catLabels[it.category] || it.category,
          ].filter(Boolean).join(' ').toLowerCase();
          return normalizedQuery.split(/\s+/).every(token => hay.includes(token));
        });
    }
    return menuItems.filter(item => item.category === activeCategory && item.isAvailable);
  }, [menuItems, activeCategory, isSearching, normalizedQuery, catLabels]);

  const restaurantName = get('restaurant_name', 'Kalyani Kitchen');
  const displayLocation = location || 'Set your delivery address';

  return (
    <div className="nh-page">
      {/* ============ FIXED TOP BAR (Address + Cart) ============ */}
      <header className="nh-topbar">
        <button
          className="nh-addr"
          type="button"
          onClick={() => navigate('/profile')}
          aria-label="Change delivery address"
        >
          <span className="nh-addr-pin">
            <MapPin size={18} strokeWidth={2.5} />
          </span>
          <span className="nh-addr-text">
            <span className="nh-addr-label">Delivery To</span>
            <span className="nh-addr-value">
              <span>{displayLocation}</span>
              <ChevronDown size={14} />
            </span>
          </span>
        </button>
        <button
          className="nh-cart-btn"
          type="button"
          onClick={() => navigate('/cart')}
          aria-label={`Open cart (${totalItems} items)`}
        >
          <ShoppingBag size={20} />
          {totalItems > 0 && <span className="nh-cart-badge">{totalItems}</span>}
        </button>
      </header>

      {/* ============ SCROLL BODY ============ */}
      <div className="nh-scroll">
        {/* Search + filter */}
        <div className="nh-search-row">
          <div className="nh-search">
            <Search size={18} strokeWidth={2.5} />
            <input
              type="search"
              placeholder={`Search foods and ${restaurantName.split(' ')[0]}`}
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search menu"
            />
          </div>
          <button className="nh-filter-btn" type="button" aria-label="Filters">
            <SlidersHorizontal size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Category chips */}
        {!isSearching && (
          <div className="nh-cats" role="tablist">
            {catSlugs.map(cat => {
              const emoji = CAT_EMOJI[cat] || CAT_EMOJI[cat.toLowerCase()] || '🍽️';
              return (
                <button
                  key={cat}
                  className={`nh-cat ${activeCategory === cat ? 'is-active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                  role="tab"
                  aria-selected={activeCategory === cat}
                >
                  <span className="nh-cat-bubble" aria-hidden="true">{emoji}</span>
                  <span className="nh-cat-label">{catLabels[cat] || cat}</span>
                </button>
              );
            })}
            <span className="nh-cats-spacer" />
          </div>
        )}

        {/* Offers carousel */}
        {!isSearching && (
          <>
            <div
              className="nh-offers"
              onScroll={e => {
                const el = e.currentTarget;
                const idx = Math.round(el.scrollLeft / (el.clientWidth * 0.88));
                if (idx !== activeOffer) setActiveOffer(idx);
              }}
            >
              {OFFERS.map((o, i) => (
                <div key={i} className={`nh-offer ${o.cls}`}>
                  <div className="nh-offer-text">
                    <span className="nh-offer-up">{o.up}</span>
                    <span className="nh-offer-headline">
                      {o.headline}
                      <em>{o.sub}</em>
                    </span>
                    <button className="nh-offer-cta" type="button">Order Now</button>
                  </div>
                  <span className="nh-offer-emoji" aria-hidden="true">{o.emoji}</span>
                </div>
              ))}
              <span className="nh-offers-spacer" />
            </div>
            <div className="nh-dots" aria-hidden="true">
              {OFFERS.map((_, i) => (
                <span key={i} className={`nh-dot ${i === activeOffer ? 'is-active' : ''}`} />
              ))}
            </div>
          </>
        )}

        {/* Section header */}
        <div className="nh-section-head">
          <h2 className="nh-section-title">
            {isSearching
              ? `${filteredItems.length} result${filteredItems.length === 1 ? '' : 's'}`
              : (catLabels[activeCategory] || 'Our Menu')}
          </h2>
        </div>

        {/* Menu grid */}
        <div className="nh-grid">
          {filteredItems.map(item => {
            const qty = getItemQuantity(item.id);
            const outOfStock = (item.qty ?? 100) <= 0;
            return (
              <div className="nh-card" key={item.id}>
                <div className="nh-card-img">
                  {item.offer && <span className="nh-card-offer">{item.offer}</span>}
                  {item.image ? (
                    <img src={item.image} alt={item.name} loading="lazy" />
                  ) : (
                    <div className="nh-card-img-fallback" aria-hidden="true">🍽️</div>
                  )}
                </div>
                <div className="nh-card-body">
                  <div className="nh-card-head">
                    <span className={`nh-veg ${item.isVeg ? '' : 'non'}`} aria-hidden="true" />
                    <h3 className="nh-card-name">{item.name}</h3>
                  </div>
                  {item.description && <p className="nh-card-desc">{item.description}</p>}
                  <div className="nh-card-foot">
                    <span className="nh-card-price">₹{item.price}</span>
                    {outOfStock ? (
                      <button className="nh-card-add" disabled>N/A</button>
                    ) : qty === 0 ? (
                      <button className="nh-card-add" onClick={() => addItem(item)}>ADD +</button>
                    ) : (
                      <div className="nh-card-qty">
                        <button onClick={() => removeItem(item.id)} aria-label="Remove">−</button>
                        <span>{qty}</span>
                        <button onClick={() => addItem(item)} aria-label="Add">+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <p className="nh-empty">
              {isSearching ? 'No dishes match your search.' : 'No items available in this category right now.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
