'use client';

import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function CreateView() {
  return (
    <div className="space-y-8 animate-pop-in">
      <PageHeader 
        title="Create & Build" 
        subtitle="Unleash your imagination!" 
        emoji="🎨" 
        colorClass="text-orange-500"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Drawing Canvas Placeholder */}
        <Card hoverEffect color="default" className="flex flex-col items-center justify-center text-center aspect-video group">
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🖍️</div>
          <h3 className="font-display text-2xl text-gray-800">Magic Canvas</h3>
          <p className="font-bold text-gray-500 mt-2 mb-6">Draw pictures and bring them to life!</p>
          <Button variant="orange">Start Drawing</Button>
        </Card>

        {/* Story Generator Placeholder */}
        <Card hoverEffect color="default" className="flex flex-col items-center justify-center text-center aspect-video group">
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📚</div>
          <h3 className="font-display text-2xl text-gray-800">Story Maker</h3>
          <p className="font-bold text-gray-500 mt-2 mb-6">Pick a hero, a place, and write a tale!</p>
          <Button variant="pink">Write a Story</Button>
        </Card>

        {/* Animation Builder Placeholder */}
        <Card hoverEffect color="default" className="flex flex-col items-center justify-center text-center aspect-video md:col-span-2 group">
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎬</div>
          <h3 className="font-display text-2xl text-gray-800">Animation Studio</h3>
          <p className="font-bold text-gray-500 mt-2 mb-6">Make your drawings move and dance.</p>
          <Button variant="blue">Animate Now</Button>
        </Card>
      </div>
    </div>
  );
}
