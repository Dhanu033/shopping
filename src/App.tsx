import React, { useEffect, useRef, useState, useMemo } from 'react';
import { SareeLook, TasselPiece, CartItem } from './types.ts';
import { INITIAL_SAREE_LOOKS } from './data/sareeLookbookData.ts';
import { AdminStudioModal } from './components/AdminStudioModal.tsx';
import { LookDetailModal } from './components/LookDetailModal.tsx';
import { ImageZoomModal } from './components/ImageZoomModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { WishlistDrawer } from './components/WishlistDrawer.tsx';
import { Heart, ShoppingBag, Sliders, Search, ArrowRight, Sparkles, ZoomIn, Lock, Eye, EyeOff, MessageSquare, Phone } from 'lucide-react';
import { PlaceOrderWhatsAppModal } from './components/PlaceOrderWhatsAppModal.tsx';
import { DEFAULT_WHATSAPP_NUMBER, WHATSAPP_STORAGE_KEY, cleanPhoneForWhatsApp } from './utils/whatsapp.ts';

const STORAGE_KEY = 'maison_vell_saree_looks_v1';

// Depth constants from specification
const KX = [1.2, 0.744, 0.496, 0.346, 0.235, 0.15, 0.085];
const KF = [1.14, 0.89, 0.777, 0.704, 0.651, 0.616, 0.59];
const KH = [1.18, 0.832, 0.574, 0.436, 0.334, 0.258, 0.19];
const KB = [0, 0, 1.5, 4, 8, 12, 17];
const KO = [1, 1, 1, 1, 0.86, 0.5, 0];

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const wrap = (x: number, n: number) => ((x % n) + n) % n;

