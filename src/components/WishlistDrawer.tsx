import React from 'react';
import { TasselPiece, SareeLook } from '../types.ts';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Array<{ piece: TasselPiece; look: SareeLook }>;
  onRemoveFromWishlist: (pieceId: string) => void;
  onAddToCart: (piece: TasselPiece, look: SareeLook) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlist,
  onRemoveFromWishlist,
  onAddToCart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h2 className="font-['Michroma'] uppercase text-xs tracking-wider font-semibold text-slate-900">
              Saved Tassels ({wishlist.length})
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
          {wishlist.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
              <Heart className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300" />
              <p className="font-['Michroma'] text-xs uppercase tracking-wider text-slate-600 mb-1">
                No saved items
              </p>
              <p className="text-xs text-slate-400 max-w-xs font-inter">
                Heart your favorite saree tassels and latkans from the runway or product rail to view them here.
              </p>
            </div>
          ) : (
            wishlist.map(({ piece, look }) => (
              <div
                key={piece.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex gap-3.5 items-center"
              >
                <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                  <img src={piece.image} alt={piece.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold font-['Michroma'] uppercase tracking-wider text-slate-900 truncate">
                    {piece.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-inter">
                    Look {look.lookNumber} &middot; {look.title}
                  </p>
                  <span className="text-xs font-semibold text-slate-900 font-inter mt-1 block">
                    {piece.price}
                  </span>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        onAddToCart(piece, look);
                        onRemoveFromWishlist(piece.id);
                      }}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                    >
                      <ShoppingBag className="w-3 h-3" /> Move to Bag
                    </button>
                    <button
                      onClick={() => onRemoveFromWishlist(piece.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
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
      </div>
    </div>
  );
};
