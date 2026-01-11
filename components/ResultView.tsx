
import React, { useState } from 'react';
import { WatchInfo, MarketingScenario, UserPreferences, ForensicPoint } from '../types';

interface ResultViewProps {
  originalImage: string;
  transformedImage: string;
  watch: WatchInfo;
  onReset: () => void;
  onSelectScenario: (scenario: MarketingScenario) => void;
  onShowInvestor: () => void;
  isTransmuting: boolean;
  userPrefs: UserPreferences;
}

const ResultView: React.FC<ResultViewProps> = ({ 
  originalImage, 
  transformedImage, 
  watch, 
  onReset, 
  onSelectScenario,
  onShowInvestor,
  isTransmuting,
  userPrefs
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForensics, setShowForensics] = useState(false);
  
  const hasPersona = userPrefs.gender || userPrefs.age || userPrefs.country;
  const personaString = [
    userPrefs.age ? `${userPrefs.age}yo` : '', 
    userPrefs.gender || '', 
    userPrefs.country ? `from ${userPrefs.country}` : ''
  ].filter(Boolean).join(' ');

  const handleShare = async () => {
    try {
      if (navigator.share) {
        const res = await fetch(transformedImage);
        const blob = await res.blob();
        const file = new File([blob], `chrono-portal-${watch.modelName.replace(/\s+/g, '-')}.png`, { type: 'image/png' });

        await navigator.share({
          title: `My ${watch.modelName} from ${watch.releaseYear}`,
          text: `Check out my watch transformed into its original era: ${watch.eraContext} #chronoportalpowerbygemini`,
          files: [file],
        });
      } else {
        const link = document.createElement('a');
        link.href = transformedImage;
        link.download = `ChronoPortal-${watch.modelName}.png`;
        link.click();
      }
    } catch (err) {
      console.error('Sharing failed', err);
    }
  };

  const getStatusColor = (status: ForensicPoint['status']) => {
    switch (status) {
      case 'Confirmed': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'Variation': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'Discrepancy': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] overflow-y-auto pb-safe">
      {/* Visual Result */}
      <div className="relative w-full aspect-square group shrink-0">
        <img 
          src={transformedImage} 
          alt="Time Portal Result" 
          className={`w-full h-full object-cover shadow-2xl transition-opacity duration-500 ${isTransmuting ? 'opacity-40 grayscale' : 'opacity-100'}`}
        />
        
        {isTransmuting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
               <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] mono text-blue-400 font-bold uppercase tracking-widest">Processing...</p>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={handleShare}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <i className="fas fa-share-alt"></i>
          </button>
        </div>
        
        <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <div className="flex gap-2">
                <div className="glass px-3 py-1 rounded-full text-xs mono text-blue-400 font-bold uppercase tracking-widest">
                Reality Synchronized
                </div>
                {hasPersona && (
                    <div className="glass px-3 py-1 rounded-full text-xs mono text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <i className="fas fa-user-circle"></i> {personaString}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Watch Info Card */}
      <div className="p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-white leading-tight">
            {watch.modelName}
          </h2>
          <div className="flex items-center gap-3">
            <p className="text-blue-500 mono text-lg font-bold">ERA: {watch.releaseYear}</p>
            <div className="w-1 h-1 rounded-full bg-gray-700"></div>
            <button 
              onClick={() => setShowForensics(!showForensics)}
              className="text-[10px] mono text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20 uppercase tracking-widest font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(74,222,128,0.25)] hover:bg-green-400/20 transition-all"
            >
              <i className="fas fa-fingerprint"></i> Forensic Audit
            </button>
          </div>
        </div>

        {/* Feature Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onShowInvestor}
            className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50"
          >
            <div className="flex items-center gap-2">
               <i className="fas fa-chart-line text-lg"></i>
               <span className="uppercase tracking-widest text-xs font-bold">Explore Market Intel</span>
            </div>
          </button>
        </div>

        {/* Forensic Section (Expandable) */}
        {showForensics && (
          <div className="glass rounded-2xl p-5 border border-green-500/30 animate-in fade-in slide-in-from-top-2 bg-gradient-to-b from-green-500/5 to-transparent relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10">
                <i className="fas fa-stamp text-5xl text-green-500 -rotate-12"></i>
             </div>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                   <i className="fas fa-shield-check"></i> Database Verified
                </h3>
                <span className="text-[8px] mono text-green-600 font-bold uppercase">Archival Precision High</span>
             </div>
             <div className="space-y-4">
                {watch.forensicVerification.map((point, idx) => (
                  <div key={idx} className="space-y-1 border-l-2 border-green-500/20 pl-3">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] mono text-gray-500 uppercase tracking-wider font-medium">{point.feature}</span>
                        <span className={`text-[8px] mono px-2 py-0.5 rounded border font-bold ${getStatusColor(point.status)}`}>
                          {point.status}
                        </span>
                     </div>
                     <p className="text-xs text-white font-medium">{point.observation}</p>
                     <div className="flex items-center gap-1.5 mt-1 bg-green-500/5 p-1.5 rounded-md border border-green-500/10">
                        <i className="fas fa-database text-[8px] text-green-500/60"></i>
                        <p className="text-[10px] text-gray-400 leading-tight italic">{point.details}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Marketing Scenarios Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
            <i className="fas fa-bullhorn mr-2 text-blue-500"></i> Historical Campaigns
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {watch.marketingScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  setSelectedId(scenario.id);
                  onSelectScenario(scenario);
                }}
                disabled={isTransmuting}
                className={`text-left p-4 rounded-xl border transition-all ${
                  selectedId === scenario.id 
                    ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10' 
                    : 'glass border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">{scenario.title}</span>
                  {selectedId === scenario.id && <i className="fas fa-check-circle text-blue-500 text-xs"></i>}
                </div>
                <p className="text-[11px] text-gray-400 leading-tight">{scenario.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass p-5 rounded-2xl space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center">
              <i className="fas fa-history mr-2 text-blue-500"></i> Era Analysis
            </h3>
            <p className="text-gray-200 leading-relaxed italic">
              "{watch.eraContext}"
            </p>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border-l-4 border-amber-500">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Horological Trivia</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {watch.historicalFunFact}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={onReset}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-white/5"
          >
            <i className="fas fa-camera"></i> Scan New Artifact
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
