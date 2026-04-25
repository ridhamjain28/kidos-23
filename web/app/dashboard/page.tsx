'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ContentCard from '@/components/ContentCard';
import LoadingCard from '@/components/LoadingCard';
import TopicPill from '@/components/TopicPill';
import AskAnything from '@/components/AskAnything';
import HomeView from '@/components/views/HomeView';
import LearnView from '@/components/views/LearnView';
import CreateView from '@/components/views/CreateView';
import ProgressView from '@/components/views/ProgressView';
import PageHeader from '@/components/ui/PageHeader';

const NAV_ITEMS = [
  { id: 'home',     label: 'Home',     emoji: '🏠' },
  { id: 'learn',    label: 'Learn',    emoji: '🗺️' },
  { id: 'ask',      label: 'Ask AI',   emoji: '🤖', primary: true },
  { id: 'create',   label: 'Create',   emoji: '🎨' },
  { id: 'stories',  label: 'Stories',  emoji: '📖' },
  { id: 'progress', label: 'Progress', emoji: '⭐' },
];

const TOPICS = [
  { emoji: '🚀', label: 'Space',     value: 'space'     },
  { emoji: '🦁', label: 'Animals',   value: 'animals'   },
  { emoji: '🔢', label: 'Maths',     value: 'math'      },
  { emoji: '🔬', label: 'Science',   value: 'science'   },
  { emoji: '💻', label: 'Coding',    value: 'coding'    },
  { emoji: '🎨', label: 'Art',       value: 'art'       },
];

