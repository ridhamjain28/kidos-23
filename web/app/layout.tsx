import type { Metadata } from 'next';
import { Lexend, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const lexend = Lexend({ 
  subsets: ['latin'],
  variable: '--font-lexend',
});

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'KidOS — Your AI Learning Adventure',
  description: 'A personalized, safe AI learning platform for curious kids aged 5–13. Stories, quizzes, and explorations tailored just for you!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lexend.variable} ${jakarta.variable} light`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="text-on-surface antialiased overflow-x-hidden relative pb-32">
        {children}
      </body>
    </html>
  );
}
