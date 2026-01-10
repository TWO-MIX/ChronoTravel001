
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

  useEffect(() => {
    // Cleanup function to stop tracks when component unmounts or stream changes
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Effect to attach stream to video element once active
  useEffect(() => {
    if (isActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isActive, stream]);

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

        <p className="absolute bottom-8 text-xs text-gray-600 uppercase tracking-widest font-mono">
          Security Protocol: Manual Activation
        </p>
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
      
      {/* Scanning HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
          
          {!isProcessing && (
            <div className="absolute inset-0 scan-line"></div>
          )}
        </div>
        
        {/* Decorative HUD elements */}
        <div className="absolute top-8 left-0 right-0 flex justify-center gap-1">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="w-1 h-1 bg-white/50 rounded-full"></div>
           ))}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute bottom-12 left-0 right-0 flex justify-center px-6">
        <button
          onClick={captureFrame}
          disabled={isProcessing}
          className={`
            group relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all active:scale-95
            ${isProcessing ? 'border-gray-500 bg-gray-700/50' : 'border-white bg-white/10 hover:bg-white/20'}
          `}
        >
          {isProcessing ? (
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
               <div className="absolute inset-2 border border-white/30 rounded-full"></div>
               <div className="w-14 h-14 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform group-active:scale-90"></div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Camera;
