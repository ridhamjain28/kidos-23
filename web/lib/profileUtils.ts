/**
 * Profile utilities: compute and update a user's "virtual personality"
 * from their interaction history. The profile guides which topics and
 * formats get higher weight when the LLM/mock generates new content.
 *
 * Scoring rules:
 *  like / finish / more_like_this → topic +1, format +1
 *  too_easy                       → topic +0.5, difficulty nudge
 *  too_hard                       → topic +0.25, difficulty nudge
 *  skip                           → topic -0.5, format -0.25
 *
 * All scores are clamped to [0, 5] to avoid runaway values.
 */

import type { Interaction } from './supabase';

export interface ComputedProfile {
  topic_scores: Record<string, number>;
  format_preferences: Record<string, number>;
  avg_session_time: number;
  skip_rate: number;
}

const clamp = (v: number, min = 0, max = 5) => Math.min(max, Math.max(min, v));

export function computeProfile(interactions: Interaction[]): ComputedProfile {
  const topic_scores: Record<string, number> = {};
  const format_preferences: Record<string, number> = {};
  let totalDuration = 0;
  let skipCount = 0;

  for (const ix of interactions) {
    const extIx = ix as Interaction & { content_items?: { topic?: string; format?: string } };
    const topic = extIx.content_items?.topic;
    const format = extIx.content_items?.format;

    if (topic) {
      topic_scores[topic] = topic_scores[topic] ?? 0;
      if (ix.action === 'like' || ix.action === 'finish' || ix.action === 'more_like_this') {
        topic_scores[topic] = clamp(topic_scores[topic] + 1);
      } else if (ix.action === 'too_easy') {
        topic_scores[topic] = clamp(topic_scores[topic] + 0.5);
      } else if (ix.action === 'too_hard') {
        topic_scores[topic] = clamp(topic_scores[topic] + 0.25);
      } else if (ix.action === 'skip') {
        topic_scores[topic] = clamp(topic_scores[topic] - 0.5);
        skipCount++;
      }
    }

    if (format) {
      format_preferences[format] = format_preferences[format] ?? 0;
      if (ix.action === 'like' || ix.action === 'finish' || ix.action === 'more_like_this') {
        format_preferences[format] = clamp(format_preferences[format] + 1);
      } else if (ix.action === 'skip') {
        format_preferences[format] = clamp(format_preferences[format] - 0.25);
      }
    }

    if (ix.duration_seconds) totalDuration += ix.duration_seconds;
  }

  const nonViewInteractions = interactions.filter(ix => ix.action !== 'view');
  const avg_session_time = nonViewInteractions.length > 0
    ? totalDuration / nonViewInteractions.length
    : 0;
  const skip_rate = nonViewInteractions.length > 0
    ? skipCount / nonViewInteractions.length
    : 0;

  return { topic_scores, format_preferences, avg_session_time, skip_rate };
}

/**
 * Pick the best topic + format for the next content piece,
 * based on user profile. If `preferredTopic` / `preferredFormat`
 * are supplied, use them; otherwise choose highest-scoring.
 */
export function pickNextContent(
  profile: ComputedProfile | null,
  allTopics: string[],
  preferredTopic?: string,
  preferredFormat?: string,
): { topic: string; format: string } {
  const formats = ['story', 'explanation', 'quiz'];

  let topic = preferredTopic;
  let format = preferredFormat;

  if (!topic) {
    if (profile && Object.keys(profile.topic_scores).length > 0) {
      // Sort by score descending — with a tiny random jitter so it's not always the same
      const sorted = Object.entries(profile.topic_scores)
        .sort(([, a], [, b]) => (b + Math.random() * 0.3) - (a + Math.random() * 0.3));
      topic = sorted[0][0];
    } else {
      topic = allTopics[Math.floor(Math.random() * allTopics.length)];
    }
  }

  if (!format) {
    if (profile && Object.keys(profile.format_preferences).length > 0) {
      const sorted = Object.entries(profile.format_preferences)
        .sort(([, a], [, b]) => b - a);
      format = sorted[0][0];
    } else {
      format = formats[Math.floor(Math.random() * formats.length)];
    }
  }

  return { topic, format };
}
