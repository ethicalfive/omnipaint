import React, { useState } from 'react';
import {
  Blend,
  Brush,
  Columns,
  Compass,
  CopyCheck,
  Crosshair,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FolderOpen,
  Hand,
  HelpCircle,
  Layers,
  Lock,
  Minus,
  Move,
  Paintbrush,
  PaintBucket,
  PenTool,
  Pencil,
  Pipette,
  Plus,
  Redo2,
  RotateCcw,
  Sliders,
  Sparkles,
  Trash2,
  Undo2,
  Unlock,
  X,
} from 'lucide-react';
import {
  Artboard,
  BlendMode,
  BrushSettings,
  CloneSource,
  Layer,
  ToolType,
  ViewportState,
} from '../types/canvas';
import { formatZoom } from '../utils/math';
import { generateId } from '../utils/presets';

interface CompactUIProps {
  artboards: Artboard[];
  selectedArtboardId: string | null;
  viewport: ViewportState;
  activeTool: ToolType;
  brushSettings: BrushSettings;
  cloneSource: CloneSource;
  isRotationLocked: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onSelectTool: (tool: ToolType) => void;
  onUpdateBrushSettings: (settings: Partial<BrushSettings>) => void;
  onUpdateCloneSource: (source: Partial<CloneSource>) => void;
  onToggleRotationLock: () => void;
  onResetRotation: () => void;
  onResetZoom: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAlignSideBySide: () => void;
  onAddNewSheet: () => void;
  onOpenEnvironments: () => void;
  onOpenHelp: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onUpdateArtboard: (id: string, updated: Partial<Artboard>) => void;
}

const PRESET_SWATCHES = [
  '#ffffff',
  '#09090b',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#38bdf8',
  '#8b5cf6',
  '#ec4899',
];

