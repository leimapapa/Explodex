
export interface ClassInfo {
  title: string;
  description: string;
  details?: Record<string, string>;
  imageUrl?: string;
  tags?: string[];
}

export interface ModelConfig {
  inputName: string;
  outputName: string;
}

export interface Candidate {
  index: number;
  label: string;
  probability: number;
}

export interface InferenceResult {
  index: number;
  label: string;
  probability: number;
  candidates: Candidate[];
  inferenceTime: number;
}

export interface ModelManifest {
  classes: string[];
  num_classes: number;
  img_size: number;
  input_mean: number[];
  input_std: number[];
  best_val_accuracy?: number;
  model_name?: string;
}

export interface PreprocessConfig {
  width: number;
  height: number;
  mean: number[];
  std: number[];
}

export interface ReportData {
  title: string;
  probability: number;
  description: string;
  image: string;
  timestamp: string;
  location?: {
    lat: number;
    lon: number;
  };
  renderSafeProcedure: string;
  furtherActions: string;
  technicalDetails?: Record<string, string>;
}