export default function App() {
  // Looks data loaded from LocalStorage or Initial Default Presets
  const [looks, setLooks] = useState<SareeLook[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved looks from localStorage', e);
    }
    return INITIAL_SAREE_LOOKS;
  });

  // Cart & Wishlist state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Array<{ piece: TasselPiece; look: SareeLook }>>([]);

  // UI Modals & Display Controls
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showMovingBigImages, setShowMovingBigImages] = useState(true);
  const [selectedLookForModal, setSelectedLookForModal] = useState<SareeLook | null>(null);
  const [zoomModalLook, setZoomModalLook] = useState<SareeLook | null>(null);
  const [placeOrderModalItem, setPlaceOrderModalItem] = useState<{
    isOpen: boolean;
    look: SareeLook | null;
    piece?: TasselPiece | null;
    customImage?: string;
    customTitle?: string;
    customPrice?: string;
  }>({
    isOpen: false,
    look: null,
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(true);

  // WhatsApp Number configured in Admin
  const [whatsappNumber, setWhatsappNumber] = useState<string>(() => {
    try {
      return localStorage.getItem(WHATSAPP_STORAGE_KEY) || DEFAULT_WHATSAPP_NUMBER;
    } catch {
      return DEFAULT_WHATSAPP_NUMBER;
    }
  });

  const handleSaveWhatsappNumber = (newNumber: string) => {
    const cleaned = cleanPhoneForWhatsApp(newNumber);
    setWhatsappNumber(cleaned);
    try {
      localStorage.setItem(WHATSAPP_STORAGE_KEY, cleaned);
    } catch (e) {
      console.warn('Failed to save WhatsApp number', e);
    }
  };

  useEffect(() => {
    if (isAdminOpen) {
      document.body.classList.add('admin-open');
    } else {
      document.body.classList.remove('admin-open');
    }
    return () => {
      document.body.classList.remove('admin-open');
    };
  }, [isAdminOpen]);

  // Active integer look displayed in UI
  const [currentLookIndex, setCurrentLookIndex] = useState(0);

  // DOM Refs for 3D runway depth engine
  const stageRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  // Animation variables held in refs to avoid re-triggering physics loop
  const animState = useRef({
    p: 0,
    target: 0,
    last: 0,
    dirty: true,
    W: 0,
    H: 0,
    base: 0,
    cardS: 0,
    side: false,
    mx: 0,
    my: 0,
    cx: 0,
    cy: 0,
    down: false,
    sx: 0,
    st: 0,
    moved: 0,
    wheelT: 0 as any,
  });

  // Flat list of all pieces for the looping product rail
  const allRailPieces = useMemo(() => {
    const list: Array<{ piece: TasselPiece; look: SareeLook; index: number }> = [];
    looks.forEach((look, lookIdx) => {
      look.pieces.forEach((piece) => {
        list.push({ piece, look, index: list.length });
      });
    });
    return list;
  }, [looks]);

  // Save looks to state & localStorage
  const handleSaveLooks = (newLooks: SareeLook[]) => {
    setLooks(newLooks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLooks));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
    animState.current.dirty = true;
  };

  const handleResetDefaults = () => {
    setLooks(INITIAL_SAREE_LOOKS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
    animState.current.dirty = true;
  };

  // Add piece to cart
  const handleAddToCart = (piece: TasselPiece, look: SareeLook, selectedLength?: string) => {
    const priceNum = parseInt(piece.price.replace(/[^0-9]/g, '')) || 500;
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === piece.id && i.selectedLength === selectedLength);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          id: piece.id,
          lookNumber: look.lookNumber,
          lookTitle: look.title,
          pieceName: piece.name,
          price: piece.price,
          numericPrice: priceNum,
          image: piece.image,
          quantity: 1,
          selectedLength,
        },
      ];
    });
  };

  // Wishlist toggle
  const isWishlisted = (pieceId: string) => wishlist.some((w) => w.piece.id === pieceId);
  const handleToggleWishlist = (piece: TasselPiece, look: SareeLook) => {
    setWishlist((prev) => {
      if (prev.some((w) => w.piece.id === piece.id)) {
        return prev.filter((w) => w.piece.id !== piece.id);
      }
      return [...prev, { piece, look }];
    });
  };

  // Jump to specific look
  const jumpToLook = (idx: number) => {
    const N = looks.length;
    let d = wrap(idx - animState.current.target, N);
    d = Math.round(d);
    animState.current.target = Math.round(animState.current.target) + (d > N / 2 ? d - N : d);
    animState.current.dirty = true;
  };

  // Initialize Runway Stage & Synchronized Loop
  useEffect(() => {
    const stage = stageRef.current;
    const rail = railRef.current;
    const ring = ringRef.current;
    const roll = rollRef.current;
    const line = lineRef.current;
    if (!stage || !rail || !ring || !line) return;

    const N = looks.length;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = animState.current;

    // Build Model DOM elements inside line
    line.innerHTML = '';
    const modelNodes = looks.map((look, i) => {
      const el = document.createElement('div');
      el.className = 'm';
      el.dataset.i = i.toString();

      const inner = document.createElement('div');
      inner.className = 'm-inner';

      const img = document.createElement('img');
      img.src = look.modelImage;
      img.alt = look.title;
      img.setAttribute('loading', 'eager');
      img.setAttribute('draggable', 'false');

      inner.appendChild(img);
      el.appendChild(inner);
      line.appendChild(el);

      return {
        el,
        r: look.aspectRatio || 0.72,
        f: '',
        o: '',
      };
    });

    // Build Cards DOM elements inside rail
    rail.innerHTML = '';
    const cardNodes = allRailPieces.map((item, i) => {
      const card = document.createElement('article');
      card.className = 'card' + (i % 2 !== 0 ? ' alt' : '');
      card.dataset.index = i.toString();

      const isHearted = wishlist.some((w) => w.piece.id === item.piece.id);

      card.innerHTML = `
        <button class="fav" aria-pressed="${isHearted}" aria-label="Save ${item.piece.name}">
          <svg viewBox="0 0 24 24"><path d="M12 20S3.5 15 3.5 9A4.6 4.6 0 0 1 12 6.6 4.600 4.600 0 0 1 20.500 9C20.500 15 12 20 12 20Z"/></svg>
        </button>
        <span class="shot">
          <img src="${item.piece.image}" alt="${item.piece.name}" loading="lazy" draggable="false" />
        </span>
        <div class="meta">
          <h3 class="wide">${item.piece.name}</h3>
          <span>${item.piece.price}</span>
          <button class="add" aria-label="Add ${item.piece.name} to bag"></button>
        </div>
      `;

      rail.appendChild(card);
      return card;
    });

    // Build Look Number Roll items if roll exists
    if (roll) {
      roll.innerHTML = '';
      for (let i = 0; i <= N; i++) {
        const b = document.createElement('b');
        b.textContent = (looks[i % N]?.lookNumber || 15 + (i % N)).toString();
        roll.appendChild(b);
      }
    }

    const size = () => {
      state.W = stage.clientWidth;
      state.H = stage.clientHeight;
      state.base = state.H * 1.2;
      state.side = window.innerWidth <= 820;

      modelNodes.forEach((m) => {
        m.el.style.width = state.base * m.r + 'px';
        m.el.style.height = state.base + 'px';
      });

      state.cardS = state.side ? 160 : rail.clientHeight / 3;
      cardNodes.forEach((c) => {
        c.style.height = state.side ? '100%' : state.cardS + 'px';
      });

      state.dirty = true;
    };

    window.addEventListener('resize', size);
    size();

    const paint = () => {
      // 1. Position Models in Depth
      modelNodes.forEach((m, i) => {
        let d = wrap(i - state.p, N);
        if (d > N - 1) d -= N;

        const k = clamp(d + 1, 0, 6);
        const a = Math.floor(k);
        const b = Math.min(6, a + 1);
        const t = k - a;
        const mix = (A: number[]) => A[a] + (A[b] - A[a]) * t;

        const h = mix(KH) * state.H;
        const s = h / state.base;
        const w = h * m.r;
        const x = mix(KX) * state.W - w / 2;
        const y = mix(KF) * state.H - h;

        m.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})`;

        const f = mix(KB) / s;
        const fs = f < 0.2 ? 'none' : `blur(${f.toFixed(1)}px)`;
        const o = mix(KO).toFixed(3);

        if (fs !== m.f) {
          m.f = fs;
          m.el.style.filter = fs;
        }
        if (o !== m.o) {
          m.o = o;
          m.el.style.opacity = o;
        }
        m.el.style.zIndex = (100 - Math.round(d * 10)).toString();
      });

      // 2. Position Looping Product Cards
      const totalCards = allRailPieces.length;
      const all = state.cardS * totalCards;
      cardNodes.forEach((c, i) => {
        let y = wrap(i * state.cardS - state.p * 2 * state.cardS, all);
        if (y > all - state.cardS) y -= all;
        c.style.transform = state.side
          ? `translate3d(${y.toFixed(1)}px,0,0)`
          : `translate3d(0,${y.toFixed(1)}px,0)`;
      });

      // 3. Rolling Look Number Window (if element present)
      if (roll && roll.firstChild) {
        const itemH = (roll.firstChild as HTMLElement).offsetHeight || 38;
        roll.style.transform = `translate3d(0,${(-wrap(state.p, N) * itemH).toFixed(1)}px,0)`;
      }

      // Update current look index for UI sync
      const activeIdx = Math.round(wrap(state.p, N)) % N;
      setCurrentLookIndex(activeIdx);
    };

    let animId: number;
    const frame = (now: number) => {
      const dt = Math.min(50, now - state.last) || 16;
      state.last = now;

      const was = state.p;
      if (calm) {
        state.p = state.target;
      } else {
        state.p += (state.target - state.p) * (1 - Math.exp(-dt * 0.0072));
      }

      if (Math.abs(state.target - state.p) < 0.0004) {
        state.p = state.target;
      }

      if (state.p !== was || state.dirty) {
        state.dirty = false;
        paint();
      }

      // Cursor ring tracking
      state.cx += (state.mx - state.cx) * 0.32;
      state.cy += (state.my - state.cy) * 0.32;
      ring.style.transform = `translate3d(${state.cx.toFixed(1)}px,${state.cy.toFixed(1)}px,0)`;

      animId = requestAnimationFrame(frame);
    };

    // Pointer Interaction Listeners
    const PULL = () => Math.max(150, state.W * 0.2);

    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') ring.classList.add('show');
    };
    const onPointerLeave = () => ring.classList.remove('show');

    const onPointerMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      state.mx = e.clientX - r.left;
      state.my = e.clientY - r.top;
      if (!state.down) return;
      const dx = e.clientX - state.sx;
      state.moved = Math.max(state.moved, Math.abs(dx));
      state.target = state.st + dx / PULL();
    };

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('a, button')) return;
      state.down = true;
      state.sx = e.clientX;
      state.st = state.target;
      state.moved = 0;
      stage.setPointerCapture(e.pointerId);
      ring.classList.add('drag');
    };

    const onRelease = (e: PointerEvent) => {
      if (!state.down) return;
      state.down = false;
      ring.classList.remove('drag');

      if (state.moved < 6) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const hit = elements.find((x) => x.classList && x.classList.contains('m')) as HTMLElement;
        if (hit && hit.dataset.i !== undefined) {
          const hitIdx = +hit.dataset.i;
          let d = wrap(hitIdx - state.target, N);
          d = Math.round(d);
          if (d > 0 && d < N) {
            state.target = Math.round(state.target) + (d > N / 2 ? d - N : d);
          }
          // User clicked/selected the image: open zoom modal to zoom and inspect it
          setZoomModalLook(looks[hitIdx]);
        }
      } else {
        state.target = Math.round(state.target);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      state.target += clamp(e.deltaY + e.deltaX, -120, 120) / 420;
      clearTimeout(state.wheelT);
      state.wheelT = setTimeout(() => {
        state.target = Math.round(state.target);
      }, 150);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        state.target = Math.round(state.target) + 1;
      }
      if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        state.target = Math.round(state.target) - 1;
      }
    };

    // Rail Clicks delegation
    const onRailClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const card = target.closest('.card') as HTMLElement;
      if (!card) return;

      const idx = parseInt(card.dataset.index || '0');
      const item = allRailPieces[idx];
      if (!item) return;

      const favBtn = target.closest('.fav');
      if (favBtn) {
        const pressed = favBtn.getAttribute('aria-pressed') === 'true';
        favBtn.setAttribute('aria-pressed', (!pressed).toString());
        handleToggleWishlist(item.piece, item.look);
        return;
      }

      const addBtn = target.closest('.add');
      if (addBtn) {
        handleAddToCart(item.piece, item.look);
        return;
      }

      // Card click opens the zoom modal to inspect and zoom the image
      setZoomModalLook(item.look);
    };

    stage.addEventListener('pointerenter', onPointerEnter);
    stage.addEventListener('pointerleave', onPointerLeave);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointerup', onRelease);
    stage.addEventListener('pointercancel', onRelease);
    stage.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    rail.addEventListener('click', onRailClick);

    // Initial paint and dismiss wait cover
    size();
    paint();
    setIsLoaded(true);

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', size);
      stage.removeEventListener('pointerenter', onPointerEnter);
      stage.removeEventListener('pointerleave', onPointerLeave);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointerup', onRelease);
      stage.removeEventListener('pointercancel', onRelease);
      stage.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      rail.removeEventListener('click', onRailClick);
    };
  }, [looks, allRailPieces]);

  // Filtered looks for catalog view when big moving images are turned off or an option is clicked
  const filteredLooks = useMemo(() => {
    if (selectedDepartment !== null && looks[selectedDepartment]) {
      const selected = looks[selectedDepartment];
      return [selected, ...looks.filter((_, i) => i !== selectedDepartment)];
    }
    if (activeCategory === 'bridal') {
      return looks.filter(
        (l) =>
          l.collection.toLowerCase().includes('bridal') ||
          l.pieces.some((p) => p.name.toLowerCase().includes('bridal') || p.name.toLowerCase().includes('kuchu'))
      );
    }
    if (activeCategory === 'heirloom') {
      return looks.filter((l) =>
        l.pieces.some(
          (p) =>
            p.name.toLowerCase().includes('latkan') ||
            p.name.toLowerCase().includes('zari') ||
            p.name.toLowerCase().includes('pendant')
        )
      );
    }
    return looks;
  }, [looks, activeCategory, selectedDepartment]);

  // Current active look
  const activeLook = looks[currentLookIndex] || looks[0];
  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  // Big moving images in #line must not display whenever any other option is clicked
  const isAnyOptionSelected = !showMovingBigImages || activeCategory !== 'all' || selectedDepartment !== null;

  return (
    <div
      className={`page ${isAnyOptionSelected ? 'hide-big-images option-selected' : ''} ${
        isAdminOpen ? 'admin-active' : ''
      }`}
    >
      {/* Header */}
      <header>
        <div className="r1">
          <div className="flex items-center gap-3">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveCategory('all');
                setSelectedDepartment(null);
                setShowMovingBigImages(false);
              }}
              className="brand wide"
              aria-label="Lakshmi Tassels"
            >
              Lakshmi Tassels
              <span className="brand-tag">&middot; Saree Tassels Atelier</span>
            </a>
          </div>

          <nav className="tabs wide" aria-label="Sections">
            <button
              onClick={() => {
                setActiveCategory('all');
                setSelectedDepartment(null);
                setShowMovingBigImages(false);
              }}
              className={
                activeCategory === 'all' && !showMovingBigImages && selectedDepartment === null ? 'on' : ''
              }
              title="View Catalog (Big Images Off)"
            >
              Catalog
            </button>
            <button
              onClick={() => {
                setActiveCategory('bridal');
                setSelectedDepartment(null);
                setShowMovingBigImages(false);
              }}
              className={activeCategory === 'bridal' ? 'on' : ''}
              title="View Bridal Kuchu Catalog (Big Images Off)"
            >
              Bridal Kuchu
            </button>
            <button
              onClick={() => {
                setActiveCategory('heirloom');
                setSelectedDepartment(null);
                setShowMovingBigImages(false);
              }}
              className={activeCategory === 'heirloom' ? 'on' : ''}
              title="View Zari Latkans Catalog (Big Images Off)"
            >
              Zari Latkans
            </button>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSelectedDepartment(null);
                setShowMovingBigImages(true);
              }}
              className={
                activeCategory === 'all' && showMovingBigImages && selectedDepartment === null ? 'on' : ''
              }
              title="View 3D Runway Stage"
            >
              Runway (3D)
            </button>
            <button
              onClick={() => {
                setSelectedLookForModal(activeLook);
                setShowMovingBigImages(false);
              }}
              className="hover:text-slate-900"
            >
              Bespoke Order
            </button>
          </nav>

          <div className="acct wide">
            {/* Direct button to turn off/on the big moving images */}
            <button
              onClick={() => {
                if (showMovingBigImages) {
                  setShowMovingBigImages(false);
                } else {
                  setShowMovingBigImages(true);
                  setSelectedDepartment(null);
                  setActiveCategory('all');
                }
              }}
              className={`px-2.5 py-1.5 rounded-full text-[9.5px] font-['Michroma'] uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                isAnyOptionSelected
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                  : 'border-slate-300 text-slate-700 hover:border-slate-800 bg-white'
              }`}
              title={
                !isAnyOptionSelected
                  ? 'Turn off the moving big images covering the total page'
                  : 'Turn on the 3D moving big images'
              }
            >
              {isAnyOptionSelected ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Big Images: OFF (Turn On)</span>
                  <span className="sm:hidden">Images: OFF</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Turn Off Big Images</span>
                  <span className="sm:hidden">Images: ON</span>
                </>
              )}
            </button>

            {/* Admin Upload & Manage Button (Password Protected) */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="admin-badge-btn"
              title="Admin Control Center (Password Protected)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => setIsWishlistOpen(true)}
              aria-label="Saved Tassels"
              className="relative p-1 hover:text-slate-900 transition-colors"
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 20S3.5 15 3.5 9A4.6 4.6 0 0 1 12 6.6 4.600 4.600 0 0 1 20.500 9C20.500 15 12 20 12 20Z" />
              </svg>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Shopping Bag"
              className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
            >
              <svg viewBox="0 0 24 24">
                <path d="M5 8h14l1 13H4Z" />
                <path d="M9 10V6a3 3 0 0 1 6 0v4" />
              </svg>
              <span>Bag ({totalCartCount})</span>
            </button>
          </div>
        </div>

        {/* Secondary Category Navigation */}
        <nav className="r2 wide" aria-label="Departments">
          {looks.map((look, idx) => (
            <button
              key={look.id}
              onClick={() => {
                jumpToLook(idx);
                setCurrentLookIndex(idx);
                setSelectedDepartment(idx);
                setShowMovingBigImages(false); // remove the big moving images when this or other option is clicked!
              }}
              className={selectedDepartment === idx && isAnyOptionSelected ? 'active-cat font-bold' : ''}
              title={`View ${look.sareeFabric} collection (big images removed)`}
            >
              {look.sareeFabric.split(' ')[0]} {look.sareeFabric.split(' ')[1] || 'Silk'}
            </button>
          ))}
          {selectedDepartment !== null && (
            <button
              onClick={() => {
                setSelectedDepartment(null);
                setShowMovingBigImages(false);
              }}
              className="text-[11px] text-rose-500 hover:text-rose-700 underline font-inter lowercase"
            >
              (show all)
            </button>
          )}
        </nav>
      </header>

      {/* Main Viewport Stage: Completely NOT rendered when Admin is open */}
      {!isAdminOpen && (
        <>
          {/* Mode 1: When user selects any other option or clicks other option, big moving images are removed and clean catalog is displayed */}
          {isAnyOptionSelected ? (
            <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6 select-none animate-in fade-in duration-200">
              <div className="max-w-7xl mx-auto space-y-5">
                {/* Notice Bar */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200 shrink-0">
                      <EyeOff className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-['Michroma'] uppercase text-xs tracking-wider font-semibold text-slate-900">
                        {selectedDepartment !== null && looks[selectedDepartment]
                          ? `${looks[selectedDepartment].sareeFabric} &middot; Big Images Removed`
                          : 'Option Selected &middot; Big Moving Images Removed'}
                      </h2>
                      <p className="text-[11px] text-slate-500 font-inter">
                        Select any tassel to zoom into its craftsmanship and place orders directly to WhatsApp (+{cleanPhoneForWhatsApp(whatsappNumber)})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowMovingBigImages(true);
                      setActiveCategory('all');
                      setSelectedDepartment(null);
                    }}
                    className="px-3.5 py-1.5 text-xs font-['Michroma'] uppercase tracking-wider text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Turn On 3D Runway</span>
                  </button>
                </div>

                {/* Grid of All Tassels and Saree Looks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLooks.map((look) => (
                    <div
                      key={look.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image Preview with Zoom icon */}
                        <div className="relative aspect-[4/3] bg-slate-100 border-b border-slate-100 overflow-hidden flex items-center justify-center">
                          <img
                            src={look.pieces[0]?.image || look.modelImage}
                            alt={look.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[10px] text-white font-mono flex items-center gap-1.5 border border-white/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Look #{look.lookNumber}
                          </div>
                          <button
                            onClick={() => setZoomModalLook(look)}
                            className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-slate-900 rounded-full shadow-md transition-all hover:scale-110"
                            title="Zoom and Inspect Image"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Details */}
                        <div className="p-5 space-y-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="font-['Michroma'] uppercase text-xs font-bold text-slate-900 truncate">
                              {look.pieces[0]?.name || look.title}
                            </h3>
                            <span className="font-inter font-bold text-base text-emerald-800 tabular-nums shrink-0">
                              {look.pieces[0]?.price}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-inter line-clamp-1">
                            {look.sareeFabric} &middot; {look.collection}
                          </p>
                          <p className="text-xs text-slate-600 font-inter line-clamp-2">
                            {look.pieces[0]?.description || look.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="p-5 pt-0 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setPlaceOrderModalItem({
                              isOpen: true,
                              look: look,
                              piece: look.pieces[0],
                              customImage: look.pieces[0]?.image || look.modelImage,
                              customTitle: look.pieces[0]?.name || look.title,
                              customPrice: look.pieces[0]?.price,
                            });
                          }}
                          className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-['Michroma'] uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.02]"
                          title="Place Order on WhatsApp with full tassel details and photo"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Place Order</span>
                        </button>

                        <button
                          onClick={() => setZoomModalLook(look)}
                          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-medium flex items-center justify-center transition-colors"
                          title="Zoom & Inspect Image"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleAddToCart(look.pieces[0], look)}
                          className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
                          title="Add to Shopping Bag"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: 3D Runway Stage & Synchronized Rail */
            <main>
              <section
                ref={stageRef}
                className="stage"
                id="stage"
                aria-label="Lakshmi Tassels Runway. Drag, scroll or use arrow keys to change looks."
                tabIndex={0}
              >
                {/* 3D Depth Runway Line */}
                <div ref={lineRef} className="line" id="line"></div>

                {/* Top Stage Brand Display */}
                <div className="stage-top-brand">Lakshmi Tassels</div>

                {/* Bottom Stage Price in Rupees & Zoom Action */}
                <div className="stage-bottom-price-bar">
                  <div className="flex items-baseline gap-2.5">
                    <span className="price-tag-badge">Look {activeLook?.lookNumber}</span>
                    <span className="price-main font-inter tabular-nums">
                      {activeLook?.pieces[0]?.price || '₹3,800'}
                    </span>
                    <span className="price-label font-inter">
                      ({activeLook?.pieces[0]?.name})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Turn Off Big Images Button */}
                    <button
                      onClick={() => setShowMovingBigImages(false)}
                      className="px-2.5 py-1.5 text-[10px] font-['Michroma'] uppercase tracking-wider text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors flex items-center gap-1.5"
                      title="Turn off the big moving images"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Turn Off Big Images</span>
                    </button>

                    <button
                      onClick={() => setZoomModalLook(activeLook)}
                      className="zoom-btn-pill"
                      title="Select and Zoom Saree Tassel Image"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Zoom Image</span>
                    </button>

                    <button
                      onClick={() => {
                        setPlaceOrderModalItem({
                          isOpen: true,
                          look: activeLook,
                          piece: activeLook?.pieces[0],
                          customImage: activeLook?.pieces[0]?.image || activeLook?.modelImage,
                          customTitle: activeLook?.pieces[0]?.name || activeLook?.title,
                          customPrice: activeLook?.pieces[0]?.price,
                        });
                      }}
                      className="px-3.5 py-1.5 text-xs font-['Michroma'] uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 rounded-full shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all hover:scale-105"
                      title="Place Order on WhatsApp with full tassel details and photo"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Place Order</span>
                    </button>

                    <button
                      onClick={() => setSelectedLookForModal(activeLook)}
                      className="px-3 py-1.5 text-xs font-['Michroma'] uppercase tracking-wider text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors hidden sm:inline-flex items-center gap-1"
                      title="View Full Saree & Tassel Ensemble Details"
                    >
                      <span>Details</span>
                    </button>
                  </div>
                </div>

                {/* Custom Interactive Ring Cursor */}
                <div ref={ringRef} className="ring" id="ring"></div>
              </section>

              {/* Synchronized Looping Product Rail */}
              <aside
                ref={railRef}
                className="rail"
                id="rail"
                aria-label="Handcrafted saree tassels and accessories in this look"
              ></aside>
            </main>
          )}
        </>
      )}

      {/* Loading Cover */}
      {!isLoaded && (
        <div className="wait" id="wait">
          <div className="flex flex-col items-center gap-3">
            <span className="font-['Michroma'] uppercase text-sm tracking-widest text-slate-800">
              Lakshmi Tassels
            </span>
            <span className="text-xs text-slate-500 font-inter">Loading runway depth lookbook...</span>
          </div>
        </div>
      )}

      {/* Admin Studio Modal (Big moving images are 100% disabled and invisible when open) */}
      <AdminStudioModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        looks={looks}
        onSaveLooks={handleSaveLooks}
        onResetDefaults={handleResetDefaults}
        activeLookIndex={currentLookIndex}
        onSelectLook={(idx) => jumpToLook(idx)}
        whatsappNumber={whatsappNumber}
        onSaveWhatsappNumber={handleSaveWhatsappNumber}
      />

      {/* Look Detail / Shop Modal */}
      <LookDetailModal
        isOpen={!!selectedLookForModal}
        onClose={() => setSelectedLookForModal(null)}
        look={selectedLookForModal}
        onAddToCart={handleAddToCart}
        isWishlisted={isWishlisted}
        onToggleWishlist={handleToggleWishlist}
        whatsappNumber={whatsappNumber}
        onPlaceOrderWhatsApp={(item) => {
          setPlaceOrderModalItem({
            isOpen: true,
            look: item.look || selectedLookForModal,
            piece: item.piece,
            customImage: item.customImage,
            customTitle: item.customTitle,
            customPrice: item.customPrice,
          });
        }}
      />

      {/* Interactive High-Res Image Zoom & Pan Modal */}
      <ImageZoomModal
        isOpen={!!zoomModalLook}
        onClose={() => setZoomModalLook(null)}
        look={zoomModalLook}
        onAddToCart={handleAddToCart}
        whatsappNumber={whatsappNumber}
        onPlaceOrderWhatsApp={(item) => {
          setPlaceOrderModalItem({
            isOpen: true,
            look: item.look || zoomModalLook,
            piece: item.piece,
            customImage: item.customImage,
            customTitle: item.customTitle,
            customPrice: item.customPrice,
          });
        }}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(id, delta) => {
          setCartItems((prev) =>
            prev
              .map((item) => {
                if (item.id === id) {
                  const newQty = item.quantity + delta;
                  return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
              })
              .filter(Boolean) as CartItem[]
          );
        }}
        onRemoveItem={(id) => setCartItems((prev) => prev.filter((i) => i.id !== id))}
        onClearCart={() => setCartItems([])}
        whatsappNumber={whatsappNumber}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveFromWishlist={(id) => setWishlist((prev) => prev.filter((w) => w.piece.id !== id))}
        onAddToCart={handleAddToCart}
      />

      {/* Place Order on WhatsApp Modal with Photo and Tassel Specifications */}
      <PlaceOrderWhatsAppModal
        isOpen={placeOrderModalItem.isOpen}
        onClose={() => setPlaceOrderModalItem((prev) => ({ ...prev, isOpen: false }))}
        look={placeOrderModalItem.look}
        piece={placeOrderModalItem.piece}
        customImage={placeOrderModalItem.customImage}
        customTitle={placeOrderModalItem.customTitle}
        customPrice={placeOrderModalItem.customPrice}
        whatsappNumber={whatsappNumber}
      />
    </div>
  );
}