export const CompactUI: React.FC<CompactUIProps> = ({
  artboards,
  selectedArtboardId,
  viewport,
  activeTool,
  brushSettings,
  cloneSource,
  isRotationLocked,
  canUndo,
  canRedo,
  onSelectTool,
  onUpdateBrushSettings,
  onUpdateCloneSource,
  onToggleRotationLock,
  onResetRotation,
  onResetZoom,
  onZoomIn,
  onZoomOut,
  onAlignSideBySide,
  onAddNewSheet,
  onOpenEnvironments,
  onOpenHelp,
  onUndo,
  onRedo,
  onUpdateArtboard,
}) => {
  const [isZenMode, setIsZenMode] = useState(false);
  const [showBrushFlyout, setShowBrushFlyout] = useState(false);
  const [showLayersFlyout, setShowLayersFlyout] = useState(false);

  const activeArtboard = artboards.find((a) => a.id === selectedArtboardId) || artboards[0] || null;

  // ZEN MODE: Floating expand button only
  if (isZenMode) {
    return (
      <div className="absolute top-3 left-3 z-50 pointer-events-auto">
        <button
          onClick={() => setIsZenMode(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-white/10 text-neutral-300 hover:text-white backdrop-blur-md shadow-xl text-xs font-medium transition-all hover:bg-neutral-800"
          title="Exit Zen Mode (Show Tools)"
        >
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>Show UI</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 1. SLIM FLOATING TOP BAR (Compact 36px) */}
      <header className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900/90 border border-white/10 backdrop-blur-xl rounded-full shadow-2xl text-xs text-neutral-200 select-none">
        {/* Brand label */}
        <span className="font-semibold text-white tracking-tight px-1.5 truncate max-w-[110px] sm:max-w-none">
          OmniCanvas
        </span>

        <span className="text-neutral-600">|</span>

        {/* Side-by-Side Arranger */}
        <button
          onClick={onAlignSideBySide}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/10 hover:text-white text-neutral-300 transition-colors whitespace-nowrap"
          title="Align all canvases side-by-side in a row"
        >
          <Columns className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Side-by-Side</span>
        </button>

        {/* Add Canvas Sheet */}
        <button
          onClick={onAddNewSheet}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/10 hover:text-white text-neutral-300 transition-colors whitespace-nowrap"
          title="Add a new canvas sheet"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          <span>+ Sheet</span>
        </button>

        {/* Environments / Presets */}
        <button
          onClick={onOpenEnvironments}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/10 hover:text-white text-neutral-300 transition-colors whitespace-nowrap"
          title="Saved environments, presets, export/import"
        >
          <FolderOpen className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden md:inline">Studio</span>
        </button>

        <span className="text-neutral-600 hidden sm:inline">|</span>

        {/* Zoom & Navigation indicator */}
        <div className="flex items-center gap-0.5 bg-black/40 rounded-lg px-1 py-0.5">
          <button
            onClick={onZoomOut}
            className="p-1 hover:text-white text-neutral-400 rounded transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={onResetZoom}
            className="px-1 font-mono text-[11px] text-neutral-300 hover:text-white tabular-nums"
            title="Reset to 100% zoom"
          >
            {formatZoom(viewport.scale)}
          </button>
          <button
            onClick={onZoomIn}
            className="p-1 hover:text-white text-neutral-400 rounded transition-colors"
            title="Zoom In"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Angle Lock Toggle (prevents unintended pinch-rotation!) */}
        <button
          onClick={onToggleRotationLock}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors ${
            isRotationLocked
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium'
              : 'hover:bg-white/10 text-neutral-400 hover:text-white'
          }`}
          title={isRotationLocked ? 'Angle locked (prevents rotation). Click to unlock.' : 'Angle unlocked. Click to lock.'}
        >
          {isRotationLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          <span className="hidden md:inline">{isRotationLocked ? 'Angle Locked' : 'Free Angle'}</span>
        </button>

        {/* Reset 0° Rotation button if rotated */}
        {Math.abs(viewport.rotation) > 0.5 && (
          <button
            onClick={onResetRotation}
            className="p-1 hover:bg-white/10 text-amber-400 rounded text-[11px] font-mono tabular-nums flex items-center gap-0.5"
            title="Snap rotation to 0°"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{Math.round(viewport.rotation)}°</span>
          </button>
        )}

        {/* Zen Mode Button */}
        <button
          onClick={() => setIsZenMode(true)}
          className="p-1.5 hover:bg-white/10 rounded-md text-neutral-400 hover:text-white transition-colors ml-0.5"
          title="Zen Mode (Hide UI for full-screen painting)"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* 2. COMPACT FLOATING TOOL STRIP (Left Edge) */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-40 pointer-events-auto flex flex-col items-center bg-neutral-900/90 border border-white/10 backdrop-blur-xl rounded-2xl p-1 shadow-2xl gap-1 select-none text-neutral-300">
        {/* Undo / Redo */}
        <div className="flex flex-col gap-0.5 pb-1 border-b border-white/10 w-full items-center">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${
              canUndo ? 'hover:bg-white/10 hover:text-white text-neutral-200' : 'text-neutral-600'
            }`}
            title="Undo (Ctrl+Z or 2-finger tap)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${
              canRedo ? 'hover:bg-white/10 hover:text-white text-neutral-200' : 'text-neutral-600'
            }`}
            title="Redo (Ctrl+Y or 3-finger tap)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Drawing Tools */}
        <div className="flex flex-col gap-1 py-1">
          {[
            { id: 'pen', label: 'Pen', icon: <PenTool className="w-4 h-4" /> },
            { id: 'brush', label: 'Brush', icon: <Paintbrush className="w-4 h-4" /> },
            { id: 'pencil', label: 'Pencil', icon: <Pencil className="w-4 h-4" /> },
            { id: 'airbrush', label: 'Airbrush', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'marker', label: 'Marker', icon: <Brush className="w-4 h-4" /> },
            { id: 'clone', label: 'Clone Stamp', icon: <CopyCheck className="w-4 h-4" /> },
            { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-4 h-4" /> },
            { id: 'smudge', label: 'Smudge', icon: <Blend className="w-4 h-4" /> },
            { id: 'bucket', label: 'Bucket', icon: <PaintBucket className="w-4 h-4" /> },
            { id: 'picker', label: 'Eyedropper', icon: <Pipette className="w-4 h-4" /> },
            { id: 'pan', label: 'Pan / Hand', icon: <Hand className="w-4 h-4" /> },
          ].map((tool) => {
            const isActive = activeTool === tool.id;
            const isClone = tool.id === 'clone';

            return (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id as ToolType)}
                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all relative ${
                  isActive
                    ? isClone
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
                title={tool.label}
              >
                {tool.icon}
                {isClone && !isActive && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Brush Color & Sliders Popover Trigger */}
        <div className="pt-1 border-t border-white/10 w-full flex flex-col items-center gap-1">
          <button
            onClick={() => setShowBrushFlyout(!showBrushFlyout)}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
              showBrushFlyout ? 'bg-white/20 ring-1 ring-white' : 'hover:bg-white/10'
            }`}
            title="Brush Size, Opacity & Color"
          >
            <div
              className="w-5 h-5 rounded-full border border-white/50 shadow-sm"
              style={{ backgroundColor: brushSettings.color }}
            />
          </button>

          {/* Layers Popover Trigger */}
          <button
            onClick={() => setShowLayersFlyout(!showLayersFlyout)}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
              showLayersFlyout ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title="Layers Panel"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. CONTEXTUAL CLONE TOOLBAR (Top Floating Pill when Clone Tool is Active) */}
      {activeTool === 'clone' && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-2 px-3 py-1 bg-neutral-900/95 border border-emerald-500/40 backdrop-blur-xl rounded-full shadow-2xl text-xs text-neutral-200 animate-in fade-in slide-in-from-top-1 duration-100">
          <button
            onClick={() => onUpdateCloneSource({ isSamplingMode: !cloneSource.isSamplingMode })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
              cloneSource.isSamplingMode
                ? 'bg-amber-500 text-neutral-950 animate-pulse font-semibold'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title="Click to sample any canvas region (or Alt+Click)"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{cloneSource.isSamplingMode ? 'Tap canvas to sample...' : 'Set Source 🎯'}</span>
          </button>

          <span className="text-[11px] text-neutral-400">
            {cloneSource.active ? 'Ready to clone onto other sheets' : 'Pick source on Sheet 1'}
          </span>

          <label className="flex items-center gap-1 text-[11px] text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={cloneSource.aligned}
              onChange={(e) => onUpdateCloneSource({ aligned: e.target.checked })}
              className="rounded border-white/20 text-emerald-600 focus:ring-0 w-3 h-3 bg-neutral-800"
            />
            <span>Aligned</span>
          </label>
        </div>
      )}

      {/* 4. COMPACT BRUSH SETTINGS POPUP */}
      {showBrushFlyout && (
        <div className="absolute left-14 top-1/2 -translate-y-1/2 z-50 pointer-events-auto w-64 bg-neutral-900/95 border border-white/10 backdrop-blur-2xl rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5 text-neutral-200 text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-semibold text-neutral-200">Brush Settings</span>
            <button
              onClick={() => setShowBrushFlyout(false)}
              className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Size slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-neutral-400">
              <span>Size</span>
              <span className="font-mono tabular-nums text-white">{brushSettings.size}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={150}
              value={brushSettings.size}
              onChange={(e) => onUpdateBrushSettings({ size: Number(e.target.value) })}
              className="w-full accent-indigo-500 bg-neutral-800 h-1.5 rounded-lg"
            />
          </div>

          {/* Opacity slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-neutral-400">
              <span>Opacity</span>
              <span className="font-mono tabular-nums text-white">
                {Math.round(brushSettings.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              value={Math.round(brushSettings.opacity * 100)}
              onChange={(e) => onUpdateBrushSettings({ opacity: Number(e.target.value) / 100 })}
              className="w-full accent-indigo-500 bg-neutral-800 h-1.5 rounded-lg"
            />
          </div>

          {/* Color palette */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-white/10">
            <div className="flex justify-between items-center text-neutral-400">
              <span>Color</span>
              <input
                type="color"
                value={brushSettings.color.startsWith('#') ? brushSettings.color : '#ffffff'}
                onChange={(e) => onUpdateBrushSettings({ color: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer border border-white/20 bg-transparent"
              />
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_SWATCHES.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateBrushSettings({ color })}
                  className={`h-5 rounded-md border ${
                    brushSettings.color.toLowerCase() === color.toLowerCase()
                      ? 'border-white ring-1 ring-indigo-400 scale-105'
                      : 'border-white/10 hover:border-white/40'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. COMPACT LAYERS FLYOUT */}
      {showLayersFlyout && activeArtboard && (
        <div className="absolute left-14 top-1/2 -translate-y-1/2 z-50 pointer-events-auto w-64 bg-neutral-900/95 border border-white/10 backdrop-blur-2xl rounded-2xl p-3 shadow-2xl flex flex-col gap-2 text-neutral-200 text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-semibold truncate max-w-[140px]">
              Layers ({activeArtboard.name})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const newLayer: Layer = {
                    id: generateId('layer'),
                    name: `Layer ${activeArtboard.layers.length + 1}`,
                    visible: true,
                    opacity: 1,
                    blendMode: 'source-over',
                  };
                  onUpdateArtboard(activeArtboard.id, {
                    layers: [newLayer, ...activeArtboard.layers],
                    activeLayerId: newLayer.id,
                  });
                }}
                className="p-1 hover:bg-white/10 text-neutral-400 hover:text-white rounded"
                title="Add Layer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowLayersFlyout(false)}
                className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Layer stack */}
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {activeArtboard.layers.map((l) => (
              <div
                key={l.id}
                onClick={() => onUpdateArtboard(activeArtboard.id, { activeLayerId: l.id })}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer ${
                  l.id === activeArtboard.activeLayerId
                    ? 'bg-indigo-600/30 border border-indigo-500/40 text-white'
                    : 'bg-neutral-800/40 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = activeArtboard.layers.map((layer) =>
                        layer.id === l.id ? { ...layer, visible: !layer.visible } : layer
                      );
                      onUpdateArtboard(activeArtboard.id, { layers: next });
                    }}
                    className="hover:text-white"
                  >
                    {l.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-neutral-600" />}
                  </button>
                  <span className="truncate">{l.name}</span>
                </div>
                {activeArtboard.layers.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = activeArtboard.layers.filter((layer) => layer.id !== l.id);
                      onUpdateArtboard(activeArtboard.id, {
                        layers: next,
                        activeLayerId: next[0].id,
                      });
                    }}
                    className="p-1 hover:text-red-400 text-neutral-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
