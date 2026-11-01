export type ToolType =
  | 'pen'
  | 'brush'
  | 'pencil'
  | 'airbrush'
  | 'marker'
  | 'clone'
  | 'eraser'
  | 'smudge'
  | 'bucket'
  | 'picker'
  | 'line'
  | 'rect'
  | 'circle'
  | 'pan';

export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'destination-out';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0 to 1
  blendMode: BlendMode;
  dataUrl?: string; // Stored image data URL for serialization & undo
}

export interface Artboard {
  id: string;
  name: string;
  x: number; // World space position X
  y: number; // World space position Y
  width: number; // Pixel width
  height: number; // Pixel height
  rotation: number; // Canvas local rotation in degrees
  scale: number; // Canvas local scale
  backgroundColor: string; // 'transparent' or color hex
  layers: Layer[];
  activeLayerId: string;
  isLocked?: boolean;
}

export interface ViewportState {
  panX: number;
  panY: number;
  scale: number; // Zoom level (e.g. 0.01 to 1000)
  rotation: number; // Viewport rotation in degrees
}

export interface CloneSource {
  canvasId: string;
  x: number; // Local canvas coordinates (pixels)
  y: number;
  active: boolean;
  isSamplingMode: boolean; // True when user is picking a new source
  aligned: boolean; // When true, offset is preserved across strokes
  sampleAllLayers: boolean;
}

export interface BrushSettings {
  size: number; // 1 - 250 px
  opacity: number; // 0.01 - 1.0
  color: string; // HEX or RGBA
  hardness: number; // 0.0 - 1.0 (0 = fuzzy airbrush, 1 = razor sharp)
  flow: number; // 0.01 - 1.0
  pressureSensitivity: boolean;
  smoothness: number; // 0 to 1
}

export interface EnvironmentData {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  viewport: ViewportState;
  artboards: Artboard[];
  brushSettings?: BrushSettings;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  time: number;
}
