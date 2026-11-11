import React from 'react';
import { CartItem } from '../types.ts';
import { X, Trash2, Plus, Minus, MessageSquare, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => sum + item.numericPrice * item.quantity, 0);

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;
    const itemsList = items
      .map(
        (i, idx) =>
          `${idx + 1}. ${i.pieceName} (Look ${i.lookNumber}) x${i.quantity} @ ${i.price} [Length: ${
            i.selectedLength || 'Standard'
          }]`
      )
      .join('\n');

    const msg = encodeURIComponent(
      `Hello Lakshmi Tassels Atelier!\nI would like to place an order for the following saree tassels & accessories:\n\n${itemsList}\n\nEstimated Total: ₹${totalAmount.toLocaleString()}\n\nPlease confirm availability and delivery timeframe for custom hand-knotting.`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-slate-800" />
            <h2 className="font-['Michroma'] uppercase text-xs tracking-wider font-semibold text-slate-900">
              Shopping Bag ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
              <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300" />
              <p className="font-['Michroma'] text-xs uppercase tracking-wider text-slate-600 mb-1">
                Your bag is empty
              </p>
              <p className="text-xs text-slate-400 max-w-xs font-inter">
                Add handcrafted saree tassels, latkans or complete looks from the runway.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex gap-3.5 items-center"
              >
                <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                  <img src={item.image} alt={item.pieceName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <h3 className="text-xs font-semibold font-['Michroma'] uppercase tracking-wider text-slate-900 truncate">
                      {item.pieceName}
                    </h3>
                    <span className="text-xs font-semibold text-slate-900 font-inter tabular-nums">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-inter">
                    Look {item.lookNumber} &middot; {item.selectedLength || 'Standard Length'}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="p-0.5 text-slate-600 hover:text-slate-900"
                        title="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold text-slate-800 px-1 font-inter tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="p-0.5 text-slate-600 hover:text-slate-900"
                        title="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-4">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-500 uppercase tracking-wider font-['Michroma']">Subtotal</span>
              <span className="text-base font-bold text-slate-900 font-inter tabular-nums">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-inter">
              Includes artisan hand-knotting, custom tassel dori strings, and luxury velvet gift packaging.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleWhatsAppCheckout}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Order &amp; Customize on WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  alert(`Thank you! Your boutique order quotation for ₹${totalAmount.toLocaleString()} has been noted. Our master artisan will reach out to confirm your saree fabric details.`);
                  onClearCart();
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-[#16191f] hover:bg-[#2b313d] text-white rounded-lg text-xs font-['Michroma'] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Direct Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
