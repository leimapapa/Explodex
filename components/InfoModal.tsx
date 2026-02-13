import React, { useEffect, useState } from 'react';
import { XMarkIcon, TagIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { ClassInfo } from '../types';
import { ReportWizard } from './ReportWizard';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ClassInfo;
  confidence: number;
  sourceImage: string;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, data, confidence, sourceImage }) => {
  const [show, setShow] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
      setIsWizardOpen(false); // Reset wizard state on close
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`
        relative w-full max-w-2xl bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]
        transition-all duration-300 transform
        ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}
      `}>
        
        {isWizardOpen ? (
          <ReportWizard 
            data={data} 
            confidence={confidence} 
            sourceImage={sourceImage} 
            onCancel={() => setIsWizardOpen(false)} 
          />
        ) : (
          <>
            {/* Header Image or Gradient */}
            <div className="h-48 w-full bg-slate-800 relative shrink-0">
              {sourceImage ? (
                <img src={sourceImage} alt={data.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary via-purple-900 to-dark flex items-center justify-center">
                  <TagIcon className="w-20 h-20 text-white/20" />
                </div>
              )}
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-card to-transparent p-6 pt-12">
                <h2 className="text-4xl font-bold text-white drop-shadow-md">{data.title}</h2>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto min-h-0">
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  Confidence: {(confidence * 100).toFixed(2)}%
                </div>
                {data.tags && data.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-xl font-semibold text-white mb-2">Description</h3>
                <p className="text-slate-300 leading-relaxed mb-8">
                  {data.description}
                </p>

                {data.details && (
                  <>
                    <h3 className="text-xl font-semibold text-white mb-4">Technical Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(data.details).map(([key, value]) => (
                        <div key={key} className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                          <span className="text-xs uppercase tracking-wider text-slate-500 block mb-1">{key}</span>
                          <span className="text-slate-200 font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-900/50 flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
              <button 
                 onClick={() => setIsWizardOpen(true)}
                 className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-600 text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Create PDF Report
              </button>
              <button 
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};