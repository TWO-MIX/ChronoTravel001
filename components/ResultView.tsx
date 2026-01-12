
import React, { useState } from 'react';
import { WatchInfo, MarketingScenario, UserPreferences, ForensicPoint, MovieAssociation } from '../types';

interface ResultViewProps {
  originalImage: string;
  transformedImage: string;
  watch: WatchInfo;
  onReset: () => void;
  onSelectScenario: (scenario: MarketingScenario) => void;
  onSelectMovie: (movie: MovieAssociation) => void;
  onRefreshImage: (scenario: MarketingScenario | null, movie: MovieAssociation | null) => void;
  onShowInvestor: () => void;
  isTransmuting: boolean;
  userPrefs: UserPreferences;
  generationTime?: number;
}

const ResultView: React.FC<ResultViewProps> = ({ 
  transformedImage, 
  watch, 
  onReset, 
  onSelectScenario,
  onSelectMovie,
  onRefreshImage,
  onShowInvestor,
  isTransmuting,
  generationTime
}) => {
  const [showForensics, setShowForensics] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<MarketingScenario | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<MovieAssociation | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const getStatusColor = (status: ForensicPoint['status']) => {
    switch (status) {
      case 'Confirmed': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'Variation': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'Discrepancy': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      default: return 'text-gray-400';
    }
  };

  const handleShare = async () => {
    if (!transformedImage || isSharing) return;
    setIsSharing(true);

    try {
      const blob = await (await fetch(transformedImage)).blob();
      const file = new File([blob], `chrono-${watch.modelName.replace(/\s+/g, '-').toLowerCase()}.png`, { type: 'image/png' });
      
      const shareData = {
        title: 'ChronoPortal - Time Travel via Horology',
        text: `Check out my artifact's history in the ChronoPortal! #chronoportalpowerbyGemini`,
        files: [file],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Download the image
        const link = document.createElement('a');
        link.href = transformedImage;
        link.download = `chronoportal-${watch.releaseYear}.png`;
        link.click();
      }
    } catch (err) {
      console.error('Error sharing temporal artifact:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] overflow-y-auto pb-safe">
      {/* Primary Visual Artifact - 9:16 aspect ratio */}
      <div className="relative w-full aspect-[9/16] shrink-0 bg-zinc-900">
        <img src={transformedImage} className={`w-full h-full object-cover shadow-2xl transition-all duration-700 ${isTransmuting ? 'opacity-40 grayscale blur-sm' : 'opacity-100'}`} />
        
        {isTransmuting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] mono text-blue-400 font-bold uppercase tracking-[0.2em] animate-pulse">Syncing Reality...</p>
          </div>
        )}

        <div className="absolute top-4 left-4">
           <div className="glass px-2 py-1 rounded text-[10px] mono text-gray-400 font-bold border border-white/5 uppercase">
              Sensor Latency: {generationTime}s
           </div>
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={handleShare}
            disabled={isTransmuting || isSharing}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
            title="Share Temporal Artifact"
          >
            <i className={`fas ${isSharing ? 'fa-spinner animate-spin' : 'fa-share-nodes'}`}></i>
          </button>
          <button 
            onClick={() => onRefreshImage(selectedScenario, selectedMovie)}
            disabled={isTransmuting}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
            title="Recalibrate Image"
          >
            <i className={`fas fa-sync-alt ${isTransmuting ? 'animate-spin' : ''}`}></i>
          </button>
        </div>

        <div className="absolute bottom-4 left-4">
           <div className="glass px-3 py-1 rounded-full text-[10px] mono text-blue-400 font-bold uppercase tracking-widest border border-blue-500/20 shadow-lg shadow-blue-500/10">
              Reality Verified
           </div>
        </div>
      </div>

      {/* Artifact Intelligence Panel */}
      <div className="p-6 space-y-8 bg-black">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">{watch.modelName}</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
               <i className="fas fa-calendar-alt text-blue-500 text-sm"></i>
               <p className="text-blue-500 mono text-lg font-bold">{watch.releaseYear}</p>
            </div>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <button 
                onClick={() => setShowForensics(!showForensics)} 
                className={`text-[10px] mono px-2 py-1 rounded border uppercase font-bold flex items-center gap-1 transition-all ${
                    showForensics ? 'bg-green-500 text-black border-green-500' : 'text-green-400 bg-green-400/10 border-green-400/20'
                }`}
            >
              <i className="fas fa-fingerprint"></i> {showForensics ? 'Hide Audit' : 'Forensic Audit'}
            </button>
          </div>
        </div>

        {showForensics && (
          <div className="glass rounded-2xl p-5 border border-green-500/30 animate-in slide-in-from-top-4 duration-300">
             <div className="flex items-center gap-2 mb-4">
                <i className="fas fa-shield-check text-green-500"></i>
                <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest">Database Verification Points</h3>
             </div>
             <div className="space-y-4">
                {watch.forensicVerification.map((point, idx) => (
                  <div key={idx} className="space-y-1 border-l-2 border-green-500/20 pl-3">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] mono text-gray-500 uppercase font-bold">{point.feature}</span>
                        <span className={`text-[8px] mono px-1.5 py-0.5 rounded border font-bold ${getStatusColor(point.status)}`}>{point.status}</span>
                     </div>
                     <p className="text-xs text-white font-medium">{point.observation}</p>
                     <p className="text-[10px] text-gray-400 italic leading-tight mt-1 opacity-70">"{point.details}"</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Cinematic Associations */}
        {watch.associatedMovies && watch.associatedMovies.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center">
              <i className="fas fa-film mr-2 text-red-500"></i> Hollywood Connections
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {watch.associatedMovies.map((movie, idx) => (
                <button 
                  key={idx} 
                  onClick={() => {
                    setSelectedMovie(movie);
                    setSelectedScenario(null);
                    onSelectMovie(movie);
                  }}
                  className={`text-left glass p-4 rounded-xl border transition-all flex items-center gap-4 ${
                    selectedMovie?.movieTitle === movie.movieTitle ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/10' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedMovie?.movieTitle === movie.movieTitle ? 'bg-red-500' : 'bg-zinc-800'}`}>
                    <i className={`fas fa-clapperboard text-sm ${selectedMovie?.movieTitle === movie.movieTitle ? 'text-white' : 'text-red-500/60'}`}></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">{movie.movieTitle}</h4>
                    <p className="text-[10px] mono text-gray-400 font-bold uppercase">Character: {movie.characterName}</p>
                  </div>
                  {selectedMovie?.movieTitle === movie.movieTitle && <i className="fas fa-check-circle text-red-500"></i>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Marketing Scenarios */}
        {watch.marketingScenarios && watch.marketingScenarios.length > 0 && (
          <div className="space-y-4">
             <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center">
               <i className="fas fa-bullhorn mr-2 text-blue-400"></i> Historical Scenarios
             </h3>
             <div className="grid grid-cols-1 gap-2">
                {watch.marketingScenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      setSelectedScenario(scenario);
                      setSelectedMovie(null);
                      onSelectScenario(scenario);
                    }}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      selectedScenario?.id === scenario.id 
                        ? 'bg-blue-600/20 border-blue-500' 
                        : 'glass border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-white uppercase tracking-wider">{scenario.title}</span>
                      {selectedScenario?.id === scenario.id && <i className="fas fa-check-circle text-blue-500"></i>}
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight">{scenario.description}</p>
                  </button>
                ))}
             </div>
          </div>
        )}

        <div className="glass p-5 rounded-2xl border-l-4 border-amber-500 space-y-2">
          <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Horological Insight</h3>
          <p className="text-gray-300 text-sm leading-relaxed italic">
            "{watch.historicalFunFact}"
          </p>
        </div>

        {/* Global CTAs */}
        <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
            <button onClick={onShowInvestor} className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] flex items-center justify-center gap-2">
               <i className="fas fa-chart-line"></i>
               <span className="uppercase tracking-[0.2em] text-xs font-bold">Invest Analyst Protocol</span>
            </button>

            <button onClick={onReset} className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              <i className="fas fa-camera"></i>
              <span className="uppercase tracking-[0.2em] text-xs font-bold">Initiate New Artifact Scan</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
