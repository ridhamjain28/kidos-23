'use client';

import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';

interface Props {
  onNavigate: (tab: string) => void;
}

export default function HomeView({ onNavigate }: Props) {
  const cards = [
    { id: 'ask', label: 'Ask AI', emoji: '🤖', desc: "Got a question? Let's find out!", color: 'purple' },
    { id: 'learn', label: 'Learn', emoji: '🗺️', desc: 'Explore new worlds & levels', color: 'blue' },
    { id: 'stories', label: 'Stories', emoji: '📖', desc: 'Read amazing adventures', color: 'pink' },
    { id: 'create', label: 'Create', emoji: '🎨', desc: 'Draw & build your own stories', color: 'orange' },
    { id: 'progress', label: 'My Progress', emoji: '⭐', desc: 'See your badges & streaks', color: 'yellow' },
  ];

  return (
    <div className="space-y-8 animate-pop-in">
      <PageHeader 
        title="Welcome Back!" 
        subtitle="What would you like to explore today?" 
        emoji="👋" 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <Card
            key={card.id}
            color={card.color as "default" | "blue" | "orange" | "pink" | "yellow" | "purple"}
            onClick={() => onNavigate(card.id)}
            className="flex flex-col justify-between aspect-square group"
            hoverEffect
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="text-6xl mb-4 group-hover:animate-bounce origin-bottom">{card.emoji}</div>
            <div>
              <h2 className="font-display text-2xl mb-1 text-gray-800">{card.label}</h2>
              <p className="font-bold text-gray-600 text-sm leading-snug">{card.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
