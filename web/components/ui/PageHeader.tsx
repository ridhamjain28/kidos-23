import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  colorClass?: string;
}

export default function PageHeader({ title, subtitle, emoji, colorClass = 'text-gray-800' }: PageHeaderProps) {
  return (
    <div className="text-center md:text-left mb-10 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {emoji && (
          <div className="w-16 h-16 mx-auto md:mx-0 rounded-2xl bg-white shadow-kid flex items-center justify-center text-4xl animate-bounce-slow shrink-0">
            {emoji}
          </div>
        )}
        <div>
          <h1 className={`font-display text-4xl md:text-5xl mb-1 ${colorClass}`}>
            {title}
          </h1>
          {subtitle && <p className="font-bold text-gray-500 text-lg md:text-xl">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
