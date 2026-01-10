
export interface Source {
  title: string;
  url: string;
}

export interface WatchInfo {
  modelName: string;
  releaseYear: string;
  eraContext: string;
  clothingDescription: string;
  environmentDescription: string;
  historicalFunFact: string;
  sources?: Source[];
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  IDENTIFYING = 'IDENTIFYING',
  TRANSFORMING = 'TRANSFORMING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalImage: string;
  transformedImage: string;
  watch: WatchInfo;
}
