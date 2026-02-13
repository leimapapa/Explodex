import React from 'react';
import { APP_LOGO_SVG_SQUARE } from '../constants';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-white/5 bg-card/50 backdrop-blur-md sticky top-0 z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden h-10 w-10">
            {/* Injecting SVG directly and controlling color with CSS currentColor */}
            <div 
              className="w-full h-full text-primary scale-110"
              dangerouslySetInnerHTML={{ __html: APP_LOGO_SVG_SQUARE }}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">Explodex</h1>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-0.5 block">AI Ordnance Classification</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
           <span className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
             Privacy Protected
           </span>
        </div>
      </div>
    </header>
  );
};