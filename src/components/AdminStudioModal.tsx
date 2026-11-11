import React, { useState, useEffect } from 'react';
import { SareeLook } from '../types.ts';
import { PRESET_GALLERY } from '../data/sareeLookbookData.ts';
import { cleanPhoneForWhatsApp } from '../utils/whatsapp.ts';
import {
  Upload,
  X,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  Check,
  Sparkles,
  Image as ImageIcon,
  Lock,
  Unlock,
  Key,
  Shield,
  Eye,
  EyeOff,
  LogOut,
  Maximize2,
  Settings,
  MessageSquare,
  Phone,
} from 'lucide-react';

interface AdminStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  looks: SareeLook[];
  onSaveLooks: (newLooks: SareeLook[]) => void;
  onResetDefaults: () => void;
  activeLookIndex: number;
  onSelectLook: (index: number) => void;
  whatsappNumber: string;
  onSaveWhatsappNumber: (newNumber: string) => void;
}

const ADMIN_CREDS_KEY = 'lakshmi_tassels_admin_creds_v1';
const ADMIN_SESSION_KEY = 'lakshmi_tassels_admin_session_v1';

export const AdminStudioModal: React.FC<AdminStudioModalProps> = ({
  isOpen,
  onClose,
  looks,
  onSaveLooks,
  onResetDefaults,
  activeLookIndex,
  onSelectLook,
  whatsappNumber,
  onSaveWhatsappNumber,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // WhatsApp Config State
  const [currentPhone, setCurrentPhone] = useState<string>(whatsappNumber);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);

  // Password Change Modal inside Admin
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  // Editor State
  const [editingIndex, setEditingIndex] = useState<number>(activeLookIndex);
  const [localLooks, setLocalLooks] = useState<SareeLook[]>(looks);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Retrieve stored credentials or defaults
  const getCredentials = () => {
    try {
      const stored = localStorage.getItem(ADMIN_CREDS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(e);
    }
    return { username: 'admin', password: 'lakshmi@2027' };
  };

  // Sync state on open
  useEffect(() => {
    setLocalLooks(looks);
    setEditingIndex(activeLookIndex);
    setLoginError(null);
    setCurrentPhone(whatsappNumber);
  }, [looks, activeLookIndex, isOpen, whatsappNumber]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const creds = getCredentials();
    if (
      usernameInput.trim() === creds.username &&
      passwordInput === creds.password
    ) {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      } catch (e) {
        console.warn(e);
      }
      setLoginError(null);
      showToast('Welcome Administrator');
    } else {
      setLoginError('Invalid Administrator Username or Password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (e) {
      console.warn(e);
    }
    setUsernameInput('');
    setPasswordInput('');
    onClose();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newPassword.length < 4) {
      alert('Username cannot be empty and password must be at least 4 characters.');
      return;
    }
    const updated = { username: newUsername.trim(), password: newPassword };
    localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(updated));
    setChangeSuccess(true);
    setTimeout(() => {
      setChangeSuccess(false);
      setIsChangePasswordOpen(false);
      showToast('Admin credentials updated successfully!');
    }, 1500);
  };

  const handleSavePhone = (phoneToSave: string) => {
    const cleaned = cleanPhoneForWhatsApp(phoneToSave);
    if (!cleaned || cleaned.length < 10) {
      alert('Please enter a valid phone number with country code (e.g. 919876543210 for India)');
      return;
    }
    setCurrentPhone(cleaned);
    onSaveWhatsappNumber(cleaned);
    showToast(`WhatsApp order receiving number updated to +${cleaned}!`);
    setIsWhatsappModalOpen(false);
  };

  const handleTestWhatsAppPing = (phoneToTest: string) => {
    const cleaned = cleanPhoneForWhatsApp(phoneToTest) || '919876543210';
    const testMsg = encodeURIComponent(
      `🔔 *Lakshmi Tassels — WhatsApp Test Notification*\nYour WhatsApp number is successfully connected! You will receive incoming saree tassel orders directly here with full details and image attachments.`
    );
    window.open(`https://wa.me/${cleaned}?text=${testMsg}`, '_blank');
  };

  // Handle image upload from computer
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'modelImage' | 'piece1' | 'piece2'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1400;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          updateLookField(field, optimizedDataUrl);
          showToast('Image uploaded and set for big screen display!');
        } else {
          updateLookField(field, dataUrl);
          showToast('Image uploaded successfully!');
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const updateLookField = (field: 'modelImage' | 'piece1' | 'piece2', value: string) => {
    const updated = [...localLooks];
    const look = { ...updated[editingIndex] };

    if (field === 'modelImage') {
      look.modelImage = value;
    } else if (field === 'piece1') {
      look.pieces = [{ ...look.pieces[0], image: value }, look.pieces[1]];
    } else if (field === 'piece2') {
      look.pieces = [look.pieces[0], { ...look.pieces[1], image: value }];
    }

    updated[editingIndex] = look;
    setLocalLooks(updated);
  };

  const updateText = (key: string, value: any) => {
    const updated = [...localLooks];
    const look = { ...updated[editingIndex], [key]: value };
    updated[editingIndex] = look;
    setLocalLooks(updated);
  };

  const updatePieceInfo = (pieceIndex: 0 | 1, key: 'name' | 'price' | 'description', value: string) => {
    const updated = [...localLooks];
    const look = { ...updated[editingIndex] };
    const pieces = [...look.pieces] as [any, any];
    pieces[pieceIndex] = { ...pieces[pieceIndex], [key]: value };
    look.pieces = pieces;
    updated[editingIndex] = look;
    setLocalLooks(updated);
  };

  const handleAddNewLook = () => {
    const nextNum = (localLooks[localLooks.length - 1]?.lookNumber || 20) + 1;
    const newLook: SareeLook = {
      id: `look-${nextNum}-${Date.now()}`,
      lookNumber: nextNum,
      title: `Look ${nextNum} — Couture Saree & Kuchu`,
      collection: 'Bespoke Bridal 2027',
      sareeFabric: 'Pure Handloom Silk with Zari Edge',
      description: 'Handcrafted saree drape with customized silk thread kuchu tassels and artisanal latkans.',
      modelImage: PRESET_GALLERY.models[0].url,
      aspectRatio: 0.72,
      pieces: [
        {
          id: `piece-${nextNum}-1`,
          name: 'Handcrafted Zari Kuchu',
          price: '₹2,950',
          image: PRESET_GALLERY.tassels[0].url,
          description: 'Pure silk thread with gold metallic wire wrapping.',
        },
        {
          id: `piece-${nextNum}-2`,
          name: 'Bridal Latkan Pendant',
          price: '₹1,450',
          image: PRESET_GALLERY.tassels[1].url,
          description: 'Matching latkan set with pearl and crystal drops.',
        },
      ],
      artisanDetails: {
        craftsmanship: 'Traditional Hand Crochet Kuchu',
        artisanHours: 16,
        silkType: 'Pure Resham Silk',
        embellishments: 'Gold Plated Beads & Pearls',
        tasselLengths: ['3.0" Standard', '4.5" Grand Bridal'],
      },
    };

    const updated = [...localLooks, newLook];
    setLocalLooks(updated);
    setEditingIndex(updated.length - 1);
    showToast(`Added Look #${nextNum} to collection`);
  };

  const handleDeleteLook = (index: number) => {
    if (localLooks.length <= 3) {
      alert('The lookbook requires at least 3 looks to maintain runway depth perspective.');
      return;
    }
    const updated = localLooks.filter((_, i) => i !== index);
    setLocalLooks(updated);
    setEditingIndex(Math.max(0, index - 1));
    showToast('Look removed');
  };

  const handleSaveAll = () => {
    onSaveLooks(localLooks);
    onSelectLook(editingIndex);
    showToast('All changes and main big images updated on the runway!');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(localLooks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'lakshmi_tassels_lookbook.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON configuration downloaded');
  };

  const currentLook = localLooks[editingIndex] || localLooks[0];

  // -------------------------------------------------------------
  // 1. UN-AUTHENTICATED STATE: SHOW SECURE LOGIN GATE ONLY
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0f13]/95 backdrop-blur-xl p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 bg-[#16191f] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-['Michroma'] uppercase text-xs tracking-wider font-semibold text-white">
                  Lakshmi Tassels
                </h2>
                <p className="text-[11px] text-white/60 font-inter">
                  Restricted Administrator Access
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div className="text-center pb-2">
              <h3 className="font-['Michroma'] uppercase text-xs tracking-wider text-slate-800">
                Admin Authentication Required
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-inter">
                Only the authorized boutique owner can modify main images, prices, and catalog data.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider font-['Michroma']">
                Username
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter administrator username"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider font-['Michroma']">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter administrator password"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Default credentials reminder for owner */}
            <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/80 text-[11px] text-amber-900 space-y-1 font-inter">
              <span className="font-semibold block flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                Default Boutique Credentials:
              </span>
              <div className="flex justify-between font-mono text-[10px] text-amber-800 pt-0.5">
                <span>Username: <strong className="text-slate-900">admin</strong></span>
                <span>Password: <strong className="text-slate-900">lakshmi@2027</strong></span>
              </div>
              <span className="text-[10px] text-amber-700/90 block pt-0.5">
                You can change these credentials anytime once logged in.
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 text-xs font-['Michroma'] uppercase tracking-wider text-white bg-[#16191f] hover:bg-slate-800 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4 text-amber-400" />
                <span>Sign In to Admin</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATED STATE: FULL DEDICATED CONTROL STUDIO
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f1115] text-slate-900 select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Admin Header Bar */}
      <header className="px-6 py-3.5 bg-[#16191f] border-b border-white/10 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs font-['Michroma'] shadow-md">
            LT
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Michroma'] uppercase text-xs sm:text-sm tracking-wider font-semibold text-white">
                Lakshmi Tassels &middot; Admin Studio
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Authorized Admin
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-inter">
              Main screen runway images are disabled in background while editing
            </p>
          </div>
        </div>

        {/* Admin Tools */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setCurrentPhone(whatsappNumber);
              setIsWhatsappModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs text-white/95 hover:text-white bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 rounded-lg flex items-center gap-1.5 transition-colors font-inter shadow-xs"
            title="Configure WhatsApp order notification receiving phone number"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-300">WhatsApp:</span>
            <span className="font-mono text-[11px] text-white">+{cleanPhoneForWhatsApp(whatsappNumber) || '919876543210'}</span>
          </button>

          <button
            onClick={() => {
              const currentCreds = getCredentials();
              setNewUsername(currentCreds.username);
              setNewPassword(currentCreds.password);
              setIsChangePasswordOpen(true);
            }}
            className="px-3 py-1.5 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg flex items-center gap-1.5 transition-colors font-inter"
            title="Change Admin Username & Password"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Change Password</span>
          </button>

          <button
            onClick={handleExportJSON}
            title="Export catalog backup"
            className="px-3 py-1.5 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg flex items-center gap-1.5 transition-colors font-inter"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Reset catalog to original luxury bridal presets?')) {
                onResetDefaults();
                onClose();
              }
            }}
            title="Reset to default luxury presets"
            className="px-3 py-1.5 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg flex items-center gap-1.5 transition-colors font-inter"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleLogout}
            title="Sign out of Admin Studio"
            className="px-3 py-1.5 text-xs text-rose-300 hover:text-rose-100 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors font-inter"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1"
            title="Close Admin Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs px-6 py-2 flex items-center justify-between font-inter shadow-md">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" /> {toastMessage}
          </span>
        </div>
      )}

      {/* Runway Looks Horizontal Reel */}
      <div className="px-6 py-3 border-b border-white/10 bg-[#16191f]/80 overflow-x-auto flex items-center gap-3 shrink-0">
        <span className="text-[11px] font-['Michroma'] uppercase tracking-wider text-amber-400 shrink-0 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Runway Looks:
        </span>
        {localLooks.map((look, i) => (
          <button
            key={look.id}
            onClick={() => setEditingIndex(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-['Michroma'] uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${
              editingIndex === i
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20 scale-105'
                : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 text-[10px] flex items-center justify-center font-bold">
              {look.lookNumber}
            </span>
            <span>Look {look.lookNumber}</span>
          </button>
        ))}
        <button
          onClick={handleAddNewLook}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 bg-white/5 border border-dashed border-white/20 hover:border-white/50 hover:bg-white/10 flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add New Look
        </button>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f4f7fa]">
        {currentLook && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Main Big Image Controls (The central focus of admin request) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-600 flex items-center justify-center">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold font-['Michroma'] uppercase tracking-wider text-slate-900">
                        Big Screen Main Image
                      </h2>
                      <span className="text-[10px] text-amber-700 font-semibold block">
                        Displayed on the 3D Runway Stage
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    Look #{currentLook.lookNumber}
                  </span>
                </div>

                {/* Big Image Preview Screen */}
                <div className="relative aspect-[3/4] bg-slate-900 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner group">
                  <img
                    src={currentLook.modelImage}
                    alt={currentLook.title}
                    className="w-full h-full object-contain object-bottom transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                    <span className="text-xs font-semibold">{currentLook.title}</span>
                    <span className="text-[11px] text-white/70">{currentLook.sareeFabric}</span>
                  </div>
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] text-white font-mono flex items-center gap-1.5 border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Runway Main Drape
                  </div>
                </div>

                {/* Main Image Upload & Change Form */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      Upload New Image for Big Screen:
                    </label>
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-amber-50/40 border-2 border-dashed border-amber-300/80 hover:border-slate-900 rounded-xl cursor-pointer transition-colors text-xs text-slate-700 font-medium">
                      <Upload className="w-4 h-4 text-amber-700" />
                      <span>Choose File from Computer (PNG / JPG / WebP)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'modelImage')}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Or paste Direct Image URL:
                    </label>
                    <input
                      type="url"
                      value={currentLook.modelImage}
                      onChange={(e) => updateLookField('modelImage', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                    />
                  </div>

                  {/* Quick Saree Drape Presets */}
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">
                      Or Select from Curated Presets:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PRESET_GALLERY.models.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            updateLookField('modelImage', preset.url);
                            showToast(`Selected preset for big screen!`);
                          }}
                          className="text-[10px] text-left p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-800 rounded truncate transition-colors"
                          title={preset.label}
                        >
                          {preset.label.split(' ')[0]} {preset.label.split(' ')[1]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Look Info & Fabrics */}
              <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-['Michroma']">
                  Look Information
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Look #</label>
                    <input
                      type="number"
                      value={currentLook.lookNumber}
                      onChange={(e) => updateText('lookNumber', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Look Title</label>
                    <input
                      type="text"
                      value={currentLook.title}
                      onChange={(e) => updateText('title', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Collection</label>
                  <input
                    type="text"
                    value={currentLook.collection}
                    onChange={(e) => updateText('collection', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Saree Fabric Details</label>
                  <input
                    type="text"
                    value={currentLook.sareeFabric}
                    onChange={(e) => updateText('sareeFabric', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Saree Tassels & Products Pricing in RUPEES */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold font-['Michroma'] uppercase tracking-wider text-slate-900">
                    Tassel Products &amp; Pricing in Rupees (₹)
                  </h2>
                  <p className="text-[11px] text-slate-500 font-inter">
                    Displayed on the synchronized right rail and bottom price bar
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 font-inter tabular-nums bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Piece 1: {currentLook.pieces[0]?.price}
                  </span>
                </div>
              </div>

              {/* Piece 1 (Primary Saree Tassel) */}
              <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 font-['Michroma']">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Piece 1 &middot; Primary Saree Tassel (Kuchu)
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{currentLook.pieces[0]?.price}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-4 aspect-square bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner">
                    <img
                      src={currentLook.pieces[0]?.image}
                      alt={currentLook.pieces[0]?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="sm:col-span-8 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tassel Name</label>
                        <input
                          type="text"
                          value={currentLook.pieces[0]?.name || ''}
                          onChange={(e) => updatePieceInfo(0, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Price in Rupees (₹)
                        </label>
                        <input
                          type="text"
                          value={currentLook.pieces[0]?.price || ''}
                          onChange={(e) => updatePieceInfo(0, 'price', e.target.value)}
                          placeholder="e.g. ₹3,800"
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-inter font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Description</label>
                      <input
                        type="text"
                        value={currentLook.pieces[0]?.description || ''}
                        onChange={(e) => updatePieceInfo(0, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-800 cursor-pointer flex items-center gap-1.5 border border-slate-200 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'piece1')}
                        />
                      </label>
                      <input
                        type="url"
                        value={currentLook.pieces[0]?.image || ''}
                        onChange={(e) => updateLookField('piece1', e.target.value)}
                        placeholder="Or paste URL..."
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Piece 2 (Secondary Latkan / Blouse Dori / Waist Accent) */}
              <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 font-['Michroma']">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Piece 2 &middot; Secondary Latkan / Belt / Blouse Dori
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{currentLook.pieces[1]?.price}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-4 aspect-square bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner">
                    <img
                      src={currentLook.pieces[1]?.image}
                      alt={currentLook.pieces[1]?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="sm:col-span-8 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Item Name</label>
                        <input
                          type="text"
                          value={currentLook.pieces[1]?.name || ''}
                          onChange={(e) => updatePieceInfo(1, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Price in Rupees (₹)
                        </label>
                        <input
                          type="text"
                          value={currentLook.pieces[1]?.price || ''}
                          onChange={(e) => updatePieceInfo(1, 'price', e.target.value)}
                          placeholder="e.g. ₹1,950"
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-inter font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Description</label>
                      <input
                        type="text"
                        value={currentLook.pieces[1]?.description || ''}
                        onChange={(e) => updatePieceInfo(1, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-800 cursor-pointer flex items-center gap-1.5 border border-slate-200 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'piece2')}
                        />
                      </label>
                      <input
                        type="url"
                        value={currentLook.pieces[1]?.image || ''}
                        onChange={(e) => updateLookField('piece2', e.target.value)}
                        placeholder="Or paste URL..."
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Artisan Knotting & Craftsmanship Details */}
              <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 font-['Michroma']">
                  Artisan Atelier Craftsmanship
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-amber-900 mb-1">
                      Knotting Technique
                    </label>
                    <input
                      type="text"
                      value={currentLook.artisanDetails?.craftsmanship || ''}
                      onChange={(e) => {
                        const details = { ...currentLook.artisanDetails, craftsmanship: e.target.value };
                        updateText('artisanDetails', details);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-amber-900 mb-1">
                      Master Knotting Hours
                    </label>
                    <input
                      type="number"
                      value={currentLook.artisanDetails?.artisanHours || 20}
                      onChange={(e) => {
                        const details = { ...currentLook.artisanDetails, artisanHours: parseInt(e.target.value) || 1 };
                        updateText('artisanDetails', details);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp Notification Number Configuration Card */}
              <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200/90 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 font-['Michroma']">
                        Boutique WhatsApp Order Number
                      </h3>
                      <p className="text-[11px] text-emerald-700 font-inter">
                        Customer orders, tassel details, and images will be sent directly to this phone
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
                    +{cleanPhoneForWhatsApp(whatsappNumber)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-7">
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                      WhatsApp Phone Number (with Country Code):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-emerald-700 font-bold">
                        +
                      </span>
                      <input
                        type="tel"
                        value={currentPhone}
                        onChange={(e) => setCurrentPhone(e.target.value)}
                        placeholder="919876543210"
                        className="w-full pl-6 pr-3 py-2 text-xs bg-white border border-emerald-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                    <span className="text-[10px] text-emerald-700/80 mt-1 block">
                      Include country code (e.g. 91 for India, followed by 10-digit number)
                    </span>
                  </div>

                  <div className="sm:col-span-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSavePhone(currentPhone)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTestWhatsAppPing(currentPhone)}
                      className="py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                      title="Send test message to this phone number"
                    >
                      <span>Test Ping</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Delete / Reorder actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteLook(editingIndex)}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete this Look
                </button>
                <span className="text-xs text-slate-500 font-inter">
                  Editing Look {editingIndex + 1} of {localLooks.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Action Bar */}
      <footer className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-lg">
        <div className="text-xs text-slate-500 font-inter flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Clicking &quot;Apply &amp; Update Live Runway&quot; will activate your updated images and prices.</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white transition-colors"
          >
            Cancel / Back to Runway
          </button>
          <button
            onClick={handleSaveAll}
            className="px-6 py-2.5 text-xs font-['Michroma'] uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md font-semibold flex items-center gap-2 transition-transform hover:scale-[1.02]"
          >
            <Check className="w-4 h-4" /> Apply &amp; Update Live Runway
          </button>
        </div>
      </footer>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Michroma'] text-xs uppercase tracking-wider font-semibold text-slate-900 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-500" /> Change Credentials
              </h3>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {changeSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4" /> Credentials saved successfully!
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  New Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-['Michroma'] uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Configuration Modal */}
      {isWhatsappModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-['Michroma'] text-xs uppercase tracking-wider font-semibold text-slate-900">
                    Boutique WhatsApp Number
                  </h3>
                  <span className="text-[11px] text-slate-500 font-inter">
                    Order notifications &amp; customer images
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsWhatsappModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-xs text-emerald-900 font-inter space-y-1">
                <span className="font-semibold block flex items-center gap-1.5 text-emerald-950">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Order Dispatch Destination
                </span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  When customers select a tassel design, zoom into an image, or checkout, clicking &quot;Place Order on WhatsApp&quot; will immediately open WhatsApp to this phone number with full ensemble specifications and attached photo.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider font-['Michroma'] mb-1.5">
                  Your WhatsApp Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400 font-bold">
                    +
                  </span>
                  <input
                    type="tel"
                    value={currentPhone}
                    onChange={(e) => setCurrentPhone(e.target.value)}
                    placeholder="919876543210"
                    className="w-full pl-8 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-inter">
                  Format: Country code + Mobile number without spaces or symbols (e.g., <strong>919876543210</strong> for India).
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleTestWhatsAppPing(currentPhone)}
                  className="w-1/3 py-2.5 text-xs font-medium text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Test Ping</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePhone(currentPhone)}
                  className="w-2/3 py-2.5 text-xs font-['Michroma'] uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-md shadow-emerald-600/20 font-semibold flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save WhatsApp Number</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
