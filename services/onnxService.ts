import { InferenceResult, PreprocessConfig, Candidate } from '../types';

// Access global ort object from CDN
const getOrt = () => (window as any).ort;

export const loadSession = async (modelData: File | ArrayBuffer): Promise<any> => {
  const ort = getOrt();
  if (!ort) throw new Error("ONNX Runtime not loaded");

  // Fix: Explicitly set wasm paths to CDN to avoid relative path loading errors
  ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";
  ort.env.logLevel = 'error';

  try {
    let buffer: ArrayBuffer;
    if (modelData instanceof File) {
      buffer = await modelData.arrayBuffer();
    } else {
      buffer = modelData;
    }

    const session = await ort.InferenceSession.create(buffer, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    return session;
  } catch (e) {
    console.error("Failed to load ONNX session:", e);
    throw e;
  }
};

export const runInference = async (
  session: any, 
  image: HTMLImageElement | HTMLVideoElement,
  config: PreprocessConfig
): Promise<InferenceResult> => {
  const ort = getOrt();
  const startTime = performance.now();

  const tensor = preprocessImage(image, config);
  const inputName = session.inputNames[0];
  const feeds = { [inputName]: tensor };
  const results = await session.run(feeds);

  const outputName = session.outputNames[0];
  const outputTensor = results[outputName];
  const outputData = outputTensor.data as Float32Array;

  const { index, probability, candidates } = softmaxAndArgmax(outputData, 3);
  const endTime = performance.now();

  return {
    index,
    label: index.toString(),
    probability,
    candidates,
    inferenceTime: endTime - startTime,
  };
};

function preprocessImage(
  image: HTMLImageElement | HTMLVideoElement, 
  config: PreprocessConfig
): any {
  const ort = getOrt();
  const { width, height, mean, std } = config;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error("Could not get canvas context");
  
  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const float32Data = new Float32Array(3 * width * height);
  
  let i = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const red = data[i * 4];
      const green = data[i * 4 + 1];
      const blue = data[i * 4 + 2];
      
      float32Data[0 * width * height + (y * width + x)] = ((red / 255.0) - mean[0]) / std[0];
      float32Data[1 * width * height + (y * width + x)] = ((green / 255.0) - mean[1]) / std[1];
      float32Data[2 * width * height + (y * width + x)] = ((blue / 255.0) - mean[2]) / std[2];
      i++;
    }
  }

  return new ort.Tensor('float32', float32Data, [1, 3, height, width]);
}

function softmaxAndArgmax(data: Float32Array, k: number = 3): { index: number, probability: number, candidates: Candidate[] } {
  let maxLogit = -Infinity;
  for (let i = 0; i < data.length; i++) {
    if (data[i] > maxLogit) maxLogit = data[i];
  }

  let sumExp = 0;
  const exps = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    exps[i] = Math.exp(data[i] - maxLogit);
    sumExp += exps[i];
  }

  const probabilities: { index: number; probability: number }[] = [];
  for (let i = 0; i < data.length; i++) {
    probabilities.push({
      index: i,
      probability: exps[i] / sumExp
    });
  }

  probabilities.sort((a, b) => b.probability - a.probability);

  const topCandidates = probabilities.slice(0, k).map(p => ({
    index: p.index,
    label: p.index.toString(),
    probability: p.probability
  }));

  return { 
    index: topCandidates[0].index, 
    probability: topCandidates[0].probability,
    candidates: topCandidates
  };
}