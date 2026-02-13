
import React, { useState, useEffect } from 'react';
import { ClassInfo, InferenceResult, ModelManifest, PreprocessConfig } from './types';
import { loadSession, runInference } from './services/onnxService';
import { ModelUploader } from './components/ModelUploader';
import { ClassificationView } from './components/ClassificationView';
import { InfoModal } from './components/InfoModal';
import { Header } from './components/Header';
import { ArrowPathIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { BUILT_IN_CLASS_DESCRIPTIONS, IMAGENET_MEAN, IMAGENET_STD, TARGET_HEIGHT, TARGET_WIDTH } from './constants';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [classData, setClassData] = useState<Record<string, ClassInfo> | null>(null);
  const [preprocessConfig, setPreprocessConfig] = useState<PreprocessConfig>({
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    mean: IMAGENET_MEAN,
    std: IMAGENET_STD
  });
  const [modelMetadata, setModelMetadata] = useState<{name?: string, accuracy?: number} | null>(null);
  
  const [isAutoChecking, setIsAutoChecking] = useState<boolean>(true);
  const [isLocalModel, setIsLocalModel] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-check for local files in the 'localModel' folder on mount
  useEffect(() => {
    const attemptAutoLoad = async () => {
      try {
        // Updated paths to look inside 'localModel' directory
        const [modelRes, configRes] = await Promise.all([
          fetch('./localModel/model.onnx'),
          fetch('./localModel/config.json')
        ]);

        if (modelRes.ok && configRes.ok) {
          setLoadingMessage('Initializing local engine from assets...');
          setIsLoading(true);
          
          const modelBuffer = await modelRes.arrayBuffer();
          const configJson = await configRes.json();
          
          await processModelData(modelBuffer, configJson);
          setIsLocalModel(true);
        } else {
          console.log("Local model files not found in /localModel/ folder.");
        }
      } catch (err) {
        console.log("No local model detected or error during fetch, showing uploader.");
      } finally {
        setIsAutoChecking(false);
        setIsLoading(false);
      }
    };

    attemptAutoLoad();
  }, []);

  // Reset result when image changes
  useEffect(() => {
    if (image) {
      setResult(null);
      handleClassify();
    }
  }, [image]);

  const processModelData = async (modelData: File | ArrayBuffer, jsonContent: any) => {
    try {
      let mapping: Record<string, ClassInfo> = {};
      let config: PreprocessConfig = {
         width: TARGET_WIDTH,
         height: TARGET_HEIGHT,
         mean: IMAGENET_MEAN,
         std: IMAGENET_STD
      };
      let metadata = {};

      if (Array.isArray(jsonContent.classes)) {
         const manifest = jsonContent as ModelManifest;
         config = {
           width: manifest.img_size || TARGET_WIDTH,
           height: manifest.img_size || TARGET_HEIGHT,
           mean: manifest.input_mean || IMAGENET_MEAN,
           std: manifest.input_std || IMAGENET_STD,
         };
         metadata = {
           name: manifest.model_name,
           accuracy: manifest.best_val_accuracy
         };
         manifest.classes.forEach((className, idx) => {
           const builtIn = BUILT_IN_CLASS_DESCRIPTIONS[className];
           mapping[idx.toString()] = builtIn || {
             title: className,
             description: "No detailed description available for this class.",
             tags: ["Custom"],
             details: { "Model Class Name": className }
           };
         });
      } else {
        mapping = jsonContent;
      }

      setClassData(mapping);
      setPreprocessConfig(config);
      setModelMetadata(metadata);
      
      const sess = await loadSession(modelData);
      setSession(sess);
    } catch (err) {
      console.error(err);
      throw new Error("Failed to process model configuration.");
    }
  };

  const handleModelLoad = async (modelFile: File, jsonFile: File) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Loading ONNX Model...');
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonContent = JSON.parse(e.target?.result as string);
          await processModelData(modelFile, jsonContent);
          setIsLoading(false);
        } catch (err) {
          setError("Failed to parse JSON configuration file.");
          setIsLoading(false);
        }
      };
      reader.readAsText(jsonFile);
    } catch (err) {
      setError("Failed to load model. Ensure it is a valid .onnx file.");
      setIsLoading(false);
    }
  };

  const handleClassify = async () => {
    if (!session || !image) return;

    setIsLoading(true);
    setLoadingMessage('Running Inference...');
    
    setTimeout(async () => {
      try {
        const imgElement = document.createElement('img');
        imgElement.src = image;
        imgElement.onload = async () => {
          try {
            const inferenceResult = await runInference(session, imgElement, preprocessConfig);
            setResult(inferenceResult);
            setIsModalOpen(true);
          } catch (e: any) {
            setError(`Inference failed: ${e.message}`);
          } finally {
            setIsLoading(false);
          }
        };
      } catch (e: any) {
        setError("Error processing image.");
        setIsLoading(false);
      }
    }, 100);
  };

  const resetSession = () => {
    setSession(null);
    setClassData(null);
    setImage(null);
    setResult(null);
    setError(null);
    setModelMetadata(null);
    setIsLocalModel(false);
  };

  if (isAutoChecking) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mb-4"></div>
        <p className="text-slate-400 font-medium animate-pulse">Checking /localModel/ for assets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-slate-200 font-sans selection:bg-primary selection:text-white pb-12">
      <Header />

      <main className="container mx-auto px-4 max-w-4xl mt-8">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-sm underline hover:text-white">Dismiss</button>
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-xl font-medium text-white animate-pulse">{loadingMessage}</p>
          </div>
        )}

        {!session ? (
          <ModelUploader onLoad={handleModelLoad} />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
               <div className="flex flex-col md:flex-row md:items-center gap-3">
                 <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                   {modelMetadata?.name || 'Classifier Ready'}
                 </h2>
                 {isLocalModel && (
                   <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                     <CheckBadgeIcon className="w-3.5 h-3.5" />
                     Pre-loaded Asset
                   </div>
                 )}
                 {modelMetadata?.accuracy && (
                   <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full font-mono">
                     Acc: {modelMetadata.accuracy.toFixed(2)}%
                   </span>
                 )}
               </div>
               
               <button 
                 onClick={resetSession}
                 className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
               >
                 <ArrowPathIcon className="w-4 h-4" />
                 {isLocalModel ? 'Unload Local Assets' : 'Reset Model'}
               </button>
            </div>
            
            <ClassificationView 
              image={image} 
              setImage={setImage} 
              result={result} 
              classData={classData}
              onDetailsClick={() => setIsModalOpen(true)}
              session={session}
              preprocessConfig={preprocessConfig}
            />
          </div>
        )}

        {isModalOpen && result && classData && image && (
          <InfoModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            data={classData[result.index.toString()]}
            confidence={result.probability}
            sourceImage={image}
          />
        )}

      </main>
    </div>
  );
};

export default App;
