
import React from 'react';
import { WatchInfo } from '../types';

interface ResultViewProps {
  originalImage: string;
  transformedImage: string;
  watch: WatchInfo;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ originalImage, transformedImage, watch, onReset }) => {
  const handleShare = async () => {
    try {
      if (navigator.share) {
        // Convert base64 to blob for sharing
        const res = await fetch(transformedImage);
        const blob = await res.blob();
        const file = new File([blob], `chrono-portal-${watch.modelName.replace(/\s+/g, '-')}.png`, { type: 'image/png' });

        await navigator.share({
          title: `My ${watch.modelName} from ${watch.releaseYear}`,
          text: `Check out my watch transformed into its original era: ${watch.eraContext}`,
          files: [file],
        });
      } else {
        // Fallback: Download
        const link = document.createElement('a');
        link.href = transformedImage;
        link.download = `ChronoPortal-${watch.modelName}.png`;
        link.click();
      }
    } catch (err) {
      console.error('Sharing failed', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] overflow-y-auto pb-safe">
      {/* Visual Result */}
      <div className="relative w-full aspect-square group shrink-0">
        <img 
          src={transformedImage} 
          alt="Time Portal Result" 
          className="w-full h-full object-cover shadow-2xl"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={handleShare}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <i className="fas fa-share-alt"></i>
          </button>
        </div>
        <div className="absolute bottom-4 left-4 glass px-3 py-1 rounded-full text-xs mono text-blue-400 font-bold uppercase tracking-widest">
          Reality Synchronized
        </div>
      </div>

      {/* Watch Info Card */}
      <div className="p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-white leading-tight">
            {watch.modelName}
          </h2>
          <p className="text-blue-500 mono text-lg font-bold">ERA: {watch.releaseYear}</p>
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
          
          <div className="h-px bg-white/10"></div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center">
              <i className="fas fa-tshirt mr-2 text-blue-500"></i> Period Attire
            </h3>
            <p className="text-gray-200 leading-relaxed">
              {watch.clothingDescription}
            </p>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border-l-4 border-amber-500">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Horological Trivia</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {watch.historicalFunFact}
          </p>
        </div>

        {/* Verification Sources from Search Grounding */}
        {watch.sources && watch.sources.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
              <i className="fas fa-globe mr-2"></i> Verification Sources
            </h3>
            <div className="flex flex-wrap gap-2">
              {watch.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass px-3 py-2 rounded-lg text-[10px] mono text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-2 border border-blue-500/20"
                >
                  <i className="fas fa-external-link-alt text-[8px]"></i>
                  {source.title.length > 25 ? source.title.substring(0, 25) + '...' : source.title}
                </a>
              ))}
            </div>
          </div>
        )}

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
