import React from 'react';
import { CopyCheck, Hand, HelpCircle, Move, RotateCw, Touchpad, X, ZoomIn } from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const gestures = [
    {
      icon: <ZoomIn className="w-5 h-5 text-indigo-400" />,
      title: '2-Finger Pinch Zoom',
      desc: 'Pinch together or apart with two fingers for infinite zoom depth (0.005x to 1000x). On mouse: scroll wheel or pinch trackpad.',
    },
    {
      icon: <RotateCw className="w-5 h-5 text-indigo-400" />,
      title: '2-Finger Pinch Rotate',
      desc: 'Twist two fingers to rotate the workspace canvas to your natural drawing angle. Click 0° in radar to snap back.',
    },
    {
      icon: <Move className="w-5 h-5 text-indigo-400" />,
      title: '2-Finger Pan / Hand Tool',
      desc: 'Drag with two fingers (or select Hand tool / hold Spacebar) to glide anywhere across the infinite plane.',
    },
    {
      icon: <CopyCheck className="w-5 h-5 text-emerald-400" />,
      title: 'Cross-Canvas Clone Tool',
      desc: 'Tap "Set Source 🎯" or Alt+Click on Canvas A. Then paint onto Canvas B! Watch the live crosshair track sampled pixels.',
    },
    {
      icon: <Touchpad className="w-5 h-5 text-indigo-400" />,
      title: '2-Finger & 3-Finger Taps',
      desc: 'Tap screen with 2 fingers to Undo. Tap screen with 3 fingers to Redo (standard Procreate gesture).',
    },
    {
      icon: <Hand className="w-5 h-5 text-indigo-400" />,
      title: 'Canvas Repositioning',
      desc: 'Touch and drag any canvas header to move it anywhere in the infinite workspace or place side-by-side.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Multitouch Gestures & Clone Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gestures grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {gestures.map((g) => (
            <div
              key={g.title}
              className="p-3 bg-neutral-950/60 border border-white/5 rounded-xl flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2">
                {g.icon}
                <span className="font-semibold text-white">{g.title}</span>
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>

        {/* Tip Box */}
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-200 flex items-center justify-between">
          <span>
            💡 <strong>Pro Tip:</strong> Use the <strong>Side-by-Side</strong> button in the top bar to instantly arrange all your open canvases into a neat horizontal art studio strip!
          </span>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20"
          >
            Got it, Let's Paint!
          </button>
        </div>
      </div>
    </div>
  );
};
