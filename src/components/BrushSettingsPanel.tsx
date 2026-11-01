import React, { useEffect, useRef } from 'react';
import { BrushSettings, ToolType } from '../types/canvas';
import { drawBrushSegment } from '../utils/brushEngine';
import { Sliders, X } from 'lucide-react';

interface BrushSettingsPanelProps {
  brushSettings: BrushSettings;
  activeTool: ToolType;
  onUpdate: (updated: Partial<BrushSettings>) => void;
  onClose: () => void;
}

const PRESET_PALETTE = [
  '#ffffff',
  '#09090b',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#78716c',
  '#334155',
];

export const BrushSettingsPanel: React.FC<BrushSettingsPanelProps> = ({
  brushSettings,
  activeTool,
  onUpdate,
  onClose,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw real-time stroke preview
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle guide
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.height / 2);
    ctx.lineTo(canvas.width - 20, canvas.height / 2);
    ctx.stroke();

    // Render sample brush wave
    const startX = 25;
    const endX = canvas.width - 25;
    const midY = canvas.height / 2;

    for (let x = startX; x <= endX; x += 2) {
      const t = (x - startX) / (endX - startX);
      const y = midY + Math.sin(t * Math.PI * 2) * 16;
      const prevX = Math.max(startX, x - 2);
      const prevT = (prevX - startX) / (endX - startX);
      const prevY = midY + Math.sin(prevT * Math.PI * 2) * 16;

      // Simulated pressure curve
      const pressure = 0.3 + 0.7 * Math.sin(t * Math.PI);

      drawBrushSegment(
        ctx,
        prevX,
        prevY,
        x,
        y,
        activeTool === 'eraser' ? 'pen' : activeTool,
        brushSettings,
        pressure
      );
    }
  }, [brushSettings, activeTool]);

  return (
    <div className="w-72 bg-neutral-900/95 border border-white/10 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl flex flex-col gap-4 text-neutral-200 z-40 select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Brush Properties
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
          aria-label="Close brush settings"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Live Stroke Preview Canvas */}
      <div className="w-full h-16 bg-neutral-950/80 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
        <canvas ref={previewCanvasRef} width={256} height={64} className="w-full h-full" />
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-3 text-xs">
        {/* Brush Size */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span>Size</span>
            <span className="font-mono tabular-nums text-neutral-200">{brushSettings.size}px</span>
          </div>
          <input
            type="range"
            min={1}
            max={200}
            value={brushSettings.size}
            onChange={(e) => onUpdate({ size: Number(e.target.value) })}
            className="w-full accent-indigo-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Opacity */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span>Opacity</span>
            <span className="font-mono tabular-nums text-neutral-200">
              {Math.round(brushSettings.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={Math.round(brushSettings.opacity * 100)}
            onChange={(e) => onUpdate({ opacity: Number(e.target.value) / 100 })}
            className="w-full accent-indigo-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Hardness / Softness */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span>Hardness</span>
            <span className="font-mono tabular-nums text-neutral-200">
              {Math.round(brushSettings.hardness * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(brushSettings.hardness * 100)}
            onChange={(e) => onUpdate({ hardness: Number(e.target.value) / 100 })}
            className="w-full accent-indigo-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Pressure Sensitivity */}
        <label className="flex items-center justify-between pt-1 cursor-pointer">
          <span className="text-neutral-400">Pressure Dynamics</span>
          <input
            type="checkbox"
            checked={brushSettings.pressureSensitivity}
            onChange={(e) => onUpdate({ pressureSensitivity: e.target.checked })}
            className="rounded border-white/20 text-indigo-600 focus:ring-0 w-4 h-4 bg-neutral-800"
          />
        </label>
      </div>

      {/* Color Palette */}
      <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400">Color Palette</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-neutral-400">{brushSettings.color}</span>
            <input
              type="color"
              value={brushSettings.color.startsWith('#') ? brushSettings.color : '#ffffff'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-6 h-6 rounded-md border border-white/20 cursor-pointer bg-transparent"
              title="Custom Color"
            />
          </div>
        </div>

        {/* Swatch grid */}
        <div className="grid grid-cols-6 gap-2">
          {PRESET_PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => onUpdate({ color })}
              className={`h-7 rounded-lg transition-transform border ${
                brushSettings.color.toLowerCase() === color.toLowerCase()
                  ? 'ring-2 ring-indigo-400 scale-105 border-white'
                  : 'border-white/10 hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`Color swatch ${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
