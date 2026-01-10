
import React, { useEffect, useState } from 'react';
import { WatchInfo, VintageAd } from '../types';
import { findVintageAds, restoreAdImage } from '../services/geminiService';

interface VintageAdsViewProps {
  watch: WatchInfo;
  onClose: () => void;
}

const VintageAdsView: React.FC<VintageAdsViewProps> = ({ watch, onClose }) => {
  const [ads, setAds] = useState<VintageAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const foundAds = await findVintageAds(watch);
        setAds(foundAds);
        
        // Auto-restore the first ad to impress the user immediately
        if (foundAds.length > 0) {
          handleRestore(foundAds[0], foundAds);
        }
      } catch (e) {
        console.error("Failed to find ads", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [watch]);

  const handleRestore = async (ad: VintageAd, currentAds: VintageAd[]) => {
    if (ad.imageUrl || restoringId) return; // Already done or busy
    
    setRestoringId(ad.id);
    try {
      const imageUrl = await restoreAdImage(ad, watch.modelName);
      setAds(prev => prev.map(item => item.id === ad.id ? { ...item, imageUrl } : item));
    } catch (e) {
      console.error(e);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#121212] flex flex-col animate-in slide-in-from-bottom duration-500">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md z-10">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-white">Archivist</h2>
          <p className="text-[10px] text-amber-500 mono font-bold">FIRE-CRAWL PROTOCOL // VINTAGE MEDIA</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
             <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-amber-500 mono text-xs uppercase tracking-widest animate-pulse">Scouring Global Archives...</p>
          </div>
        ) : (
          <div className="space-y-8 pb-20">
            <div className="glass p-4 rounded-xl border-l-4 border-amber-500">
              <p className="text-gray-300 text-xs italic leading-relaxed">
                "We found {ads.length} historical campaigns for the {watch.modelName} ({watch.releaseYear}). Tap any entry to run a Neural Restoration."
              </p>
            </div>

            {ads.map((ad, index) => (
              <div key={ad.id} className="space-y-3">
                <div className="flex justify-between items-end">
                   <h3 className="text-white font-bold text-lg leading-tight w-2/3">{ad.headline}</h3>
                   <span className="text-amber-500 mono text-sm font-bold border border-amber-500/30 px-2 py-1 rounded">{ad.year}</span>
                </div>
                
                <div 
                  onClick={() => handleRestore(ad, ads)}
                  className={`relative w-full aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group transition-all duration-500 ${!ad.imageUrl ? 'border-2 border-dashed border-white/10 hover:border-amber-500/50' : 'shadow-2xl'}`}
                >
                  {ad.imageUrl ? (
                    <>
                        <img src={ad.imageUrl} alt="Restored Ad" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-4 left-4">
                            <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                                Restored
                            </span>
                        </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center text-center p-6 space-y-4">
                        {restoringId === ad.id ? (
                            <>
                                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-amber-500 text-xs uppercase tracking-widest animate-pulse">Generating Restoration...</p>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-file-image text-4xl text-white/20 group-hover:text-amber-500/50 transition-colors"></i>
                                <p className="text-gray-500 text-xs uppercase tracking-widest">Tap to Restore Visual</p>
                                <p className="text-gray-600 text-[10px] leading-tight max-w-[200px] line-clamp-3">
                                    "{ad.description}"
                                </p>
                            </>
                        )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="text-center pt-8">
                <button 
                  onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${watch.modelName}+vintage+ad`, '_blank')}
                  className="text-xs text-gray-500 underline hover:text-white transition-colors"
                >
                    View Original Artifacts on Google Images
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VintageAdsView;
