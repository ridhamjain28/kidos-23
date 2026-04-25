import React from 'react';
import { LabsContent, LabsTag } from '@/lib/labs';

interface Props {
  items: LabsContent[];
  onSignal: (itemId: string, tags: LabsTag[], signal: 'like' | 'skip' | 'view') => void;
  loading: boolean;
}

export const DiscoverMode: React.FC<Props> = ({ items, onSignal, loading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[420px]">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="group relative bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800/50 hover:border-cyan-500/30 transition-all duration-500 flex flex-col justify-between overflow-hidden backdrop-blur-sm"
        >
          {/* Subtle Background Glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/5 blur-[80px] group-hover:bg-cyan-500/10 transition-all duration-700" />
          
          <div className="relative z-10">
            <div className="flex gap-2 mb-6">
              {item.tags.map(t => (
                <span key={t} className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/30">
                  {t}
                </span>
              ))}
            </div>
            <h2 className="text-2xl font-black text-white mb-4 leading-[1.1] tracking-tight group-hover:text-cyan-100 transition-colors">
              {item.title}
            </h2>
            <p className="text-slate-400 text-base leading-relaxed line-clamp-3">
              {item.body}
            </p>
          </div>

          <div className="flex gap-4 mt-10 relative z-10">
            <button 
              disabled={loading}
              onClick={() => onSignal(item.id, item.tags, 'like')}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 shadow-[0_4px_20px_rgba(6,182,212,0.2)]"
            >
              Like
            </button>
            <button 
              disabled={loading}
              onClick={() => onSignal(item.id, item.tags, 'skip')}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-30 border border-slate-700/50"
            >
              Skip
            </button>
          </div>
        </div>
      ))}
      
      {items.length === 0 && !loading && (
        <div className="col-span-2 flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-800 rounded-[3rem]">
          <p className="text-slate-500 font-medium">No intelligence nodes available.</p>
          <p className="text-slate-600 text-sm mt-2">Trigger a new synthesis or adjust your DNA profile.</p>
        </div>
      )}
    </div>
  );
};
