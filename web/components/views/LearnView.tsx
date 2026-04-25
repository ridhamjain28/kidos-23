'use client';

import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';

export default function LearnView() {
  const worlds = [
    { id: 'space', name: 'Space Explorer', emoji: '🚀', levels: 5, color: 'purple', active: true },
    { id: 'animals', name: 'Animal Kingdom', emoji: '🦁', levels: 4, color: 'blue', active: false },
    { id: 'math', name: 'Math Island', emoji: '🔢', levels: 6, color: 'orange', active: false },
  ];

  return (
    <div className="space-y-12 animate-pop-in pb-20">
      <PageHeader 
        title="Learning Map" 
        subtitle="Pick a world and start your adventure!" 
        emoji="🗺️" 
        colorClass="text-blue-600"
      />

      <div className="max-w-4xl mx-auto space-y-16 relative">
        {/* Subtle connecting line behind worlds */}
        <div className="absolute top-0 bottom-0 left-1/2 w-4 -translate-x-1/2 bg-gray-100 rounded-full border-2 border-gray-200 z-0 hidden md:block"></div>

        {worlds.map((world, i) => (
          <div key={world.id} className={`relative z-10 flex flex-col md:flex-row items-center gap-6 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
            
            {/* World Card */}
            <div className="w-full md:w-1/2">
              <Card 
                color={world.color as "default" | "blue" | "orange" | "pink" | "yellow" | "purple"} 
                hoverEffect={world.active}
                className={`transform transition-all ${!world.active ? 'opacity-70 grayscale-[50%]' : ''}`}
              >
                <div className="text-5xl mb-4">{world.emoji}</div>
                <h3 className="font-display text-2xl mb-1 text-gray-800">{world.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-1">
                    {[...Array(world.levels)].map((_, j) => (
                      <div key={j} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[12px] shadow-sm ${world.active && j === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-400'}`}>
                        {world.active && j === 0 ? '⭐' : '🔒'}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-500 ml-2">{world.levels} Levels</span>
                </div>
                {!world.active && (
                  <div className="bg-white/50 rounded-full px-4 py-2 text-sm font-bold inline-block text-gray-600">
                    Complete previous world to unlock
                  </div>
                )}
              </Card>
            </div>

            {/* Map Node (Desktop only) */}
            <div className="hidden md:flex w-16 h-16 bg-white rounded-full border-4 border-gray-200 items-center justify-center shadow-md z-10">
              <div className={`w-8 h-8 rounded-full ${world.active ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
            </div>

            <div className="hidden md:block w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
