import React from 'react';
import { LabsContent, LabsTag } from '@/lib/labs';

interface Props {
  mainItem: LabsContent;
  recommendations: LabsContent[];
  onSignal: (itemId: string, tags: LabsTag[], signal: 'full' | 'partial' | 'early_skip' | 'click') => void;
  loading: boolean;
}

export const WatchMode: React.FC<Props> = ({ mainItem, recommendations, onSignal, loading }) => {
  if (!mainItem) return null;

  return (
    <div className="space-y-10">
      {/* Immersive Main Player Mock */}
      <div className="bg-slate-900 rounded-[3rem] p-12 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
          <div className="h-full bg-cyan-500 animate-[loading_10s_linear_infinite] shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center py-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-950/50 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-8 border border-cyan-800/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            Neural Stream Active
          </div>
          
          <h2 className="text-4xl font-black text-white mb-6 leading-tight tracking-tight">
            {mainItem.title}
          </h2>
          <p className="text-slate-400 text-xl leading-relaxed mb-12 font-medium">
            {mainItem.body}
          </p>
          
          <div className="flex justify-center items-center gap-6">
            <button 
              disabled={loading}
              onClick={() => onSignal(mainItem.id, mainItem.tags, 'full')}
              className="group/btn bg-white hover:bg-cyan-50 text-slate-950 font-black px-10 py-5 rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30 shadow-xl"
            >
              Finish Watching
            </button>
            <button 
              disabled={loading}
              onClick={() => onSignal(mainItem.id, mainItem.tags, 'early_skip')}
              className="text-slate-500 hover:text-rose-400 font-bold px-6 py-5 transition-colors disabled:opacity-30 flex items-center gap-2"
            >
              Skip Session
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Decorative corner accents */}
        <div className="absolute bottom-6 right-8 text-[10px] font-mono text-slate-700 select-none">
          CHANNELS: {mainItem.tags.join(' // ')}
        </div>
      </div>

      {/* Intelligent Recommendations Tray */}
      <div>
        <div className="flex items-center justify-between mb-6 px-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Recommended Channels
          </h3>
          <span className="text-[10px] text-cyan-600 font-bold">Ranked by Affinity</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <div 
              key={rec.id} 
              onClick={() => !loading && onSignal(rec.id, rec.tags, 'click')}
              className="group bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/50 hover:border-cyan-500/40 cursor-pointer transition-all hover:translate-y-[-4px] backdrop-blur-sm"
            >
              <div className="flex gap-1.5 mb-4">
                {rec.tags.map(t => (
                  <span key={t} className="text-[8px] font-bold text-cyan-600 uppercase">
                    #{t}
                  </span>
                ))}
              </div>
              <h4 className="text-white font-black text-base mb-3 group-hover:text-cyan-200 transition-colors line-clamp-2 leading-snug">
                {rec.title}
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                Switch to this
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};
