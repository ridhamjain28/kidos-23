'use client';

import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';

interface Props {
  user: { nickname: string; topicScores: Record<string, number> };
}

export default function ProgressView({ user }: Props) {
  // Simple aggregation for UI
  const topTopics = Object.entries(user.topicScores || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const totalPoints = Object.values(user.topicScores || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 animate-pop-in">
      <PageHeader 
        title="My Progress" 
        subtitle={`Way to go, ${user.nickname}!`} 
        emoji="⭐" 
        colorClass="text-yellow-500"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats */}
        <Card color="yellow" className="flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">🔥</div>
          <h3 className="font-display text-4xl text-orange-600">3 Days</h3>
          <p className="font-bold text-yellow-800 mt-2 uppercase tracking-wide text-sm">Learning Streak</p>
        </Card>

        <Card color="blue" className="flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">🌟</div>
          <h3 className="font-display text-4xl text-blue-600">{Math.floor(totalPoints * 10)} XP</h3>
          <p className="font-bold text-blue-800 mt-2 uppercase tracking-wide text-sm">Total Points Earned</p>
        </Card>

        {/* Top Topics */}
        <Card className="md:col-span-2">
          <h3 className="font-display text-2xl text-gray-800 mb-6">Your Favorite Topics</h3>
          {topTopics.length === 0 ? (
            <p className="text-gray-500 font-bold text-center py-8 bg-gray-50 rounded-2xl">Keep learning to see your top topics here!</p>
          ) : (
            <div className="space-y-6">
              {topTopics.map(([topic, score]) => (
                <div key={topic} className="flex items-center gap-4">
                  <span className="font-bold text-gray-700 capitalize w-24 text-lg">{topic}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all duration-1000 shadow-inner"
                      style={{ width: `${Math.min(100, score * 20)}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-gray-800 bg-yellow-100 px-4 py-2 rounded-full text-sm">Lvl {Math.floor(score) + 1}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
