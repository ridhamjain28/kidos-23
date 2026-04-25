'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AGE_OPTIONS = Array.from({ length: 9 }, (_, i) => i + 5); // 5–13

const INTEREST_OPTIONS = [
  { emoji: '🚀', label: 'Space' },
  { emoji: '🦁', label: 'Animals' },
  { emoji: '🔢', label: 'Maths' },
  { emoji: '🔬', label: 'Science' },
  { emoji: '💻', label: 'Coding' },
  { emoji: '🎨', label: 'Art' },
  { emoji: '🌊', label: 'Oceans' },
  { emoji: '🦕', label: 'Dinosaurs' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '🏛️', label: 'History' },
];

const STEPS = ['Welcome', 'About You', 'Your Interests', 'Parent Info', "You're In!"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [age, setAge] = useState<number | null>(null);
  const [nickname, setNickname] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [parentEmail, setParentEmail] = useState('');
  const [parentConsent, setParentConsent] = useState(false);

  const toggleInterest = (label: string) => {
    setInterests(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label],
    );
  };

  const nextStep = () => {
    setError('');
    if (step === 1 && !age) { setError('Please pick your age!'); return; }
    if (step === 1 && !nickname.trim()) { setError('Please enter a nickname!'); return; }
    if (step === 3 && !parentConsent) {
      setError('A parent or guardian must agree before we can continue.');
      return;
    }
    if (step === 3) {
      handleSubmit();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Insert user into Supabase (or use local storage if Supabase isn't configured)
      const supabaseConfigured =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'YOUR_SUPABASE_URL';

      let userId = `local_${Date.now()}`;

      if (supabaseConfigured) {
        const { data, error: dbErr } = await supabase
          .from('users')
          .insert({
            age,
            nickname: nickname.trim(),
            parent_email: parentEmail.trim() || null,
            parent_consent: parentConsent,
          })
          .select('id')
          .single();

        if (dbErr) throw dbErr;
        userId = data.id;
      }

      // Build initial topic_scores from selected interests
      const topicScores: Record<string, number> = {};
      interests.forEach(i => { topicScores[i.toLowerCase()] = 1.5; });

      // Store session in localStorage (works even without Supabase)
      localStorage.setItem(
        'kidos_user',
        JSON.stringify({ id: userId, age, nickname: nickname.trim(), topicScores }),
      );

      setStep(4); // success screen
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      const e = err as Error;
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-sky font-body flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <span className="text-3xl animate-float">🌟</span>
        <span className="font-display text-3xl text-kidos-purple">KidOS</span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? 'text-kidos-purple font-bold' : ''}>
              {s}
            </span>
          ))}
        </div>
        <div className="w-full h-3 bg-purple-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-kidos rounded-full transition-all duration-500"
            style={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-4xl shadow-kid w-full max-w-md p-8 animate-pop-in">
        {/* ── STEP 0: Welcome ── */}
        {step === 0 && (
          <div className="text-center">
            <div className="text-7xl mb-6 animate-bounce-slow">🚀</div>
            <h1 className="font-display text-3xl text-kidos-purple mb-3">Welcome to KidOS!</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              KidOS is your personal learning buddy — it tells you stories, asks you quizzes,
              and gets smarter the more you explore. Ready?
            </p>
            <button
              id="onboard-welcome-next"
              onClick={() => setStep(1)}
              className="btn-kid bg-kidos-purple w-full"
            >
              Let&apos;s Go! 🌟
            </button>
          </div>
        )}

        {/* ── STEP 1: Age + Nickname ── */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-2xl text-kidos-purple mb-6 text-center">About You</h2>

            <div className="mb-5">
              <label className="block font-bold text-gray-700 mb-2">How old are you? 🎂</label>
              <div className="flex flex-wrap gap-2">
                {AGE_OPTIONS.map(a => (
                  <button
                    key={a}
                    id={`age-btn-${a}`}
                    onClick={() => setAge(a)}
                    className={`w-12 h-12 rounded-2xl font-bold text-lg transition-all duration-150 ${
                      age === a
                        ? 'bg-kidos-purple text-white shadow-kid scale-110'
                        : 'bg-purple-50 text-kidos-purple hover:bg-purple-100'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block font-bold text-gray-700 mb-2">What&apos;s your nickname? 😎</label>
              <input
                id="nickname-input"
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="e.g. StarKid, DragonBoy, AstroAna"
                maxLength={20}
                className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 text-lg font-bold focus:border-kidos-purple outline-none transition"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button id="onboard-step1-next" onClick={nextStep} className="btn-kid bg-kidos-purple w-full">
              Next ➡️
            </button>
          </div>
        )}

        {/* ── STEP 2: Interests ── */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-2xl text-kidos-purple mb-2 text-center">
              What do you love? 💛
            </h2>
            <p className="text-center text-gray-500 text-sm mb-5">Pick as many as you want!</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {INTEREST_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  id={`interest-${opt.label}`}
                  onClick={() => toggleInterest(opt.label)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-150 ${
                    interests.includes(opt.label)
                      ? 'bg-kidos-purple text-white shadow-kid scale-105'
                      : 'bg-purple-50 text-kidos-purple hover:bg-purple-100'
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span> {opt.label}
                </button>
              ))}
            </div>

            <button id="onboard-step2-next" onClick={() => setStep(3)} className="btn-kid bg-kidos-purple w-full">
              Almost there! ➡️
            </button>
          </div>
        )}

        {/* ── STEP 3: Parent Info & Consent ── */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-2xl text-kidos-purple mb-3 text-center">
              Parent / Guardian 🛡️
            </h2>

            {/* COPPA-style privacy notice */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5 text-sm text-green-800">
              <p className="font-bold mb-1">📋 A note for parents:</p>
              <p>
                KidOS tracks <strong>in-app activity only</strong> (which topics your child reads, likes, or skips)
                to personalise their learning. We do <strong>not</strong> use external trackers, ads, or sell any
                data. For full COPPA compliance in production, please review our privacy policy.
              </p>
            </div>

            <div className="mb-5">
              <label className="block font-bold text-gray-700 mb-2">
                Parent email <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="parent-email-input"
                type="email"
                value={parentEmail}
                onChange={e => setParentEmail(e.target.value)}
                placeholder="parent@email.com"
                className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 text-lg focus:border-kidos-purple outline-none transition"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                id="consent-checkbox"
                type="checkbox"
                checked={parentConsent}
                onChange={e => setParentConsent(e.target.checked)}
                className="mt-1 w-5 h-5 accent-purple-600 cursor-pointer"
              />
              <span className="text-sm text-gray-600">
                I am a parent or guardian and I agree that KidOS may track in-app interactions
                to personalise my child&apos;s learning experience.
              </span>
            </label>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button
              id="onboard-submit"
              onClick={nextStep}
              disabled={loading}
              className="btn-kid bg-kidos-green w-full disabled:opacity-60"
            >
              {loading ? '⏳ Setting up...' : "Let's Learn! 🎉"}
            </button>
          </div>
        )}

        {/* ── STEP 4: Success ── */}
        {step === 4 && (
          <div className="text-center">
            <div className="text-7xl mb-4 animate-bounce-slow">🎉</div>
            <h2 className="font-display text-3xl text-kidos-purple mb-3">You&apos;re in, {nickname}!</h2>
            <p className="text-gray-600">Taking you to your dashboard…</p>
            <div className="mt-6 flex justify-center">
              <div className="w-8 h-8 border-4 border-kidos-purple border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Back button */}
      {step > 0 && step < 4 && (
        <button
          onClick={() => { setStep(s => s - 1); setError(''); }}
          className="mt-4 text-gray-400 hover:text-kidos-purple font-bold transition text-sm"
        >
          ← Back
        </button>
      )}
    </main>
  );
}
