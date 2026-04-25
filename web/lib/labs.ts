export const LABS_TAGS = [
  "Tech",
  "Cooking",
  "Fitness",
  "Travel",
  "Gaming",
  "Finance",
  "Art",
  "Science",
] as const;

export type LabsTag = (typeof LABS_TAGS)[number];

export interface LabsContent {
  id: string;
  title: string;
  body: string;
  tags: LabsTag[];
}

export const FALLBACK_POOL: LabsContent[] = [
  {
    id: "f1",
    title: "The Future of Quantum Computing",
    body: "Quantum bits or qubits allow for exponentially more processing power than classical bits.",
    tags: ["Tech", "Science"],
  },
  {
    id: "f2",
    title: "Mastering the Sourdough Starter",
    body: "A healthy starter requires consistent feeding and the right ambient temperature.",
    tags: ["Cooking", "Science"],
  },
  {
    id: "f3",
    title: "High-Intensity Interval Training",
    body: "HIIT workouts maximize calorie burn in short durations by spiking heart rate.",
    tags: ["Fitness", "Science"],
  },
  {
    id: "f4",
    title: "Hidden Gems of Kyoto",
    body: "Explore the ancient temples and quiet gardens away from the main tourist paths.",
    tags: ["Travel", "Art"],
  },
  {
    id: "f5",
    title: "The Evolution of Game Engines",
    body: "Modern engines like Unreal Engine 5 are pushing the boundaries of real-time photorealism.",
    tags: ["Gaming", "Tech"],
  },
  {
    id: "f6",
    title: "Understanding Compound Interest",
    body: "The most powerful force in the universe is interest earning interest over time.",
    tags: ["Finance", "Science"],
  },
  {
    id: "f7",
    title: "Digital Art Mastery",
    body: "Using layers and blend modes can transform a simple sketch into a masterpiece.",
    tags: ["Art", "Tech"],
  },
  {
    id: "f8",
    title: "Backpacking through Patagonia",
    body: "Prepare for unpredictable weather and stunning glacial views in this remote region.",
    tags: ["Travel", "Fitness"],
  },
  {
    id: "f9",
    title: "AI in Financial Markets",
    body: "Machine learning algorithms now execute the majority of high-frequency trades.",
    tags: ["Tech", "Finance"],
  },
  {
    id: "f10",
    title: "The Chemistry of Baking",
    body: "Understanding how proteins and starches react is the key to a perfect cake.",
    tags: ["Cooking", "Science"],
  },
];

export const INITIAL_USER_PROFILE: Record<LabsTag, number> & { age: number } = {
  Tech: 0,
  Cooking: 0,
  Fitness: 0,
  Travel: 0,
  Gaming: 0,
  Finance: 0,
  Art: 0,
  Science: 0,
  age: 7,
};

export const DEFAULT_AGE = 7;

export const SCORING = {
  DISCOVER: {
    LIKE: 3,
    VIEW: 1,
    SKIP: -2,
  },
  WATCH: {
    FULL: 4,
    PARTIAL: 2,
    EARLY_SKIP: -3,
    CLICK: 2,
  },
};

export const CLAMP = { MIN: -5, MAX: 10 };
