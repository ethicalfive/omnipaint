import React, { useState } from 'react';
import { Artboard, EnvironmentData, ViewportState } from '../types/canvas';
import { getDefaultEnvironment, createNewArtboard, drawStarterStudyArt } from '../utils/presets';
import {
  Download,
  FolderOpen,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface EnvironmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArtboards: Artboard[];
  currentViewport: ViewportState;
  onLoadEnvironment: (env: EnvironmentData) => void;
}

const STORAGE_KEY = 'omnicanvas_saved_environments';

export const EnvironmentsModal: React.FC<EnvironmentsModalProps> = ({
  isOpen,
  onClose,
  currentArtboards,
  currentViewport,
  onLoadEnvironment,
}) => {
  const [envTitle, setEnvTitle] = useState('My Studio Environment');
  const [savedEnvs, setSavedEnvs] = useState<EnvironmentData[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  if (!isOpen) return null;

  // Save current environment to localStorage
  const handleSaveCurrent = () => {
    const newEnv: EnvironmentData = {
      id: `env_${Date.now()}`,
      name: envTitle.trim() || 'Untitled Studio',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      viewport: currentViewport,
      artboards: currentArtboards,
    };

    const next = [newEnv, ...savedEnvs];
    setSavedEnvs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // Delete saved environment
  const handleDeleteEnv = (id: string) => {
    const next = savedEnvs.filter((e) => e.id !== id);
    setSavedEnvs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // Export current environment as JSON file
  const handleExportJSON = () => {
    const envData: EnvironmentData = {
      id: `env_${Date.now()}`,
      name: envTitle.trim() || 'Studio Environment',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      viewport: currentViewport,
      artboards: currentArtboards,
    };

    const blob = new Blob([JSON.stringify(envData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${envTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_omnicanvas.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as EnvironmentData;
        if (parsed && parsed.artboards && Array.isArray(parsed.artboards)) {
          onLoadEnvironment(parsed);
          onClose();
        } else {
          alert('Invalid environment JSON format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Preset 1: Dual Canvas Side-by-Side Clone Study
  const handleLoadPresetDual = () => {
    onLoadEnvironment(getDefaultEnvironment());
    onClose();
  };

  // Preset 2: Comic Strip Storyboard (3 side-by-side canvases)
  const handleLoadPresetComic = () => {
    const p1 = createNewArtboard('Panel 1: The Call', 700, 900, -1150, -450, '#111318');
    const p2 = createNewArtboard('Panel 2: The Journey', 700, 900, -350, -450, '#111318');
    const p3 = createNewArtboard('Panel 3: The Discovery', 700, 900, 450, -450, '#111318');

    onLoadEnvironment({
      id: 'preset_comic',
      name: 'Comic Strip 3-Panel Storyboard',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      viewport: { panX: 0, panY: 0, scale: 0.75, rotation: 0 },
      artboards: [p1, p2, p3],
    });
    onClose();
  };

  // Preset 3: Infinite Zoom Macro & Micro Exploration
  const handleLoadPresetInfiniteZoom = () => {
    const macro = createNewArtboard('Macro Galaxy Canvas', 1600, 1600, -800, -800, '#090a0f');
    const system = createNewArtboard('Solar Detail Canvas', 600, 600, 200, 200, '#111827');
    const micro = createNewArtboard('Micro Specimen Canvas', 300, 300, 350, 350, '#1e1b4b');

    onLoadEnvironment({
      id: 'preset_infinite_zoom',
      name: 'Infinite Zoom Macro-to-Micro Board',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      viewport: { panX: 0, panY: 0, scale: 0.5, rotation: 0 },
      artboards: [macro, system, micro],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-neutral-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Environments & Studio Management</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section: Save Current State */}
        <div className="flex flex-col gap-2 p-3 bg-neutral-950/70 border border-white/5 rounded-xl">
          <span className="text-xs font-semibold text-white">Save Current Environment</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={envTitle}
              onChange={(e) => setEnvTitle(e.target.value)}
              className="flex-1 bg-neutral-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
              placeholder="Environment title..."
            />
            <button
              onClick={handleSaveCurrent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
              title="Download .json file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Section: Import File */}
        <div className="flex items-center justify-between p-3 bg-neutral-950/40 border border-white/5 rounded-xl text-xs">
          <div>
            <div className="font-semibold text-white">Import Environment (.json)</div>
            <div className="text-[11px] text-neutral-400">Load previously exported studio backup</div>
          </div>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Select File</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>

        {/* Section: Starter Preset Environments */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Starter Studio Presets</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Preset 1 */}
            <button
              onClick={handleLoadPresetDual}
              className="p-3 text-left rounded-xl border border-white/10 bg-neutral-800/40 hover:bg-neutral-800 hover:border-indigo-500 transition-all flex flex-col gap-1"
            >
              <span className="font-semibold text-white">Dual Clone Study</span>
              <span className="text-[11px] text-neutral-400">
                2 side-by-side canvases with master artwork ready to clone from.
              </span>
            </button>

            {/* Preset 2 */}
            <button
              onClick={handleLoadPresetComic}
              className="p-3 text-left rounded-xl border border-white/10 bg-neutral-800/40 hover:bg-neutral-800 hover:border-indigo-500 transition-all flex flex-col gap-1"
            >
              <span className="font-semibold text-white">Comic Storyboard</span>
              <span className="text-[11px] text-neutral-400">
                3 canvases lined up side-by-side for sequential art & panels.
              </span>
            </button>

            {/* Preset 3 */}
            <button
              onClick={handleLoadPresetInfiniteZoom}
              className="p-3 text-left rounded-xl border border-white/10 bg-neutral-800/40 hover:bg-neutral-800 hover:border-indigo-500 transition-all flex flex-col gap-1"
            >
              <span className="font-semibold text-white">Infinite Zoom</span>
              <span className="text-[11px] text-neutral-400">
                Macro, medium, and micro canvases to test extreme scale ranges.
              </span>
            </button>
          </div>
        </div>

        {/* Section: Saved Local Environments */}
        <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
          <span className="text-xs font-semibold text-neutral-300">
            Saved In Browser ({savedEnvs.length})
          </span>

          {savedEnvs.length === 0 ? (
            <div className="text-xs text-neutral-500 italic py-2">
              No saved environments yet. Save your current studio setup above!
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {savedEnvs.map((env) => (
                <div
                  key={env.id}
                  className="flex items-center justify-between p-2.5 bg-neutral-950/60 border border-white/5 rounded-xl text-xs hover:border-white/20 transition-all"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-white truncate">{env.name}</span>
                    <span className="text-[11px] text-neutral-500">
                      {env.artboards?.length || 0} canvases · {new Date(env.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        onLoadEnvironment(env);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg font-medium transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteEnv(env.id)}
                      className="p-1 hover:text-red-400 text-neutral-500 rounded transition-colors"
                      title="Delete saved environment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
