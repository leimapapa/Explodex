
// Use named imports to resolve "no exported member" and "Property does not exist" errors in onnxruntime-web
import { env, InferenceSession, Tensor } from 'onnxruntime-web';
import { InferenceResult, PreprocessConfig, Candidate } from '../types';

// Updated to use InferenceSession directly instead of ort.InferenceSession
export const loadSession = async (modelData: File | ArrayBuffer): Promise<InferenceSession> => {
  // Config for ONNX WebAssembly paths - using direct env export
  env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";
  env.logLevel = 'error';

  try {
    let buffer: ArrayBuffer;
    if (modelData instanceof File) {
      buffer = await modelData.arrayBuffer();
    } else {
      buffer = modelData;
    }

    // Using InferenceSession.create directly
    const session = await InferenceSession.create(buffer, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    return session;
  } catch (e) {
    console.error("Failed to load ONNX session:", e);
    throw e;
  }
};

// Using InferenceSession as a type directly
export const runInference = async (
  session: InferenceSession, 
  image: HTMLImageElement | HTMLVideoElement,
  config: PreprocessConfig
): Promise<InferenceResult> => {
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

// Using Tensor as a return type directly
function preprocessImage(
  image: HTMLImageElement | HTMLVideoElement, 
  config: PreprocessConfig
): Tensor {
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

  // Using new Tensor directly instead of ort.Tensor
  return new Tensor('float32', float32Data, [1, 3, height, width]);
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
