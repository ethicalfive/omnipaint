import React, { useEffect, useRef, useState } from 'react';
import { Artboard, CloneSource, ToolType } from '../types/canvas';
import { Download, Move, Trash2 } from 'lucide-react';

interface ArtboardViewProps {
  artboard: Artboard;
  isActiveCloneSource: boolean;
  cloneSource: CloneSource;
  activeTool: ToolType;
  onUpdate: (updated: Partial<Artboard>) => void;
  onDelete: (artboardId: string) => void;
  onExport: (artboard: Artboard) => void;
  onHeaderPointerDown: (e: React.PointerEvent, artboardId: string) => void;
  registerLayerCanvas: (layerId: string, canvas: HTMLCanvasElement | null) => void;
}

export const ArtboardView: React.FC<ArtboardViewProps> = ({
  artboard,
  isActiveCloneSource,
  cloneSource,
  onUpdate,
  onDelete,
  onExport,
  onHeaderPointerDown,
  registerLayerCanvas,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(artboard.name);

  useEffect(() => {
    setNameInput(artboard.name);
  }, [artboard.name]);

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (nameInput.trim()) {
      onUpdate({ name: nameInput.trim() });
    } else {
      setNameInput(artboard.name);
    }
  };

  const isCloneSampleThisCanvas = cloneSource.active && cloneSource.canvasId === artboard.id;

  return (
    <div
      id={`artboard-${artboard.id}`}
      data-artboard-id={artboard.id}
      className="absolute select-none group"
      style={{
        transform: `translate3d(${artboard.x}px, ${artboard.y}px, 0px) rotate(${artboard.rotation}deg) scale(${artboard.scale || 1})`,
        transformOrigin: 'center center',
        width: `${artboard.width}px`,
        height: `${artboard.height}px`,
      }}
    >
      {/* Minimalist Artboard Sheet Label & Drag Handle */}
      <div
        className="absolute -top-7 left-0 right-0 h-6 flex items-center justify-between px-1.5 text-[11px] text-neutral-400 font-medium select-none pointer-events-auto"
        onPointerDown={(e) => {
          e.stopPropagation();
          onHeaderPointerDown(e, artboard.id);
        }}
      >
        {/* Left: Drag Handle & Sheet Name */}
        <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:text-white transition-colors bg-neutral-900/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10">
          <Move className="w-3 h-3 text-neutral-500 shrink-0" />
          {isEditingName ? (
            <input
              type="text"
              value={nameInput}
              autoFocus
              className="bg-neutral-800 text-[11px] px-1 py-0 rounded border border-indigo-500 text-white outline-none w-28"
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setNameInput(artboard.name);
                  setIsEditingName(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="truncate cursor-pointer hover:underline"
              title="Double click to rename"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
            >
              {artboard.name}
            </span>
          )}

          <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
            {artboard.width}×{artboard.height}
          </span>
        </div>

        {/* Right: Quick Minimalist Hover Actions */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {isCloneSampleThisCanvas && (
            <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1 rounded">
              🎯 Source
            </span>
          )}
          <button
            onClick={() => onExport(artboard)}
            className="p-1 hover:text-white text-neutral-400 transition-colors"
            title="Export as PNG"
            aria-label="Export canvas PNG"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(artboard.id)}
            className="p-1 hover:text-red-400 text-neutral-500 transition-colors"
            title="Delete canvas sheet"
            aria-label="Delete sheet"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Canvas Layer Container */}
      <div
        className={`relative w-full h-full overflow-hidden rounded-sm ring-1 ring-white/15 shadow-2xl shadow-black/60 pointer-events-none ${
          artboard.backgroundColor === 'transparent' ? 'canvas-checkerboard' : ''
        }`}
        style={{
          backgroundColor:
            artboard.backgroundColor === 'transparent' ? undefined : artboard.backgroundColor,
        }}
      >
        {artboard.layers.map((layer) => (
          <LayerCanvas
            key={layer.id}
            layerId={layer.id}
            width={artboard.width}
            height={artboard.height}
            visible={layer.visible}
            opacity={layer.opacity}
            blendMode={layer.blendMode}
            initialDataUrl={layer.dataUrl}
            registerLayerCanvas={registerLayerCanvas}
          />
        ))}

        {/* Clone Source Reticle indicator */}
        {isCloneSampleThisCanvas && (
          <div
            id={`clone-reticle-${artboard.id}`}
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-20"
            style={{
              left: `${cloneSource.x}px`,
              top: `${cloneSource.y}px`,
            }}
          >
            <div className="relative w-7 h-7 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="absolute -top-1 w-0.5 h-2 bg-emerald-400" />
              <div className="absolute -bottom-1 w-0.5 h-2 bg-emerald-400" />
              <div className="absolute -left-1 h-0.5 w-2 bg-emerald-400" />
              <div className="absolute -right-1 h-0.5 w-2 bg-emerald-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface LayerCanvasProps {
  layerId: string;
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  initialDataUrl?: string;
  registerLayerCanvas: (layerId: string, canvas: HTMLCanvasElement | null) => void;
}

const LayerCanvas: React.FC<LayerCanvasProps> = ({
  layerId,
  width,
  height,
  visible,
  opacity,
  blendMode,
  initialDataUrl,
  registerLayerCanvas,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    registerLayerCanvas(layerId, canvas);

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = initialDataUrl;
    }

    return () => {
      registerLayerCanvas(layerId, null);
    };
  }, [layerId, registerLayerCanvas]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{
        display: visible ? 'block' : 'none',
        opacity,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mixBlendMode: (blendMode === 'source-over' ? 'normal' : blendMode) as any,
      }}
    />
  );
};
