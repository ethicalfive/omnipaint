/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Artboard,
  BrushSettings,
  CloneSource,
  EnvironmentData,
  ToolType,
  ViewportState,
} from './types/canvas';
import {
  arrangeGrid,
  arrangeSideBySide,
  createNewArtboard,
  getDefaultEnvironment,
} from './utils/presets';
import { clamp } from './utils/math';
import { InfiniteWorkspace } from './components/InfiniteWorkspace';
import { CompactUI } from './components/CompactUI';
import { EnvironmentsModal } from './components/EnvironmentsModal';
import { GestureGuideModal } from './components/GestureGuideModal';

interface UndoRecord {
  artboardId: string;
  layerId: string;
  dataUrl: string;
}

export default function App() {
  const initialEnv = useRef(getDefaultEnvironment()).current;

  const [artboards, setArtboards] = useState<Artboard[]>(initialEnv.artboards);
  const [selectedArtboardId, setSelectedArtboardId] = useState<string | null>(
    initialEnv.artboards[0]?.id || null
  );
  const [viewport, setViewport] = useState<ViewportState>(initialEnv.viewport);

  // Rotation lock is enabled by default so 2-finger pinch-zoom and pan never accidentally spins!
  const [isRotationLocked, setIsRotationLocked] = useState(true);

  // Active Tool & Settings
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 20,
    opacity: 1,
    color: '#38bdf8',
    hardness: 0.85,
    flow: 1,
    pressureSensitivity: true,
    smoothness: 0.5,
  });

  // Cross-canvas Clone Source state (points to Canvas 1 demo art by default)
  const [cloneSource, setCloneSource] = useState<CloneSource>({
    canvasId: initialEnv.artboards[0]?.id || '',
    x: 400,
    y: 350,
    active: true,
    isSamplingMode: false,
    aligned: true,
    sampleAllLayers: true,
  });

  // Undo / Redo history
  const undoStackRef = useRef<UndoRecord[]>([]);
  const redoStackRef = useRef<UndoRecord[]>([]);
  const [historyCount, setHistoryCount] = useState({ undo: 0, redo: 0 });

  // Modals state
  const [isEnvironmentsModalOpen, setIsEnvironmentsModalOpen] = useState(false);
  const [isGestureGuideOpen, setIsGestureGuideOpen] = useState(false);

  // Record undo snapshot before changes
  const handleSaveUndoState = useCallback(
    (artboardId: string, layerId: string) => {
      const artboard = artboards.find((a) => a.id === artboardId);
      if (!artboard) return;
      const layer = artboard.layers.find((l) => l.id === layerId);
      if (!layer) return;

      const canvasEl = document.querySelector(
        `#artboard-${artboardId} canvas`
      ) as HTMLCanvasElement | null;
      const dataUrl = canvasEl ? canvasEl.toDataURL() : layer.dataUrl || '';

      undoStackRef.current.push({ artboardId, layerId, dataUrl });
      if (undoStackRef.current.length > 25) undoStackRef.current.shift();
      redoStackRef.current = [];
      setHistoryCount({ undo: undoStackRef.current.length, redo: 0 });
    },
    [artboards]
  );

  // Perform Undo
  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const record = undoStackRef.current.pop()!;

    const targetCanvas = document.querySelector(
      `#artboard-${record.artboardId} canvas`
    ) as HTMLCanvasElement | null;

    if (targetCanvas) {
      const currentData = targetCanvas.toDataURL();
      redoStackRef.current.push({
        artboardId: record.artboardId,
        layerId: record.layerId,
        dataUrl: currentData,
      });

      const ctx = targetCanvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = record.dataUrl;
      }
    }

    setHistoryCount({
      undo: undoStackRef.current.length,
      redo: redoStackRef.current.length,
    });
  }, []);

  // Perform Redo
  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const record = redoStackRef.current.pop()!;

    const targetCanvas = document.querySelector(
      `#artboard-${record.artboardId} canvas`
    ) as HTMLCanvasElement | null;

    if (targetCanvas) {
      const currentData = targetCanvas.toDataURL();
      undoStackRef.current.push({
        artboardId: record.artboardId,
        layerId: record.layerId,
        dataUrl: currentData,
      });

      const ctx = targetCanvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = record.dataUrl;
      }
    }

    setHistoryCount({
      undo: undoStackRef.current.length,
      redo: redoStackRef.current.length,
    });
  }, []);

  // Update artboard by ID
  const handleUpdateArtboard = useCallback((id: string, updated: Partial<Artboard>) => {
    setArtboards((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
    );
  }, []);

  // Delete artboard
  const handleDeleteArtboard = useCallback((id: string) => {
    setArtboards((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Export single canvas as PNG image
  const handleExportArtboard = useCallback((artboard: Artboard) => {
    const compCanvas = document.createElement('canvas');
    compCanvas.width = artboard.width;
    compCanvas.height = artboard.height;
    const ctx = compCanvas.getContext('2d');
    if (!ctx) return;

    if (artboard.backgroundColor && artboard.backgroundColor !== 'transparent') {
      ctx.fillStyle = artboard.backgroundColor;
      ctx.fillRect(0, 0, artboard.width, artboard.height);
    }

    const canvases = document.querySelectorAll(
      `#artboard-${artboard.id} canvas`
    ) as NodeListOf<HTMLCanvasElement>;

    canvases.forEach((c) => {
      ctx.drawImage(c, 0, 0);
    });

    const url = compCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artboard.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    a.click();
  }, []);

  // Align All Side-by-Side horizontally with smooth spacing
  const handleAlignSideBySide = () => {
    setArtboards((prev) => arrangeSideBySide(prev, 60));
    setViewport((prev) => ({
      ...prev,
      panX: 0,
      panY: 0,
      rotation: 0,
    }));
  };

  // Quick Add Canvas Sheet (placed side-by-side to the right)
  const handleAddNewSheet = () => {
    const rightmost =
      artboards.length > 0
        ? Math.max(...artboards.map((a) => a.x + a.width))
        : 0;
    const newSheet = createNewArtboard(
      `Sheet ${artboards.length + 1}`,
      800,
      800,
      rightmost + 60,
      -400,
      '#18191e'
    );
    setArtboards((prev) => [...prev, newSheet]);
    setSelectedArtboardId(newSheet.id);
  };

  // Zoom In / Zoom Out / Reset
  const handleZoomIn = () => {
    setViewport((prev) => ({
      ...prev,
      scale: clamp(prev.scale * 1.25, 0.01, 500),
    }));
  };

  const handleZoomOut = () => {
    setViewport((prev) => ({
      ...prev,
      scale: clamp(prev.scale * 0.8, 0.01, 500),
    }));
  };

  const handleResetZoom = () => {
    setViewport((prev) => ({ ...prev, scale: 1 }));
  };

  const handleResetRotation = () => {
    setViewport((prev) => ({ ...prev, rotation: 0 }));
  };

  // Load an entire environment
  const handleLoadEnvironment = (env: EnvironmentData) => {
    if (env.artboards && env.artboards.length > 0) {
      setArtboards(env.artboards);
      setSelectedArtboardId(env.artboards[0].id);
    }
    if (env.viewport) {
      setViewport(env.viewport);
    }
    if (env.brushSettings) {
      setBrushSettings(env.brushSettings);
    }
    undoStackRef.current = [];
    redoStackRef.current = [];
    setHistoryCount({ undo: 0, redo: 0 });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'p') setActiveTool('pen');
      if (key === 'b') setActiveTool('brush');
      if (key === 'n') setActiveTool('pencil');
      if (key === 'a') setActiveTool('airbrush');
      if (key === 'm') setActiveTool('marker');
      if (key === 's') setActiveTool('clone');
      if (key === 'e') setActiveTool('eraser');
      if (key === 'u') setActiveTool('smudge');
      if (key === 'g') setActiveTool('bucket');
      if (key === 'i') setActiveTool('picker');
      if (key === 'h' || key === ' ') setActiveTool('pan');

      if (e.key === '[') {
        setBrushSettings((prev) => ({ ...prev, size: Math.max(1, prev.size - 4) }));
      }
      if (e.key === ']') {
        setBrushSettings((prev) => ({ ...prev, size: Math.min(200, prev.size + 4) }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans select-none">
      {/* 1. Infinite Multitouch Plane (Shared Canvas Space with 60fps Direct Hardware Transforms) */}
      <InfiniteWorkspace
        artboards={artboards}
        viewport={viewport}
        activeTool={activeTool}
        brushSettings={brushSettings}
        cloneSource={cloneSource}
        isRotationLocked={isRotationLocked}
        onSelectArtboard={setSelectedArtboardId}
        onUpdateArtboard={handleUpdateArtboard}
        onDeleteArtboard={handleDeleteArtboard}
        onExportArtboard={handleExportArtboard}
        onUpdateViewportSync={setViewport}
        onUpdateCloneSource={(partial) => setCloneSource((prev) => ({ ...prev, ...partial }))}
        onUpdateBrushSettings={(partial) => setBrushSettings((prev) => ({ ...prev, ...partial }))}
        onSaveUndoState={handleSaveUndoState}
        onPerformUndo={handleUndo}
        onPerformRedo={handleRedo}
      />

      {/* 2. Compact Minimalist UI (Floating slim top pill, slim left tools, quiet HUD) */}
      <CompactUI
        artboards={artboards}
        selectedArtboardId={selectedArtboardId}
        viewport={viewport}
        activeTool={activeTool}
        brushSettings={brushSettings}
        cloneSource={cloneSource}
        isRotationLocked={isRotationLocked}
        canUndo={historyCount.undo > 0}
        canRedo={historyCount.redo > 0}
        onSelectTool={setActiveTool}
        onUpdateBrushSettings={(partial) => setBrushSettings((prev) => ({ ...prev, ...partial }))}
        onUpdateCloneSource={(partial) => setCloneSource((prev) => ({ ...prev, ...partial }))}
        onToggleRotationLock={() => setIsRotationLocked(!isRotationLocked)}
        onResetRotation={handleResetRotation}
        onResetZoom={handleResetZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onAlignSideBySide={handleAlignSideBySide}
        onAddNewSheet={handleAddNewSheet}
        onOpenEnvironments={() => setIsEnvironmentsModalOpen(true)}
        onOpenHelp={() => setIsGestureGuideOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onUpdateArtboard={handleUpdateArtboard}
      />

      {/* 3. Environments & Gesture Guide Modals */}
      <EnvironmentsModal
        isOpen={isEnvironmentsModalOpen}
        onClose={() => setIsEnvironmentsModalOpen(false)}
        currentArtboards={artboards}
        currentViewport={viewport}
        onLoadEnvironment={handleLoadEnvironment}
      />

      <GestureGuideModal
        isOpen={isGestureGuideOpen}
        onClose={() => setIsGestureGuideOpen(false)}
      />
    </div>
  );
}
