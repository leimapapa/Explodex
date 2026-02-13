import React, { useState } from 'react';
import { DocumentArrowUpIcon, CodeBracketSquareIcon } from '@heroicons/react/24/outline';
import { SAMPLE_JSON } from '../constants';

interface ModelUploaderProps {
  onLoad: (model: File, json: File) => void;
}

export const ModelUploader: React.FC<ModelUploaderProps> = ({ onLoad }) => {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modelFile && jsonFile) {
      onLoad(modelFile, jsonFile);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-card border border-white/5 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Initialize Engine</h2>
          <p className="text-slate-400">Load your ONNX model and the class configuration file to begin.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Model Input */}
            <div className={`
              relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group
              ${modelFile ? 'border-primary bg-primary/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}
            `}>
              <input 
                type="file" 
                accept=".onnx" 
                onChange={(e) => e.target.files && setModelFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <DocumentArrowUpIcon className={`w-12 h-12 mb-3 ${modelFile ? 'text-primary' : 'text-slate-500 group-hover:text-slate-400'}`} />
              <h3 className="font-semibold text-slate-200">
                {modelFile ? modelFile.name : 'Upload .onnx Model'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Binary Model File</p>
            </div>

            {/* JSON Input */}
            <div className={`
              relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group
              ${jsonFile ? 'border-secondary bg-secondary/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}
            `}>
              <input 
                type="file" 
                accept=".json" 
                onChange={(e) => e.target.files && setJsonFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <CodeBracketSquareIcon className={`w-12 h-12 mb-3 ${jsonFile ? 'text-secondary' : 'text-slate-500 group-hover:text-slate-400'}`} />
              <h3 className="font-semibold text-slate-200">
                {jsonFile ? jsonFile.name : 'Upload config .json'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Class & Params Manifest</p>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 text-xs font-mono text-slate-400 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-300">Expected JSON Format:</span>
              <button 
                type="button" 
                onClick={() => navigator.clipboard.writeText(SAMPLE_JSON)}
                className="text-primary hover:text-primary-400"
              >
                Copy Sample
              </button>
            </div>
            <pre className="overflow-x-auto">{SAMPLE_JSON}</pre>
          </div>

          <button
            type="submit"
            disabled={!modelFile || !jsonFile}
            className={`
              w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all
              ${modelFile && jsonFile 
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-primary/25 hover:shadow-primary/40 scale-[1.02]' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
            `}
          >
            Load System
          </button>
        </form>
      </div>
    </div>
  );
};