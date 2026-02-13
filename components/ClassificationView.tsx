import React, { useRef, useState, useEffect } from 'react';
import { 
  CameraIcon, 
  PhotoIcon, 
  SparklesIcon, 
  XMarkIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  BoltIcon, 
  StopIcon,
  ArrowPathRoundedSquareIcon 
} from '@heroicons/react/24/outline';
import { InferenceResult, ClassInfo, PreprocessConfig } from '../types';
import { fileToBase64 } from '../utils/imageUtils';
import { runInference } from '../services/onnxService';

interface ClassificationViewProps {
  image: string | null;
  setImage: (img: string | null) => void;
  result: InferenceResult | null;
  classData: Record<string, ClassInfo> | null;
  onDetailsClick: () => void;
  session: any;
  preprocessConfig: PreprocessConfig;
}

export const ClassificationView: React.FC<ClassificationViewProps> = ({ 
  image, 
  setImage, 
  result, 
  classData,
  onDetailsClick,
  session,
  preprocessConfig
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);
  const [liveResult, setLiveResult] = useState<InferenceResult | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>(0);
  const processingRef = useRef<boolean>(false);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Continuous Inference Loop
  useEffect(() => {
    if (isCameraOpen && isContinuous && session && videoRef.current) {
      const loop = async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
           requestRef.current = requestAnimationFrame(loop);
           return;
        }

        if (!processingRef.current) {
          processingRef.current = true;
          try {
            // Throttle slightly by awaiting inference
            const res = await runInference(session, videoRef.current, preprocessConfig);
            setLiveResult(res);
          } catch (e) {
            console.error("Continuous inference error:", e);
          } finally {
            processingRef.current = false;
          }
        }
        requestRef.current = requestAnimationFrame(loop);
      };

      requestRef.current = requestAnimationFrame(loop);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      setLiveResult(null);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isCameraOpen, isContinuous, session, preprocessConfig]);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const b64 = await fileToBase64(e.target.files[0]);
      setImage(b64);
      // Reset input value so same file can be selected again if needed
      e.target.value = '';
      setShowAlternatives(false);
    }
  };

  const setupCameraStream = async (mode: 'environment' | 'user') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode,
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error("Camera access failed:", e);
      alert("Could not access camera. Please ensure you have granted camera permissions.");
      setIsCameraOpen(false);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      setFacingMode('environment');
      // Small delay to ensure the modal DOM is rendered before attaching stream
      setTimeout(() => setupCameraStream('environment'), 100);
    } catch (e) {
      console.error(e);
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setLiveResult(null);
    setIsContinuous(false); // Reset to single shot
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const handleFlipCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    setupCameraStream(newMode);
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw video frame to canvas
        ctx.drawImage(videoRef.current, 0, 0);
        // Convert to base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setImage(dataUrl);
        setShowAlternatives(false);
        stopCamera();
      }
    }
  };

  // Safe lookup for result
  const matchedInfo = (result && classData) ? classData[result.index.toString()] : null;

  // Live Result Info
  const liveInfo = (liveResult && classData) ? classData[liveResult.index.toString()] : null;

  return (
    <>
      {/* Full Screen Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />
            
            {/* Live Result Overlay */}
            {isContinuous && liveResult && (
               <div className="absolute top-24 inset-x-4 md:inset-x-auto md:w-96 md:left-1/2 md:-translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center animate-in slide-in-from-top-4 transition-all">
                  <div className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1">
                     Live Inference
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 truncate">
                    {liveInfo ? liveInfo.title : `Class ${liveResult.index}`}
                  </h3>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="h-2 w-32 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-100"
                        style={{ width: `${liveResult.probability * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-primary font-bold">{(liveResult.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 font-mono">
                    Time: {liveResult.inferenceTime.toFixed(1)}ms
                  </div>
               </div>
            )}

            {/* Viewfinder Overlay - Only show when NOT in continuous mode or when no live result yet */}
            {(!isContinuous || !liveResult) && (
              <div className="absolute inset-0 pointer-events-none border-[30px] border-black/30 transition-opacity duration-500">
                 <div className="w-full h-full border-2 border-white/20 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                 </div>
              </div>
            )}

            <button 
              onClick={stopCamera}
              className="absolute top-6 right-6 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-md z-20"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
          </div>
          
          {/* Camera Controls */}
          <div className="bg-black/90 flex flex-col items-center justify-center pb-8 pt-6 gap-6 relative z-20 border-t border-white/10">
             
             {/* Mode Toggle */}
             <div className="flex items-center bg-slate-800/80 rounded-full p-1 border border-white/10">
               <button 
                 onClick={() => setIsContinuous(false)}
                 className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!isContinuous ? 'bg-white text-black shadow-md' : 'text-slate-400 hover:text-white'}`}
               >
                 Single Shot
               </button>
               <button 
                 onClick={() => setIsContinuous(true)}
                 className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${isContinuous ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
               >
                 <BoltIcon className="w-3 h-3" />
                 Continuous
               </button>
             </div>

             <div className="flex items-center justify-between gap-8 w-full px-8 max-w-md">
                <button 
                  onClick={stopCamera}
                  className="text-white text-sm font-medium hover:text-slate-300 px-4 py-2 w-20"
                >
                  Cancel
                </button>
                
                {/* Trigger Button */}
                <button 
                  onClick={takePhoto}
                  className={`
                    w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all shadow-lg active:scale-95
                    ${isContinuous 
                      ? 'border-red-500 bg-red-500/20 hover:bg-red-500/40 shadow-red-900/20' 
                      : 'border-white bg-white/20 hover:bg-white/40 shadow-white/10'}
                  `}
                >
                  {isContinuous ? (
                     <StopIcon className="w-8 h-8 text-red-500" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white"></div>
                  )}
                </button>
                
                {/* Flip Camera Button */}
                <button 
                  onClick={handleFlipCamera}
                  className="text-white hover:text-slate-300 px-4 py-2 w-20 flex flex-col items-center justify-center gap-1"
                >
                  <ArrowPathRoundedSquareIcon className="w-6 h-6" />
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Flip</span>
                </button>
             </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
        
        {/* Image Area */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-black/40 rounded-2xl overflow-hidden border border-white/10 shadow-inner group">
            {image ? (
               <img src={image} alt="Input" className="w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <PhotoIcon className="w-16 h-16 mb-4 opacity-50" />
                <p>No Image Selected</p>
              </div>
            )}
            
            {/* Overlay Actions */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex gap-3 justify-center">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white px-4 py-2 rounded-lg transition-all"
              >
                <PhotoIcon className="w-5 h-5" />
                <span>Upload</span>
              </button>
              <button 
                 onClick={startCamera}
                 className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg shadow-primary/25 transition-all"
              >
                <CameraIcon className="w-5 h-5" />
                <span>Capture</span>
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                // Removed capture="environment" to ensure this always opens file picker
                onChange={handleFileChange} 
                className="hidden" 
              />
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex flex-col h-full">
          {result ? (
            <div className="bg-card border border-white/5 rounded-2xl p-6 flex flex-col h-full shadow-xl">
               <div className="mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Top Prediction</span>
                    <span className="text-xs font-mono text-slate-500">{result.inferenceTime.toFixed(1)}ms</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {matchedInfo ? matchedInfo.title : `Class ${result.index}`}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out"
                        style={{ width: `${result.probability * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-primary font-bold">{(result.probability * 100).toFixed(1)}%</span>
                  </div>

                  {/* Alternatives Toggle */}
                  <button 
                    onClick={() => setShowAlternatives(!showAlternatives)}
                    className="mt-3 flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {showAlternatives ? <ChevronUpIcon className="w-3 h-3"/> : <ChevronDownIcon className="w-3 h-3"/>}
                    {showAlternatives ? 'Hide Alternatives' : 'Show 2nd & 3rd Candidates'}
                  </button>

                  {/* Alternatives List */}
                  {showAlternatives && result.candidates && result.candidates.length > 1 && (
                    <div className="mt-3 space-y-2 pl-2 border-l-2 border-slate-700 animate-in fade-in slide-in-from-top-2">
                       {result.candidates.slice(1, 3).map((candidate) => {
                          const info = classData ? classData[candidate.index.toString()] : null;
                          const name = info ? info.title : `Class ${candidate.index}`;
                          const prob = (candidate.probability * 100).toFixed(1);
                          return (
                            <div key={candidate.index} className="text-sm">
                              <div className="flex justify-between text-slate-300 mb-1">
                                <span>{name}</span>
                                <span className="font-mono text-slate-500">{prob}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-slate-500" 
                                  style={{ width: `${candidate.probability * 100}%` }} 
                                />
                              </div>
                            </div>
                          );
                       })}
                    </div>
                  )}
               </div>

               <div className="flex-grow space-y-4">
                 <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                   <h4 className="text-sm font-semibold text-slate-300 mb-2">Brief</h4>
                   <p className="text-slate-400 leading-relaxed text-sm">
                     {matchedInfo ? matchedInfo.description : 'No description available in the provided JSON map.'}
                   </p>
                 </div>
               </div>

               <button 
                 onClick={onDetailsClick}
                 className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-white font-medium transition-all group"
               >
                 <SparklesIcon className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                 View Full Details
               </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-8">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <SparklesIcon className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-center max-w-xs">Upload or capture an image to see the neural network results here.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};