import { Artboard, Point2D, ViewportState } from '../types/canvas';

/**
 * Converts screen coordinates (clientX, clientY) to infinite world coordinates
 * taking into account viewport pan, scale, and rotation around the screen center.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: ViewportState,
  windowWidth: number,
  windowHeight: number
): Point2D {
  const cx = windowWidth / 2;
  const cy = windowHeight / 2;

  // Offset from screen center minus camera pan
  const dx = screenX - cx - viewport.panX;
  const dy = screenY - cy - viewport.panY;

  // Invert rotation (degrees to radians)
  const rad = (-viewport.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotX = dx * cos - dy * sin;
  const rotY = dx * sin + dy * cos;

  return {
    x: rotX / viewport.scale,
    y: rotY / viewport.scale,
  };
}

/**
 * Converts infinite world coordinates back to screen coordinates.
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: ViewportState,
  windowWidth: number,
  windowHeight: number
): Point2D {
  const cx = windowWidth / 2;
  const cy = windowHeight / 2;

  const rad = (viewport.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const scaledX = worldX * viewport.scale;
  const scaledY = worldY * viewport.scale;

  const rotX = scaledX * cos - scaledY * sin;
  const rotY = scaledX * sin + scaledY * cos;

  return {
    x: rotX + cx + viewport.panX,
    y: rotY + cy + viewport.panY,
  };
}

/**
 * Converts world coordinates to local artboard pixel coordinates (0..width, 0..height)
 */
export function worldToArtboardLocal(
  worldX: number,
  worldY: number,
  artboard: Artboard
): Point2D {
  // Center of artboard in world space
  const cx = artboard.x + artboard.width / 2;
  const cy = artboard.y + artboard.height / 2;

  const dx = worldX - cx;
  const dy = worldY - cy;

  // Invert artboard local rotation
  const rad = (-artboard.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotX = dx * cos - dy * sin;
  const rotY = dx * sin + dy * cos;

  return {
    x: rotX / (artboard.scale || 1) + artboard.width / 2,
    y: rotY / (artboard.scale || 1) + artboard.height / 2,
  };
}

/**
 * Converts artboard local pixel coordinates to world coordinates.
 */
export function artboardLocalToWorld(
  localX: number,
  localY: number,
  artboard: Artboard
): Point2D {
  const cx = artboard.x + artboard.width / 2;
  const cy = artboard.y + artboard.height / 2;

  const lx = (localX - artboard.width / 2) * (artboard.scale || 1);
  const ly = (localY - artboard.height / 2) * (artboard.scale || 1);

  const rad = (artboard.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: lx * cos - ly * sin + cx,
    y: lx * sin + ly * cos + cy,
  };
}

/**
 * Tests whether local coordinates are inside artboard bounds
 */
export function isInsideArtboard(localX: number, localY: number, artboard: Artboard, tolerance = 0): boolean {
  return (
    localX >= -tolerance &&
    localX <= artboard.width + tolerance &&
    localY >= -tolerance &&
    localY <= artboard.height + tolerance
  );
}

/**
 * Computes distance between two 2D points
 */
export function getDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Computes midpoint between two 2D points
 */
export function getMidpoint(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Computes angle in degrees between two 2D points
 */
export function getAngleDegrees(p1: Point2D, p2: Point2D): number {
  return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
}

/**
 * Normalizes an angle into -180..180 degrees
 */
export function normalizeAngle(deg: number): number {
  let angle = deg % 360;
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;
  return angle;
}

/**
 * Clamps value between min and max
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Formats zoom percentage cleanly (e.g. 100%, 250%, 0.5%, 1250%)
 */
export function formatZoom(scale: number): string {
  const pct = scale * 100;
  if (pct >= 100) return `${Math.round(pct)}%`;
  if (pct >= 10) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(2)}%`;
}
