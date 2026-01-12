
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraProps {
  onCapture: (base64: string) => void;
  isProcessing: boolean;
}

const Camera: React.FC<CameraProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (isActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isActive, stream]);

  // Simulate focus detection for HUD feedback
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFocused(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Camera access required to function. Please check permissions.");
    }
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];
      onCapture(base64);
    }
  }, [isProcessing, onCapture]);

  if (!isActive) {
    return (
      <div className="relative w-full h-full bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all"></div>
          <div className="relative w-24 h-24 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
            <i className="fas fa-camera text-3xl text-white"></i>
          </div>
        </div>
        
        <h2 className="text-4xl mb-3 text-white tracking-wider font-logo">ChronoPortal</h2>
        <p className="text-gray-400 mb-10 max-w-xs leading-relaxed text-sm">
          Activate temporal sensors to identify artifacts and open a window to the past.
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        <button 
          onClick={startCamera}
          className="group relative px-8 py-4 bg-white text-black font-bold rounded-full transition-all active:scale-95 hover:bg-gray-100"
        >
          <span className="flex items-center gap-3">
            <i className="fas fa-power-off text-sm"></i>
            <span>Activate Sensor</span>
          </span>
          <div className="absolute inset-0 rounded-full border border-white/50 animate-ping opacity-20"></div>
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Precision Reticle Overlay (The Hitbox) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        <div className="relative">
          {/* Main Hitbox Area */}
          <div className={`w-64 h-64 border-2 rounded-[2rem] transition-colors duration-500 relative ${isFocused ? 'border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)]' : 'border-white/20'}`}>
            <div className={`absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 rounded-tl-[2rem] transition-colors ${isFocused ? 'border-blue-400' : 'border-white/40'}`}></div>
            <div className={`absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 rounded-tr-[2rem] transition-colors ${isFocused ? 'border-blue-400' : 'border-white/40'}`}></div>
            <div className={`absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 rounded-bl-[2rem] transition-colors ${isFocused ? 'border-blue-400' : 'border-white/40'}`}></div>
            <div className={`absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 rounded-br-[2rem] transition-colors ${isFocused ? 'border-blue-400' : 'border-white/40'}`}></div>
            
            {/* Inner Alignment HUD - Dial Circle */}
            <div className="absolute inset-0 flex items-center justify-center">
               <div className={`w-40 h-40 border-2 border-dashed rounded-full transition-all duration-700 ${isFocused ? 'border-blue-500/50 scale-100' : 'border-white/10 scale-90'}`}></div>
            </div>

            {/* Micro-guide Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
               <div className="w-[1px] h-4 bg-white"></div>
               <div className="w-4 h-[1px] bg-white absolute"></div>
            </div>

            {!isProcessing && (
              <div className="absolute inset-0 scan-line rounded-[2rem]"></div>
            )}
          </div>

          {/* Forensic Data Points */}
          {isFocused && (
            <div className="absolute -right-32 top-0 space-y-2">
               <div className="glass px-2 py-1 rounded-md border-l-2 border-blue-500 animate-in slide-in-from-left">
                  <p className="text-[8px] mono text-blue-400 font-bold uppercase">Alignment: High</p>
               </div>
               <div className="glass px-2 py-1 rounded-md border-l-2 border-blue-500 animate-in slide-in-from-left delay-75">
                  <p className="text-[8px] mono text-blue-400 font-bold uppercase">Vector: Locked</p>
               </div>
               <div className="glass px-2 py-1 rounded-md border-l-2 border-blue-500 animate-in slide-in-from-left delay-150">
                  <p className="text-[8px] mono text-blue-400 font-bold uppercase">Focus: Optimal</p>
               </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
           <div className="glass px-4 py-2 rounded-full flex items-center gap-3 border border-blue-500/20">
              <i className={`fas ${isFocused ? 'fa-crosshairs text-blue-400 scale-110' : 'fa-camera text-white/50'} transition-all`}></i>
              <p className="text-[10px] mono text-white font-bold uppercase tracking-[0.2em]">
                {isFocused ? 'Position Secured' : 'Place Dial in Circle'}
              </p>
           </div>
           
           <div className="flex gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isFocused ? 'bg-blue-500 animate-pulse' : 'bg-white/20'}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full ${isFocused ? 'bg-blue-500 animate-pulse delay-75' : 'bg-white/20'}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full ${isFocused ? 'bg-blue-500 animate-pulse delay-150' : 'bg-white/20'}`}></div>
           </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Capture Interaction */}
      <div className="absolute bottom-28 left-0 right-0 flex justify-center px-6">
        <button
          onClick={captureFrame}
          disabled={isProcessing}
          className={`
            group relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all active:scale-95
            ${isProcessing ? 'border-blue-900 bg-blue-900/50' : 'border-white bg-white/10 hover:bg-white/20'}
          `}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center">
               <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
               <p className="absolute -bottom-10 text-[8px] mono text-blue-400 font-bold uppercase tracking-widest whitespace-nowrap">Extracting Blueprint...</p>
            </div>
          ) : (
            <>
               <div className="absolute inset-2 border border-white/30 rounded-full"></div>
               <div className="w-14 h-14 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)]"></div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Camera;
