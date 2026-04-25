import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'purple' | 'blue' | 'orange' | 'pink' | 'yellow';
  fullWidth?: boolean;
}

const variantMap = {
  primary: 'bg-kidos-purple text-white hover:bg-purple-600',
  secondary: 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50',
  purple: 'bg-purple-500 text-white hover:bg-purple-600',
  blue: 'bg-blue-500 text-white hover:bg-blue-600',
  orange: 'bg-orange-500 text-white hover:bg-orange-600',
  pink: 'bg-pink-500 text-white hover:bg-pink-600',
  yellow: 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500',
};

export default function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseClasses = 'px-8 py-4 rounded-full font-display text-lg shadow-kid transition-all duration-200 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105';
  const variantClasses = variantMap[variant];
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
