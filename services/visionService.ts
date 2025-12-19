import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { useStore } from '../store';

let handLandmarker: HandLandmarker | undefined;
let runningMode: 'IMAGE' | 'VIDEO' = 'VIDEO';

// Smoothing variables
let lastHandCenter = { x: 0, y: 0, z: 0 };
let lastPinch = 0;
let lastSpread = 1;
let lastRotation = 0;
let smoothedVelocity = 0;

// Gesture tracking
let lastTipPos = { x: 0, y: 0 };
let consecutiveFastFrames = 0; // To prevent noise triggering flick

// Throttling for performance
let lastPredictionTime = 0;

export const initializeVision = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: runningMode,
    numHands: 2,
    // Optimized for better detection rate while maintaining stability
    minHandDetectionConfidence: 0.6, 
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.75
  });
};

// Lerp helper
const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

export const detectHands = (video: HTMLVideoElement) => {
  if (!handLandmarker) return;

  const now = performance.now();
  const state = useStore.getState();

  // Performance Throttling
  // High: Run as fast as possible (every frame)
  // Saver: Limit to ~15-20 FPS (approx 50ms interval) to save CPU
  const throttleInterval = state.performanceMode === 'saver' ? 50 : 0;
  
  if (now - lastPredictionTime < throttleInterval) {
      return;
  }
  lastPredictionTime = now;

  const result = handLandmarker.detectForVideo(video, now);
  const { setHandState, triggerScatter, triggerHole } = state;

  if (result.landmarks && result.landmarks.length > 0) {
    let pinchStrength = 0;
    let spreadDistance = 1;
    let rawX = 0;
    let rawY = 0;
    let rotation = 0;
    
    // Process first hand
    const landmarks1 = result.landmarks[0];
    const thumbTip1 = landmarks1[4];
    const indexTip1 = landmarks1[8];
    const indexMCP1 = landmarks1[5]; 
    const pinkyMCP1 = landmarks1[17];
    const wrist1 = landmarks1[0];

    // --- 1. Pinch Detection ---
    const pinchDist = Math.sqrt(
      Math.pow(thumbTip1.x - indexTip1.x, 2) + 
      Math.pow(thumbTip1.y - indexTip1.y, 2)
    );
    pinchStrength = Math.max(0, Math.min(1, 1 - (pinchDist - 0.02) / 0.1));

    // --- 2. Center Calculation ---
    rawX = (wrist1.x + indexMCP1.x + pinkyMCP1.x) / 3;
    rawY = (wrist1.y + indexMCP1.y + pinkyMCP1.y) / 3;

    // --- 3. Rotation (Roll) ---
    const deltaX = pinkyMCP1.x - indexMCP1.x;
    const deltaY = pinkyMCP1.y - indexMCP1.y;
    rotation = Math.atan2(deltaY, deltaX);

    // --- 4. Spread Detection ---
    if (result.landmarks.length > 1) {
      const landmarks2 = result.landmarks[1];
      const wrist2 = landmarks2[0];
      const indexMCP2 = landmarks2[5];
      const pinkyMCP2 = landmarks2[17];
      
      const palm2X = (wrist2.x + indexMCP2.x + pinkyMCP2.x) / 3;
      const palm2Y = (wrist2.y + indexMCP2.y + pinkyMCP2.y) / 3;

      rawX = (rawX + palm2X) / 2;
      rawY = (rawY + palm2Y) / 2;

      const handsDist = Math.sqrt(
          Math.pow(wrist1.x - wrist2.x, 2) + 
          Math.pow(wrist1.y - wrist2.y, 2)
      );
      spreadDistance = Math.max(0.5, Math.min(2.5, handsDist * 2.5));
    } else {
        const tips = [8, 12, 16, 20];
        let totalTipDist = 0;
        tips.forEach(idx => {
            const tip = landmarks1[idx];
            totalTipDist += Math.sqrt(Math.pow(tip.x - wrist1.x, 2) + Math.pow(tip.y - wrist1.y, 2));
        });
        const avgTipDist = totalTipDist / 4;
        spreadDistance = 0.5 + (avgTipDist * 2.0); 
    }

    // --- SMOOTHING & OUTLIER REMOVAL ---
    const distFromLast = Math.sqrt(
      Math.pow(rawX - lastHandCenter.x, 2) + Math.pow(rawY - lastHandCenter.y, 2)
    );

    let lerpFactor = 0.2; 
    // Ignore massive jumps (teleportation) unless it persists
    if (lastHandCenter.x !== 0 && distFromLast > 0.3) {
       lerpFactor = 0.01; 
    }

    const smoothedX = lerp(lastHandCenter.x, rawX, lerpFactor);
    const smoothedY = lerp(lastHandCenter.y, rawY, lerpFactor);
    
    lastHandCenter = { x: smoothedX, y: smoothedY, z: 0 };
    lastPinch = lerp(lastPinch, pinchStrength, 0.2);
    lastSpread = lerp(lastSpread, spreadDistance, 0.2);
    lastRotation = lerp(lastRotation, -rotation, 0.2);

    // --- GESTURE RECOGNITION ---
    const velocity = distFromLast; 
    
    // Optimized Wave Detection
    // Increased lerp speed (0.15 -> 0.3) to capture fast waves better
    smoothedVelocity = lerp(smoothedVelocity, velocity, 0.3);

    // 1. Scatter (Wave)
    if (state.isScatterEnabled) {
        // Lowered threshold (0.09 -> 0.05) to make it easier to trigger
        if (smoothedVelocity > 0.05) {
            triggerScatter(smoothedVelocity * 4.0);
        }
    }

    // 2. Flick/Hole
    if (state.isHoleEnabled) {
        const relTipX = indexTip1.x - wrist1.x;
        const relTipY = indexTip1.y - wrist1.y;
        const tipSpeed = Math.sqrt(Math.pow(relTipX - lastTipPos.x, 2) + Math.pow(relTipY - lastTipPos.y, 2));
        lastTipPos = { x: relTipX, y: relTipY };

        // Needs to be fast
        if (tipSpeed > 0.12) {
             consecutiveFastFrames++;
             // Need 2 consecutive fast frames to confirm intent (flick) vs noise
             if (consecutiveFastFrames >= 2) {
                // Map screen coords to 3D world coords (Approximate)
                const worldX = (smoothedX - 0.5) * 12; 
                const worldY = -(smoothedY - 0.5) * 9; 
                triggerHole([worldX, worldY, 0]);
                consecutiveFastFrames = 0; // Reset after trigger
             }
        } else {
            consecutiveFastFrames = 0;
        }
    }

    setHandState({
      detected: true,
      pinchStrength: lastPinch,
      spreadDistance: lastSpread,
      handCenter: [(smoothedX - 0.5) * 2, -(smoothedY - 0.5) * 2, 0], 
      rotation: lastRotation,
      velocity: smoothedVelocity
    });

  } else {
    // Graceful Recovery
    const { detected } = state.handState;
    if (detected) {
        setHandState({ detected: false, velocity: 0 });
    }
  }
};