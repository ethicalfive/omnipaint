import React, { useState } from 'react';
import { Artboard, ViewportState } from '../types/canvas';
import { createNewArtboard } from '../utils/presets';
import { Layout, Plus, X } from 'lucide-react';

interface NewCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCanvas: (newArtboard: Artboard) => void;
  existingArtboards: Artboard[];
  viewport: ViewportState;
}

const PRESETS = [
  { label: 'Square Studio', w: 800, h: 800, desc: 'Balanced square artboard' },
  { label: 'High-Res Square', w: 1200, h: 1200, desc: 'Detailed painting artboard' },
  { label: '16:9 Landscape', w: 1280, h: 720, desc: 'Widescreen environment & film' },
  { label: '9:16 Portrait', w: 720, h: 1280, desc: 'Vertical character & portrait' },
  { label: 'Palette / Moodboard', w: 450, h: 800, desc: 'Color reference & texture study' },
];

const BACKGROUND_OPTIONS = [
  { label: 'Deep Dark', value: '#18191e' },
  { label: 'Slate Navy', value: '#0f172a' },
  { label: 'Pure White', value: '#ffffff' },
  { label: 'Warm Charcoal', value: '#262626' },
  { label: 'Transparent', value: 'transparent' },
];

export const NewCanvasModal: React.FC<NewCanvasModalProps> = ({
  isOpen,
  onClose,
  onAddCanvas,
  existingArtboards,
  viewport,
}) => {
  const [name, setName] = useState(`Canvas ${existingArtboards.length + 1}`);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(800);
  const [bg, setBg] = useState('#18191e');
  const [placement, setPlacement] = useState<'right' | 'below' | 'center'>('right');

  if (!isOpen) return null;

  const handleCreate = () => {
    let posX = 0;
    let posY = 0;

    if (existingArtboards.length > 0) {
      if (placement === 'right') {
        const rightmost = Math.max(...existingArtboards.map((a) => a.x + a.width));
        posX = rightmost + 80;
        posY = -height / 2;
      } else if (placement === 'below') {
        const bottommost = Math.max(...existingArtboards.map((a) => a.y + a.height));
        posX = -width / 2;
        posY = bottommost + 80;
      } else {
        // Center at current camera focus
        posX = -viewport.panX / viewport.scale - width / 2;
        posY = -viewport.panY / viewport.scale - height / 2;
      }
    } else {
      posX = -width / 2;
      posY = -height / 2;
    }

    const newArtboard = createNewArtboard(name, width, height, posX, posY, bg);
    onAddCanvas(newArtboard);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Add New Canvas Artboard</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="text-neutral-400 font-medium">Canvas Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
            placeholder="e.g. Character Sheet, Texture Study"
          />
        </div>

        {/* Quick Size Presets */}
        <div className="flex flex-col gap-1.5 text-xs">
          <label className="text-neutral-400 font-medium">Dimension Presets</label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => {
              const isSelected = width === p.w && height === p.h;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setWidth(p.w);
                    setHeight(p.h);
                  }}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-neutral-800/60 border-white/5 hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
                    {p.w} × {p.h} px
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Dimensions */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-neutral-400 font-medium">Width (px)</label>
            <input
              type="number"
              min={100}
              max={4000}
              value={width}
              onChange={(e) => setWidth(Math.max(100, Number(e.target.value)))}
              className="bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-neutral-400 font-medium">Height (px)</label>
            <input
              type="number"
              min={100}
              max={4000}
              value={height}
              onChange={(e) => setHeight(Math.max(100, Number(e.target.value)))}
              className="bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Background Color */}
        <div className="flex flex-col gap-1.5 text-xs">
          <label className="text-neutral-400 font-medium">Canvas Background</label>
          <div className="flex flex-wrap gap-2">
            {BACKGROUND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBg(opt.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                  bg === opt.value
                    ? 'bg-indigo-600 border-indigo-400 text-white'
                    : 'bg-neutral-800 border-white/10 text-neutral-300 hover:border-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Placement Option */}
        <div className="flex flex-col gap-1.5 text-xs">
          <label className="text-neutral-400 font-medium">Placement in Studio</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPlacement('right')}
              className={`p-2 rounded-lg border text-center transition-all ${
                placement === 'right'
                  ? 'bg-indigo-600/30 border-indigo-500 text-white'
                  : 'bg-neutral-800 border-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              Side-by-Side (Right)
            </button>
            <button
              type="button"
              onClick={() => setPlacement('below')}
              className={`p-2 rounded-lg border text-center transition-all ${
                placement === 'below'
                  ? 'bg-indigo-600/30 border-indigo-500 text-white'
                  : 'bg-neutral-800 border-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              Stacked (Below)
            </button>
            <button
              type="button"
              onClick={() => setPlacement('center')}
              className={`p-2 rounded-lg border text-center transition-all ${
                placement === 'center'
                  ? 'bg-indigo-600/30 border-indigo-500 text-white'
                  : 'bg-neutral-800 border-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              Center View
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
