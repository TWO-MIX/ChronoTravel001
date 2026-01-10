
import React, { useEffect, useState, useRef } from 'react';
import { WatchInfo } from '../types';

interface ImmersiveARProps {
  panoramaImage: string;
  transformedImage: string;
  watch: WatchInfo;
  onExit: () => void;
}

const ImmersiveAR: React.FC<ImmersiveARProps> = ({ 
  panoramaImage, 
  transformedImage, 
  watch, 
  onExit 
}) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 90, gamma: 0 });
  const [isDesktop, setIsDesktop] = useState(false);
  
  // For desktop drag fallback
  const dragRef = useRef({ isDragging: false, startX: 0, startAlpha: 0 });

  useEffect(() => {
    // Check if DeviceOrientationEvent is defined
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      // iOS 13+ requires permission
      setPermissionGranted(false);
    } else if (window.DeviceOrientationEvent) {
      // Non-iOS or older iOS
      setPermissionGranted(true);
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
      // Likely desktop
      setIsDesktop(true);
      setPermissionGranted(true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (event.alpha !== null && event.beta !== null) {
      setOrientation({ 
        alpha: event.alpha, 
        beta: event.beta, 
        gamma: event.gamma || 0 
      });
    }
  };

  const requestAccess = async () => {
    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          alert('Permission required for 360 view');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Desktop Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDesktop) return;
    dragRef.current = { 
      isDragging: true, 
      startX: e.clientX, 
      startAlpha: orientation.alpha 
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDesktop || !dragRef.current.isDragging) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const newAlpha = (dragRef.current.startAlpha - deltaX * 0.5) % 360; 
    setOrientation(prev => ({ ...prev, alpha: newAlpha }));
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
  };

  const bgPosX = -(orientation.alpha * 4);
  const tilt = Math.max(-20, Math.min(20, orientation.beta - 90));
  
  if (!permissionGranted && !isDesktop) {
    return (
      <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <i className="fas fa-compass text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-white">Calibrate Sensors</h2>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          Enable gyroscope access to look around the {watch.releaseYear} environment.
        </p>
        <button 
          onClick={requestAccess}
          className="px-8 py-3 bg-white text-black font-bold rounded-xl active:scale-95 transition-transform"
        >
          Enable 360° Tracking
        </button>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 z-50 bg-black overflow-hidden select-none cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 360 Background Layer */}
      <div 
        className="absolute inset-[-20%] w-[140%] h-[140%] bg-cover bg-center transition-transform duration-75 ease-out will-change-transform"
        style={{
          backgroundImage: `url(${panoramaImage})`,
          transform: `translate3d(${bgPosX % 100}px, ${tilt * 5}px, 0) scale(1.2)` 
        }}
      ></div>

      {/* Vignette Overlay - Fixed gradient syntax */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.8) 100%)'
        }}
      ></div>

      {/* Transformed Wrist Overlay - "The Anchor" */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-full max-w-lg aspect-square">
          <img 
            src={transformedImage} 
            alt="Wrist Anchor" 
            className="w-full h-full object-cover"
            style={{
              maskImage: 'radial-gradient(circle at center, black 30%, transparent 65%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 65%)'
            }}
          />
        </div>
      </div>

      {/* HUD Elements - Fixed positioning logic */}
      <div className="absolute top-0 pt-safe left-4 right-4 flex justify-between items-start pointer-events-none z-50 mt-4">
        <div className="glass px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
           <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
           <span className="text-[10px] mono text-white font-bold uppercase tracking-widest">360° LIVE</span>
        </div>
        
        <button 
          onClick={onExit}
          className="w-10 h-10 glass rounded-full flex items-center justify-center text-white pointer-events-auto active:scale-90"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="absolute bottom-0 pb-safe left-0 right-0 p-8 text-center pointer-events-none mb-4">
        <div className="inline-block glass px-4 py-2 rounded-xl">
           <p className="text-xs text-white/80 font-bold uppercase tracking-widest">
             {isDesktop ? 'Drag to Look Around' : 'Move Phone to Explore'}
           </p>
        </div>
      </div>
    </div>
  );
};

export default ImmersiveAR;
