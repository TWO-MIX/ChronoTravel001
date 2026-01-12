
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, WatchInfo, MarketingScenario, UserPreferences, MovieAssociation } from './types';
import Camera from './components/Camera';
import ResultView from './components/ResultView';
import InvestorView from './components/InvestorView';
import { identifyWatch, transformEra, vectorizeImage } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [watchInfo, setWatchInfo] = useState<WatchInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isCompatible, setIsCompatible] = useState(true);
  const [envError, setEnvError] = useState<string | null>(null);
  const [isReTransmuting, setIsReTransmuting] = useState(false);
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    gender: '', age: '', country: '', customYear: ''
  });

  const hasActivePersona = Boolean(userPrefs.gender || userPrefs.age || userPrefs.country || userPrefs.customYear);

  useEffect(() => {
    const isSecure = window.isSecureContext;
    if (!isSecure && window.location.hostname !== 'localhost') {
      setIsCompatible(false);
      setEnvError("Security Breach: ChronoPortal requires an encrypted HTTPS connection to access temporal sensors.");
    }
  }, []);

  useEffect(() => {
    const isRunning = state === AppState.IDENTIFYING || state === AppState.TRANSFORMING || isReTransmuting;
    
    if (isRunning) {
      const start = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Number(((Date.now() - start) / 1000).toFixed(1)));
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, isReTransmuting]);

  const handleCapture = useCallback(async (base64: string) => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 300);
    
    setElapsedTime(0);
    setState(AppState.IDENTIFYING);
    setOriginalImage(`data:image/jpeg;base64,${base64}`);
    setErrorMessage(null);

    try {
      // Step 1: Pre-process image for structural blueprint matching
      const blueprintBase64 = await vectorizeImage(base64);
      
      // Step 2: Use both original and blueprint for forensic ID
      const info = await identifyWatch(base64, blueprintBase64);
      setWatchInfo(info);
      
      setState(AppState.TRANSFORMING);
      const result = await transformEra(base64, info, userPrefs);
      setTransformedImage(result);
      
      setState(AppState.RESULT);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Temporal paradox detected. The artifact identification was severed.");
      setState(AppState.ERROR);
    }
  }, [userPrefs]);

  const handleSelectScenario = async (scenario: MarketingScenario) => {
    if (!originalImage || !watchInfo || isReTransmuting) return;
    setElapsedTime(0);
    setIsReTransmuting(true);
    try {
      const base64 = originalImage.split(',')[1];
      const result = await transformEra(base64, watchInfo, userPrefs, scenario, true);
      setTransformedImage(result);
    } catch (err) {
      console.error("Scenario transformation failed", err);
    } finally {
      setIsReTransmuting(false);
    }
  };

  const handleSelectMovie = async (movie: MovieAssociation) => {
    if (!originalImage || !watchInfo || isReTransmuting) return;
    setElapsedTime(0);
    setIsReTransmuting(true);
    try {
      const base64 = originalImage.split(',')[1];
      const movieScenario: MarketingScenario = {
        id: `movie-${movie.movieTitle}`,
        title: movie.movieTitle,
        description: movie.context,
        environmentPrompt: `a cinematic frame from the movie "${movie.movieTitle}".`,
        clothingPrompt: `period-accurate clothing as seen on ${movie.characterName} in ${movie.movieTitle}.`
      };
      const result = await transformEra(base64, watchInfo, userPrefs, movieScenario, true);
      setTransformedImage(result);
    } catch (err) {
      console.error("Movie transformation failed", err);
    } finally {
      setIsReTransmuting(false);
    }
  };

  const handleRefreshImage = async (activeScenario: MarketingScenario | null, activeMovie: MovieAssociation | null) => {
    if (!originalImage || !watchInfo || isReTransmuting) return;
    setElapsedTime(0);
    setIsReTransmuting(true);
    try {
      const base64 = originalImage.split(',')[1];
      let finalScenario: MarketingScenario | undefined = undefined;
      
      if (activeMovie) {
        finalScenario = {
          id: `movie-refresh`,
          title: activeMovie.movieTitle,
          description: activeMovie.context,
          environmentPrompt: `cinematic ${activeMovie.movieTitle} style.`,
          clothingPrompt: `clothing from ${activeMovie.movieTitle}.`
        };
      } else if (activeScenario) {
        finalScenario = activeScenario;
      }

      const result = await transformEra(base64, watchInfo, userPrefs, finalScenario, (activeScenario !== null || activeMovie !== null));
      setTransformedImage(result);
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setIsReTransmuting(false);
    }
  };

  const reset = () => {
    setState(AppState.IDLE);
    setOriginalImage(null);
    setTransformedImage(null);
    setWatchInfo(null);
    setErrorMessage(null);
    setElapsedTime(0);
  };

  if (!isCompatible) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-10 text-center">
        <i className="fas fa-shield-alt text-4xl text-amber-500 mb-8"></i>
        <h2 className="text-2xl font-bold mb-4 uppercase tracking-[0.2em] text-white">System Restriction</h2>
        <p className="text-gray-400 mono text-sm leading-relaxed">{envError}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-screen bg-black overflow-hidden relative ${isPulsing ? 'pulse-capture' : ''}`}>
      {/* Dynamic Header */}
      <header className="pt-safe px-4 pb-4 z-20 glass border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 mt-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fas fa-hourglass-half text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase font-logo text-blue-400">ChronoPortal</h1>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-gray-400 mono font-bold uppercase">Production Build 1.0.4</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
            <button 
              onClick={() => setShowSettings(true)}
              disabled={state !== AppState.IDLE && state !== AppState.RESULT}
              className={`relative text-[10px] mono text-gray-400 border border-white/10 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-white/5 transition-colors`}
            >
              <i className="fas fa-user-cog"></i> Persona
              {hasActivePersona && <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full -mr-1 -mt-1 border border-black shadow-sm"></div>}
            </button>
        </div>
      </header>

      {/* Primary Rendering Engine */}
      <main className="flex-1 relative overflow-hidden">
        {state === AppState.IDLE || state === AppState.IDENTIFYING || state === AppState.TRANSFORMING ? (
          <div className="h-full relative">
            <Camera onCapture={handleCapture} isProcessing={state !== AppState.IDLE} />
            
            {state !== AppState.IDLE && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-10 text-center">
                <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-white mono mb-1">{elapsedTime}s</span>
                        <i className={`fas ${state === AppState.IDENTIFYING ? 'fa-fingerprint' : 'fa-magic'} text-blue-500/50 text-sm animate-pulse`}></i>
                    </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold uppercase tracking-[0.2em] text-white">
                    {state === AppState.IDENTIFYING ? 'Forensic Audit' : 'Transmuting'}
                  </h3>
                  <div className="h-1 w-12 bg-blue-500 mx-auto rounded-full"></div>
                  <p className="text-gray-400 text-sm mono font-medium max-w-[200px] mx-auto uppercase tracking-widest leading-relaxed">
                    {state === AppState.IDENTIFYING ? 'Identifying Timepiece via Gemini 3 Pro...' : 'Opening Temporal Corridor...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : state === AppState.RESULT && watchInfo && transformedImage && originalImage ? (
          <ResultView 
            originalImage={originalImage}
            transformedImage={transformedImage}
            watch={watchInfo}
            onReset={reset}
            onSelectScenario={handleSelectScenario}
            onSelectMovie={handleSelectMovie}
            onRefreshImage={handleRefreshImage}
            onShowInvestor={() => setState(AppState.INVESTOR)}
            isTransmuting={isReTransmuting}
            userPrefs={userPrefs}
            generationTime={elapsedTime}
          />
        ) : state === AppState.INVESTOR && watchInfo ? (
          <InvestorView watch={watchInfo} onClose={() => setState(AppState.RESULT)} />
        ) : state === AppState.ERROR ? (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center bg-zinc-950">
            <i className="fas fa-exclamation-triangle text-3xl text-red-500 mb-6"></i>
            <h3 className="text-2xl font-bold mb-3 uppercase tracking-wider">Temporal Link Severed</h3>
            <p className="text-gray-400 mb-8 mono text-sm leading-relaxed">{errorMessage}</p>
            <button onClick={reset} className="px-10 py-4 bg-white text-black font-bold rounded-2xl shadow-xl shadow-white/5 uppercase tracking-widest text-xs">Initialize Reboot</button>
          </div>
        ) : null}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <div className="glass p-6 rounded-3xl w-full max-w-sm border-blue-500/30">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold uppercase tracking-widest text-white">Persona Protocol</h3>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400"><i className="fas fa-times"></i></button>
            </div>
            <div className="space-y-4 mb-8">
                <input type="number" placeholder="Age" value={userPrefs.age} className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-xl" onChange={(e) => setUserPrefs({...userPrefs, age: e.target.value})} />
                <input type="text" placeholder="Country" value={userPrefs.country} className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-xl" onChange={(e) => setUserPrefs({...userPrefs, country: e.target.value})} />
                <input type="text" placeholder="Year Override (Optional)" value={userPrefs.customYear || ''} className="w-full bg-black/50 border border-white/10 p-3 text-white rounded-xl" onChange={(e) => setUserPrefs({...userPrefs, customYear: e.target.value})} />
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-sm uppercase tracking-widest">Confirm Protocol</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
