
import React, { useEffect, useState } from 'react';
import { WatchInfo, MarketAnalysis } from '../types';
import { analyzeMarketValue } from '../services/geminiService';

interface InvestorViewProps {
  watch: WatchInfo;
  onClose: () => void;
}

const InvestorView: React.FC<InvestorViewProps> = ({ watch, onClose }) => {
  const [data, setData] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyzeMarketValue(watch.modelName);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Unable to connect to Market Crawler Protocol.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [watch.modelName]);

  const handleEbayClick = () => {
    const query = encodeURIComponent(watch.modelName);
    window.open(`https://www.ebay.com/sch/i.html?_nkw=${query}`, '_blank');
  };

  const renderChart = (history: { year: string; averagePrice: number }[]) => {
    if (!history || history.length === 0) return null;
    
    const height = 150;
    const width = 300;
    const padding = 20;
    
    const prices = history.map(h => h.averagePrice);
    const minPrice = Math.min(...prices) * 0.9;
    const maxPrice = Math.max(...prices) * 1.1;
    
    const getX = (index: number) => padding + (index * ((width - padding * 2) / (history.length - 1)));
    const getY = (price: number) => height - (padding + ((price - minPrice) / (maxPrice - minPrice)) * (height - padding * 2));

    const points = history.map((point, i) => `${getX(i)},${getY(point.averagePrice)}`).join(' ');

    return (
      <div className="w-full flex justify-center py-4">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />
          
          {/* The Line */}
          <polyline 
            fill="none" 
            stroke={data?.marketSentiment === 'Bearish' ? '#ef4444' : '#10b981'} 
            strokeWidth="3" 
            points={points} 
            className="drop-shadow-lg"
          />
          
          {/* Dots and Labels */}
          {history.map((point, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(point.averagePrice)} r="4" fill="#fff" />
              <text 
                x={getX(i)} 
                y={height + 15} 
                fill="gray" 
                fontSize="10" 
                textAnchor="middle" 
                className="font-mono"
              >
                {point.year}
              </text>
              <text 
                x={getX(i)} 
                y={getY(point.averagePrice) - 10} 
                fill="white" 
                fontSize="10" 
                textAnchor="middle" 
                fontWeight="bold"
              >
                ${point.averagePrice.toLocaleString()}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#0a0a0a] flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-white">Market Intel</h2>
          <p className="text-[10px] text-emerald-500 mono font-bold">MCP: EBAY CRAWLER ACTIVE</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
             <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-emerald-500 mono text-xs uppercase tracking-widest animate-pulse">Analyzing Global Markets...</p>
          </div>
        ) : error ? (
          <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-xl text-red-400 text-center">
            {error}
          </div>
        ) : data ? (
          <>
            {/* Price Card */}
            <div className="glass p-6 rounded-2xl border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Estimated Value</span>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  data.marketSentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' : 
                  data.marketSentiment === 'Bearish' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {data.marketSentiment} Trend
                </span>
              </div>
              <div className="text-4xl font-bold text-white mb-1">
                ${data.currentMinPrice.toLocaleString()} - ${data.currentMaxPrice.toLocaleString()}
              </div>
              <p className="text-gray-500 text-xs mono">Based on recent sold listings</p>
            </div>

            {/* Chart */}
            <div className="glass p-4 rounded-2xl">
              <h3 className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-4">3-Year Trajectory</h3>
              {renderChart(data.priceHistory)}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-4 rounded-xl">
                 <p className="text-gray-500 text-[10px] uppercase font-bold">Invest Rating</p>
                 <p className={`text-3xl font-bold ${
                   data.investmentRating.includes('A') || data.investmentRating.includes('S') ? 'text-emerald-400' : 'text-white'
                 }`}>{data.investmentRating}</p>
              </div>
              <div className="glass p-4 rounded-xl">
                 <p className="text-gray-500 text-[10px] uppercase font-bold">3Y Growth</p>
                 <p className="text-3xl font-bold text-white">
                   {((data.priceHistory[data.priceHistory.length-1].averagePrice - data.priceHistory[0].averagePrice) / data.priceHistory[0].averagePrice * 100).toFixed(0)}%
                 </p>
              </div>
            </div>

            {/* Insight */}
            <div className="glass p-4 rounded-xl border-l-2 border-emerald-500">
               <p className="text-gray-300 text-sm italic leading-relaxed">"{data.insight}"</p>
            </div>

            {/* CTA */}
            <button 
              onClick={handleEbayClick}
              className="w-full py-4 bg-[#0064D2] text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-blue-900/20"
            >
              <i className="fas fa-shopping-cart"></i>
              Check Live Prices on eBay
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default InvestorView;