export interface ContentData {
  content_id: string | null;
  topic: string;
  format: string;
  difficulty: string;
  content: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; age: number; nickname: string; topicScores: Record<string,number>; formatPreferences?: Record<string,number> } | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [cards, setCards] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(false);

  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());

  useEffect(() => {
    const raw = localStorage.getItem('kidos_user');
    if (!raw) { 
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        age: 8,
        nickname: 'Explorer',
        topicScores: {}
      };
      setUser(mockUser);
      localStorage.setItem('kidos_user', JSON.stringify(mockUser));
      return; 
    }
    setUser(JSON.parse(raw));
  }, [router]);

  // IBLM Session Lifecycle
  useEffect(() => {
    if (!user) return;
    
    const IBLM_BACKEND_URL = process.env.NEXT_PUBLIC_IBLM_BACKEND_URL || 'http://localhost:8001';
    
    // Start session
    fetch(`${IBLM_BACKEND_URL}/iblm/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id })
    }).catch(console.error);

    const endSession = () => {
      fetch(`${IBLM_BACKEND_URL}/iblm/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, mastery_updates: {} }),
        keepalive: true
      }).catch(console.error);
    };

    window.addEventListener('beforeunload', endSession);
    return () => {
      window.removeEventListener('beforeunload', endSession);
      endSession();
    };
  }, [user]);

  const fetchContent = useCallback(async (format?: string, topic?: string) => {
    if (!user) return;
    setLoading(true);
    setCards([]);

    try {
      const requests = Array.from({ length: 3 }, () =>
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            topic: topic ?? undefined,
            format: format ?? undefined,
            age: user.age,
            local_profile: {
              topic_scores: user.topicScores || {},
              format_preferences: user.formatPreferences || {}
            }
          }),
        }).then(r => r.json()),
      );

      const results = await Promise.all(requests);
      setCards(results.filter(r => r.ok).map((r) => ({
        content_id: r.content_id,
        topic: r.topic,
        format: r.format,
        difficulty: r.difficulty,
        content: r.content,
      })));
    } catch (err) {
      console.error('fetchContent error', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'stories') {
      fetchContent('story', selectedTopic ?? undefined);
    }
  }, [user, activeTab, selectedTopic, fetchContent]);

  const handleMoreLikeThis = (topic: string, format: string) => {
    setSelectedTopic(topic);
    fetchContent(format, topic);
  };

  const handleCardInteraction = async (
    contentId: string | null,
    action: string,
    durationSeconds: number,
    topic: string,
    format: string
  ) => {
    if (!user || !contentId) return;

    // Behavioral Telemetry (IBLM Block 1)
    const now = Date.now();
    const skipLatency = action === 'skip' ? now - lastInteractionTime : null;
    const currentTapVelocity = 1000 / (now - lastInteractionTime); // actions per second
    setLastInteractionTime(now);

    const behavioral_metadata = {
      skip_latency_ms: skipLatency,
      tap_velocity: currentTapVelocity,
      dwell_time_seconds: durationSeconds,
      timestamp: new Date().toISOString()
    };

    const clamp = (v: number) => Math.min(5, Math.max(0, v));
    const newUser = { ...user };
    if (!newUser.topicScores) newUser.topicScores = {};
    const fPrefs = user.formatPreferences || {};

    const tScore = newUser.topicScores[topic] || 0;
    const fScore = fPrefs[format] || 0;

    if (['like', 'finish', 'more_like_this'].includes(action)) {
      newUser.topicScores[topic] = clamp(tScore + 1);
      fPrefs[format] = clamp(fScore + 1);
    } else if (action === 'too_easy') {
      newUser.topicScores[topic] = clamp(tScore + 0.5);
    } else if (action === 'too_hard') {
      newUser.topicScores[topic] = clamp(tScore + 0.25);
    } else if (action === 'skip') {
      newUser.topicScores[topic] = clamp(tScore - 0.5);
      fPrefs[format] = clamp(fScore - 0.25);
    }

    newUser.formatPreferences = fPrefs;
    setUser(newUser);
    localStorage.setItem('kidos_user', JSON.stringify(newUser));

    fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: user.id, 
        content_id: contentId, 
        action, 
        duration_seconds: durationSeconds,
        behavioral_metadata 
      }),
    }).catch(console.error);

    fetch('/api/update_profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    }).catch(console.error);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-body overflow-hidden">
      
      {/* ══ TOP NAVIGATION BAR ════════════════════════════ */}
      <header className="w-full bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between shrink-0 z-50 shadow-sm">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-kidos-purple text-white flex items-center justify-center text-xl shadow-kid transform rotate-3">
            🌟
          </div>
          <span className="font-display text-2xl text-kidos-purple hidden sm:block">KidOS</span>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 font-bold text-sm ${
                activeTab === item.id
                  ? item.primary
                    ? 'bg-kidos-purple text-white shadow-kid scale-105'
                    : 'bg-gray-800 text-white shadow-md'
                  : item.primary
                    ? 'bg-purple-100 text-kidos-purple hover:bg-purple-200 hover:scale-105'
                    : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Right: Profile & Settings */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-kidos flex items-center justify-center text-white font-bold shadow-sm cursor-pointer hover:scale-105 transition-transform">
            {user.nickname.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ══ MAIN CONTENT AREA ══════════════════════════ */}
      <main className="flex-1 overflow-y-auto relative">
        <div 
          key={activeTab} 
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-24 md:pb-12 animate-pop-in"
        >
          
          {/* Views Route */}
          {activeTab === 'home' && <HomeView onNavigate={setActiveTab} />}
          {activeTab === 'learn' && <LearnView />}
          {activeTab === 'ask' && (
            <div className="max-w-4xl mx-auto w-full">
              <PageHeader title="Ask AI Anything" subtitle="What are you curious about today?" emoji="🤖" colorClass="text-kidos-purple" />
              <AskAnything userAge={user.age} />
            </div>
          )}
          {activeTab === 'create' && <CreateView />}
          {activeTab === 'progress' && <ProgressView user={user} />}
          
          {/* Stories View */}
          {activeTab === 'stories' && (
            <div className="space-y-6 animate-pop-in">
              <PageHeader title="Stories" subtitle="Pick a topic and read an adventure!" emoji="📖" colorClass="text-pink-500" />

              {/* Topic Filter */}
              <div className="flex gap-2 flex-wrap pb-4">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                    !selectedTopic
                      ? 'bg-gray-800 text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ✨ All
                </button>
                {TOPICS.map(t => (
                  <TopicPill
                    key={t.value}
                    emoji={t.emoji}
                    label={t.label}
                    value={t.value}
                    active={selectedTopic === t.value}
                    onClick={() => setSelectedTopic(prev => prev === t.value ? null : t.value)}
                  />
                ))}
              </div>

              {/* Feed */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => <LoadingCard key={i} />)}
                </div>
              ) : cards.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="text-6xl mb-4">🔮</div>
                  <p className="text-gray-500 font-bold text-lg">No stories here yet!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((card, i) => (
                    <ContentCard
                      key={`${card.content_id ?? i}-${i}`}
                      card={card}
                      userAge={user.age}
                      onInteraction={handleCardInteraction}
                      onMoreLikeThis={handleMoreLikeThis}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ══ MOBILE BOTTOM NAV ══════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-6 pt-3 flex justify-around items-center z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all relative ${
              activeTab === item.id
                ? item.primary ? 'text-kidos-purple scale-110' : 'text-gray-800 scale-110'
                : item.primary ? 'text-kidos-purple/70 hover:text-kidos-purple' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-2xl">{item.emoji}</span>
            <span className={`text-[10px] font-bold ${activeTab === item.id ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
              {item.label}
            </span>
            {activeTab === item.id && (
              <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${item.primary ? 'bg-kidos-purple' : 'bg-gray-800'}`}></div>
            )}
          </button>
        ))}
      </nav>
      
    </div>
  );
}
