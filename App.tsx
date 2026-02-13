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

  /**
   * Ultra-fast Auto-detection:
   * Pings localModel/manifest.json. If it doesn't respond in 500ms, fallback to manual.
   */
  useEffect(() => {
    const attemptAutoLoad = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500); // Tight 500ms probe

      try {
        // Try to fetch manifest.json header first to see if it exists
        const response = await fetch('./localModel/manifest.json', { 
          method: 'GET',
          signal: controller.signal 
        });
        
        if (response.ok) {
          const configJson = await response.json();
          // Manifest exists, start full model load
          await loadFromPaths('model.onnx', configJson);
        } else {
          setIsAutoChecking(false);
        }
      } catch (err) {
        // Most likely 404 or Timeout
        console.log("Auto-detection: Local assets not found. Switching to manual mode.");
        setIsAutoChecking(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const loadFromPaths = async (onnxPath: string, configJson: any) => {
      setLoadingMessage(`Booting Embedded System...`);
      setIsLoading(true);
      try {
        const modelRes = await fetch(`./localModel/${onnxPath}`);
        if (modelRes.ok) {
          const modelBuffer = await modelRes.arrayBuffer();
          await processModelData(modelBuffer, configJson);
          setIsLocalModel(true);
        }
      } catch (e) {
        console.error("Local model binary failed to load:", e);
      } finally {
        setIsLoading(false);
        setIsAutoChecking(false);
      }
    };

    attemptAutoLoad();
  }, []);

  useEffect(() => {
    if (image && session) {
      setResult(null);
      handleClassify();
    }
  }, [image, session]);

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

      if (jsonContent && Array.isArray(jsonContent.classes)) {
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
             description: "External dataset class detected.",
             tags: ["Custom"],
             details: { "Label": className }
           };
         });
      } else if (jsonContent) {
        mapping = jsonContent;
      }

      setClassData(mapping);
      setPreprocessConfig(config);
      setModelMetadata(metadata);
      
      const sess = await loadSession(modelData);
      setSession(sess);
    } catch (err) {
      console.error(err);
      throw new Error("Invalid Model Configuration: Check JSON and ONNX compatibility.");
    }
  };

  const handleModelLoad = async (modelFile: File, jsonFile: File) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Optimizing Neural Hub...');
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonContent = JSON.parse(e.target?.result as string);
          await processModelData(modelFile, jsonContent);
          setIsLoading(false);
        } catch (err) {
          setError("Manifest Error: JSON format is invalid.");
          setIsLoading(false);
        }
      };
      reader.readAsText(jsonFile);
    } catch (err) {
      setError("ONNX Error: System could not initialize model binary.");
      setIsLoading(false);
    }
  };

  const handleClassify = async () => {
    if (!session || !image) return;

    setIsLoading(true);
    setLoadingMessage('Processing Signal...');
    
    // Defer for UI responsiveness
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
            setError(`Inference Fault: ${e.message}`);
          } finally {
            setIsLoading(false);
          }
        };
        imgElement.onerror = () => {
          setError("Signal Error: Image buffer corrupted.");
          setIsLoading(false);
        };
      } catch (e: any) {
        setError("Core System Failure.");
        setIsLoading(false);
      }
    }, 50);
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
        <div className="relative h-12 w-12 mb-6">
           <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
           <div className="relative animate-spin rounded-full h-12 w-12 border-t-2 border-primary shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
        </div>
        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">Syncing Local Assets</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-slate-200 font-sans selection:bg-primary selection:text-white pb-12">
      <Header />

      <main className="container mx-auto px-4 max-w-4xl mt-8 animate-in fade-in duration-700">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-center justify-between shadow-lg">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-[10px] font-bold uppercase tracking-widest bg-red-500/20 px-3 py-1 rounded-md hover:bg-red-500/30 ml-4 transition-colors">Clear</button>
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4 shadow-[0_0_30px_rgba(99,102,241,0.3)]"></div>
            <p className="text-sm font-bold text-white uppercase tracking-[0.2em] animate-pulse">{loadingMessage}</p>
          </div>
        )}

        {!session ? (
          <ModelUploader onLoad={handleModelLoad} />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
               <div className="flex flex-col md:flex-row md:items-center gap-3">
                 <h2 className="text-2xl font-bold text-white">
                   {modelMetadata?.name || 'Active Instance'}
                 </h2>
                 {isLocalModel && (
                   <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                     <CheckBadgeIcon className="w-3.5 h-3.5" />
                     Auto-Linked
                   </div>
                 )}
                 {modelMetadata?.accuracy && (
                   <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full font-mono font-bold">
                     ACC: {modelMetadata.accuracy.toFixed(1)}%
                   </span>
                 )}
               </div>
               
               <button 
                 onClick={resetSession}
                 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
               >
                 <ArrowPathIcon className="w-3.5 h-3.5" />
                 Unload
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