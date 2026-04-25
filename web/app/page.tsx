import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* TopAppBar */}
      <header className="hidden md:flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto bg-white/70 backdrop-blur-2xl docked full-width top-0 z-50 sticky shadow-[0px_20px_40px_rgba(42,47,50,0.06)]">
        <div className="flex items-center gap-4 text-3xl font-extrabold tracking-tight text-sky-800 dark:text-sky-300">
          <span>KidOS</span>
        </div>
        <nav className="flex gap-8 items-center font-body font-medium">
          <Link className="text-sky-700 dark:text-sky-400 font-bold border-b-4 border-sky-500 pb-1" href="/dashboard?tab=learn">Learn</Link>
          <Link className="text-slate-500 dark:text-slate-400 hover:text-sky-600 transition-colors pb-1 border-b-4 border-transparent hover:border-sky-300" href="/dashboard?tab=ask">Ask</Link>
          <Link className="text-slate-500 dark:text-slate-400 hover:text-sky-600 transition-colors pb-1 border-b-4 border-transparent hover:border-sky-300" href="/dashboard?tab=create">Playground</Link>
          <Link className="text-slate-500 dark:text-slate-400 hover:text-sky-600 transition-colors pb-1 border-b-4 border-transparent hover:border-sky-300" href="/dashboard?tab=stories">Stories</Link>
          <Link className="text-slate-500 dark:text-slate-400 hover:text-sky-600 transition-colors pb-1 border-b-4 border-transparent hover:border-sky-300" href="/dashboard?tab=progress">Progress</Link>
          <Link className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-black transition-colors pb-1 border-b-4 border-transparent hover:border-indigo-500" href="/labs">Labs 🧪</Link>
        </nav>
        <div className="flex items-center gap-4 text-sky-700 dark:text-sky-400">
          <button className="p-2 hover:bg-sky-50/50 dark:hover:bg-sky-900/30 rounded-full transition-all duration-300 scale-105 active:scale-95">
            <span className="material-symbols-outlined text-2xl">account_circle</span>
          </button>
          <button className="p-2 hover:bg-sky-50/50 dark:hover:bg-sky-900/30 rounded-full transition-all duration-300 scale-105 active:scale-95">
            <span className="material-symbols-outlined text-2xl">settings</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="max-w-7xl mx-auto px-6 pt-12 md:pt-24 pb-24 relative z-10">
        {/* Welcome Hero */}
        <div className="mb-16 text-center relative z-20">
          <h1 className="text-5xl md:text-6xl font-headline font-extrabold text-primary mb-4">Hello, Explorer!</h1>
          <p className="text-xl md:text-2xl text-on-surface-variant font-body">What do you want to discover today?</p>
        </div>

        {/* Mascot */}
        <div className="absolute top-10 right-10 md:top-20 md:right-20 z-30 animate-bounce" style={{ animationDuration: '3s' }}>
          <img 
            alt="Mascot" 
            className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-2xl" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNwayOzPfgRHlcFPM6cQGziCf1tZDiqqm8phUozy7Glfix-f5JGMIPplbrWFTDJiAfqA9oOWKv8q7FfXeMibSzxXMtR7U4JdZp7DGcA4Act_xglM0QugK2CAN8K4RUp8Ix7bfK9J3aAeB1XERTrM9kjZQFtLNOZJ3f2fu52V91hAxfjpKWDZSgjtzqwcprtsIk1ejoL4LJqFf0AXI3bk5RtNss8RlMp87_1EB1Xsd-ALpIk9Kyv7KJK6NQvAjzyVxyYZNZJO4-uDyW"
          />
        </div>

        {/* Bento Grid Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Ask Anything (Highlight) */}
          <Link href="/dashboard" className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-primary to-primary-container rounded-xl p-8 md:p-12 text-white relative overflow-hidden cloud-shadow squishy-hover group flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10">
              <span className="material-symbols-outlined text-6xl mb-6 bg-white/20 p-4 rounded-full inline-block backdrop-blur-md">psychology</span>
              <h2 className="text-4xl font-headline font-extrabold mb-3">Ask Anything</h2>
              <p className="text-xl opacity-90 font-body">Got a question? Let&apos;s figure it out together!</p>
            </div>
            <div className="relative z-10 mt-8 self-start">
              <span className="inline-block bg-white text-primary px-8 py-3 rounded-full font-bold text-lg hover:scale-105 transition-transform cloud-shadow">Ask Now</span>
            </div>
          </Link>

          {/* Learn Something */}
          <Link href="/dashboard?tab=learn" className="bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden cloud-shadow squishy-hover flex flex-col items-center justify-center text-center">
            <div className="w-full h-32 bg-secondary-container rounded-lg mb-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-secondary-dim">school</span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-primary mb-2">Learn</h3>
            <p className="text-on-surface-variant font-body">New lessons await!</p>
          </Link>

          {/* Create */}
          <Link href="/dashboard?tab=create" className="bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden cloud-shadow squishy-hover flex flex-col items-center justify-center text-center">
            <div className="w-full h-32 bg-tertiary-container rounded-lg mb-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-tertiary-dim">palette</span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-primary mb-2">Create</h3>
            <p className="text-on-surface-variant font-body">Draw & build.</p>
          </Link>

          {/* Stories */}
          <Link href="/dashboard?tab=stories" className="bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden cloud-shadow squishy-hover flex flex-col items-center justify-center text-center">
            <div className="w-full h-32 bg-primary-fixed-dim rounded-lg mb-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-on-primary-fixed">auto_stories</span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-primary mb-2">Stories</h3>
            <p className="text-on-surface-variant font-body">Read an adventure.</p>
          </Link>

          {/* Progress */}
          <Link href="/dashboard?tab=progress" className="bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden cloud-shadow squishy-hover flex flex-col items-center justify-center text-center">
            <div className="w-full h-32 bg-surface-container-high rounded-lg mb-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-on-surface">emoji_events</span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-primary mb-2">Progress</h3>
            <p className="text-on-surface-variant font-body">See your trophies.</p>
          </Link>
        </div>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-6 left-0 right-0 w-full z-50 flex justify-around items-center px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg mx-auto max-w-md rounded-[32px] shadow-[0px_20px_40px_rgba(42,47,50,0.06)] py-2">
        <Link className="flex flex-col items-center justify-center bg-gradient-to-br from-sky-600 to-sky-400 text-white rounded-full p-4 scale-110 -translate-y-2 shadow-lg squishy-bounce-effect transition-all duration-500" href="/dashboard?tab=learn">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          <span className="font-lexend text-xs font-bold uppercase tracking-wider mt-1 hidden">Learn</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-2 hover:text-sky-600 dark:hover:text-sky-300 transition-colors" href="/dashboard">
          <span className="material-symbols-outlined text-2xl">psychology</span>
          <span className="font-lexend text-xs font-bold uppercase tracking-wider mt-1 hidden">Ask</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-2 hover:text-sky-600 dark:hover:text-sky-300 transition-colors" href="/dashboard?tab=create">
          <span className="material-symbols-outlined text-2xl">grid_view</span>
          <span className="font-lexend text-xs font-bold uppercase tracking-wider mt-1 hidden">Playground</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-2 hover:text-sky-600 dark:hover:text-sky-300 transition-colors" href="/dashboard?tab=stories">
          <span className="material-symbols-outlined text-2xl">auto_stories</span>
          <span className="font-lexend text-xs font-bold uppercase tracking-wider mt-1 hidden">Stories</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-2 hover:text-sky-600 dark:hover:text-sky-300 transition-colors" href="/dashboard?tab=progress">
          <span className="material-symbols-outlined text-2xl">trending_up</span>
          <span className="font-lexend text-xs font-bold uppercase tracking-wider mt-1 hidden">Progress</span>
        </Link>
      </nav>
    </>
  );
}
