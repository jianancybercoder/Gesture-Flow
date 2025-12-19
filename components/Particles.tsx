import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { generateParticles } from '../utils/shapes';

const MAX_HOLES = 5;

const vertexShader = `
  uniform float uTime;
  uniform float uSize;
  uniform float uMorph;
  uniform float uSpread;
  uniform float uNoiseStrength;
  uniform float uPinch;
  uniform float uScatter;
  uniform float uIsScan; // 1.0 if scan mode, 0.0 otherwise
  uniform sampler2D uVideoTexture;
  
  uniform vec3 uHoles[${MAX_HOLES}];
  uniform float uHolesTime[${MAX_HOLES}];
  
  attribute vec3 aTarget;
  
  varying vec3 vColor;
  varying float vDist;
  varying float vScanIntensity; // Pass brightness to fragment

  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857; 
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    // Morphing
    vec3 basePos = mix(position, aTarget, uMorph);
    vec3 finalPos = basePos;
    
    // --- SCANNER MODE ---
    // Calculate UV coordinates based on X,Y position (assuming plane matches aspect ratio)
    // X range approx -4 to 4, Y range approx -2.25 to 2.25
    vec2 scanUV = vec2(
        (basePos.x / 8.0) + 0.5,
        (basePos.y / 4.5) + 0.5
    );

    // Default intensity for non-scan modes
    vScanIntensity = 1.0; 

    // Apply Video Texture Displacement if in Scan Mode
    if (uIsScan > 0.5) {
        // Sample texture
        // Flip X for mirror effect matching the video element
        vec4 texColor = texture2D(uVideoTexture, vec2(1.0 - scanUV.x, scanUV.y));
        
        // Calculate Luminance
        float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
        vScanIntensity = luminance;

        // Displace Z based on luminance 
        // OPTIMIZED ALGORITHM:
        // 1. Cap the max luminance to avoid spikes from glare (smoothstep 0.0 to 0.9)
        // 2. Reduce the extrusion factor significantly (2.5 -> 0.5) for a "Relief" look
        float dampenedLum = smoothstep(0.0, 0.95, luminance);
        float zOffset = dampenedLum * 0.5; 
        
        finalPos.z += zOffset;
    }

    // Ambient Noise movement (Reduced in Scan mode to keep object stable)
    float activeNoise = (uIsScan > 0.5) ? uNoiseStrength * 0.1 : uNoiseStrength;
    
    vec3 noiseOffset = vec3(
      snoise(finalPos + uTime * 0.2),
      snoise(finalPos + uTime * 0.3 + 10.0),
      snoise(finalPos + uTime * 0.4 + 20.0)
    ) * activeNoise;

    // --- CHAOS SCATTER (Violent Wave) ---
    vec3 turbulence = vec3(
        snoise(finalPos * 0.8 + uTime * 2.0),
        snoise(finalPos * 0.8 + uTime * 2.0 + 100.0),
        snoise(finalPos * 0.8 + uTime * 2.0 + 200.0)
    );
    
    vec3 scatterDir = normalize(finalPos);
    if (length(finalPos) < 0.1) scatterDir = normalize(turbulence);
    
    vec3 finalScatter = mix(scatterDir, turbulence, 0.8) * uScatter * 25.0; 

    finalPos = finalPos + noiseOffset + finalScatter;
    
    // --- HAND CONTROL (Enhanced) ---
    // Pinch: Exponential compression to center
    // CHANGED: Instead of 0.01 (too small), use 0.5 (half size) so it doesn't disappear
    finalPos = mix(finalPos, finalPos * 0.5, pow(uPinch, 1.5));
    
    float spreadFactor = 1.0 + (uSpread - 1.0) * 4.0; 
    finalPos *= spreadFactor;

    // --- HOLE PENETRATION (Tunnel Effect) ---
    for(int i = 0; i < ${MAX_HOLES}; i++) {
        float age = uTime - uHolesTime[i];
        if (age > 0.0 && age < 2.5) { 
            vec3 holePos = uHoles[i];
            float dist2D = distance(finalPos.xy, holePos.xy);
            float radius = 5.0 * smoothstep(2.5, 0.0, age); 
            
            if (dist2D < radius) {
                vec2 pushDir = normalize(finalPos.xy - holePos.xy);
                float wallNoise = snoise(finalPos * 5.0) * 0.5;
                finalPos.xy = holePos.xy + pushDir * (radius + wallNoise);
                finalPos.z += snoise(vec3(finalPos.xy, uTime * 5.0)) * 1.0;
            }
        }
    }

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = uSize * (300.0 / -mvPosition.z);
    
    vDist = length(finalPos);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uIsScan;
  uniform float uTime;
  
  varying float vScanIntensity;

  // Pseudo-random for sparkle
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float dist = length(xy);

    if (dist > 0.5) discard;

    // --- LUXURY AESTHETIC ---
    float alpha = 1.0 - (dist * 2.0);
    alpha = pow(alpha, 2.0); // Soft curve

    // Sparkle effect
    float sparkle = sin(uTime * 10.0 + random(gl_PointCoord.xy) * 10.0) * 0.5 + 0.5;
    
    // Base Color
    vec3 finalColor = uColor;

    // In Scan Mode, modulate brightness by the video luminance
    if (uIsScan > 0.5) {
        // Enhance contrast for scan mode
        float scanBrightness = smoothstep(0.1, 0.9, vScanIntensity);
        finalColor *= (0.3 + scanBrightness * 0.7); 
        
        // Make bright parts distinct
        if (vScanIntensity > 0.8) {
            finalColor += vec3(0.2); // Add a bit of white to peaks
        }
    }

    // Apply sparkle
    finalColor += sparkle * 0.2; 

    // Final alpha output
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const Particles: React.FC = () => {
  const mesh = useRef<THREE.Points>(null);
  
  // Split selectors to ensure shallow comparison (or just distinct values)
  const config = useStore(state => state.config);
  const currentShape = useStore(state => state.currentShape);
  const targetShape = useStore(state => state.targetShape);
  const isMorphing = useStore(state => state.isMorphing);
  const completeMorph = useStore(state => state.completeMorph);
  const isRotationControlEnabled = useStore(state => state.isRotationControlEnabled);
  const updateEffects = useStore(state => state.updateEffects);
  const videoTexture = useStore(state => state.videoTexture);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = generateParticles(currentShape, config.count);
    const target = generateParticles(targetShape, config.count);
    
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
    return geo;
  }, [config.count, currentShape, targetShape]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSize: { value: config.size },
    uColor: { value: new THREE.Color(config.color) },
    uMorph: { value: 0 },
    uNoiseStrength: { value: config.noiseStrength },
    uPinch: { value: 0 },
    uSpread: { value: 1.0 },
    uScatter: { value: 0 },
    uHoles: { value: new Array(MAX_HOLES * 3).fill(0) },
    uHolesTime: { value: new Array(MAX_HOLES).fill(-100) },
    uVideoTexture: { value: null },
    uIsScan: { value: 0 }
  }), []);

  useEffect(() => {
    if (mesh.current) {
      const mat = mesh.current.material as THREE.ShaderMaterial;
      mat.uniforms.uSize.value = config.size;
      mat.uniforms.uColor.value.set(config.color);
      mat.uniforms.uNoiseStrength.value = config.noiseStrength;
    }
  }, [config]);

  // Update texture uniform when videoTexture changes
  useEffect(() => {
    if (mesh.current && videoTexture) {
        const mat = mesh.current.material as THREE.ShaderMaterial;
        mat.uniforms.uVideoTexture.value = videoTexture;
    }
  }, [videoTexture]);

  // Reset morph uniform when target shape changes
  useEffect(() => {
    if (mesh.current) {
        const mat = mesh.current.material as THREE.ShaderMaterial;
        mat.uniforms.uMorph.value = 0;
    }
  }, [targetShape]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    
    const mat = mesh.current.material as THREE.ShaderMaterial;
    const time = state.clock.elapsedTime;
    mat.uniforms.uTime.value = time;

    // Check if we are in Scan mode
    const isScanTarget = targetShape === 'scan';
    const isScanCurrent = currentShape === 'scan';
    const inScanMode = (isScanCurrent && !isMorphing) || (isScanTarget && isMorphing && mat.uniforms.uMorph.value > 0.5);
    
    mat.uniforms.uIsScan.value = THREE.MathUtils.lerp(mat.uniforms.uIsScan.value, inScanMode ? 1.0 : 0.0, 0.1);

    updateEffects(time);
    
    const storeState = useStore.getState();
    mat.uniforms.uScatter.value = storeState.scatterIntensity;

    const activeHoles = storeState.holes;
    const holePosArray = mat.uniforms.uHoles.value;
    const holeTimeArray = mat.uniforms.uHolesTime.value;
    
    for (let i = 0; i < MAX_HOLES; i++) {
        if (i < activeHoles.length) {
            holePosArray[i*3] = activeHoles[i].position[0];
            holePosArray[i*3+1] = activeHoles[i].position[1];
            holePosArray[i*3+2] = activeHoles[i].position[2];
            holeTimeArray[i] = activeHoles[i].timestamp;
        } else {
            holeTimeArray[i] = -100.0;
        }
    }

    if (isMorphing) {
      const speed = 2.0;
      let nextProgress = mat.uniforms.uMorph.value + delta * speed;
      if (nextProgress >= 1) {
        nextProgress = 1;
        completeMorph(); 
        mat.uniforms.uMorph.value = 1.0; 
      } else {
        mat.uniforms.uMorph.value = nextProgress;
      }
    } else {
        mat.uniforms.uMorph.value = 0;
    }

    const handState = storeState.handState;
    const pinchEnabled = storeState.isPinchEnabled;

    let targetPinch = 0;
    let targetSpread = 1.0;
    let lerpSpeed = 0.05; 

    if (handState.detected) {
        if (pinchEnabled) {
            targetPinch = handState.pinchStrength;
            targetSpread = handState.spreadDistance;
        }
        lerpSpeed = 0.15;
    }

    mat.uniforms.uPinch.value = THREE.MathUtils.lerp(mat.uniforms.uPinch.value, targetPinch, lerpSpeed);
    mat.uniforms.uSpread.value = THREE.MathUtils.lerp(mat.uniforms.uSpread.value, targetSpread, lerpSpeed);

    if (isRotationControlEnabled && handState.detected) {
        const targetRotZ = handState.rotation;
        const targetRotY = handState.handCenter[0] * 1.5; 
        const targetRotX = handState.handCenter[1] * 1.5; 

        mesh.current.rotation.z = THREE.MathUtils.lerp(mesh.current.rotation.z, targetRotZ, 0.1);
        mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, targetRotY, 0.05);
        mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, targetRotX, 0.05);
    } else {
        mesh.current.rotation.z = THREE.MathUtils.lerp(mesh.current.rotation.z, 0, 0.02);
        mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, 0, 0.02);
        mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, 0, 0.02);
    }
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};