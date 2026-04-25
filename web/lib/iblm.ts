/**
 * IBLM (Individual Behaviour Learning Model) Implementation for KidOS
 * Architecture:
 * - Hot Memory: Active session state (React/Next.js)
 * - Warm Memory: Summarized intents (Vector DB / JSON summaries)
 * - Cold Memory: The Kernel (Validated permanent rules - kernel.json)
 */

export interface UserKernel {
  user_id: string;
  expertise_level: 'beginner' | 'intermediate' | 'expert';
  preferred_tone: string;
  enforced_rules: string[];
  rule_usage: Record<string, { last_used: string; weight: number }>;
  topic_affinities: Record<string, number>;
  format_weights: Record<string, number>;
  last_updated: string;
  frustration_threshold: number;
}

export interface BehavioralSignal {
  type: 'preference' | 'hypothesis' | 'frustration' | 'expertise';
  value: any;
  confidence: number;
  scope?: string;
}

export async function loadKernel(userId: string): Promise<UserKernel> {
  try {
    const res = await fetch(`http://localhost:8000/iblm/kernel/${userId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to load kernel from backend:", err);
  }

  // Default Kernel for new users
  return {
    user_id: userId,
    expertise_level: 'beginner',
    preferred_tone: 'friendly and encouraging',
    enforced_rules: [],
    rule_usage: {},
    topic_affinities: {},
    format_weights: {
      story: 1.0,
      explanation: 1.0,
      quiz: 1.0
    },
    last_updated: new Date().toISOString(),
    frustration_threshold: 0.5
  };
}

/**
 * Saves the Cold Memory (The Kernel)
 */
export async function saveKernel(kernel: UserKernel) {
  console.warn("Direct kernel save from frontend is deprecated. Let the orchestrator handle rule decay and storage.");
}

/**
 * Step 5: The Guidance Engine and Context Injector
 * Generates the "Mission Briefing" for the reasoning model
 */
export function generateMissionBriefing(kernel: UserKernel): string {
  const rules = kernel.enforced_rules.map(r => `- ${r}`).join('\n');
  const briefing = `
[MISSION BRIEFING: INDIVIDUAL BEHAVIOR LEARNING MODEL]
User ID: ${kernel.user_id}
Expertise: ${kernel.expertise_level}
Tone: ${kernel.preferred_tone}
Behavioral Constraints:
${rules || '- No specific constraints yet.'}

Apply these rules strictly. You are the user's Semantic Twin. 
Adapt your explanation depth to their ${kernel.expertise_level} level.
`;
  return briefing.trim();
}

/**
 * Step 2: Signal Extraction (The Thinking Phase)
 * Calls a lightweight local model (Ollama) to extract behavioral signals from interactions
 */
export async function extractSignals(interaction: any, currentKernel: UserKernel): Promise<BehavioralSignal[]> {
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/generate';
  const model = process.env.OLLAMA_EXTRACTOR_MODEL || 'qwen:1.8b'; // Fallback to what's available

  const prompt = `
Analyze this user interaction and extract behavioral signals for an Individual Behavior Learning Model.
User ID: ${interaction.user_id}
Action: ${interaction.action}
Duration: ${interaction.duration_seconds}s
Content Topic: ${interaction.topic}
Current User Expertise: ${currentKernel.expertise_level}

Determine:
1. Is there a shift in preference?
2. Is the user frustrated? (e.g. fast skip, button mashing)
3. Did they demonstrate a higher level of understanding?

Return ONLY a JSON array of signals:
[{ "type": "preference"|"hypothesis"|"frustration"|"expertise", "value": "...", "confidence": 0.0-1.0 }]
`;

  try {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        format: 'json'
      })
    });

    if (!res.ok) return [];
    const data = await res.json();
    return JSON.parse(data.response);
  } catch (err) {
    console.error('IBLM Signal Extraction Failed:', err);
    return [];
  }
}

/**
 * Step 3: Socratic Validator & Belief Pruning
 * Updates the kernel based on extracted signals
 */
export function applySignalsToKernel(kernel: UserKernel, signals: BehavioralSignal[]): UserKernel {
  let updatedKernel = { ...kernel };
  const now = new Date();
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

  // 1. Decay existing rules (Step 3: Socratic Validator)
  for (const rule of updatedKernel.enforced_rules) {
    const usage = updatedKernel.rule_usage[rule] || { last_used: new Date().toISOString(), weight: 1.0 };
    const ageInDays = (now.getTime() - new Date(usage.last_used).getTime()) / (1000 * 60 * 60 * 24);
    
    // Decay weight by 0.05 per day of inactivity
    usage.weight = Math.max(0, usage.weight - (ageInDays * 0.05));
    updatedKernel.rule_usage[rule] = usage;
  }

  // 2. Prune stale or weak rules
  updatedKernel.enforced_rules = updatedKernel.enforced_rules.filter(rule => {
    const usage = updatedKernel.rule_usage[rule];
    const isStale = (now.getTime() - new Date(usage.last_used).getTime()) > TWO_WEEKS_MS;
    const isWeak = usage.weight < 0.2;
    return !isStale && !isWeak;
  });

  // 3. Apply new signals
  for (const signal of signals) {
    if (signal.confidence < 0.6) continue;

    switch (signal.type) {
      case 'preference':
        if (typeof signal.value === 'string') {
          const rule = signal.value;
          if (!updatedKernel.enforced_rules.includes(rule)) {
            updatedKernel.enforced_rules.push(rule);
          }
          updatedKernel.rule_usage[rule] = { 
            last_used: now.toISOString(), 
            weight: Math.min(1.0, (updatedKernel.rule_usage[rule]?.weight || 0.5) + 0.2) 
          };
        }
        break;
      case 'expertise':
        if (signal.value === 'increase') {
          updatedKernel.expertise_level = kernel.expertise_level === 'beginner' ? 'intermediate' : 'expert';
        }
        break;
      case 'frustration':
        if (signal.value === 'high') {
          updatedKernel.expertise_level = 'beginner';
          updatedKernel.preferred_tone = 'ultra-simple and highly encouraging';
        }
        break;
    }
  }

  updatedKernel.last_updated = now.toISOString();
  return updatedKernel;
}
