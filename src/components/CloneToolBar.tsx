import React from 'react';
import { Artboard, CloneSource } from '../types/canvas';
import { Check, Crosshair, HelpCircle, RotateCcw } from 'lucide-react';

interface CloneToolBarProps {
  cloneSource: CloneSource;
  artboards: Artboard[];
  onUpdateCloneSource: (source: Partial<CloneSource>) => void;
  onOpenHelp: () => void;
}

export const CloneToolBar: React.FC<CloneToolBarProps> = ({
  cloneSource,
  artboards,
  onUpdateCloneSource,
  onOpenHelp,
}) => {
  const sourceArtboard = artboards.find((a) => a.id === cloneSource.canvasId);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/95 border border-indigo-500/40 backdrop-blur-xl rounded-xl shadow-2xl text-xs text-neutral-200 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Pick Source Button */}
      <button
        onClick={() => onUpdateCloneSource({ isSamplingMode: !cloneSource.isSamplingMode })}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all min-h-[36px] ${
          cloneSource.isSamplingMode
            ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30 animate-pulse font-semibold'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25'
        }`}
        title="Tap to pick a point on any canvas to clone from (or Alt+Click)"
      >
        <Crosshair className="w-4 h-4 shrink-0" />
        <span>{cloneSource.isSamplingMode ? 'Tap canvas to set source...' : 'Set Source 🎯'}</span>
      </button>

      {/* Source Status */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md text-[11px] text-neutral-300">
        <span className="text-neutral-500">Source:</span>
        {cloneSource.active && sourceArtboard ? (
          <span className="font-medium text-emerald-400 truncate max-w-[130px]" title={sourceArtboard.name}>
            {sourceArtboard.name} ({cloneSource.x}, {cloneSource.y})
          </span>
        ) : (
          <span className="text-neutral-500 italic">No source set</span>
        )}
      </div>

      {/* Aligned Toggle */}
      <label className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-md cursor-pointer transition-colors min-h-[36px]">
        <input
          type="checkbox"
          checked={cloneSource.aligned}
          onChange={(e) => onUpdateCloneSource({ aligned: e.target.checked })}
          className="rounded border-white/20 text-indigo-600 focus:ring-0 w-3.5 h-3.5 bg-neutral-800"
        />
        <span className="text-[11px]">Aligned</span>
      </label>

      {/* Sample All Layers */}
      <label className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-md cursor-pointer transition-colors min-h-[36px]">
        <input
          type="checkbox"
          checked={cloneSource.sampleAllLayers}
          onChange={(e) => onUpdateCloneSource({ sampleAllLayers: e.target.checked })}
          className="rounded border-white/20 text-indigo-600 focus:ring-0 w-3.5 h-3.5 bg-neutral-800"
        />
        <span className="text-[11px]">All Layers</span>
      </label>

      {/* Reset Source */}
      {cloneSource.active && (
        <button
          onClick={() => onUpdateCloneSource({ active: false })}
          className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-neutral-200 rounded-md transition-colors"
          title="Reset Clone Source"
          aria-label="Reset clone source"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Quick Help */}
      <button
        onClick={onOpenHelp}
        className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-indigo-400 rounded-md transition-colors"
        title="How does cross-canvas clone work?"
        aria-label="Clone tool tips"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
