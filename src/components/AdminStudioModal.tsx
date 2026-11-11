import React, { useState } from 'react';
import { SareeLook } from '../types.ts';
import { PRESET_GALLERY } from '../data/sareeLookbookData.ts';
import { Upload, X, Plus, Trash2, RotateCcw, Download, Check, Sparkles, Image as ImageIcon, Eye } from 'lucide-react';

interface AdminStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  looks: SareeLook[];
  onSaveLooks: (newLooks: SareeLook[]) => void;
  onResetDefaults: () => void;
  activeLookIndex: number;
  onSelectLook: (index: number) => void;
}

export const AdminStudioModal: React.FC<AdminStudioModalProps> = ({
  isOpen,
  onClose,
  looks,
  onSaveLooks,
  onResetDefaults,
  activeLookIndex,
  onSelectLook,
}) => {
  const [editingIndex, setEditingIndex] = useState<number>(activeLookIndex);
  const [localLooks, setLocalLooks] = useState<SareeLook[]>(looks);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync when props change or modal opens
  React.useEffect(() => {
    setLocalLooks(looks);
    setEditingIndex(activeLookIndex);
  }, [looks, activeLookIndex, isOpen]);

  if (!isOpen) return null;

  const currentLook = localLooks[editingIndex] || localLooks[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to optimize and load user uploaded image to Data URL
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

      // Create an image to optionally scale down if huge
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          updateLookField(field, optimizedDataUrl);
          showToast('Image uploaded successfully!');
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
      collection: 'Bespoke Atelier 2027',
      sareeFabric: 'Pure Handloom Silk with Zari Edge',
      description: 'Handcrafted saree drape highlighting custom silk thread kuchu tassels and artisanal latkans.',
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
    showToast('All changes saved to runway!');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#fafbfc]">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm font-['Michroma']">
              LT
            </span>
            <div>
              <h2 className="font-['Michroma'] uppercase text-sm tracking-wider text-slate-900">
                Lakshmi Tassels &middot; Admin Studio
              </h2>
              <p className="text-xs text-slate-500 font-inter">
                Upload saree drape photos, custom tassel pieces, and manage the 3D runway depth experience
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              title="Export backup JSON"
              className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => {
                if (confirm('Reset to original luxury bridal saree presets? All custom edits will be restored.')) {
                  onResetDefaults();
                  onClose();
                }
              }}
              title="Reset defaults"
              className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" /> {toastMessage}
            </span>
          </div>
        )}

        {/* Looks Horizontal Reel */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 overflow-x-auto flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Runway Looks ({localLooks.length}):
          </span>
          {localLooks.map((look, i) => (
            <button
              key={look.id}
              onClick={() => setEditingIndex(i)}
              className={`px-3 py-1.5 rounded-md text-xs font-['Michroma'] uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${
                editingIndex === i
                  ? 'bg-[#16191f] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 text-[10px] flex items-center justify-center font-bold">
                {look.lookNumber}
              </span>
              <span>Look {look.lookNumber}</span>
            </button>
          ))}
          <button
            onClick={handleAddNewLook}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-100 flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Look
          </button>
        </div>

        {/* Main Editor Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentLook && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Saree Model Image Upload & Details */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold font-['Michroma'] uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-600" />
                      Saree Drape / Model Photo
                    </h3>
                    <span className="text-[11px] text-slate-500 font-inter">Shown on 3D runway</span>
                  </div>

                  {/* Image Preview Box */}
                  <div className="relative aspect-[3/4] bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner group">
                    <img
                      src={currentLook.modelImage}
                      alt={currentLook.title}
                      className="w-full h-full object-contain object-bottom transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white text-xs font-medium">Current Runway Drape</span>
                    </div>
                  </div>

                  {/* Upload Controls */}
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Upload Saree Photo from Device (PNG / JPG / WebP):
                      </label>
                      <label className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-white border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-lg cursor-pointer transition-colors text-xs text-slate-600 font-medium">
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>Choose File or Drag & Drop</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'modelImage')}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Or enter Image URL:
                      </label>
                      <input
                        type="url"
                        value={currentLook.modelImage}
                        onChange={(e) => updateLookField('modelImage', e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">
                        Or choose from Saree Presets:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {PRESET_GALLERY.models.slice(0, 6).map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => updateLookField('modelImage', preset.url)}
                            className="text-[10px] text-left p-1.5 bg-white border border-slate-200 hover:border-slate-900 rounded truncate transition-colors"
                            title={preset.label}
                          >
                            {preset.label.split(' ')[0]} {preset.label.split(' ')[1]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Look Metadata */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Look Number</label>
                    <input
                      type="number"
                      value={currentLook.lookNumber}
                      onChange={(e) => updateText('lookNumber', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Look Title</label>
                    <input
                      type="text"
                      value={currentLook.title}
                      onChange={(e) => updateText('title', e.target.value)}
                      placeholder="e.g. Kanjivaram Crimson & Zari Kuchu"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Collection / Season</label>
                    <input
                      type="text"
                      value={currentLook.collection}
                      onChange={(e) => updateText('collection', e.target.value)}
                      placeholder="e.g. Bridal Heritage 2027"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Saree Fabric & Pallu Details</label>
                    <input
                      type="text"
                      value={currentLook.sareeFabric}
                      onChange={(e) => updateText('sareeFabric', e.target.value)}
                      placeholder="e.g. Pure Mulberry Kanjivaram Silk with 3-ply Pure Zari"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Editorial Description</label>
                    <textarea
                      rows={2}
                      value={currentLook.description}
                      onChange={(e) => updateText('description', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Two Tassel Products in Product Rail */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold font-['Michroma'] uppercase tracking-wider text-slate-900">
                    Product Rail Items (Tassels &amp; Accessories for this Look)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-inter">
                    Appears on the synchronized right rail
                  </span>
                </div>

                {/* Piece 1 (Primary Tassel) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Piece 1 &middot; Primary Saree Tassel / Kuchu
                    </span>
                    <span className="text-xs text-amber-700 font-semibold">{currentLook.pieces[0]?.price}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-4 aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden relative shadow-inner">
                      <img
                        src={currentLook.pieces[0]?.image}
                        alt={currentLook.pieces[0]?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="sm:col-span-8 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Tassel Name</label>
                          <input
                            type="text"
                            value={currentLook.pieces[0]?.name || ''}
                            onChange={(e) => updatePieceInfo(0, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Price</label>
                          <input
                            type="text"
                            value={currentLook.pieces[0]?.price || ''}
                            onChange={(e) => updatePieceInfo(0, 'price', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Description</label>
                        <input
                          type="text"
                          value={currentLook.pieces[0]?.description || ''}
                          onChange={(e) => updatePieceInfo(0, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <label className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-800 rounded text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Upload Image</span>
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
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Piece 2 (Secondary Tassel / Latkan) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Piece 2 &middot; Secondary Latkan / Dori / Belt
                    </span>
                    <span className="text-xs text-amber-700 font-semibold">{currentLook.pieces[1]?.price}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-4 aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden relative shadow-inner">
                      <img
                        src={currentLook.pieces[1]?.image}
                        alt={currentLook.pieces[1]?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="sm:col-span-8 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Item Name</label>
                          <input
                            type="text"
                            value={currentLook.pieces[1]?.name || ''}
                            onChange={(e) => updatePieceInfo(1, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Price</label>
                          <input
                            type="text"
                            value={currentLook.pieces[1]?.price || ''}
                            onChange={(e) => updatePieceInfo(1, 'price', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Description</label>
                        <input
                          type="text"
                          value={currentLook.pieces[1]?.description || ''}
                          onChange={(e) => updatePieceInfo(1, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <label className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-800 rounded text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Upload Image</span>
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
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Artisan Craftsmanship Specifications */}
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 font-['Michroma']">
                    Artisan Atelier Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-amber-800 mb-1">Technique / Craftsmanship</label>
                      <input
                        type="text"
                        value={currentLook.artisanDetails?.craftsmanship || ''}
                        onChange={(e) => {
                          const details = { ...currentLook.artisanDetails, craftsmanship: e.target.value };
                          updateText('artisanDetails', details);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-amber-800 mb-1">Handcrafting Hours</label>
                      <input
                        type="number"
                        value={currentLook.artisanDetails?.artisanHours || 20}
                        onChange={(e) => {
                          const details = { ...currentLook.artisanDetails, artisanHours: parseInt(e.target.value) || 1 };
                          updateText('artisanDetails', details);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Bar inside Look */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteLook(editingIndex)}
                    className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md border border-rose-200 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete this Look
                  </button>

                  <div className="text-xs text-slate-500 font-inter">
                    Position {editingIndex + 1} of {localLooks.length} in runway line
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-[#fafbfc] flex items-center justify-between">
          <div className="text-xs text-slate-500 font-inter">
            Changes will update the live 3D runway depth view and synchronized product rail immediately.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 text-xs font-['Michroma'] uppercase tracking-wider text-white bg-[#16191f] hover:bg-[#282d37] rounded-lg shadow-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Save &amp; Apply to Runway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
