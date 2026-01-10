
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraProps {
  onCapture: (base64: string) => void;
  isProcessing: boolean;
}

const Camera: React.FC<CameraProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };

    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

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
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute bottom-12 left-0 right-0 flex justify-center px-6">
        <button
          onClick={captureFrame}
          disabled={isProcessing}
          className={`
            w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all active:scale-95
            ${isProcessing ? 'border-gray-500 bg-gray-700/50' : 'border-white bg-white/10 hover:bg-white/20'}
          `}
        >
          {isProcessing ? (
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <div className="w-14 h-14 bg-white rounded-full"></div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Camera;
