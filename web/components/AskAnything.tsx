'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';

export default function AskAnything({ userAge }: { userAge: number }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userQuery = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: userQuery,
          format: 'explanation',
          age: userAge,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', text: data.content }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "Oops! I couldn't find the answer right now. Can you try again later?" }]);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Oops! My circuits are a bit jumbled. Can you ask again?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card color="purple" className="flex flex-col h-[500px] animate-pop-in">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
            <span className="text-5xl mb-3 opacity-50">✨</span>
            <p className="font-bold text-gray-500">Try asking: &quot;Why is the sky blue?&quot;</p>
            <p className="text-sm">or &quot;How do airplanes fly?&quot;</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm font-bold shadow-sm ${
                  m.role === 'user'
                    ? 'bg-kidos-purple text-white rounded-br-none'
                    : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-bl-none px-5 py-3 text-sm font-bold flex items-center gap-2">
              <span className="animate-bounce">🤖</span> Thinking...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleAsk} className="relative mt-auto">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              className="w-full bg-white border border-gray-200 rounded-full py-4 pl-6 pr-12 font-bold text-gray-700 focus:outline-none focus:border-kidos-purple focus:ring-2 focus:ring-purple-100 transition-all shadow-inner"
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-kidos-purple transition-colors text-xl"
              title="Voice Input"
            >
              🎤
            </button>
          </div>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="w-14 h-14 bg-kidos-purple rounded-full flex items-center justify-center text-white text-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shrink-0 shadow-sm"
          >
            ✨
          </button>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
          <button type="button" onClick={() => setQuery('Explain black holes')} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-50 whitespace-nowrap shadow-sm">🔍 Explain more</button>
          <button type="button" onClick={() => setQuery('Tell a story about a brave dog')} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-50 whitespace-nowrap shadow-sm">📖 Tell a story</button>
          <button type="button" onClick={() => setQuery('Show me an animal fact')} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-50 whitespace-nowrap shadow-sm">🦁 Animal fact</button>
        </div>
      </form>
    </Card>
  );
}
