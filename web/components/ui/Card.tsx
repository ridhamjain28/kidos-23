import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  color?: 'default' | 'blue' | 'orange' | 'pink' | 'yellow' | 'purple';
  hoverEffect?: boolean;
  style?: React.CSSProperties;
}

const colorMap = {
  default: 'bg-white border-gray-100',
  blue: 'bg-blue-50 border-blue-200',
  orange: 'bg-orange-50 border-orange-200',
  pink: 'bg-pink-50 border-pink-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  purple: 'bg-purple-50 border-purple-200',
};

export default function Card({ children, className = '', onClick, color = 'default', hoverEffect = false, style }: CardProps) {
  const baseClasses = 'rounded-[2.5rem] p-8 shadow-kid border-2';
  const colorClasses = colorMap[color];
  const interactionClasses = onClick || hoverEffect ? 'cursor-pointer hover:-translate-y-2 hover:shadow-kid active:translate-y-0 transition-all duration-300 ease-out' : '';

  return (
    <div 
      onClick={onClick}
      className={`${baseClasses} ${colorClasses} ${interactionClasses} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
