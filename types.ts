
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

export interface ForensicPoint {
  feature: string;
  observation: string;
  status: 'Confirmed' | 'Discrepancy' | 'Variation';
  details: string;
}

export interface MovieAssociation {
  movieTitle: string;
  characterName: string;
  context: string;
}

export interface WatchInfo {
  modelName: string;
  releaseYear: string;
  eraContext: string;
  clothingDescription: string;
  environmentDescription: string;
  historicalFunFact: string;
  marketingScenarios: MarketingScenario[];
  forensicVerification: ForensicPoint[];
  associatedMovies: MovieAssociation[];
  sources?: Source[];
}

export enum AppState {
  IDLE = 'IDLE',
  IDENTIFYING = 'IDENTIFYING',
  TRANSFORMING = 'TRANSFORMING',
  RESULT = 'RESULT',
  INVESTOR = 'INVESTOR',
  ERROR = 'ERROR'
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalImage: string;
  transformedImage: string;
  watch: WatchInfo;
}

// Added for vintage advertisements feature
export interface VintageAd {
  id: string;
  year: string;
  headline: string;
  description: string;
  imageUrl?: string;
}
