import { create } from 'zustand';
import { AppState, ShapeType } from './types';

export const useStore = create<AppState>((set, get) => ({
  language: 'zh-TW',
  performanceMode: 'high',

  currentShape: 'saturn',
  targetShape: 'saturn',
  config: {
    count: 12000,
    size: 0.12,
    noiseStrength: 0.2,
    color: '#FFD700', // Luxury Gold
  },
  handState: {
    detected: false,
    pinchStrength: 0,
    spreadDistance: 1,
    handCenter: [0, 0, 0],
    rotation: 0,
    velocity: 0,
  },
  
  videoTexture: null,

  isCameraEnabled: false,
  videoSize: 'medium',
  isRotationControlEnabled: false,
  isScatterEnabled: true,
  isHoleEnabled: true,
  isPinchEnabled: true,

  isMorphing: false,
  morphProgress: 0,
  
  scatterIntensity: 0,
  holes: [],

  setLanguage: (language) => set({ language }),
  setPerformanceMode: (mode) => set((state) => {
    // Auto-adjust particle count for performance
    const newCount = mode === 'saver' ? 4000 : 12000;
    return { 
        performanceMode: mode,
        config: { ...state.config, count: newCount }
    };
  }),
  setVideoTexture: (texture) => set({ videoTexture: texture }),

  setShape: (shape: ShapeType) => set((state) => {
    if (state.currentShape === shape) return {};
    return { targetShape: shape, isMorphing: true, morphProgress: 0 };
  }),
  setConfig: (newConfig) => set((state) => ({ config: { ...state.config, ...newConfig } })),
  setHandState: (newState) => set((state) => ({ handState: { ...state.handState, ...newState } })),
  toggleCamera: () => set((state) => ({ isCameraEnabled: !state.isCameraEnabled })),
  setVideoSize: (size) => set({ videoSize: size }),
  toggleRotationControl: () => set((state) => ({ isRotationControlEnabled: !state.isRotationControlEnabled })),
  toggleScatter: () => set((state) => ({ isScatterEnabled: !state.isScatterEnabled })),
  toggleHole: () => set((state) => ({ isHoleEnabled: !state.isHoleEnabled })),
  togglePinch: () => set((state) => ({ isPinchEnabled: !state.isPinchEnabled })),

  startMorph: () => set({ isMorphing: true }),
  completeMorph: () => set((state) => ({ 
    currentShape: state.targetShape, 
    isMorphing: false, 
    morphProgress: 0 
  })),

  triggerScatter: (intensity) => set((state) => {
    if (!state.isScatterEnabled) return {};
    // Add intensity, cap higher for chaotic effect
    return { scatterIntensity: Math.min(2.0, state.scatterIntensity + intensity) };
  }),

  triggerHole: (position) => set((state) => {
    if (!state.isHoleEnabled) return {};
    return { 
      holes: [...state.holes, { id: Math.random(), position, timestamp: performance.now() / 1000 }] 
    };
  }),

  updateEffects: (currentTime) => {
    const state = get();
    let newScatter = state.scatterIntensity;
    if (newScatter > 0) {
      // Slower decay for "floating" feel (0.95 -> 0.92)
      newScatter *= 0.92; 
      if (newScatter < 0.01) newScatter = 0;
    }

    // Holes live longer now (2.5 seconds) for dramatic effect
    const newHoles = state.holes.filter(h => currentTime - h.timestamp < 2.5);

    // Only update if changed
    if (newScatter !== state.scatterIntensity || newHoles.length !== state.holes.length) {
      set({ scatterIntensity: newScatter, holes: newHoles });
    }
  },
}));
