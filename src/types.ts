export interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  optimizedPrompt: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

// Props types shared across components
export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  status: AnalysisStatus;
}

export interface SidebarProps {
  status: AnalysisStatus;
  result: AnalysisResult | null;
  onApplyFix: (fixedPrompt: string) => void;
}
