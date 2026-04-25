import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Temporary console.log to verify env variables are loading (do not expose full keys in production)
console.log('Verifying Supabase Env Variables:', { 
  url: supabaseUrl, 
  keyExists: !!supabaseAnonKey 
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables! Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface User {
  id: string;
  age: number;
  nickname: string;
  parent_email?: string;
  parent_consent: boolean;
  created_at: string;
}

export interface ContentItem {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  format: 'story' | 'explanation' | 'quiz';
  content: string;
  created_at: string;
}

export interface UserProfile {
  user_id: string;
  topic_scores: Record<string, number>;
  format_preferences: Record<string, number>;
  avg_session_time: number;
  skip_rate: number;
  updated_at: string;
}

export interface Interaction {
  id: string;
  user_id: string;
  content_id: string;
  action: 'view' | 'like' | 'skip' | 'finish' | 'too_hard' | 'too_easy' | 'more_like_this';
  duration_seconds: number;
  behavioral_metadata?: Json;
  timestamp: string;
}
