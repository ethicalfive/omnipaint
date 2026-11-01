import React, { useCallback, useEffect, useRef } from 'react';
import {
  Artboard,
  BrushSettings,
  CloneSource,
  Point2D,
  ToolType,
  ViewportState,
} from '../types/canvas';
import { ArtboardView } from './ArtboardView';
import {
  clamp,
  getAngleDegrees,
  getDistance,
  getMidpoint,
  normalizeAngle,
  screenToWorld,
  worldToArtboardLocal,
  worldToScreen,
} from '../utils/math';
import {
  drawBrushSegment,
  drawCloneStampSegment,
  drawSmudgeSegment,
  floodFill,
  sampleColor,
} from '../utils/brushEngine';

interface InfiniteWorkspaceProps {
  artboards: Artboard[];
  viewport: ViewportState;
  activeTool: ToolType;
  brushSettings: BrushSettings;
  cloneSource: CloneSource;
  isRotationLocked: boolean;
  onSelectArtboard: (id: string) => void;
  onUpdateArtboard: (id: string, updated: Partial<Artboard>) => void;
  onDeleteArtboard: (id: string) => void;
  onExportArtboard: (artboard: Artboard) => void;
  onUpdateViewportSync: (viewport: ViewportState) => void;
  onUpdateCloneSource: (source: Partial<CloneSource>) => void;
  onUpdateBrushSettings: (settings: Partial<BrushSettings>) => void;
  onSaveUndoState: (artboardId: string, layerId: string) => void;
  onPerformUndo?: () => void;
  onPerformRedo?: () => void;
}

interface ActivePointer {
  id: number;
  clientX: number;
  clientY: number;
  pressure: number;
  pointerType: string;
}

