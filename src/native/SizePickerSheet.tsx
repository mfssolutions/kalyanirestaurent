import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { MenuItem, MenuItemSize } from '../types';
import './SizePickerSheet.css';

interface Props {
  item: MenuItem;
  onClose: () => void;
  onPick: (size: MenuItemSize) => void;
}

/**
 * Swiggy-style bottom sheet for picking a portion before adding to cart.
 * Price updates live as the user changes the selected size.
 */
export default function SizePickerSheet({ item, onClose, onPick }: Props) {
  const sizes = item.sizes || [];
  const [selected, setSelected] = useState<string>(sizes[0]?.label || '');

  useEffect(() => {
    // Prevent body scroll while sheet is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const current = sizes.find(s => s.label === selected) || sizes[0];

  const handleAdd = () => {
    if (current) onPick(current);
  };

  return (
    <div className="sps-backdrop" onClick={onClose}>
      <div className="sps-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="sps-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <h3 className="sps-title">{item.name}</h3>
        <p className="sps-subtitle">Pick a portion</p>

        <ul className="sps-list" role="radiogroup" aria-label="Select size">
          {sizes.map(s => {
            const active = s.label === selected;
            return (
              <li key={s.label}>
                <button
                  type="button"
                  className={`sps-opt ${active ? 'is-active' : ''}`}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelected(s.label)}
                >
                  <span className="sps-opt-radio" aria-hidden="true" />
                  <span className="sps-opt-label">{s.label}</span>
                  <span className="sps-opt-price">₹{s.price.toFixed(2)}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="sps-add"
          onClick={handleAdd}
          disabled={!current}
        >
          Add to cart · ₹{(current?.price ?? 0).toFixed(2)}
        </button>
      </div>
    </div>
  );
}
