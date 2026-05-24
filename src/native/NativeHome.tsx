import { useMemo, useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, ShoppingBag, MapPin, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAdmin } from '../contexts/AdminContext';
import { useCart } from '../contexts/CartContext';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { MenuCategory, MenuItem } from '../types';
import { CATEGORY_LABELS } from '../types';
import NativeProductCard from './NativeProductCard';
import './NativeHome.css';

interface NativeHomeProps {
  location: string | null;
  onRequestLocation?: () => void;
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

export default function NativeHome({ location, onRequestLocation }: NativeHomeProps) {
  const { menuItems, categories } = useAdmin();
  const { totalItems } = useCart();
  const { get } = useConfig();
  const { user } = useAuth();
  const navigate = useNavigate();

  const catSlugs = categories.length > 0
    ? categories.filter(c => c.isActive).map(c => c.slug)
    : ['breakfast', 'lunch', 'snacks', 'starters', 'combo', 'desert'];

  const catLabels: Record<string, string> = { ...CATEGORY_LABELS };
  categories.forEach(c => { catLabels[c.slug] = c.name; });

  const [activeCategory, setActiveCategory] = useState<MenuCategory>(catSlugs[0] || 'breakfast');
  const [query, setQuery] = useState('');
  const [activeOffer, setActiveOffer] = useState(0);
  const [vegOnly, setVegOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const matchesQuery = (it: MenuItem) => {
    // Prefer admin-curated `keywords` array when present (exact-keyword match);
    // fall back to substring match across name / description / category label.
    if (it.keywords && it.keywords.length > 0) {
      const kw = it.keywords.map(k => k.toLowerCase());
      if (normalizedQuery.split(/\s+/).every(tok => kw.some(k => k.includes(tok)))) {
        return true;
      }
    }
    const hay = [
      it.name,
      it.description,
      catLabels[it.category] || it.category,
      it.productCode,
    ].filter(Boolean).join(' ').toLowerCase();
    return normalizedQuery.split(/\s+/).every(tok => hay.includes(tok));
  };

  const filteredItems = useMemo(() => {
    let list = menuItems.filter(it => it.isAvailable !== false);
    if (isSearching) {
      list = list.filter(matchesQuery);
    } else {
      list = list.filter(it => it.category === activeCategory);
    }
    if (vegOnly) list = list.filter(it => it.isVeg);
    if (sortBy === 'price-asc')  list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItems, activeCategory, isSearching, normalizedQuery, vegOnly, sortBy]);

  /* ---- Log searches to backend (debounced) ---- */
  const lastLoggedRef = useRef<string>('');
  useEffect(() => {
    if (!isSearching) return;
    const q = normalizedQuery;
    const id = setTimeout(() => {
      if (lastLoggedRef.current === q) return;
      lastLoggedRef.current = q;
      const matched = filteredItems.slice(0, 5).map(it => ({
        id: it.id, name: it.name, productCode: it.productCode,
      }));
      supabase.from('search_logs').insert({
        user_id: user?.id || null,
        keyword: q,
        results_count: filteredItems.length,
        matched_items: matched,
        platform: Capacitor.isNativePlatform() ? 'android' : 'web',
      }).then(() => {}, () => {/* swallow */});
    }, 700);
    return () => clearTimeout(id);
  }, [normalizedQuery, isSearching, filteredItems, user]);

  const restaurantName = get('restaurant_name', 'Kalyani Kitchen');
  const displayLocation = location || 'Tap to set address';

  return (
    <div className="nh-page">
      {/* ============ FIXED TOP BAR (Address + Cart) ============ */}
      <header className="nh-topbar">
        <button
          className="nh-addr"
          type="button"
          onClick={() => onRequestLocation ? onRequestLocation() : navigate('/profile')}
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
          <button className="nh-filter-btn" type="button" aria-label="Filters" onClick={() => setFilterOpen(true)}>
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

        {/* Menu grid: strict product card */}
        <div className="nh-cards">
          {filteredItems.map(item => (
            <NativeProductCard key={item.id} item={item} />
          ))}
          {filteredItems.length === 0 && (
            <p className="nh-empty">
              {isSearching ? 'No dishes match your search.' : 'No items available in this category right now.'}
            </p>
          )}
        </div>
      </div>

      {/* ============ FILTER BOTTOM SHEET ============ */}
      {filterOpen && (
        <div className="nh-filter-backdrop" onClick={() => setFilterOpen(false)}>
          <div className="nh-filter-sheet" onClick={e => e.stopPropagation()}>
            <h3>Filters</h3>
            <label className="nh-filter-row">
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={e => setVegOnly(e.target.checked)}
              />
              <span>Pure veg only</span>
            </label>
            <h4>Sort by</h4>
            {[
              { v: 'default',    l: 'Relevance' },
              { v: 'price-asc',  l: 'Price: low to high' },
              { v: 'price-desc', l: 'Price: high to low' },
            ].map(o => (
              <label className="nh-filter-row" key={o.v}>
                <input
                  type="radio"
                  name="sort"
                  checked={sortBy === o.v}
                  onChange={() => setSortBy(o.v as 'default' | 'price-asc' | 'price-desc')}
                />
                <span>{o.l}</span>
              </label>
            ))}
            <button className="nh-filter-apply" onClick={() => setFilterOpen(false)}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
