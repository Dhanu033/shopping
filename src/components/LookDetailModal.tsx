import React, { useState } from 'react';
import { SareeLook, TasselPiece } from '../types.ts';
import { X, Heart, ShoppingBag, MessageSquare, Check, Sparkles, Clock, Scissors, ShieldCheck, Send } from 'lucide-react';
import { cleanPhoneForWhatsApp, formatWhatsAppOrderUrl, DEFAULT_WHATSAPP_NUMBER } from '../utils/whatsapp.ts';

interface LookDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  look: SareeLook | null;
  onAddToCart: (piece: TasselPiece, look: SareeLook, selectedLength?: string) => void;
  isWishlisted: (pieceId: string) => boolean;
  onToggleWishlist: (piece: TasselPiece, look: SareeLook) => void;
  whatsappNumber?: string;
  onPlaceOrderWhatsApp?: (item: {
    look?: SareeLook;
    piece?: TasselPiece;
    customImage?: string;
    customTitle?: string;
    customPrice?: string;
  }) => void;
}

export const LookDetailModal: React.FC<LookDetailModalProps> = ({
  isOpen,
  onClose,
  look,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  whatsappNumber,
  onPlaceOrderWhatsApp,
}) => {
  const [selectedLength, setSelectedLength] = useState<string>('3.5" Traditional');
  const [activeTab, setActiveTab] = useState<'overview' | 'craftsmanship' | 'customization'>('overview');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  if (!isOpen || !look) return null;

  const handleAddPiece = (piece: TasselPiece) => {
    onAddToCart(piece, look, selectedLength);
    setAddedToast(`Added ${piece.name} to bag`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const handleAddFullLook = () => {
    look.pieces.forEach((piece) => {
      onAddToCart(piece, look, selectedLength);
    });
    setAddedToast(`Added complete Look #${look.lookNumber} (2 pieces) to bag`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const openWhatsAppInquiry = () => {
    if (onPlaceOrderWhatsApp) {
      onPlaceOrderWhatsApp({
        look,
        piece: look.pieces[0],
        customImage: look.modelImage,
        customTitle: `Look ${look.lookNumber} · ${look.title}`,
        customPrice: look.pieces[0]?.price,
      });
      return;
    }
    const cleanNumber = cleanPhoneForWhatsApp(whatsappNumber || '') || DEFAULT_WHATSAPP_NUMBER;
    const url = formatWhatsAppOrderUrl({
      phone: cleanNumber,
      lookNumber: look.lookNumber,
      lookTitle: look.title,
      pieceName: look.pieces[0]?.name || 'Bridal Saree Tassel',
      price: look.pieces[0]?.price || '₹3,800',
      length: selectedLength,
      sareeFabric: look.sareeFabric,
      imageUrl: look.modelImage,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#fafbfc]">
          <div className="flex items-center gap-3">
            <span className="font-['Michroma'] text-xs uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200/60">
              Look {look.lookNumber}
            </span>
            <div>
              <h2 className="font-['Michroma'] uppercase text-sm tracking-wider text-slate-900">
                {look.title}
              </h2>
              <span className="text-xs text-slate-500 font-inter">{look.collection}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {addedToast && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> {addedToast}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Saree Drape Visual */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="w-full aspect-[3/4] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner relative group">
                <img
                  src={look.modelImage}
                  alt={look.title}
                  className="w-full h-full object-contain object-bottom"
                />
                <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md rounded-lg p-2.5 border border-slate-200/80 text-[11px] text-slate-600 text-center font-inter">
                  <span className="font-semibold text-slate-900 block">{look.sareeFabric}</span>
                  Hand-crafted pallu tassel embellishment
                </div>
              </div>
            </div>

            {/* Right Column: Information, Pieces & Customization */}
            <div className="md:col-span-7 space-y-6">
              {/* Description */}
              <div>
                <p className="text-xs leading-relaxed text-slate-600 font-inter">
                  {look.description}
                </p>
              </div>

              {/* Tassel Length Selector */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 font-['Michroma'] uppercase tracking-wider">
                    Select Tassel Length:
                  </label>
                  <span className="text-[11px] text-amber-700 font-medium">Bespoke Fit</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(look.artisanDetails?.tasselLengths || [
                    '3.0" Standard Pallu',
                    '4.5" Grand Bridal',
                    '6.0" Royal Maharani',
                  ]).map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setSelectedLength(len)}
                      className={`px-3 py-2 text-xs rounded-lg border text-center transition-all ${
                        selectedLength === len
                          ? 'border-slate-900 bg-slate-900 text-white font-medium'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tassel Pieces List */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 font-['Michroma']">
                  Individual Tassel Pieces in this Ensemble:
                </h3>
                <div className="space-y-3">
                  {look.pieces.map((piece, idx) => {
                    const wishlisted = isWishlisted(piece.id);
                    return (
                      <div
                        key={piece.id || idx}
                        className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex items-center gap-4 transition-all hover:shadow-sm"
                      >
                        <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          <img
                            src={piece.image}
                            alt={piece.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold font-['Michroma'] uppercase tracking-wider text-slate-900 truncate">
                            {piece.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-inter line-clamp-1 mt-0.5">
                            {piece.description || 'Artisanal hand-crafted saree tassel'}
                          </p>
                          <span className="text-xs font-semibold text-amber-800 mt-1 block">
                            {piece.price}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onToggleWishlist(piece, look)}
                            className={`p-2 rounded-lg border transition-colors ${
                              wishlisted
                                ? 'bg-rose-50 border-rose-200 text-rose-600'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                            }`}
                            title={wishlisted ? 'Saved' : 'Save to wishlist'}
                          >
                            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleAddPiece(piece)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Artisan Highlights */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#fdf8ee] rounded-xl border border-[#e2c98a]/60 text-[11px] text-[#745318]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{look.artisanDetails?.artisanHours || 20} hours of master knotting</span>
                </div>
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{look.artisanDetails?.silkType || 'Pure Resham Silk'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{look.artisanDetails?.embellishments || 'Zari & Pearls'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Handcrafted Couture Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-[#fafbfc] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={openWhatsAppInquiry}
            className="px-4 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Inquire on WhatsApp</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
            >
              Close
            </button>
            <button
              onClick={handleAddFullLook}
              className="px-5 py-2 text-xs font-['Michroma'] uppercase tracking-wider text-white bg-[#16191f] hover:bg-[#2e3440] rounded-lg shadow-sm flex items-center gap-2 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add Complete Ensemble</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