export const InfiniteWorkspace: React.FC<InfiniteWorkspaceProps> = ({
  artboards,
  viewport,
  activeTool,
  brushSettings,
  cloneSource,
  isRotationLocked,
  onSelectArtboard,
  onUpdateArtboard,
  onDeleteArtboard,
  onExportArtboard,
  onUpdateViewportSync,
  onUpdateCloneSource,
  onUpdateBrushSettings,
  onSaveUndoState,
  onPerformUndo,
  onPerformRedo,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Mutable Viewport reference for 60-120fps hardware transforms WITHOUT React re-renders!
  const viewportRef = useRef<ViewportState>({ ...viewport });

  // Keep ref synced if external changes occur (like Fit All or preset load)
  useEffect(() => {
    viewportRef.current = { ...viewport };
    applyTransform();
  }, [viewport]);

  // Direct CSS transform helper
  const applyTransform = () => {
    if (planeRef.current) {
      const { panX, panY, scale, rotation } = viewportRef.current;
      planeRef.current.style.transform = `translate3d(${panX}px, ${panY}px, 0px) rotate(${rotation}deg) scale(${scale})`;
    }
  };

  // In-progress stroke tracking
  const strokeStateRef = useRef<{
    artboardId: string;
    layerId: string;
    lastLocalPoint: Point2D | null;
    startSourcePoint: Point2D | null;
    lastSourcePoint: Point2D | null;
    startLocalPoint: Point2D | null;
    sourceCanvas: HTMLCanvasElement | null;
    isDrawing: boolean;
  }>({
    artboardId: '',
    layerId: '',
    lastLocalPoint: null,
    startSourcePoint: null,
    lastSourcePoint: null,
    startLocalPoint: null,
    sourceCanvas: null,
    isDrawing: false,
  });

  // Multitouch gesture tracking
  const activePointersRef = useRef<Map<number, ActivePointer>>(new Map());
  const pinchGestureRef = useRef<{
    prevDist: number;
    prevMid: Point2D;
    initialAngle: number;
    prevAngle: number;
    accumulatedRotation: number;
    hasCrossedRotationDeadzone: boolean;
  } | null>(null);

  // Dragging artboard position tracking
  const dragArtboardRef = useRef<{
    artboardId: string;
    startWorldX: number;
    startWorldY: number;
    artboardStartX: number;
    artboardStartY: number;
  } | null>(null);

  // Panning workspace tracking
  const panStateRef = useRef<{
    isPanning: boolean;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  }>({
    isPanning: false,
    startClientX: 0,
    startClientY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  // Quick 2-finger tap (Undo) & 3-finger tap (Redo) detector
  const tapDetectorRef = useRef<{
    maxFingers: number;
    startTime: number;
    hasMoved: boolean;
  }>({ maxFingers: 0, startTime: 0, hasMoved: false });

  // Register layer canvas elements
  const registerLayerCanvas = useCallback((layerId: string, canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      layerCanvasesRef.current.set(layerId, canvas);
    } else {
      layerCanvasesRef.current.delete(layerId);
    }
  }, []);

  // Composite canvas generator for an artboard (flattens all visible layers)
  const getCompositeCanvas = useCallback((artboardId: string): HTMLCanvasElement | null => {
    const artboard = artboards.find((a) => a.id === artboardId);
    if (!artboard) return null;

    const compCanvas = document.createElement('canvas');
    compCanvas.width = artboard.width;
    compCanvas.height = artboard.height;
    const ctx = compCanvas.getContext('2d');
    if (!ctx) return null;

    // Background
    if (artboard.backgroundColor && artboard.backgroundColor !== 'transparent') {
      ctx.fillStyle = artboard.backgroundColor;
      ctx.fillRect(0, 0, artboard.width, artboard.height);
    }

    // Layers
    for (const layer of artboard.layers) {
      if (!layer.visible) continue;
      const lCanvas = layerCanvasesRef.current.get(layer.id);
      if (lCanvas) {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.drawImage(lCanvas, 0, 0);
        ctx.restore();
      }
    }

    return compCanvas;
  }, [artboards]);

  // Find artboard under world coordinates (seamless hit testing)
  const findArtboardAt = (worldPoint: Point2D): Artboard | null => {
    for (let i = artboards.length - 1; i >= 0; i--) {
      const a = artboards[i];
      const local = worldToArtboardLocal(worldPoint.x, worldPoint.y, a);
      if (local.x >= 0 && local.x <= a.width && local.y >= 0 && local.y <= a.height) {
        return a;
      }
    }
    return null;
  };

  // HEADER POINTER DOWN (Canvas Repositioning Drag)
  const handleHeaderPointerDown = (e: React.PointerEvent, artboardId: string) => {
    if (e.button !== 0) return;
    const artboard = artboards.find((a) => a.id === artboardId);
    if (!artboard || artboard.isLocked) return;

    onSelectArtboard(artboardId);
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width || window.innerWidth;
    const h = rect?.height || window.innerHeight;
    const worldPoint = screenToWorld(e.clientX, e.clientY, viewportRef.current, w, h);

    dragArtboardRef.current = {
      artboardId,
      startWorldX: worldPoint.x,
      startWorldY: worldPoint.y,
      artboardStartX: artboard.x,
      artboardStartY: artboard.y,
    };
  };

  // WORKSPACE POINTER DOWN
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width || window.innerWidth;
    const h = rect?.height || window.innerHeight;

    // Track active pointer
    activePointersRef.current.set(e.pointerId, {
      id: e.pointerId,
      clientX: e.clientX,
      clientY: e.clientY,
      pressure: e.pressure || 0.5,
      pointerType: e.pointerType,
    });

    const pointerCount = activePointersRef.current.size;

    tapDetectorRef.current = {
      maxFingers: Math.max(tapDetectorRef.current.maxFingers, pointerCount),
      startTime: Date.now(),
      hasMoved: false,
    };

    // 2 POINTERS ACTIVE: MULTITOUCH PINCH-ZOOM & TWO-FINGER MOVE (PAN)
    if (pointerCount === 2) {
      // Abort any active stroke cleanly
      strokeStateRef.current.isDrawing = false;
      dragArtboardRef.current = null;
      panStateRef.current.isPanning = false;

      const [p1, p2] = Array.from(activePointersRef.current.values());
      const dist = getDistance({ x: p1.clientX, y: p1.clientY }, { x: p2.clientX, y: p2.clientY });
      const angle = getAngleDegrees({ x: p1.clientX, y: p1.clientY }, { x: p2.clientX, y: p2.clientY });
      const mid = getMidpoint({ x: p1.clientX, y: p1.clientY }, { x: p2.clientX, y: p2.clientY });

      pinchGestureRef.current = {
        prevDist: dist,
        prevMid: mid,
        initialAngle: angle,
        prevAngle: angle,
        accumulatedRotation: 0,
        hasCrossedRotationDeadzone: false,
      };
      return;
    }

    if (pointerCount > 2) {
      return;
    }

    // 1 POINTER ACTIVE:
    // Middle click, Space held, or Pan tool: Workspace Pan
    if (e.button === 1 || activeTool === 'pan' || e.shiftKey) {
      panStateRef.current = {
        isPanning: true,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPanX: viewportRef.current.panX,
        startPanY: viewportRef.current.panY,
      };
      return;
    }

    // Hit-test on the shared infinite plane
    const worldPoint = screenToWorld(e.clientX, e.clientY, viewportRef.current, w, h);
    const hitArtboard = findArtboardAt(worldPoint);

    if (!hitArtboard) {
      // Touching empty space: Pan workspace smoothly
      panStateRef.current = {
        isPanning: true,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPanX: viewportRef.current.panX,
        startPanY: viewportRef.current.panY,
      };
      return;
    }

    // Touching a canvas sheet: NO SELECTION REQUIRED, DRAW DIRECTLY!
    onSelectArtboard(hitArtboard.id);
    const local = worldToArtboardLocal(worldPoint.x, worldPoint.y, hitArtboard);

    // Clone Tool: Pick Sample Source
    if (activeTool === 'clone' && (cloneSource.isSamplingMode || e.altKey)) {
      onUpdateCloneSource({
        canvasId: hitArtboard.id,
        x: Math.round(local.x),
        y: Math.round(local.y),
        active: true,
        isSamplingMode: false,
      });
      return;
    }

    // Eyedropper Tool
    if (activeTool === 'picker') {
      const comp = getCompositeCanvas(hitArtboard.id);
      if (comp) {
        const ctx = comp.getContext('2d');
        if (ctx) {
          const colorHex = sampleColor(ctx, local.x, local.y);
          onUpdateBrushSettings({ color: colorHex });
        }
      }
      return;
    }

    // Paint Bucket (Flood Fill) Tool
    if (activeTool === 'bucket') {
      if (hitArtboard.isLocked) return;
      const activeLayer = hitArtboard.layers.find((l) => l.id === hitArtboard.activeLayerId);
      if (!activeLayer || !activeLayer.visible) return;

      const layerCanvas = layerCanvasesRef.current.get(activeLayer.id);
      if (layerCanvas) {
        const ctx = layerCanvas.getContext('2d');
        if (ctx) {
          onSaveUndoState(hitArtboard.id, activeLayer.id);
          floodFill(ctx, local.x, local.y, brushSettings.color, 32);
        }
      }
      return;
    }

    // Drawing Tools: Pen, Pencil, Airbrush, Marker, Eraser, Clone, Smudge
    if (hitArtboard.isLocked) return;
    const activeLayer = hitArtboard.layers.find((l) => l.id === hitArtboard.activeLayerId);
    if (!activeLayer || !activeLayer.visible) return;

    // Check Clone Stamp setup
    let sourceStart: Point2D | null = null;
    let cachedSourceCanvas: HTMLCanvasElement | null = null;
    if (activeTool === 'clone') {
      const sourceArtboardId = cloneSource.active ? cloneSource.canvasId : hitArtboard.id;
      if (!cloneSource.active) {
        onUpdateCloneSource({
          canvasId: hitArtboard.id,
          x: Math.round(local.x),
          y: Math.round(local.y),
          active: true,
          isSamplingMode: false,
        });
        sourceStart = { x: local.x, y: local.y };
      } else {
        sourceStart = { x: cloneSource.x, y: cloneSource.y };
      }
      cachedSourceCanvas = getCompositeCanvas(sourceArtboardId);
    }

    // Save undo state before beginning stroke
    onSaveUndoState(hitArtboard.id, activeLayer.id);

    strokeStateRef.current = {
      artboardId: hitArtboard.id,
      layerId: activeLayer.id,
      lastLocalPoint: local,
      startLocalPoint: local,
      startSourcePoint: sourceStart,
      lastSourcePoint: sourceStart,
      sourceCanvas: cachedSourceCanvas,
      isDrawing: true,
    };

    // Draw initial dab on pointerdown
    const layerCanvas = layerCanvasesRef.current.get(activeLayer.id);
    if (layerCanvas) {
      const ctx = layerCanvas.getContext('2d');
      if (ctx) {
        if (activeTool === 'clone' && sourceStart && cachedSourceCanvas) {
          drawCloneStampSegment(
            ctx,
            cachedSourceCanvas,
            local.x,
            local.y,
            local.x,
            local.y,
            sourceStart.x,
            sourceStart.y,
            sourceStart.x,
            sourceStart.y,
            brushSettings,
            e.pressure || 0.5
          );
        } else if (['pen', 'pencil', 'airbrush', 'marker', 'eraser'].includes(activeTool)) {
          drawBrushSegment(
            ctx,
            local.x,
            local.y,
            local.x,
            local.y,
            activeTool,
            brushSettings,
            e.pressure || 0.5
          );
        }
      }
    }
  };

  // WORKSPACE POINTER MOVE (Ultra-Optimized 60-120fps direct hardware loop)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, {
        id: e.pointerId,
        clientX: e.clientX,
        clientY: e.clientY,
        pressure: e.pressure || 0.5,
        pointerType: e.pointerType,
      });
      tapDetectorRef.current.hasMoved = true;
    }

    // 1. TWO-FINGER PINCH-ZOOM AND TWO-FINGER PAN / MOVE (Anchored at midpoint between fingers)
    if (activePointersRef.current.size === 2 && pinchGestureRef.current) {
      const [p1, p2] = Array.from(activePointersRef.current.values());
      const currentDist = getDistance({ x: p1.clientX, y: p1.clientY }, { x: p2.clientX, y: p2.clientY });
      const currentMid = getMidpoint({ x: p1.clientX, y: p1.clientY }, { x: p2.clientX, y: p2.clientY });
      const currentAngle = getAngleDegrees({ x: p1.clientX, y: p1.clientY }, { x: p2.clientX, y: p2.clientY });

      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || window.innerWidth;
      const h = rect?.height || window.innerHeight;

      // 1. Convert PREVIOUS midpoint to world coordinates before zoom
      const worldAnchor = screenToWorld(
        pinchGestureRef.current.prevMid.x,
        pinchGestureRef.current.prevMid.y,
        viewportRef.current,
        w,
        h
      );

      // 2. Compute smooth zoom ratio
      if (pinchGestureRef.current.prevDist > 0 && currentDist > 0) {
        const distRatio = currentDist / pinchGestureRef.current.prevDist;
        viewportRef.current.scale = clamp(viewportRef.current.scale * distRatio, 0.01, 500);
      }

      // 3. Compute rotation if angle unlocked
      if (!isRotationLocked) {
        const deltaAngle = normalizeAngle(currentAngle - pinchGestureRef.current.prevAngle);
        pinchGestureRef.current.accumulatedRotation += Math.abs(deltaAngle);

        // 6-degree deadzone prevents unintended spinning during pinch zoom / pan
        if (pinchGestureRef.current.accumulatedRotation > 6) {
          pinchGestureRef.current.hasCrossedRotationDeadzone = true;
        }

        if (pinchGestureRef.current.hasCrossedRotationDeadzone) {
          viewportRef.current.rotation = (viewportRef.current.rotation + deltaAngle * 0.6) % 360;
        }
      }

      // 4. Anchor world coordinate to CURRENT finger midpoint (simultaneous pan + zoom centered on fingers!)
      const projectedScreen = worldToScreen(
        worldAnchor.x,
        worldAnchor.y,
        viewportRef.current,
        w,
        h
      );

      viewportRef.current.panX += (currentMid.x - projectedScreen.x);
      viewportRef.current.panY += (currentMid.y - projectedScreen.y);

      // Update gesture baseline
      pinchGestureRef.current.prevDist = currentDist;
      pinchGestureRef.current.prevMid = currentMid;
      pinchGestureRef.current.prevAngle = currentAngle;

      // Direct DOM update (no re-renders!)
      applyTransform();
      return;
    }

    // 2. DRAGGING ARTBOARD POSITION
    if (dragArtboardRef.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || window.innerWidth;
      const h = rect?.height || window.innerHeight;
      const worldPoint = screenToWorld(e.clientX, e.clientY, viewportRef.current, w, h);

      const deltaX = worldPoint.x - dragArtboardRef.current.startWorldX;
      const deltaY = worldPoint.y - dragArtboardRef.current.startWorldY;

      onUpdateArtboard(dragArtboardRef.current.artboardId, {
        x: Math.round(dragArtboardRef.current.artboardStartX + deltaX),
        y: Math.round(dragArtboardRef.current.artboardStartY + deltaY),
      });
      return;
    }

    // 3. PANNING WORKSPACE (Hand tool / empty space drag)
    if (panStateRef.current.isPanning) {
      const dx = e.clientX - panStateRef.current.startClientX;
      const dy = e.clientY - panStateRef.current.startClientY;

      viewportRef.current.panX = panStateRef.current.startPanX + dx;
      viewportRef.current.panY = panStateRef.current.startPanY + dy;
      applyTransform();
      return;
    }

    // 4. DRAWING ON CANVAS (Pen, Pencil, Airbrush, Marker, Eraser, Clone, Smudge)
    if (strokeStateRef.current.isDrawing && strokeStateRef.current.lastLocalPoint) {
      const artboard = artboards.find((a) => a.id === strokeStateRef.current.artboardId);
      if (!artboard) return;

      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || window.innerWidth;
      const h = rect?.height || window.innerHeight;
      const worldPoint = screenToWorld(e.clientX, e.clientY, viewportRef.current, w, h);
      const currentLocal = worldToArtboardLocal(worldPoint.x, worldPoint.y, artboard);

      const layerCanvas = layerCanvasesRef.current.get(strokeStateRef.current.layerId);
      if (!layerCanvas) return;
      const ctx = layerCanvas.getContext('2d');
      if (!ctx) return;

      // CLONE STAMP TOOL
      if (activeTool === 'clone' && strokeStateRef.current.startSourcePoint && strokeStateRef.current.startLocalPoint) {
        const offsetTargetX = currentLocal.x - strokeStateRef.current.startLocalPoint.x;
        const offsetTargetY = currentLocal.y - strokeStateRef.current.startLocalPoint.y;

        const currentSourceX = strokeStateRef.current.startSourcePoint.x + offsetTargetX;
        const currentSourceY = strokeStateRef.current.startSourcePoint.y + offsetTargetY;

        // Directly update source reticle DOM element for zero-latency 60fps tracking!
        const reticleEl = document.getElementById(`clone-reticle-${cloneSource.canvasId}`);
        if (reticleEl) {
          reticleEl.style.left = `${Math.round(currentSourceX)}px`;
          reticleEl.style.top = `${Math.round(currentSourceY)}px`;
        }

        const sourceCanvas = strokeStateRef.current.sourceCanvas;

        if (sourceCanvas && strokeStateRef.current.lastSourcePoint) {
          drawCloneStampSegment(
            ctx,
            sourceCanvas,
            strokeStateRef.current.lastLocalPoint.x,
            strokeStateRef.current.lastLocalPoint.y,
            currentLocal.x,
            currentLocal.y,
            strokeStateRef.current.lastSourcePoint.x,
            strokeStateRef.current.lastSourcePoint.y,
            currentSourceX,
            currentSourceY,
            brushSettings,
            e.pressure || 0.5
          );
        }

        strokeStateRef.current.lastLocalPoint = currentLocal;
        strokeStateRef.current.lastSourcePoint = { x: currentSourceX, y: currentSourceY };
        return;
      }

      // SMUDGE TOOL
      if (activeTool === 'smudge') {
        drawSmudgeSegment(
          ctx,
          strokeStateRef.current.lastLocalPoint.x,
          strokeStateRef.current.lastLocalPoint.y,
          currentLocal.x,
          currentLocal.y,
          brushSettings
        );
        strokeStateRef.current.lastLocalPoint = currentLocal;
        return;
      }

      // BRUSHES: Pen, Pencil, Airbrush, Marker, Eraser
      if (['pen', 'pencil', 'airbrush', 'marker', 'eraser'].includes(activeTool)) {
        drawBrushSegment(
          ctx,
          strokeStateRef.current.lastLocalPoint.x,
          strokeStateRef.current.lastLocalPoint.y,
          currentLocal.x,
          currentLocal.y,
          activeTool,
          brushSettings,
          e.pressure || 0.5
        );
        strokeStateRef.current.lastLocalPoint = currentLocal;
      }
    }
  };

  // WORKSPACE POINTER UP / CANCEL
  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);

    // Multitouch Tap gestures: 2 fingers = Undo, 3 fingers = Redo
    const elapsed = Date.now() - tapDetectorRef.current.startTime;
    if (elapsed < 320 && !tapDetectorRef.current.hasMoved && activePointersRef.current.size === 0) {
      if (tapDetectorRef.current.maxFingers === 2 && onPerformUndo) {
        onPerformUndo();
      } else if (tapDetectorRef.current.maxFingers >= 3 && onPerformRedo) {
        onPerformRedo();
      }
    }

    if (activePointersRef.current.size < 2) {
      pinchGestureRef.current = null;
    }

    if (activePointersRef.current.size === 0) {
      tapDetectorRef.current = { maxFingers: 0, startTime: 0, hasMoved: false };
      // Sync viewport state to parent once gesture finishes
      onUpdateViewportSync({ ...viewportRef.current });
    }

    if (dragArtboardRef.current) {
      dragArtboardRef.current = null;
    }

    if (panStateRef.current.isPanning) {
      panStateRef.current.isPanning = false;
      onUpdateViewportSync({ ...viewportRef.current });
    }

    if (strokeStateRef.current.isDrawing) {
      strokeStateRef.current.isDrawing = false;
      strokeStateRef.current.lastLocalPoint = null;

      // If clone tool is NOT aligned, reset reticle back to initial sample coordinate
      if (activeTool === 'clone' && !cloneSource.aligned && strokeStateRef.current.startSourcePoint) {
        onUpdateCloneSource({
          x: strokeStateRef.current.startSourcePoint.x,
          y: strokeStateRef.current.startSourcePoint.y,
        });
      } else if (activeTool === 'clone' && strokeStateRef.current.lastSourcePoint) {
        onUpdateCloneSource({
          x: Math.round(strokeStateRef.current.lastSourcePoint.x),
          y: Math.round(strokeStateRef.current.lastSourcePoint.y),
        });
      }
      strokeStateRef.current.sourceCanvas = null;
    }
  };

  // MOUSE WHEEL ZOOM & TRACKPAD PAN
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width || window.innerWidth;
    const h = rect?.height || window.innerHeight;

    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = Math.pow(0.992, e.deltaY);
      const newScale = clamp(viewportRef.current.scale * zoomFactor, 0.01, 500);

      const mouseScreenX = e.clientX;
      const mouseScreenY = e.clientY;

      const beforeWorld = screenToWorld(mouseScreenX, mouseScreenY, viewportRef.current, w, h);
      viewportRef.current.scale = newScale;
      const afterWorld = screenToWorld(mouseScreenX, mouseScreenY, viewportRef.current, w, h);

      viewportRef.current.panX += (afterWorld.x - beforeWorld.x) * newScale;
      viewportRef.current.panY += (afterWorld.y - beforeWorld.y) * newScale;

      applyTransform();
      onUpdateViewportSync({ ...viewportRef.current });
    } else {
      viewportRef.current.panX -= e.deltaX;
      viewportRef.current.panY -= e.deltaY;
      applyTransform();
      onUpdateViewportSync({ ...viewportRef.current });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none infinite-grid touch-none cursor-crosshair"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      style={{ touchAction: 'none' }}
    >
      {/* Infinite World Plane Transform Container */}
      <div
        ref={planeRef}
        className="absolute top-1/2 left-1/2 pointer-events-none will-change-transform"
        style={{
          transformOrigin: '0px 0px',
        }}
      >
        {artboards.map((artboard) => (
          <div key={artboard.id} className="pointer-events-auto">
            <ArtboardView
              artboard={artboard}
              isActiveCloneSource={cloneSource.active && cloneSource.canvasId === artboard.id}
              cloneSource={cloneSource}
              activeTool={activeTool}
              onUpdate={(updated) => onUpdateArtboard(artboard.id, updated)}
              onDelete={onDeleteArtboard}
              onExport={onExportArtboard}
              onHeaderPointerDown={handleHeaderPointerDown}
              registerLayerCanvas={registerLayerCanvas}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
