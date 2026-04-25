'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LABS_TAGS, 
  LabsTag, 
  LabsContent, 
  INITIAL_USER_PROFILE, 
  FALLBACK_POOL, 
  CLAMP, 
  SCORING,
  DEFAULT_AGE
} from '@/lib/labs';
import { InterestSidebar } from '@/components/labs/InterestSidebar';
import { DiscoverMode } from '@/components/labs/DiscoverMode';
import { WatchMode } from '@/components/labs/WatchMode';
import { supabase } from '@/lib/supabase';

export default function LabsPage() {
  const [mode, setMode] = useState<'discover' | 'watch'>('discover');
  const [profile, setProfile] = useState(INITIAL_USER_PROFILE);
  const [age, setAge] = useState(DEFAULT_AGE);
  const [discoverPool, setDiscoverPool] = useState<LabsContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [genContext, setGenContext] = useState<string | null>(null);

  // Initialize with some fallback data and start IBLM session
  useEffect(() => {
    setDiscoverPool(FALLBACK_POOL.slice(0, 2));
    
    const backendUrl = process.env.NEXT_PUBLIC_IBLM_BACKEND_URL || 'http://localhost:8000';
    const userId = (typeof window !== 'undefined' ? localStorage.getItem('kidos_user_id') : null) || 'demo_user';
    
    // 1. Start IBLM session
    fetch(`${backendUrl}/iblm/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    }).catch(() => null);

    // 2. Load kernel tag scores into local profile
    fetch(`${backendUrl}/iblm/kernel/${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(kernel => {
        if (kernel?.tag_scores) {
          // Merge IBLM tag scores into local profile state
          setProfile(prev => {
            const merged = { ...prev };
            Object.entries(kernel.tag_scores).forEach(([tag, score]) => {
              if (tag in merged) merged[tag] = score as number;
            });
            return merged;
          });
        }
      })
      .catch(() => null);
  }, []);

  const updateProfile = (tags: LabsTag[], score: number) => {
    setLoading(true);
    // 300ms delay for "thoughtful" profile update
    setTimeout(() => {
      setProfile((prev) => {
        const next = { ...prev };
        tags.forEach((tag) => {
          next[tag] = Math.min(CLAMP.MAX, Math.max(CLAMP.MIN, next[tag] + score));
        });
        return next;
      });
      setLoading(false);
    }, 300);
  };

  const handleDiscoverSignal = (itemId: string, tags: LabsTag[], signal: 'like' | 'skip' | 'view') => {
    const score = SCORING.DISCOVER[signal.toUpperCase() as keyof typeof SCORING.DISCOVER];
    updateProfile(tags, score);
    
    // Send IBLM interaction telemetry
    const backendUrl = process.env.NEXT_PUBLIC_IBLM_BACKEND_URL || 'http://localhost:8000';
    const userId = (typeof window !== 'undefined' ? localStorage.getItem('kidos_user_id') : null) || 'demo_user';

    fetch(`${backendUrl}/iblm/tag-signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        tags: tags,
        signal: signal,
        content_id: itemId
      })
    }).catch(() => null);

    // Rotate items in discover pool with a slight delay
    setTimeout(() => {
      setDiscoverPool((prev) => {
        const filtered = prev.filter(it => it.id !== itemId);
        const unused = FALLBACK_POOL.filter(f => !prev.find(p => p.id === f.id));
        const next = unused.length > 0 
          ? unused[Math.floor(Math.random() * unused.length)]
          : FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
        
        const newItem = { ...next, id: `${next.id}-${Date.now()}` };
        return [...filtered, newItem];
      });
    }, 300);
  };

  const handleWatchSignal = (itemId: string, tags: LabsTag[], signal: 'full' | 'partial' | 'early_skip' | 'click') => {
    const key = signal.toUpperCase().replace(' ', '_') as keyof typeof SCORING.WATCH;
    const score = SCORING.WATCH[key];
    updateProfile(tags, score);

    const backendUrl = process.env.NEXT_PUBLIC_IBLM_BACKEND_URL || 'http://localhost:8000';
    const userId = (typeof window !== 'undefined' ? localStorage.getItem('kidos_user_id') : null) || 'demo_user';

    fetch(`${backendUrl}/iblm/tag-signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        tags: tags,
        signal: signal,
        content_id: itemId
      })
    }).catch(() => null);
  };

  // Recommendation Logic for Watch Mode (Unified Brain)
  const recommendations = useMemo(() => {
    return [...FALLBACK_POOL]
      .map(item => {
        // Calculate score based on user profile
        const score = item.tags.reduce((acc, tag) => acc + profile[tag], 0);
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(x => x.item);
  }, [profile]);

  const mainWatchItem = recommendations[0] || FALLBACK_POOL[0];
  const watchRecs = recommendations.slice(1);

  const handleSynthesize = async () => {
    setSynthesisLoading(true);
    
    // 1. Get User ID (Supabase Session or LocalStorage)
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || (typeof window !== 'undefined' ? localStorage.getItem('kidos_user_id') : null) || 'demo_user';

    // 2. Fetch IBLM Kernel for grounding and tag scores
    const backendUrl = process.env.NEXT_PUBLIC_IBLM_BACKEND_URL || 'http://localhost:8000';
    const kernelRes = await fetch(`${backendUrl}/iblm/kernel/${userId}`).catch(() => null);
    const kernel = kernelRes?.ok ? await kernelRes.json() : null;
    const iblmTagScores = kernel?.tag_scores || {};

    // 3. Use IBLM tag scores for top tags if available, else fallback to local profile
    const scoresToUse = Object.keys(iblmTagScores).length > 0 ? iblmTagScores : profile;
    const sortedTags = Object.entries(scoresToUse)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([t]) => t as LabsTag);
    
    const top2 = sortedTags.slice(0, 2);
    setGenContext(top2.join(' + '));

    try {
      // 4. Build Mission Briefing
      const mission_briefing = kernel ? 
        `Child profile: curiosity_type=${kernel.curiosity_type}, frustration_threshold=${kernel.frustration_threshold}, sessions=${kernel.total_sessions}. Top rules: ${JSON.stringify((kernel.rules || []).slice(0, 3))}. Growth: ${JSON.stringify(kernel.growth_projections || {})}` 
        : '';

      // 5. Call Synthesis API with Mission Briefing
      const res = await fetch('/api/labs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topTags: top2, 
          age,
          userId,
          mission_briefing 
        }),
      });
      
      const data = await res.json();
      
      // Artificial 2s delay for "Neural Synthesis"
      setTimeout(() => {
        setDiscoverPool(data.items);
        setMode('discover');
        setSynthesisLoading(false);
      }, 2000);
    } catch (err) {
      console.error("Synthesis failed", err);
      setSynthesisLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-8 selection:bg-cyan-500/30">
      <div className="max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-12 items-start">
        
        {/* DNA Sidebar */}
        <InterestSidebar profile={profile} age={age} />

        {/* Main Interface Area */}
        <div className="flex-1 space-y-12 w-full">
          
          {/* Engine Status & Control Bar */}
          <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-slate-900/30 p-12 rounded-[3.5rem] border border-slate-800/40 backdrop-blur-md shadow-inner">
            <div className="space-y-3">
              <h1 className="text-6xl font-black text-white tracking-tighter italic">
                CogniLabs<span className="text-cyan-500">.</span>
              </h1>
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-12 bg-cyan-800" />
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">
                  Hybrid Intelligence Hub
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {/* Age Selector */}
              <div className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-2xl border border-slate-800/50">
                <span className="text-[10px] font-black text-slate-500 ml-2">AGE</span>
                <input 
                  type="range" 
                  min="5" 
                  max="12" 
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value))}
                  className="w-24 accent-cyan-500 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer"
                />
                <span className="text-sm font-black text-white w-6">{age}</span>
              </div>

              <nav className="flex bg-slate-950/80 p-2 rounded-[1.5rem] border border-slate-800/50 shadow-2xl">
                <button 
                  onClick={() => setMode('discover')}
                  className={`px-10 py-4 rounded-2xl text-[11px] font-black tracking-widest transition-all ${
                    mode === 'discover' 
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)]' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  DISCOVER
                </button>
                <button 
                  onClick={() => setMode('watch')}
                  className={`px-10 py-4 rounded-2xl text-[11px] font-black tracking-widest transition-all ${
                    mode === 'watch' 
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)]' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  WATCH
                </button>
              </nav>

              <button 
                onClick={handleSynthesize}
                disabled={synthesisLoading}
                className="group relative flex items-center gap-4 bg-white hover:bg-cyan-50 text-slate-950 px-10 py-5 rounded-[1.5rem] transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 shadow-2xl overflow-hidden"
              >
                <span className="font-black text-xs uppercase tracking-widest relative z-10">Neural Synthesis</span>
                <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>
          </header>

          {/* Synthesis Loading Overlay */}
          {synthesisLoading && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/90 backdrop-blur-2xl animate-in fade-in duration-500">
               <div className="text-center space-y-10 max-w-lg px-10">
                  <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-cyan-500/10 rounded-full animate-pulse border border-cyan-500/20" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-white tracking-tight">Synthesizing Nodes</h2>
                    <div className="flex items-center justify-center gap-3">
                        <span className="px-3 py-1 bg-slate-900 text-slate-400 text-[10px] font-mono rounded border border-slate-800">TARGET: {genContext}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                    <div className="h-full bg-cyan-500 animate-[loading_2s_ease-in-out_infinite]" />
                  </div>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">Calibrating Neural Pathways...</p>
               </div>
            </div>
          )}

          {/* Active Mode Workspace */}
          <main className="relative min-h-[500px]">
            <div className="transition-all duration-700 ease-in-out">
              {mode === 'discover' ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center gap-6 px-6">
                      <div className="h-[2px] w-8 bg-slate-800" />
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Active Discovery Stream</span>
                  </div>
                  <DiscoverMode 
                    items={discoverPool} 
                    onSignal={handleDiscoverSignal} 
                    loading={loading} 
                  />
                </div>
              ) : (
                <div className="animate-in slide-in-from-right-8 duration-700">
                  <WatchMode 
                    mainItem={mainWatchItem} 
                    recommendations={watchRecs} 
                    onSignal={handleWatchSignal} 
                    loading={loading} 
                  />
                </div>
              )}
            </div>
          </main>

        </div>
      </div>

      <style jsx global>{`
        @keyframes loading {
          0% { transform: translateX(-100%); width: 20%; }
          50% { transform: translateX(50%); width: 50%; }
          100% { transform: translateX(200%); width: 20%; }
        }
        body {
          background-color: #020617;
        }
      `}</style>
    </div>
  );
}
