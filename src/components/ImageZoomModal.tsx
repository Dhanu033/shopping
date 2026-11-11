import React, { useState, useRef, useEffect } from 'react';
import { SareeLook, TasselPiece } from '../types.ts';
import { X, ZoomIn, ZoomOut, RotateCcw, Sparkles, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  look: SareeLook | null;
  initialImage?: string;
  initialTitle?: string;
  initialPrice?: string;
  onAddToCart?: (piece: TasselPiece, look: SareeLook) => void;
}

interface GalleryItem {
  url: string;
  title: string;
  price: string;
  subtitle?: string;
  type: string;
  pieceRef?: TasselPiece;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  onClose,
  look,
  initialImage,
  initialTitle,
  initialPrice,
  onAddToCart,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Available images to cycle through in the active look
  const imageGallery: GalleryItem[] = React.useMemo(() => {
    if (!look) {
      if (initialImage) {
        return [{ url: initialImage, title: initialTitle || 'Saree Tassel', price: initialPrice || '₹2,500', subtitle: 'Handcrafted Tassel Piece', type: 'Piece' }];
      }
      return [];
    }
    return [
      {
        url: look.modelImage,
        title: `Look ${look.lookNumber} · ${look.title}`,
        price: look.pieces[0]?.price || '₹3,800',
        subtitle: look.sareeFabric,
        type: 'Saree Drape',
        pieceRef: look.pieces[0],
      },
      {
        url: look.pieces[0]?.image,
        title: look.pieces[0]?.name,
        price: look.pieces[0]?.price,
        subtitle: look.pieces[0]?.description || 'Primary Saree Kuchu Tassel',
        type: 'Piece 1',
        pieceRef: look.pieces[0],
      },
      {
        url: look.pieces[1]?.image,
        title: look.pieces[1]?.name,
        price: look.pieces[1]?.price,
        subtitle: look.pieces[1]?.description || 'Secondary Latkan / Belt',
        type: 'Piece 2',
        pieceRef: look.pieces[1],
      },
    ];
  }, [look, initialImage, initialTitle, initialPrice]);

  // Reset zoom & pan when image changes or modal opens
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setSelectedImageIndex(0);
  }, [isOpen, look]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedImageIndex, imageGallery.length]);

  if (!isOpen || imageGallery.length === 0) return null;

  const currentItem = imageGallery[selectedImageIndex] || imageGallery[0];

  const handleZoomIn = () => {
    setScale((prev) => Math.min(4, prev + 0.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(1, prev - 0.5);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2.5);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setScale((prev) => {
      const next = Math.min(4, Math.max(1, prev + delta));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handlePrev = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : imageGallery.length - 1));
    handleResetZoom();
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) => (prev < imageGallery.length - 1 ? prev + 1 : 0));
    handleResetZoom();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] bg-[#111317] text-white rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Bar with Brand & Details */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#16191f]">
          <div className="flex items-center gap-3">
            <span className="font-['Michroma'] text-amber-400 text-xs sm:text-sm uppercase tracking-widest font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Lakshmi Tassels
            </span>
            <span className="text-white/30 hidden sm:inline">&middot;</span>
            <span className="text-xs text-white/70 hidden sm:inline font-inter">
              High Resolution Image Zoom
            </span>
          </div>

          {/* Zoom Control Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className="p-1.5 text-white/80 hover:text-white disabled:opacity-30 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono tabular-nums text-amber-300">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={scale >= 4}
                className="p-1.5 text-white/80 hover:text-white disabled:opacity-30 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleResetZoom}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 hover:text-white border border-white/10 transition-colors"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-rose-600 rounded-lg text-white/80 hover:text-white border border-white/10 transition-colors ml-2"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Zoom Canvas Stage */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          className={`flex-1 relative overflow-hidden flex items-center justify-center bg-[#0d0f13] ${
            scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
          }`}
        >
          {/* Main Zoomable Image */}
          <div
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="w-full h-full flex items-center justify-center p-4"
          >
            <img
              src={currentItem.url}
              alt={currentItem.title}
              draggable="false"
              className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-2xl"
            />
          </div>

          {/* Left / Right Carousel Arrow Buttons */}
          {imageGallery.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105"
                title="Previous Image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105"
                title="Next Image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Floating Zoom Hint */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-white/70 font-inter pointer-events-none">
            {scale > 1
              ? 'Drag to pan around · Double click to reset'
              : 'Scroll or Double-click to zoom into handcrafted knotting'}
          </div>
        </div>

        {/* Bottom Bar: Image Switcher & Prominent Price in RUPEES */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#16191f] flex flex-wrap items-center justify-between gap-4">
          {/* Thumbnails to switch views */}
          <div className="flex items-center gap-2">
            {imageGallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedImageIndex(idx);
                  handleResetZoom();
                }}
                className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImageIndex === idx
                    ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center font-['Michroma'] uppercase py-0.5 text-white/90">
                  {img.type}
                </span>
              </button>
            ))}
          </div>

          {/* Current Item Title & Price in Rupees */}
          <div className="flex-1 min-w-[200px] text-center sm:text-left">
            <h3 className="font-['Michroma'] text-xs sm:text-sm uppercase tracking-wider text-white truncate">
              {currentItem.title}
            </h3>
            <p className="text-[11px] text-white/60 font-inter truncate">
              {currentItem.subtitle}
            </p>
          </div>

          {/* Price & Add to Bag in Rupees */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-[10px] text-white/50 uppercase tracking-widest font-['Michroma']">
                Price in Rupees
              </span>
              <span className="text-xl sm:text-2xl font-bold text-amber-400 font-inter tabular-nums">
                {currentItem.price}
              </span>
            </div>

            {onAddToCart && look && (
              <button
                onClick={() => {
                  const pieceToOrder = currentItem.pieceRef || look.pieces[0];
                  onAddToCart(pieceToOrder, look);
                  onClose();
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20 font-inter"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
