
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
  ERROR = 'ERROR'
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalImage: string;
  transformedImage: string;
  watch: WatchInfo;
}
