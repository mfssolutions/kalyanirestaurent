import { useState } from 'react';
import type { MenuItem, MenuItemSize } from '../types';
import { useCart } from '../contexts/CartContext';
import SizePickerSheet from './SizePickerSheet';
import './NativeProductCard.css';

interface Props {
  item: MenuItem;
}

/**
 * Strict product-card model per spec:
 *   - 1000×1000 image (with swipe if `images[]` present), SPECIAL OFFER ribbon
 *   - Name (clamped to 2 lines)
 *   - Product ID
 *   - Veg/Non-veg label (square badge top-right)
 *   - Price (₹0.00)
 *   - Available sizes (if `sizes[]`)
 *   - COMBO label if isCombo
 *   - ADD button: opens Swiggy-style size picker when sizes exist; else direct add
 */
export default function NativeProductCard({ item }: Props) {
  const { addItem, removeItem, getItemQuantity } = useCart();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const allImages = (item.images && item.images.length > 0
    ? item.images
    : item.image ? [item.image] : []);

  const hasSizes = Array.isArray(item.sizes) && item.sizes.length > 0;
  const outOfStock = (item.qty ?? 100) <= 0;

  // For sized items, total quantity = sum of every variant in the cart.
  // For unsized items, just the normal id-based lookup.
  const baseQty = getItemQuantity(item.id);

  const handleAdd = () => {
    if (outOfStock) return;
    if (hasSizes) { setPickerOpen(true); return; }
    addItem(item);
  };

  const onPickSize = (size: MenuItemSize) => {
    setPickerOpen(false);
    const variant: MenuItem = {
      ...item,
      id: `${item.id}__${size.label.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${item.name} (${size.label})`,
      price: size.price,
    };
    addItem(variant);
  };

  // Cheapest size or base price for display
  const displayPrice = hasSizes
    ? Math.min(...item.sizes!.map(s => s.price))
    : item.price;

  return (
    <div className="npc">
      {/* ===== Image column ===== */}
      <div className="npc-imgwrap">
        {item.offer && <span className="npc-ribbon">SPECIAL OFFER</span>}
        {item.isCombo && <span className="npc-combo">COMBO</span>}
        {allImages.length > 0 ? (
          <>
            <img
              src={allImages[activeImg]}
              alt={item.name}
              className="npc-img"
              loading="lazy"
            />
            {allImages.length > 1 && (
              <div className="npc-dots" aria-hidden="true">
                {allImages.map((_, i) => (
                  <span
                    key={i}
                    className={`npc-dot ${i === activeImg ? 'is-active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                  />
                ))}
              </div>
            )}
            {/* Swipe arrows for >1 image — tap zones */}
            {allImages.length > 1 && (
              <>
                <button
                  className="npc-swipe prev"
                  type="button"
                  aria-label="Previous image"
                  onClick={() => setActiveImg(i => (i - 1 + allImages.length) % allImages.length)}
                >‹</button>
                <button
                  className="npc-swipe next"
                  type="button"
                  aria-label="Next image"
                  onClick={() => setActiveImg(i => (i + 1) % allImages.length)}
                >›</button>
              </>
            )}
          </>
        ) : (
          <div className="npc-img npc-img-placeholder">
            <span>Product Photo</span>
            <small>1000 × 1000 px</small>
          </div>
        )}
      </div>

      {/* ===== Content column ===== */}
      <div className="npc-body">
        <div className="npc-row">
          <h3 className="npc-name" title={item.name}>{item.name}</h3>
          <span className={`npc-veg ${item.isVeg ? 'veg' : 'non'}`} aria-label={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}>
            <span className="npc-veg-dot" />
          </span>
        </div>

        {item.productCode && (
          <p className="npc-code">ID: {item.productCode}</p>
        )}

        <p className="npc-price">₹{displayPrice.toFixed(2)}</p>

        {hasSizes && (
          <div className="npc-sizes" aria-hidden="true">
            {item.sizes!.map(s => (
              <span key={s.label} className="npc-size-chip">{s.label}</span>
            ))}
          </div>
        )}

        <div className="npc-foot">
          {outOfStock ? (
            <button className="npc-add" disabled>Out of stock</button>
          ) : !hasSizes && baseQty > 0 ? (
            <div className="npc-qty">
              <button onClick={() => removeItem(item.id)} aria-label="Decrease">−</button>
              <span>{baseQty}</span>
              <button onClick={() => addItem(item)} aria-label="Increase">+</button>
            </div>
          ) : (
            <button className="npc-add" onClick={handleAdd}>
              Add <span aria-hidden="true">+</span>
            </button>
          )}
        </div>
      </div>

      {hasSizes && pickerOpen && (
        <SizePickerSheet
          item={item}
          onClose={() => setPickerOpen(false)}
          onPick={onPickSize}
        />
      )}
    </div>
  );
}
