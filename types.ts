
export interface Source {
  title: string;
  url: string;
}

export interface MarketingScenario {
  id: string;
  title: string;
  description: string;
  environmentPrompt: string;
  clothingPrompt: string;
}

export interface UserPreferences {
  gender: string;
  age: string;
  country: string;
  customYear?: string;
}

export interface MarketAnalysis {
  currency: string;
  currentMinPrice: number;
  currentMaxPrice: number;
  priceHistory: { year: string; averagePrice: number }[];
  marketSentiment: 'Bullish' | 'Bearish' | 'Stable';
  investmentRating: string; // e.g., "A", "B", "C"
  insight: string;
}

export interface VintageAd {
  id: string;
  headline: string;
  description: string;
  year: string;
  visualPrompt: string; // Internal use for generation
  imageUrl?: string; // Populated after generation
}

export interface WatchInfo {
  modelName: string;
  releaseYear: string;
  eraContext: string;
  clothingDescription: string;
  environmentDescription: string;
  historicalFunFact: string;
  marketingScenarios: MarketingScenario[];
  sources?: Source[];
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  IDENTIFYING = 'IDENTIFYING',
  TRANSFORMING = 'TRANSFORMING',
  RESULT = 'RESULT',
  LIVE = 'LIVE',
  GENERATING_WORLD = 'GENERATING_WORLD',
  IMMERSIVE = 'IMMERSIVE',
  INVESTOR = 'INVESTOR',
  ADS = 'ADS',
  ERROR = 'ERROR'
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalImage: string;
  transformedImage: string;
  watch: WatchInfo;
}
