import * as THREE from 'three';
import { ShapeType } from '../types';

export const generateParticles = (shape: ShapeType, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const idx = i * 3;

    switch (shape) {
      case 'heart': {
        // Parametric Heart
        const t = Math.random() * Math.PI * 2;
        // Random distribution inside to fill volume
        const r = Math.sqrt(Math.random()); 
        // Heart curve
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        
        // Scale down
        x = hx * r * 0.2;
        y = hy * r * 0.2;
        z = (Math.random() - 0.5) * 2; // Thickness
        break;
      }
      case 'flower': {
        // Rose curve
        const k = 4; // Petals
        const theta = Math.random() * Math.PI * 2;
        const rad = Math.sqrt(Math.random()); 
        const rCurve = Math.cos(k * theta);
        const rFinal = 3 * rCurve * rad + 1; // +1 to add some center bulk
        
        x = rFinal * Math.cos(theta);
        y = rFinal * Math.sin(theta);
        z = (Math.random() - 0.5) * 1.5;
        
        // Rotate to look up slightly
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI/4);
        const v = new THREE.Vector3(x,y,z).applyQuaternion(q);
        x = v.x; y = v.y; z = v.z;
        break;
      }
      case 'saturn': {
        const type = Math.random();
        if (type > 0.4) {
          // Planet sphere
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos((Math.random() * 2) - 1);
          const r = 1.5 * Math.cbrt(Math.random()); // Uniform sphere
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
        } else {
          // Rings
          const theta = Math.random() * Math.PI * 2;
          const r = 2.2 + Math.random() * 2.0;
          x = r * Math.cos(theta);
          z = r * Math.sin(theta); // Lay flat on XZ plane
          y = (Math.random() - 0.5) * 0.1;
          
          // Tilt rings
          const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI/6);
          const v = new THREE.Vector3(x,y,z).applyQuaternion(q);
          x = v.x; y = v.y; z = v.z;
        }
        break;
      }
      case 'scan': {
        // Grid Plane for Video Projection (Aspect Ratio 16:9 approx)
        // We create a grid from -4 to 4 in X, and -2.25 to 2.25 in Y
        const aspectRatio = 16 / 9;
        const width = 8;
        const height = width / aspectRatio;

        // Grid distribution
        const sideCount = Math.ceil(Math.sqrt(count));
        const row = Math.floor(i / sideCount);
        const col = i % sideCount;
        
        const u = col / sideCount; // 0 to 1
        const v = row / sideCount; // 0 to 1

        x = (u - 0.5) * width;
        y = (v - 0.5) * height;
        z = 0; // Z will be displaced by shader based on luminance
        break;
      }
      case 'fireworks': {
        // Explosion from center
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        // Let's make a big sphere shell
        const r = 4 * Math.sqrt(Math.random());
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
        break;
      }
    }

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
  }

  return positions;
};