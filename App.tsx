
import React, { useState, useCallback, useEffect } from 'react';
import { AppState, WatchInfo, HistoryItem } from './types';
import Camera from './components/Camera';
import ResultView from './components/ResultView';
import { identifyWatch, transformEra } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [watchInfo, setWatchInfo] = useState<WatchInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleCapture = useCallback(async (base64: string) => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 300);
    
    setState(AppState.IDENTIFYING);
    setOriginalImage(`data:image/jpeg;base64,${base64}`);
    setErrorMessage(null);

    try {
      // Step 1: Identify
      const info = await identifyWatch(base64);
      setWatchInfo(info);
      
      // Step 2: Transform
      setState(AppState.TRANSFORMING);
      const result = await transformEra(base64, info);
      setTransformedImage(result);
      
      setState(AppState.RESULT);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "The time portal encountered a paradox. Try scanning again.");
      setState(AppState.ERROR);
    }
  }, []);

  const reset = () => {
    setState(AppState.IDLE);
    setOriginalImage(null);
    setTransformedImage(null);
    setWatchInfo(null);
    setErrorMessage(null);
  };

  return (
    <div className={`flex flex-col h-screen w-screen bg-black overflow-hidden relative ${isPulsing ? 'pulse-capture' : ''}`}>
      {/* Header - Fixed to top with safe area */}
      <header className="pt-safe px-4 pb-4 z-20 glass border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 mt-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fas fa-hourglass-half text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tighter uppercase">ChronoPortal</h1>
            <p className="text-[10px] text-blue-400 mono leading-none font-bold">V-AR ENGINE 1.0</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
            <button 
              onClick={() => setShowQR(!showQR)}
              className="text-[10px] mono text-gray-400 border border-white/10 px-2 py-1 rounded flex items-center gap-1 hover:bg-white/5 transition-colors"
            >
              <i className="fas fa-qrcode"></i> Mobile Sync
            </button>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] mono text-gray-500 font-bold uppercase">Ready</span>
            </div>
        </div>
      </header>

      {/* QR Overlay for Mobile Sync */}
      {showQR && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/90 backdrop-blur-md">
          <div className="glass p-8 rounded-3xl flex flex-col items-center gap-6 max-w-xs w-full border-blue-500/30">
            <div className="text-center">
              <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-2">Sync to Phone</h3>
              <p className="text-xs text-gray-400 mono">Scan this code with your phone camera to test AR features.</p>
            </div>
            <div className="bg-white p-4 rounded-xl">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`} 
                alt="QR Code" 
                className="w-40 h-40"
              />
            </div>
            <button 
              onClick={() => setShowQR(false)}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-sm uppercase tracking-widest"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {state === AppState.IDLE || state === AppState.IDENTIFYING || state === AppState.TRANSFORMING ? (
          <div className="h-full relative">
            <Camera 
              onCapture={handleCapture} 
              isProcessing={state === AppState.IDENTIFYING || state === AppState.TRANSFORMING} 
            />
            
            {(state === AppState.IDENTIFYING || state === AppState.TRANSFORMING) && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-10 text-center">
                <div className="relative mb-8">
                    <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <i className={`fas ${state === AppState.IDENTIFYING ? 'fa-fingerprint' : 'fa-magic'} text-blue-500 text-xl animate-pulse`}></i>
                    </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold uppercase tracking-[0.2em] text-white">
                    {state === AppState.IDENTIFYING ? 'Artifact ID' : 'Transmuting'}
                  </h3>
                  <div className="h-1 w-12 bg-blue-500 mx-auto rounded-full"></div>
                  <p className="text-gray-400 text-sm mono font-medium max-w-[200px]">
                    {state === AppState.IDENTIFYING 
                      ? 'Cross-referencing global horological datasets...' 
                      : `Projecting ${watchInfo?.releaseYear || 'temporal'} environment layers...`}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : state === AppState.RESULT && originalImage && transformedImage && watchInfo ? (
          <ResultView 
            originalImage={originalImage}
            transformedImage={transformedImage}
            watch={watchInfo}
            onReset={reset}
          />
        ) : state === AppState.ERROR ? (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center bg-zinc-950">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
              <i className="fas fa-exclamation-triangle text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold mb-3 uppercase tracking-wider">Neural Link Severed</h3>
            <p className="text-gray-400 mb-8 mono text-sm leading-relaxed">{errorMessage}</p>
            <button
              onClick={reset}
              className="px-10 py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95 shadow-xl shadow-white/10"
            >
              Initialize Reboot
            </button>
          </div>
        ) : null}
      </main>

      {/* Footer Branding - Only show on Idle */}
      {state === AppState.IDLE && (
        <div className="absolute bottom-[140px] left-0 right-0 px-8 text-center pointer-events-none z-10">
          <p className="text-white/60 text-xs font-bold uppercase tracking-[0.3em] drop-shadow-lg">
            Align Artifact <span className="text-blue-500">&bull;</span> Center Dial
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
