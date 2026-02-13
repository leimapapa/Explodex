import React from 'react';
import { CpuChipIcon } from '@heroicons/react/24/outline';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-white/5 bg-card/50 backdrop-blur-md sticky top-0 z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <CpuChipIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Explodex</h1>
            <span className="text-xs text-slate-400 font-mono">Offline Ordnance Classification</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <span className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
             Privacy Protected
           </span>
        </div>
      </div>
    </header>
  );
};