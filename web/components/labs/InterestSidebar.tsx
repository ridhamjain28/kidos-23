import React from 'react';
import { LABS_TAGS, LabsTag } from '@/lib/labs';

interface Props {
  profile: Record<LabsTag, number>;
  age: number;
}

export const InterestSidebar: React.FC<Props> = ({ profile, age }) => {
  return (
    <div className="w-72 bg-slate-900/60 p-7 rounded-[2rem] border border-slate-800/50 backdrop-blur-xl sticky top-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
        <h3 className="text-xs font-black text-cyan-500 uppercase tracking-[0.2em]">Neural DNA</h3>
        <div className="ml-auto px-2 py-0.5 bg-slate-800 rounded text-[10px] font-bold text-slate-400">
          AGE {age}
        </div>
      </div>
      
      <div className="space-y-6">
        {LABS_TAGS.map((tag) => {
          const score = profile[tag];
          // Map -5 to 10 to 0% to 100%
          const percentage = ((score + 5) / 15) * 100;
          
          return (
            <div key={tag} className="space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-300 tracking-wide">{tag}</span>
                <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                  score > 0 ? "text-cyan-400 bg-cyan-950/30" : 
                  score < 0 ? "text-rose-400 bg-rose-950/30" : 
                  "text-slate-500"
                }`}>
                  {score > 0 ? `+${score}` : score}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                    score > 0 ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' : 
                    score < 0 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 
                    'bg-slate-700'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 pt-6 border-t border-slate-800">
        <p className="text-[10px] text-slate-500 leading-relaxed italic">
          DNA updates in real-time as the brain monitors your interactions.
        </p>
      </div>
    </div>
  );
};
