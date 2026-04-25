'use client';

import { useState, useEffect, useRef } from 'react';
import type { ContentData } from '@/app/dashboard/page';

const FORMAT_META: Record<string, { emoji: string; label: string; bg: string; border: string }> = {
  story:       { emoji: '📖', label: 'Story',       bg: 'from-pink-50 to-rose-50',     border: 'border-pink-200'   },
  explanation: { emoji: '🔬', label: 'Explanation', bg: 'from-blue-50 to-indigo-50',   border: 'border-blue-200'   },
  quiz:        { emoji: '🎯', label: 'Quiz',        bg: 'from-yellow-50 to-amber-50',  border: 'border-yellow-200' },
};

const DIFF_META: Record<string, { label: string; color: string }> = {
  easy:   { label: 'Easy 🌱',   color: 'bg-green-100 text-green-700'  },
  medium: { label: 'Medium 🌟', color: 'bg-yellow-100 text-yellow-700' },
  hard:   { label: 'Hard 🔥',   color: 'bg-red-100 text-red-700'      },
};

const TOPIC_EMOJI: Record<string, string> = {
  space: '🚀', animals: '🦁', math: '🔢', science: '🔬',
  coding: '💻', art: '🎨', oceans: '🌊', dinosaurs: '🦕',
  history: '🏛️', music: '🎵',
};

interface Props {
  card: ContentData;
  userAge: number;
  onInteraction: (contentId: string | null, action: string, durationSeconds: number, topic: string, format: string) => void;
  onMoreLikeThis: (topic: string, format: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ContentCard({ card, userAge, onInteraction, onMoreLikeThis }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [reacted, setReacted] = useState<string | null>(null);
  const openedAt = useRef<number>(Date.now());
  const fmt = FORMAT_META[card.format] ?? FORMAT_META.story;
  const diff = DIFF_META[card.difficulty] ?? DIFF_META.medium;
  const topicEmoji = TOPIC_EMOJI[card.topic] ?? '✨';

  // Log "view" when card is first opened
  useEffect(() => {
    if (expanded) {
      openedAt.current = Date.now();
      onInteraction(card.content_id, 'view', 0, card.topic, card.format);
    }
  }, [expanded]);

  const handleAction = (action: string) => {
    const duration = Math.round((Date.now() - openedAt.current) / 1000);
    setReacted(action);
    onInteraction(card.content_id, action, duration, card.topic, card.format);
    if (action === 'more_like_this') {
      onMoreLikeThis(card.topic, card.format);
    }
    if (action === 'skip' || action === 'finish') {
      setTimeout(() => setExpanded(false), 600);
    }
  };

  // Parse markdown-like content into paragraphs
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-kidos-purple mt-4 mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4">{line.slice(2)}</li>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i}>{line}</p>;
    });
  };

  return (
    <div
      className={`bg-gradient-to-b ${fmt.bg} border ${fmt.border} rounded-[32px] shadow-sm card-hover overflow-hidden animate-pop-in`}
    >
      {/* ── Card Header (always visible) ── */}
      <div
        className="p-6 sm:p-8 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
        id={`card-${card.content_id ?? card.topic}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm shrink-0">
              {topicEmoji}
            </div>
            <div>
              <div className="flex gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold bg-white/70 px-2 py-0.5 rounded-full text-gray-600">
                  {fmt.emoji} {fmt.label}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${diff.color}`}>
                  {diff.label}
                </span>
              </div>
              <h3 className="font-display text-lg text-gray-800 capitalize">
                {card.topic}
              </h3>
            </div>
          </div>
          <span className="text-xl transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
            ▾
          </span>
        </div>

        {/* Teaser — first 120 chars */}
        {!expanded && (
          <p className="text-gray-600 text-sm mt-3 line-clamp-3 leading-relaxed">
            {card.content.slice(0, 140)}…
          </p>
        )}
      </div>

      {/* ── Expanded Content ── */}
      {expanded && (
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="bg-white/80 border border-white/50 rounded-[24px] p-5 mb-5 text-sm leading-relaxed text-gray-700 shadow-sm max-h-80 overflow-y-auto">
            <ul className="list-none p-0 m-0">
              {renderContent(card.content)}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              id={`like-${card.content_id}`}
              onClick={() => handleAction('like')}
              disabled={!!reacted}
              className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                reacted === 'like'
                  ? 'bg-pink-500 text-white scale-105'
                  : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
              } disabled:cursor-not-allowed`}
            >
              ❤️ Love it!
            </button>

            <button
              id={`skip-${card.content_id}`}
              onClick={() => handleAction('skip')}
              disabled={!!reacted}
              className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                reacted === 'skip'
                  ? 'bg-gray-400 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } disabled:cursor-not-allowed`}
            >
              ⏭️ Skip
            </button>

            <button
              id={`too-easy-${card.content_id}`}
              onClick={() => handleAction('too_easy')}
              disabled={!!reacted}
              className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                reacted === 'too_easy'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              } disabled:cursor-not-allowed`}
            >
              😎 Too Easy
            </button>

            <button
              id={`too-hard-${card.content_id}`}
              onClick={() => handleAction('too_hard')}
              disabled={!!reacted}
              className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                reacted === 'too_hard'
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              } disabled:cursor-not-allowed`}
            >
              🤯 Too Hard
            </button>
          </div>

          <div className="flex gap-2">
            <button
              id={`more-like-${card.content_id}`}
              onClick={() => handleAction('more_like_this')}
              className="flex-1 btn-kid bg-kidos-purple text-sm py-2.5"
            >
              ✨ More Like This!
            </button>
            <button
              id={`finish-${card.content_id}`}
              onClick={() => handleAction('finish')}
              disabled={!!reacted}
              className="flex-1 btn-kid bg-kidos-green text-sm py-2.5 disabled:opacity-60"
            >
              ✅ Done!
            </button>
          </div>

          {reacted && reacted !== 'more_like_this' && (
            <p className="text-center text-sm font-bold text-kidos-purple mt-3 animate-pop-in">
              {{
                like: '❤️ Noted! More like this coming up!',
                skip: '⏭️ Got it — we\'ll try something different!',
                too_easy: '😎 We\'ll level it up!',
                too_hard: '🤯 No worries — easier content incoming!',
                finish: '🎉 Great job finishing this!',
              }[reacted] ?? '✅ Logged!'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
