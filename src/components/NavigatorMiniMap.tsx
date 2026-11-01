import React, { useRef, useState } from 'react';
import { Artboard, ViewportState } from '../types/canvas';
import { clamp, formatZoom } from '../utils/math';
import { Compass, Maximize2, Minus, Plus, RotateCcw, Scan } from 'lucide-react';

interface NavigatorMiniMapProps {
  artboards: Artboard[];
  viewport: ViewportState;
  selectedArtboardId: string | null;
  onUpdateViewport: (viewport: ViewportState) => void;
  onFitAll: () => void;
  onResetZoom: () => void;
  onResetRotation: () => void;
}

export const NavigatorMiniMap: React.FC<NavigatorMiniMapProps> = ({
  artboards,
  viewport,
  selectedArtboardId,
  onUpdateViewport,
  onFitAll,
  onResetZoom,
  onResetRotation,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);

  // Compute world bounding box enclosing all artboards
  let minX = -1000;
  let maxX = 1000;
  let minY = -1000;
  let maxY = 1000;

  if (artboards.length > 0) {
    minX = Math.min(...artboards.map((a) => a.x)) - 300;
    maxX = Math.max(...artboards.map((a) => a.x + a.width)) + 300;
    minY = Math.min(...artboards.map((a) => a.y)) - 300;
    maxY = Math.max(...artboards.map((a) => a.y + a.height)) + 300;
  }

  const worldWidth = Math.max(1000, maxX - minX);
  const worldHeight = Math.max(1000, maxY - minY);

  // Mini-map dimensions
  const mapSize = 140;
  const scaleX = mapSize / worldWidth;
  const scaleY = mapSize / worldHeight;
  const mapScale = Math.min(scaleX, scaleY);

  const handleMapPointerDown = (e: React.PointerEvent) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click point in minimap to world coordinate
    const targetWorldX = minX + clickX / mapScale;
    const targetWorldY = minY + clickY / mapScale;

    // Center viewport at this world coordinate
    onUpdateViewport({
      ...viewport,
      panX: -targetWorldX * viewport.scale,
      panY: -targetWorldY * viewport.scale,
    });
  };

  const handleZoomIn = () => {
    onUpdateViewport({
      ...viewport,
      scale: clamp(viewport.scale * 1.25, 0.005, 1000),
    });
  };

  const handleZoomOut = () => {
    onUpdateViewport({
      ...viewport,
      scale: clamp(viewport.scale * 0.8, 0.005, 1000),
    });
  };

  return (
    <div className="bg-neutral-900/95 border border-white/10 backdrop-blur-2xl rounded-2xl p-2.5 shadow-2xl flex flex-col gap-2 select-none z-30 text-neutral-200">
      {/* Zoom & Rotation Controls Bar */}
      <div className="flex items-center justify-between gap-2 text-xs">
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onResetZoom}
            className="px-1.5 py-0.5 hover:bg-white/10 rounded font-mono text-[11px] font-medium text-neutral-300 tabular-nums"
            title="Reset to 100% zoom"
          >
            {formatZoom(viewport.scale)}
          </button>

          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rotation & Fit buttons */}
        <div className="flex items-center gap-1">
          {Math.abs(viewport.rotation) > 0.5 && (
            <button
              onClick={onResetRotation}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded text-[10px] font-mono tabular-nums"
              title="Snap rotation to 0°"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{Math.round(viewport.rotation)}°</span>
            </button>
          )}

          <button
            onClick={onFitAll}
            className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors"
            title="Fit all canvases in view"
            aria-label="Fit all canvases"
          >
            <Scan className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand Radar' : 'Collapse Radar'}
            aria-label="Toggle radar"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Radar Canvas Container */}
      {!isCollapsed && (
        <div
          ref={mapRef}
          onPointerDown={handleMapPointerDown}
          className="relative bg-neutral-950/90 border border-white/5 rounded-xl overflow-hidden cursor-crosshair transition-all"
          style={{ width: `${mapSize}px`, height: `${mapSize}px` }}
          title="Click to jump camera to location"
        >
          {/* Subtle grid lines */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:16px_16px]" />

          {/* Render miniature artboard boxes */}
          {artboards.map((a) => {
            const bx = (a.x - minX) * mapScale;
            const by = (a.y - minY) * mapScale;
            const bw = Math.max(3, a.width * mapScale);
            const bh = Math.max(3, a.height * mapScale);
            const isSelected = a.id === selectedArtboardId;

            return (
              <div
                key={a.id}
                className={`absolute rounded-[2px] transition-colors pointer-events-none ${
                  isSelected ? 'bg-indigo-500 ring-1 ring-white' : 'bg-neutral-600'
                }`}
                style={{
                  left: `${bx}px`,
                  top: `${by}px`,
                  width: `${bw}px`,
                  height: `${bh}px`,
                }}
              />
            );
          })}

          {/* Current Camera Viewport Frustum Wireframe */}
          <div
            className="absolute border border-amber-400 bg-amber-400/10 pointer-events-none rounded-[2px]"
            style={{
              left: `${(-viewport.panX / viewport.scale - minX) * mapScale - 16}px`,
              top: `${(-viewport.panY / viewport.scale - minY) * mapScale - 12}px`,
              width: `${(window.innerWidth / viewport.scale) * mapScale}px`,
              height: `${(window.innerHeight / viewport.scale) * mapScale}px`,
              transform: `rotate(${-viewport.rotation}deg)`,
              transformOrigin: 'center center',
            }}
          />
        </div>
      )}
    </div>
  );
};
