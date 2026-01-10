
import React, { useState, useCallback, useEffect } from 'react';
import { AppState, WatchInfo, MarketingScenario, UserPreferences } from './types';
import Camera from './components/Camera';
import ResultView from './components/ResultView';
import LiveAR from './components/LiveAR';
import InvestorView from './components/InvestorView';
import VintageAdsView from './components/VintageAdsView';
import { identifyWatch, transformEra } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [watchInfo, setWatchInfo] = useState<WatchInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isCompatible, setIsCompatible] = useState(true);
  const [envError, setEnvError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<MarketingScenario | undefined>(undefined);
  const [isReTransmuting, setIsReTransmuting] = useState(false);

  // User Preferences State
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    gender: '',
    age: '',
    country: '',
    customYear: ''
  });

  const hasActivePersona = Boolean(userPrefs.gender || userPrefs.age || userPrefs.country || userPrefs.customYear);

  useEffect(() => {
    setCurrentUrl(window.location.href);
    
    const isSecure = window.isSecureContext;
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isInApp = /FBAN|FBAV|Instagram|LinkedIn|Discord|Twitter/i.test(ua);

    if (!isSecure && window.location.hostname !== 'localhost') {
      setIsCompatible(false);
      setEnvError("Security breach detected: This application requires an HTTPS connection to access temporal sensors (camera).");
    } else if (isInApp) {
      setIsCompatible(false);
      setEnvError("In-App Browser detected. These browsers restrict camera/microphone access. Please tap the '...' or share icon and select 'Open in Safari' or 'Open in Chrome'.");
    }
  }, []);

  const handleCapture = useCallback(async (base64: string) => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 300);
    
    setState(AppState.IDENTIFYING);
    setOriginalImage(`data:image/jpeg;base64,${base64}`);
    setErrorMessage(null);
    setSelectedScenario(undefined);

    try {
      const info = await identifyWatch(base64);
      setWatchInfo(info);
      
      setState(AppState.TRANSFORMING);
      const result = await transformEra(base64, info, userPrefs);
      setTransformedImage(result);
      
      setState(AppState.RESULT);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "The time portal encountered a paradox. Try scanning again.");
      setState(AppState.ERROR);
    }
  }, [userPrefs]);

  const handleSelectScenario = async (scenario: MarketingScenario) => {
    if (!originalImage || !watchInfo || isReTransmuting) return;
    
    setIsReTransmuting(true);
    setSelectedScenario(scenario);
    
    try {
      const base64 = originalImage.split(',')[1];
      const result = await transformEra(base64, watchInfo, userPrefs, scenario);
      setTransformedImage(result);
    } catch (err) {
      console.error("Scenario transformation failed", err);
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
    setSelectedScenario(undefined);
  };

  const handlePrefChange = (key: keyof UserPreferences, value: string) => {
    setUserPrefs(prev => ({ ...prev, [key]: value }));
  };

  if (!isCompatible) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-10 text-center">
        <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-8 border border-amber-500/20">
          <i className="fas fa-shield-alt text-4xl"></i>
        </div>
        <h2 className="text-2xl font-bold mb-4 uppercase tracking-[0.2em] text-white">System Restriction</h2>
        <p className="text-gray-400 mb-8 mono text-sm leading-relaxed">{envError}</p>
        <div className="glass p-4 rounded-xl text-xs mono text-blue-400 border-blue-500/20">
          REQUIRED: Safari (iOS) or Chrome (Android)
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-screen bg-black overflow-hidden relative ${isPulsing ? 'pulse-capture' : ''}`}>
      {/* Header */}
      <header className="pt-safe px-4 pb-4 z-20 glass border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 mt-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fas fa-hourglass-half text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tighter uppercase">ChronoPortal</h1>
            <p className="text-[10px] text-blue-400 mono leading-none font-bold">V-AR ENGINE 1.6</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
            <button 
              onClick={() => setShowSettings(true)}
              disabled={state !== AppState.IDLE && state !== AppState.RESULT}
              className={`relative text-[10px] mono text-gray-400 border border-white/10 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-white/5 transition-colors`}
            >
              <i className="fas fa-user-cog"></i> Persona
              {hasActivePersona && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full -mr-1 -mt-1 border border-black shadow-sm"></div>
              )}
            </button>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] mono text-gray-500 font-bold uppercase tracking-widest">Active</span>
            </div>
        </div>
      </header>

      {/* Settings Modal - Increased Z-Index and contrast */}
      {showSettings && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <div className="glass p-6 rounded-3xl w-full max-w-sm border-blue-500/30 shadow-2xl shadow-blue-900/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold uppercase tracking-widest text-white">Persona Protocol</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="space-y-1">
                <label className="text-[10px] mono text-blue-400 font-bold uppercase">Identity (Gender)</label>
                <select 
                  value={userPrefs.gender}
                  onChange={(e) => handlePrefChange('gender', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none appearance-none"
                >
                  <option value="">Any / Unspecified</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] mono text-blue-400 font-bold uppercase">Chronological Age</label>
                <input 
                  type="number"
                  placeholder="e.g. 28"
                  value={userPrefs.age}
                  onChange={(e) => handlePrefChange('age', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none placeholder-gray-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] mono text-blue-400 font-bold uppercase">Geographic Origin</label>
                <input 
                  type="text"
                  placeholder="e.g. Japan, New York, London"
                  value={userPrefs.country}
                  onChange={(e) => handlePrefChange('country', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none placeholder-gray-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] mono text-blue-400 font-bold uppercase">Temporal Override (Year)</label>
                <input 
                  type="text"
                  placeholder="e.g. 1920, 2077 (Default: Watch Era)"
                  value={userPrefs.customYear || ''}
                  onChange={(e) => handlePrefChange('customYear', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none placeholder-gray-600"
                />
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
            >
              Confirm Parameters
            </button>
          </div>
        </div>
      )}

      {/* Main Area */}
      <main className="flex-1 relative overflow-hidden">
        {state === AppState.LIVE && watchInfo ? (
          <LiveAR 
            watch={watchInfo} 
            selectedScenario={selectedScenario} 
            onExit={() => setState(AppState.RESULT)} 
          />
        ) : (state === AppState.IDLE || state === AppState.IDENTIFYING || state === AppState.TRANSFORMING) ? (
          <div className="h-full relative">
            <Camera 
              onCapture={handleCapture} 
              isProcessing={state !== AppState.IDLE} 
            />
            
            {state !== AppState.IDLE && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-10 text-center">
                <div className="relative mb-8">
                    <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <i className={`fas ${
                            state === AppState.IDENTIFYING ? 'fa-fingerprint' : 'fa-magic'
                        } text-blue-500 text-xl animate-pulse`}></i>
                    </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold uppercase tracking-[0.2em] text-white">
                    {state === AppState.IDENTIFYING ? 'Artifact ID' : 'Transmuting'}
                  </h3>
                  <div className="h-1 w-12 bg-blue-500 mx-auto rounded-full"></div>
                  <p className="text-gray-400 text-sm mono font-medium max-w-[200px] mx-auto">
                    {state === AppState.IDENTIFYING ? 'Cross-referencing global horological datasets...' : 
                     `Projecting ${userPrefs.customYear || watchInfo?.releaseYear || 'temporal'} environment layers...`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : state === AppState.RESULT && watchInfo && transformedImage && originalImage ? (
          <div className="h-full relative overflow-y-auto">
            <ResultView 
              originalImage={originalImage}
              transformedImage={transformedImage}
              watch={watchInfo}
              onReset={reset}
              onSelectScenario={handleSelectScenario}
              onShowInvestor={() => setState(AppState.INVESTOR)}
              onShowAds={() => setState(AppState.ADS)}
              isTransmuting={isReTransmuting}
              userPrefs={userPrefs}
            />
          </div>
        ) : state === AppState.INVESTOR && watchInfo ? (
           <InvestorView 
             watch={watchInfo}
             onClose={() => setState(AppState.RESULT)}
           />
        ) : state === AppState.ADS && watchInfo ? (
           <VintageAdsView
             watch={watchInfo}
             onClose={() => setState(AppState.RESULT)}
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
