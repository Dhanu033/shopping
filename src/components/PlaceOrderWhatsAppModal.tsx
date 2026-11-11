import React, { useState } from 'react';
import { SareeLook, TasselPiece } from '../types.ts';
import { formatWhatsAppOrderUrl, copyImageToClipboard } from '../utils/whatsapp.ts';
import { X, MessageSquare, Copy, Check, Sparkles, Send, Download } from 'lucide-react';

interface PlaceOrderWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  look: SareeLook | null;
  piece?: TasselPiece | null;
  customImage?: string;
  customTitle?: string;
  customPrice?: string;
  whatsappNumber: string;
}

export const PlaceOrderWhatsAppModal: React.FC<PlaceOrderWhatsAppModalProps> = ({
  isOpen,
  onClose,
  look,
  piece,
  customImage,
  customTitle,
  customPrice,
  whatsappNumber,
}) => {
  const [selectedLength, setSelectedLength] = useState<string>('4.5" Grand Bridal');
  const [customerName, setCustomerName] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [copiedImage, setCopiedImage] = useState(false);

  if (!isOpen) return null;

  const displayImage = customImage || piece?.image || look?.modelImage || '';
  const displayTitle = customTitle || piece?.name || look?.title || 'Bespoke Saree Tassel';
  const displayPrice = customPrice || piece?.price || look?.pieces[0]?.price || '₹3,800';

  const handlePlaceOrder = () => {
    const url = formatWhatsAppOrderUrl({
      phone: whatsappNumber,
      lookNumber: look?.lookNumber,
      lookTitle: look?.title,
      pieceName: displayTitle,
      price: displayPrice,
      length: selectedLength,
      sareeFabric: look?.sareeFabric,
      imageUrl: displayImage,
      customerName: customerName.trim(),
      customerNotes: customerNotes.trim(),
    });
    window.open(url, '_blank');
    onClose();
  };

  const handleCopyImage = async () => {
    if (!displayImage) return;
    const success = await copyImageToClipboard(displayImage);
    if (success) {
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 3000);
    } else {
      // Fallback: copy image link
      navigator.clipboard.writeText(displayImage);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#16191f] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-['Michroma'] uppercase text-xs tracking-wider font-semibold text-white">
                Place Order on WhatsApp
              </h2>
              <span className="text-[11px] text-emerald-400 font-inter">
                Direct to Boutique Owner ({whatsappNumber || '+91 98765 43210'})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Item Preview Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex gap-4 items-center">
            <div className="w-20 h-24 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 shadow-sm">
              <img
                src={displayImage}
                alt={displayTitle}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-['Michroma'] uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {look ? `Look ${look.lookNumber}` : 'Bespoke Tassel'}
              </span>
              <h3 className="font-['Michroma'] text-xs font-bold uppercase tracking-wider text-slate-900 mt-1 truncate">
                {displayTitle}
              </h3>
              {look?.sareeFabric && (
                <p className="text-[11px] text-slate-500 font-inter line-clamp-1 mt-0.5">
                  {look.sareeFabric}
                </p>
              )}
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-base font-bold text-slate-900 font-inter tabular-nums">
                  {displayPrice}
                </span>
                <span className="text-[10px] text-slate-500">Includes Custom Handcrafting</span>
              </div>
            </div>
          </div>

          {/* Tassel Length Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider font-['Michroma'] mb-2">
              Select Tassel Length
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['3.0" Standard', '4.5" Grand Bridal', '6.0" Royal Maharani'].map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => setSelectedLength(len)}
                  className={`px-3 py-2 text-xs rounded-lg border text-center transition-all ${
                    selectedLength === len
                      ? 'border-slate-900 bg-slate-900 text-white font-medium shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Your Name / Contact:
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Special Instructions (Color match with your saree, event date, etc.):
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="e.g. Please match with my royal blue Kanjivaram saree pallu"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Image Share Helper Button */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div className="text-[11px] text-emerald-900 font-inter">
              <span className="font-semibold block">Photo attached in WhatsApp message</span>
              The design link and tassel specifications will be sent directly to the owner.
            </div>
            <button
              type="button"
              onClick={handleCopyImage}
              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
            >
              {copiedImage ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Photo Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copy Photo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handlePlaceOrder}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-['Michroma'] uppercase tracking-wider font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            <Send className="w-4 h-4" />
            <span>Send Order to WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
