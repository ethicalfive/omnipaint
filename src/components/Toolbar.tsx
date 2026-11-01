import React from 'react';
import { BrushSettings, ToolType } from '../types/canvas';
import {
  Blend,
  Brush,
  CircleDot,
  CopyCheck,
  Eraser,
  Hand,
  Paintbrush,
  PaintBucket,
  PenTool,
  Pencil,
  Pipette,
  Redo2,
  Undo2,
  Sparkles,
} from 'lucide-react';

interface ToolbarProps {
  activeTool: ToolType;
  brushSettings: BrushSettings;
  canUndo: boolean;
  canRedo: boolean;
  onSelectTool: (tool: ToolType) => void;
  onToggleBrushSettings: () => void;
  onUndo: () => void;
  onRedo: () => void;
  isOpenSettings: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  brushSettings,
  canUndo,
  canRedo,
  onSelectTool,
  onToggleBrushSettings,
  onUndo,
  onRedo,
  isOpenSettings,
}) => {
  const tools: Array<{ id: ToolType; label: string; icon: React.ReactNode; shortcut: string }> = [
    { id: 'pen', label: 'Pen', icon: <PenTool className="w-5 h-5" />, shortcut: 'P' },
    { id: 'brush', label: 'Studio Brush', icon: <Paintbrush className="w-5 h-5" />, shortcut: 'B' },
    { id: 'pencil', label: 'Pencil', icon: <Pencil className="w-5 h-5" />, shortcut: 'N' },
    { id: 'airbrush', label: 'Airbrush', icon: <Sparkles className="w-5 h-5" />, shortcut: 'A' },
    { id: 'marker', label: 'Marker', icon: <Brush className="w-5 h-5" />, shortcut: 'M' },
    { id: 'clone', label: 'Clone Stamp', icon: <CopyCheck className="w-5 h-5" />, shortcut: 'S' },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-5 h-5" />, shortcut: 'E' },
    { id: 'smudge', label: 'Smudge / Blend', icon: <Blend className="w-5 h-5" />, shortcut: 'U' },
    { id: 'bucket', label: 'Paint Bucket', icon: <PaintBucket className="w-5 h-5" />, shortcut: 'G' },
    { id: 'picker', label: 'Eyedropper', icon: <Pipette className="w-5 h-5" />, shortcut: 'I' },
    { id: 'pan', label: 'Hand (Pan)', icon: <Hand className="w-5 h-5" />, shortcut: 'H' },
  ];

  return (
    <div className="flex flex-col items-center bg-neutral-900/95 border border-white/10 backdrop-blur-2xl rounded-2xl p-1.5 shadow-2xl gap-1 z-30 select-none">
      {/* Undo & Redo buttons */}
      <div className="flex items-center gap-1 pb-1 border-b border-white/10 w-full justify-center">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-colors ${
            canUndo
              ? 'text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95'
              : 'text-neutral-600 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z or 2-finger tap)"
          aria-label="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-colors ${
            canRedo
              ? 'text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95'
              : 'text-neutral-600 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y or 3-finger tap)"
          aria-label="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Tool Buttons */}
      <div className="flex flex-col gap-1 py-1">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          const isClone = tool.id === 'clone';

          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all relative group ${
                isActive
                  ? isClone
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
              aria-label={tool.label}
            >
              {tool.icon}

              {/* Special badge on clone stamp to make it stand out */}
              {isClone && !isActive && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Color Preview & Brush Settings Trigger */}
      <div className="pt-1 border-t border-white/10 w-full flex flex-col items-center gap-1">
        <button
          onClick={onToggleBrushSettings}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all relative ${
            isOpenSettings ? 'bg-white/20 ring-2 ring-indigo-500' : 'hover:bg-white/10'
          }`}
          title="Brush & Color Settings"
          aria-label="Brush and color settings"
        >
          {/* Outer ring showing active brush size indicator */}
          <div
            className="w-7 h-7 rounded-full shadow-md border-2 border-white/40 flex items-center justify-center transition-transform"
            style={{ backgroundColor: brushSettings.color }}
          >
            <div
              className="rounded-full bg-white/90 shadow-sm"
              style={{
                width: `${Math.max(3, Math.min(18, brushSettings.size / 5))}px`,
                height: `${Math.max(3, Math.min(18, brushSettings.size / 5))}px`,
              }}
            />
          </div>
        </button>
      </div>
    </div>
  );
};
