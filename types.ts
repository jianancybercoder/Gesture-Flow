import * as THREE from 'three';

export type ShapeType = 'heart' | 'flower' | 'saturn' | 'scan' | 'fireworks';
export type VideoSizeType = 'small' | 'medium' | 'large';
export type Language = 'zh-TW' | 'zh-CN' | 'en' | 'ja' | 'ko';
export type PerformanceMode = 'high' | 'saver';

export interface ParticleConfig {
  count: number;
  size: number;
  noiseStrength: number;
  color: string;
}

export interface HoleInteraction {
  id: number;
  position: [number, number, number];
  timestamp: number;
}

export interface HandState {
  detected: boolean;
  pinchStrength: number; // 0 (open) to 1 (closed)
  spreadDistance: number; // For two hands
  handCenter: [number, number, number]; // normalized -1 to 1
  rotation: number; // Z-axis rotation (Roll) in radians
  velocity: number; // Movement speed of hand
}

export interface AppState {
  language: Language;
  performanceMode: PerformanceMode;
  
  currentShape: ShapeType;
  targetShape: ShapeType;
  config: ParticleConfig;
  handState: HandState;
  
  // Video Texture for Scanner Mode
  videoTexture: THREE.VideoTexture | null;

  // Settings
  isCameraEnabled: boolean;
  videoSize: VideoSizeType;
  isRotationControlEnabled: boolean;
  isScatterEnabled: boolean; // Toggle for wave/scatter
  isHoleEnabled: boolean;    // Toggle for flick/hole
  isPinchEnabled: boolean;   // Toggle for fist pinch/zoom

  // Morphing
  isMorphing: boolean;
  morphProgress: number;
  
  // Visual effects
  scatterIntensity: number; // 0 to 1
  holes: HoleInteraction[];

  // Actions
  setLanguage: (lang: Language) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  setVideoTexture: (texture: THREE.VideoTexture | null) => void;
  
  setShape: (shape: ShapeType) => void;
  setConfig: (config: Partial<ParticleConfig>) => void;
  setHandState: (state: Partial<HandState>) => void;
  toggleCamera: () => void;
  setVideoSize: (size: VideoSizeType) => void;
  toggleRotationControl: () => void;
  toggleScatter: () => void;
  toggleHole: () => void;
  togglePinch: () => void;
  
  startMorph: () => void;
  completeMorph: () => void;
  
  triggerScatter: (intensity: number) => void;
  triggerHole: (position: [number, number, number]) => void;
  updateEffects: (time: number) => void;
}