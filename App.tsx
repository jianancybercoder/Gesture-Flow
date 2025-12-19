import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Particles } from './components/Particles';
import { UI } from './components/UI';
import { useStore } from './store';
import { initializeVision, detectHands } from './services/visionService';

const VisionManager: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Optimized Selectors
  const isCameraEnabled = useStore(state => state.isCameraEnabled);
  const videoSize = useStore(state => state.videoSize);
  const setVideoTexture = useStore(state => state.setVideoTexture);
  
  const requestRef = useRef<number>();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeVision().then(() => setInitialized(true));
  }, []);

  useEffect(() => {
    if (!initialized || !isCameraEnabled || !videoRef.current) {
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(track => track.stop());
         videoRef.current.srcObject = null;
      }
      setVideoTexture(null);
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 }, 
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
              if (videoRef.current) {
                  // Create Video Texture for Particles
                  const texture = new THREE.VideoTexture(videoRef.current);
                  texture.minFilter = THREE.LinearFilter;
                  texture.magFilter = THREE.LinearFilter;
                  texture.format = THREE.RGBAFormat;
                  setVideoTexture(texture);
                  
                  predictWebcam();
              }
          });
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        useStore.getState().toggleCamera(); // Turn off if failed
      }
    };

    const predictWebcam = () => {
        if(videoRef.current && videoRef.current.currentTime > 0) {
            detectHands(videoRef.current);
        }
        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    startCamera();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
      }
      setVideoTexture(null);
    };
  }, [isCameraEnabled, initialized]);

  // Dynamic Video Size Classes
  const sizeClasses = {
      small: "w-32",
      medium: "w-48",
      large: "w-80"
  };

  return (
    <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline
        className={`fixed top-4 left-4 ${sizeClasses[videoSize]} h-auto aspect-video object-cover rounded-lg border-2 border-white/20 opacity-70 z-20 pointer-events-none hidden md:block mix-blend-screen transition-all duration-300`}
        style={{ display: isCameraEnabled ? 'block' : 'none', transform: 'scaleX(-1)' }} // Mirror
    />
  );
};

const App: React.FC = () => {
  const performanceMode = useStore(state => state.performanceMode);
  
  // Throttle DPR in saver mode to reduce GPU load
  const dpr = performanceMode === 'saver' ? 1 : [1, 2];

  return (
    <div className="w-full h-full bg-black relative">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} dpr={dpr}>
        <color attach="background" args={['#050505']} />
        <Particles />
        <OrbitControls makeDefault enablePan={false} enableZoom={true} minDistance={2} maxDistance={20} />
      </Canvas>
      
      <UI />
      <VisionManager />
    </div>
  );
};

export default App;