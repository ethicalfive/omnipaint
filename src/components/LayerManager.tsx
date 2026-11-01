import React from 'react';
import { Artboard, BlendMode, Layer } from '../types/canvas';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { generateId } from '../utils/presets';

interface LayerManagerProps {
  activeArtboard: Artboard | null;
  onUpdateArtboard: (id: string, updated: Partial<Artboard>) => void;
  onClose: () => void;
}

const BLEND_MODES: Array<{ label: string; value: BlendMode }> = [
  { label: 'Normal', value: 'source-over' },
  { label: 'Multiply', value: 'multiply' },
  { label: 'Screen', value: 'screen' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Darken', value: 'darken' },
  { label: 'Lighten', value: 'lighten' },
  { label: 'Color Dodge', value: 'color-dodge' },
];

export const LayerManager: React.FC<LayerManagerProps> = ({
  activeArtboard,
  onUpdateArtboard,
  onClose,
}) => {
  if (!activeArtboard) {
    return (
      <div className="w-72 bg-neutral-900/95 border border-white/10 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl text-neutral-400 text-xs text-center select-none">
        Select a canvas to inspect layers
      </div>
    );
  }

  const layers = activeArtboard.layers;
  const activeLayer = layers.find((l) => l.id === activeArtboard.activeLayerId) || layers[0];

  // Add new blank layer on top
  const handleAddLayer = () => {
    const newLayer: Layer = {
      id: generateId('layer'),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      opacity: 1,
      blendMode: 'source-over',
    };
    onUpdateArtboard(activeArtboard.id, {
      layers: [newLayer, ...layers],
      activeLayerId: newLayer.id,
    });
  };

  // Delete layer
  const handleDeleteLayer = (layerId: string) => {
    if (layers.length <= 1) return; // Keep at least 1 layer
    const nextLayers = layers.filter((l) => l.id !== layerId);
    const nextActiveId =
      activeArtboard.activeLayerId === layerId ? nextLayers[0].id : activeArtboard.activeLayerId;

    onUpdateArtboard(activeArtboard.id, {
      layers: nextLayers,
      activeLayerId: nextActiveId,
    });
  };

  // Toggle visibility
  const handleToggleVisible = (layerId: string) => {
    const nextLayers = layers.map((l) =>
      l.id === layerId ? { ...l, visible: !l.visible } : l
    );
    onUpdateArtboard(activeArtboard.id, { layers: nextLayers });
  };

  // Update active layer props (opacity, blend mode)
  const handleUpdateActiveLayer = (updated: Partial<Layer>) => {
    const nextLayers = layers.map((l) =>
      l.id === activeLayer.id ? { ...l, ...updated } : l
    );
    onUpdateArtboard(activeArtboard.id, { layers: nextLayers });
  };

  // Move layer up in stack
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...layers];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onUpdateArtboard(activeArtboard.id, { layers: next });
  };

  // Move layer down in stack
  const handleMoveDown = (index: number) => {
    if (index >= layers.length - 1) return;
    const next = [...layers];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onUpdateArtboard(activeArtboard.id, { layers: next });
  };

  return (
    <div className="w-72 bg-neutral-900/95 border border-white/10 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-neutral-200 z-40 select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Layers ({activeArtboard.name})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddLayer}
            className="p-1 hover:bg-white/10 text-neutral-400 hover:text-white rounded-lg transition-colors"
            title="Add Layer"
            aria-label="Add new layer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
            aria-label="Close layers panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Layer Adjustments: Opacity & Blend Mode */}
      {activeLayer && (
        <div className="flex flex-col gap-2 p-2.5 bg-neutral-950/70 rounded-xl border border-white/5 text-xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span>Layer Opacity</span>
            <span className="font-mono tabular-nums text-neutral-200">
              {Math.round(activeLayer.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(activeLayer.opacity * 100)}
            onChange={(e) => handleUpdateActiveLayer({ opacity: Number(e.target.value) / 100 })}
            className="w-full accent-indigo-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-neutral-400">Blend Mode</span>
            <select
              value={activeLayer.blendMode}
              onChange={(e) => handleUpdateActiveLayer({ blendMode: e.target.value as BlendMode })}
              className="bg-neutral-800 border border-white/10 text-neutral-200 text-[11px] rounded px-2 py-1 outline-none"
            >
              {BLEND_MODES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Layer Stack List */}
      <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
        {layers.map((layer, idx) => {
          const isCurrent = layer.id === activeArtboard.activeLayerId;

          return (
            <div
              key={layer.id}
              onClick={() => onUpdateArtboard(activeArtboard.id, { activeLayerId: layer.id })}
              className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all border ${
                isCurrent
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                  : 'bg-neutral-950/40 border-white/5 text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Visibility button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleVisible(layer.id);
                  }}
                  className="p-1 hover:text-white transition-colors"
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5 text-neutral-300" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-neutral-600" />
                  )}
                </button>
                <span className="truncate font-medium">{layer.name}</span>
              </div>

              {/* Layer Actions */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  disabled={idx === 0}
                  onClick={() => handleMoveUp(idx)}
                  className={`p-1 rounded ${
                    idx === 0 ? 'text-neutral-700' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Move layer up"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  disabled={idx === layers.length - 1}
                  onClick={() => handleMoveDown(idx)}
                  className={`p-1 rounded ${
                    idx === layers.length - 1 ? 'text-neutral-700' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Move layer down"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                {layers.length > 1 && (
                  <button
                    onClick={() => handleDeleteLayer(layer.id)}
                    className="p-1 hover:text-red-400 text-neutral-500 transition-colors"
                    title="Delete layer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
