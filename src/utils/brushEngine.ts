import { BrushSettings, ToolType } from '../types/canvas';

// Shared offscreen scratch canvas for efficient masked stamp operations
let scratchCanvas: HTMLCanvasElement | null = null;
let scratchCtx: CanvasRenderingContext2D | null = null;

function getScratchCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  if (!scratchCanvas) {
    scratchCanvas = document.createElement('canvas');
    scratchCtx = scratchCanvas.getContext('2d', { willReadFrequently: true });
  }
  const size = Math.max(width, height, 64);
  if (scratchCanvas.width < size || scratchCanvas.height < size) {
    scratchCanvas.width = size;
    scratchCanvas.height = size;
  }
  return { canvas: scratchCanvas, ctx: scratchCtx! };
}

/**
 * Draws a single brush stamp onto target canvas context
 */
export function drawBrushStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tool: ToolType,
  brush: BrushSettings,
  pressure = 1
): void {
  const effectivePressure = brush.pressureSensitivity ? Math.max(0.1, pressure) : 1;
  const radius = Math.max(0.5, (brush.size / 2) * effectivePressure);
  const opacity = brush.opacity * brush.flow;

  ctx.save();

  if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  } else {
    ctx.globalCompositeOperation = 'source-over';
  }

  if (tool === 'airbrush') {
    // Soft gaussian-like falloff
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const col = hexToRgb(brush.color);
    grad.addColorStop(0, `rgba(${col}, ${opacity * 0.4})`);
    grad.addColorStop(0.5, `rgba(${col}, ${opacity * 0.15})`);
    grad.addColorStop(1, `rgba(${col}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  } else if (tool === 'pencil') {
    // Sketchy grain texture
    const col = hexToRgb(brush.color);
    ctx.fillStyle = `rgba(${col}, ${opacity * 0.7})`;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Random grain specks
    const grainCount = Math.floor(radius * 1.5);
    ctx.fillStyle = `rgba(${col}, ${opacity * 0.9})`;
    for (let i = 0; i < grainCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const gx = x + Math.cos(angle) * dist;
      const gy = y + Math.sin(angle) * dist;
      ctx.fillRect(gx, gy, 1, 1);
    }
  } else if (tool === 'marker') {
    // Marker feel: semi-transparent, flat chiseled tip
    const col = hexToRgb(brush.color);
    ctx.fillStyle = `rgba(${col}, ${opacity * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.6, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Standard Pen / Brush / Round with hardness control
    const col = tool === 'eraser' ? '0, 0, 0' : hexToRgb(brush.color);
    if (brush.hardness >= 0.95) {
      ctx.fillStyle = `rgba(${col}, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const grad = ctx.createRadialGradient(x, y, radius * brush.hardness, x, y, radius);
      grad.addColorStop(0, `rgba(${col}, ${opacity})`);
      grad.addColorStop(1, `rgba(${col}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Draws a line of stamps between two points for continuous smooth stroke
 */
export function drawBrushSegment(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  tool: ToolType,
  brush: BrushSettings,
  pressure = 1
): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Spacing: stamps placed every fraction of brush size
  const spacing = Math.max(1, (brush.size * (tool === 'airbrush' ? 0.1 : 0.25)) / 2);
  const steps = Math.max(1, Math.ceil(dist / spacing));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = fromX + dx * t;
    const y = fromY + dy * t;
    drawBrushStamp(ctx, x, y, tool, brush, pressure);
  }
}

// Cached radial feather mask to avoid recreating gradients on every touch event
let cachedMaskCanvas: HTMLCanvasElement | null = null;
let cachedMaskCtx: CanvasRenderingContext2D | null = null;
let cachedMaskDiameter = 0;
let cachedMaskHardness = -1;

function getFeatherMask(diameter: number, hardness: number): HTMLCanvasElement {
  const d = Math.max(2, Math.round(diameter));
  if (!cachedMaskCanvas) {
    cachedMaskCanvas = document.createElement('canvas');
    cachedMaskCtx = cachedMaskCanvas.getContext('2d');
  }
  if (cachedMaskDiameter !== d || cachedMaskHardness !== hardness) {
    cachedMaskCanvas.width = d;
    cachedMaskCanvas.height = d;
    cachedMaskDiameter = d;
    cachedMaskHardness = hardness;
    const ctx = cachedMaskCtx!;
    ctx.clearRect(0, 0, d, d);
    const radius = d / 2;
    const grad = ctx.createRadialGradient(
      radius,
      radius,
      radius * Math.max(0.01, hardness),
      radius,
      radius,
      radius
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  return cachedMaskCanvas;
}

/**
 * ULTRA-OPTIMIZED CLONE STAMP ENGINE FOR MOBILE / POTATO PHONES:
 * Samples pixels from source canvas at (sourceX, sourceY) and paints them onto
 * targetCtx at (targetX, targetY) with size, opacity, and radial feathering.
 */
export function drawCloneStampSegment(
  targetCtx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  fromTargetX: number,
  fromTargetY: number,
  toTargetX: number,
  toTargetY: number,
  fromSourceX: number,
  fromSourceY: number,
  toSourceX: number,
  toSourceY: number,
  brush: BrushSettings,
  pressure = 1
): void {
  const dx = toTargetX - fromTargetX;
  const dy = toTargetY - fromTargetY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Spacing: optimized step distance to avoid excessive blits on mobile
  const spacing = Math.max(3, (brush.size * 0.3) / 2);
  const steps = Math.max(1, Math.ceil(dist / spacing));

  const effectivePressure = brush.pressureSensitivity ? Math.max(0.1, pressure) : 1;
  const diameter = Math.max(2, Math.round(brush.size * effectivePressure));
  const radius = diameter / 2;

  targetCtx.save();
  targetCtx.globalAlpha = brush.opacity * brush.flow;

  // FAST PATH: Hard edge clone (hardness >= 0.8) uses direct GPU-accelerated canvas clip
  if (brush.hardness >= 0.8) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const tx = fromTargetX + dx * t;
      const ty = fromTargetY + dy * t;
      const sx = fromSourceX + (toSourceX - fromSourceX) * t;
      const sy = fromSourceY + (toSourceY - fromSourceY) * t;

      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.arc(tx, ty, radius, 0, Math.PI * 2);
      targetCtx.clip();
      targetCtx.drawImage(
        sourceCanvas,
        sx - radius,
        sy - radius,
        diameter,
        diameter,
        tx - radius,
        ty - radius,
        diameter,
        diameter
      );
      targetCtx.restore();
    }
    targetCtx.restore();
    return;
  }

  // FEATHERED PATH: Reuses cached pre-rendered radial mask image
  const mask = getFeatherMask(diameter, brush.hardness);
  const { canvas: scratch, ctx: sCtx } = getScratchCanvas(diameter, diameter);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const tx = fromTargetX + dx * t;
    const ty = fromTargetY + dy * t;
    const sx = fromSourceX + (toSourceX - fromSourceX) * t;
    const sy = fromSourceY + (toSourceY - fromSourceY) * t;

    // 1. Draw source patch
    sCtx.clearRect(0, 0, diameter, diameter);
    sCtx.save();
    sCtx.drawImage(
      sourceCanvas,
      sx - radius,
      sy - radius,
      diameter,
      diameter,
      0,
      0,
      diameter,
      diameter
    );

    // 2. Feather with pre-rendered mask
    sCtx.globalCompositeOperation = 'destination-in';
    sCtx.drawImage(mask, 0, 0);
    sCtx.restore();

    // 3. Blit to target
    targetCtx.drawImage(
      scratch,
      0,
      0,
      diameter,
      diameter,
      tx - radius,
      ty - radius,
      diameter,
      diameter
    );
  }

  targetCtx.restore();
}

/**
 * Smudge tool implementation:
 * Picks up colors along the stroke path and blends them forward
 */
export function drawSmudgeSegment(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  brush: BrushSettings
): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return;

  const radius = Math.max(2, brush.size / 2);
  const diameter = radius * 2;
  const steps = Math.max(1, Math.ceil(dist / 3));

  const { canvas: scratch, ctx: sCtx } = getScratchCanvas(diameter, diameter);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const sampleX = fromX + dx * t;
    const sampleY = fromY + dy * t;

    // Grab current patch under brush
    sCtx.clearRect(0, 0, diameter, diameter);
    sCtx.drawImage(
      ctx.canvas,
      sampleX - radius,
      sampleY - radius,
      diameter,
      diameter,
      0,
      0,
      diameter,
      diameter
    );

    // Blit forward slightly with low opacity
    ctx.save();
    ctx.globalAlpha = 0.25 * brush.opacity;
    ctx.drawImage(
      scratch,
      0,
      0,
      diameter,
      diameter,
      sampleX - radius + (dx / dist) * 2,
      sampleY - radius + (dy / dist) * 2,
      diameter,
      diameter
    );
    ctx.restore();
  }
}

/**
 * Flood fill (paint bucket) algorithm on ImageData
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  tolerance = 32
): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const x = Math.floor(startX);
  const y = Math.floor(startY);

  if (x < 0 || x >= width || y < 0 || y >= height) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const startPos = (y * width + x) * 4;
  const targetR = data[startPos];
  const targetG = data[startPos + 1];
  const targetB = data[startPos + 2];
  const targetA = data[startPos + 3];

  const fillRgb = hexToRgbArray(fillColorHex);
  const fillR = fillRgb[0];
  const fillG = fillRgb[1];
  const fillB = fillRgb[2];
  const fillA = 255;

  // Don't fill if color is identical
  if (
    Math.abs(targetR - fillR) <= 2 &&
    Math.abs(targetG - fillG) <= 2 &&
    Math.abs(targetB - fillB) <= 2 &&
    Math.abs(targetA - fillA) <= 2
  ) {
    return;
  }

  const matches = (idx: number) => {
    return (
      Math.abs(data[idx] - targetR) <= tolerance &&
      Math.abs(data[idx + 1] - targetG) <= tolerance &&
      Math.abs(data[idx + 2] - targetB) <= tolerance &&
      Math.abs(data[idx + 3] - targetA) <= tolerance
    );
  };

  const queue: number[] = [x, y];
  const visited = new Uint8Array(width * height);

  while (queue.length > 0) {
    const cy = queue.pop()!;
    const cx = queue.pop()!;

    const idx = (cy * width + cx) * 4;
    const pixelIdx = cy * width + cx;

    if (visited[pixelIdx]) continue;
    visited[pixelIdx] = 1;

    if (matches(idx)) {
      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = fillA;

      if (cx > 0 && !visited[pixelIdx - 1]) queue.push(cx - 1, cy);
      if (cx < width - 1 && !visited[pixelIdx + 1]) queue.push(cx + 1, cy);
      if (cy > 0 && !visited[pixelIdx - width]) queue.push(cx, cy - 1);
      if (cy < height - 1 && !visited[pixelIdx + width]) queue.push(cx, cy + 1);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Samples RGBA color at specified pixel and returns hex string
 */
export function sampleColor(ctx: CanvasRenderingContext2D, x: number, y: number): string {
  const px = Math.floor(x);
  const py = Math.floor(y);
  if (px < 0 || px >= ctx.canvas.width || py < 0 || py >= ctx.canvas.height) {
    return '#000000';
  }
  const pixel = ctx.getImageData(px, py, 1, 1).data;
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`;
}

export function hexToRgb(hex: string): string {
  const [r, g, b] = hexToRgbArray(hex);
  return `${r}, ${g}, ${b}`;
}

export function hexToRgbArray(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c || '000000', 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
