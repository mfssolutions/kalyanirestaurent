import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { useCart } from '../contexts/CartContext';
import type { MenuCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import './FoodMenu.css';

const FALLBACK_CATS: MenuCategory[] = [
  'breakfast', 'lunch', 'snacks', 'starters', 'combo',
  'desert', 'fish-items', 'chicken-specials', 'special-items',
];

export default function FoodMenu() {
  const { menuItems, categories } = useAdmin();
  const { addItem, removeItem, getItemQuantity } = useCart();

  const catSlugs = categories.length > 0
    ? categories.filter(c => c.isActive).map(c => c.slug)
    : FALLBACK_CATS;

  const catLabels: Record<string, string> = { ...CATEGORY_LABELS };
  categories.forEach(c => { catLabels[c.slug] = c.name; });

  const [activeCategory, setActiveCategory] = useState<MenuCategory>(catSlugs[0] || 'breakfast');
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const filteredItems = useMemo(() => {
    if (isSearching) {
      // Global fuzzy-ish substring search across name + description + category label
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

  return (
    <section className="food-menu" id="menu">
      <h2 className="food-menu__title">Our Menu</h2>
      <p className="food-menu__subtitle">Handcrafted dishes made with the finest ingredients</p>

      <div className="food-menu__search">
        <Search size={18} className="food-menu__search-icon" />
        <input
          type="search"
          className="food-menu__search-input"
          placeholder="Search dishes, ingredients, categories..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search menu"
        />
        {query && (
          <button className="food-menu__search-clear" onClick={() => setQuery('')} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>

      {!isSearching && (
        <div className="food-menu__categories">
          {catSlugs.map(cat => (
            <button
              key={cat}
              className={`food-menu__cat-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {catLabels[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {isSearching && (
        <p className="food-menu__search-meta">
          {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'} for "{query}"
        </p>
      )}
      <div className="food-menu__grid">
        {filteredItems.map(item => {
          const qty = getItemQuantity(item.id);
          return (
            <div className="food-menu__card" key={item.id}>
              {item.offer && <span className="food-menu__offer">{item.offer}</span>}
              <div className="food-menu__card-img">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="food-menu__img" loading="lazy" />
                ) : (
                  <div className="food-menu__img-placeholder">
                    <span>🍽️</span>
                  </div>
                )}
              </div>
              <div className="food-menu__card-body">
                <div className="food-menu__card-header">
                  <span className={`food-menu__veg-badge ${item.isVeg ? 'veg' : 'non-veg'}`}>●</span>
                  <h3 className="food-menu__item-name">{item.name}</h3>
                </div>
                <p className="food-menu__item-price">₹{item.price}</p>
                <p className="food-menu__item-desc">{item.description}</p>
              </div>
              <div className="food-menu__card-action">
                {(item.qty ?? 100) <= 0 ? (
                  <span className="food-menu__unavailable">Unavailable</span>
                ) : qty === 0 ? (
                  <button className="food-menu__add-btn" onClick={() => addItem(item)}>
                    ADD
                    <span className="food-menu__plus-icon">+</span>
                  </button>
                ) : (
                  <div className="food-menu__qty-control">
                    <button className="food-menu__qty-btn minus" onClick={() => removeItem(item.id)}>−</button>
                    <span className="food-menu__qty-value">{qty}</span>
                    <button className="food-menu__qty-btn plus" onClick={() => addItem(item)}>+</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <p className="food-menu__empty">{isSearching ? 'No dishes match your search.' : 'No items available in this category right now.'}</p>
        )}
      </div>
    </section>
  );
}
