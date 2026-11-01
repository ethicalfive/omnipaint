import { Artboard, EnvironmentData, ViewportState } from '../types/canvas';

// Helper to generate a unique ID
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Creates a blank artboard
 */
export function createNewArtboard(
  name = 'Canvas',
  width = 800,
  height = 800,
  x = 0,
  y = 0,
  backgroundColor = '#18191e'
): Artboard {
  const layer1Id = generateId('layer');
  return {
    id: generateId('artboard'),
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    scale: 1,
    backgroundColor,
    layers: [
      {
        id: layer1Id,
        name: 'Layer 1',
        visible: true,
        opacity: 1,
        blendMode: 'source-over',
      },
    ],
    activeLayerId: layer1Id,
    isLocked: false,
  };
}

/**
 * Draws starter concept artwork on a canvas to provide instant cloning material
 */
export function drawStarterStudyArt(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // Background gradient (twilight celestial mountain horizon)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#0f172a');
  skyGrad.addColorStop(0.35, '#312e81');
  skyGrad.addColorStop(0.65, '#c026d3');
  skyGrad.addColorStop(0.85, '#f97316');
  skyGrad.addColorStop(1, '#fde047');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Distant glowing moon / sun
  ctx.save();
  const sunGrad = ctx.createRadialGradient(w * 0.72, h * 0.32, 10, w * 0.72, h * 0.32, 120);
  sunGrad.addColorStop(0, '#ffffff');
  sunGrad.addColorStop(0.2, '#fef08a');
  sunGrad.addColorStop(0.6, 'rgba(251, 146, 60, 0.4)');
  sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.32, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Mountain layer 1 (distant purple)
  ctx.fillStyle = '#4c1d95';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.75);
  ctx.lineTo(w * 0.25, h * 0.52);
  ctx.lineTo(w * 0.55, h * 0.68);
  ctx.lineTo(w * 0.85, h * 0.48);
  ctx.lineTo(w, h * 0.7);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Mountain layer 2 (foreground dark violet)
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.82);
  ctx.lineTo(w * 0.4, h * 0.62);
  ctx.lineTo(w * 0.7, h * 0.8);
  ctx.lineTo(w, h * 0.72);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Pine tree silhouettes
  ctx.fillStyle = '#09090b';
  for (let i = 0; i < 9; i++) {
    const tx = w * 0.08 + i * (w * 0.1);
    const ty = h * 0.88 + Math.sin(i) * 20;
    const th = 60 + (i % 3) * 25;
    ctx.beginPath();
    ctx.moveTo(tx, ty - th);
    ctx.lineTo(tx + 18, ty);
    ctx.lineTo(tx - 18, ty);
    ctx.closePath();
    ctx.fill();
  }

  // Floating Color Swatch circles on top left (great for clone stamp sampling!)
  const swatches = ['#38bdf8', '#a855f7', '#ec4899', '#f97316', '#22c55e', '#eab308'];
  swatches.forEach((color, idx) => {
    const sx = 45 + idx * 46;
    const sy = 45;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });

  // Reference label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('TARGET TO CLONE FROM: Sun, Swatches, Mountains', 40, 85);

  return canvas.toDataURL();
}

/**
 * Builds the initial default environment: 2 canvases side-by-side
 */
export function getDefaultEnvironment(): EnvironmentData {
  const canvas1 = createNewArtboard('Source Study Canvas', 800, 800, -850, -400, '#0f172a');
  const canvas2 = createNewArtboard('Paint & Clone Canvas', 800, 800, 50, -400, '#18191e');

  // Generate demo artwork for Canvas 1
  const offscreen = document.createElement('canvas');
  offscreen.width = 800;
  offscreen.height = 800;
  const dataUrl = drawStarterStudyArt(offscreen);
  canvas1.layers[0].dataUrl = dataUrl;

  const viewport: ViewportState = {
    panX: 0,
    panY: 0,
    scale: 0.85,
    rotation: 0,
  };

  return {
    id: 'default_env',
    name: 'Dual Canvas Side-by-Side Study',
    description: 'Two canvases side-by-side with reference artwork ready for cross-canvas clone stamping',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    viewport,
    artboards: [canvas1, canvas2],
  };
}

/**
 * Arranges artboards neatly in a horizontal row
 */
export function arrangeSideBySide(artboards: Artboard[], gap = 80): Artboard[] {
  if (artboards.length === 0) return artboards;
  const totalWidth = artboards.reduce((sum, a) => sum + a.width, 0) + gap * (artboards.length - 1);
  let currentX = -totalWidth / 2;

  return artboards.map((artboard) => {
    const updated = {
      ...artboard,
      x: currentX,
      y: -artboard.height / 2,
      rotation: 0,
    };
    currentX += artboard.width + gap;
    return updated;
  });
}

/**
 * Arranges artboards in a grid
 */
export function arrangeGrid(artboards: Artboard[], cols = 2, gap = 80): Artboard[] {
  if (artboards.length === 0) return artboards;

  const numCols = Math.min(cols, artboards.length);
  const rows = Math.ceil(artboards.length / numCols);

  const maxW = Math.max(...artboards.map((a) => a.width));
  const maxH = Math.max(...artboards.map((a) => a.height));

  const totalGridW = numCols * maxW + (numCols - 1) * gap;
  const totalGridH = rows * maxH + (rows - 1) * gap;

  const startX = -totalGridW / 2;
  const startY = -totalGridH / 2;

  return artboards.map((artboard, idx) => {
    const col = idx % numCols;
    const row = Math.floor(idx / numCols);
    return {
      ...artboard,
      x: startX + col * (maxW + gap),
      y: startY + row * (maxH + gap),
      rotation: 0,
    };
  });
}
