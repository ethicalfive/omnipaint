import React from 'react';
import { Columns, Grid, HelpCircle, Layers, Plus, Save } from 'lucide-react';

interface TopBarProps {
  onAlignSideBySide: () => void;
  onAlignDual: () => void;
  onOpenNewCanvasModal: () => void;
  onOpenEnvironmentsModal: () => void;
  onOpenGestureGuide: () => void;
  onOpenSaveMenu: () => void;
  activeArtboardCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onAlignSideBySide,
  onAlignDual,
  onOpenNewCanvasModal,
  onOpenEnvironmentsModal,
  onOpenGestureGuide,
  onOpenSaveMenu,
  activeArtboardCount,
}) => {
  return (
    <header className="h-14 flex items-center justify-between gap-8 px-6 bg-neutral-950/80 border-b border-white/10 backdrop-blur-xl z-30 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
          OmniCanvas Studio
        </span>
        <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline tabular-nums">
          · {activeArtboardCount} {activeArtboardCount === 1 ? 'canvas' : 'canvases'}
        </span>
      </div>

      {/* Zone 2: 4–5 concise single-line nav action buttons */}
      <nav className="flex items-center gap-2 md:gap-4 text-xs font-medium text-neutral-300 overflow-x-auto no-scrollbar">
        <button
          onClick={onAlignSideBySide}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
          title="Arrange all canvases side-by-side in a horizontal row"
        >
          <Columns className="w-3.5 h-3.5 text-indigo-400" />
          <span>Side-by-Side</span>
        </button>

        <button
          onClick={onAlignDual}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
          title="Arrange dual comparison canvas view (reference and target)"
        >
          <Grid className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dual Grid</span>
        </button>

        <button
          onClick={onOpenNewCanvasModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
          title="Create a new canvas artboard"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          <span>New Canvas</span>
        </button>

        <button
          onClick={onOpenEnvironmentsModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
          title="Load and save studio environments, preset scenes"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Environments</span>
        </button>

        <button
          onClick={onOpenGestureGuide}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
          title="Multitouch gestures, pinch zoom/rotate, and clone shortcuts"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Gestures & Tips</span>
          <span className="md:hidden">Tips</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenSaveMenu}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25 active:scale-95 transition-all whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Save className="w-4 h-4" />
          <span>Save Studio</span>
        </button>
      </div>
    </header>
  );
};
