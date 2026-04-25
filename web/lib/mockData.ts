// Mock content bank — used when LLM_API_KEY is not set
// Each entry is pre-written, kid-friendly content for demos and testing.

export const TOPICS = [
  'space', 'animals', 'math', 'science', 'history',
  'art', 'music', 'coding', 'oceans', 'dinosaurs',
];

export const FORMATS = ['story', 'explanation', 'quiz'] as const;

export const MOCK_CONTENT: Record<string, Record<string, string>> = {
  space: {
    story: `🚀 Zara and the Star Map

One day, a curious girl named Zara found a glowing map in her backyard. The map had tiny dots all over it — they were stars! Her robot friend Beep told her each dot was a sun, just like ours but super far away.

"How far?" Zara asked.
"So far that if you drove a car there, it would take millions of years!" said Beep.

They hopped into their imaginary rocket, counted down from 10… and ZOOM! They flew past the Moon, past Mars, and waved at Jupiter's giant red spot. 

At the end of the adventure, Zara realized: space is enormous — and that makes our little home Earth even more special. 🌍

**Check your understanding:** Why does Beep say it would take millions of years to drive to a star?`,

    explanation: `⭐ What Is Space?

Space is everything beyond Earth's air (called the atmosphere). It's a very big place — bigger than you can imagine!

**Key facts:**
- Space is mostly empty, but contains stars, planets, moons, comets, and black holes
- Our Sun is a star — a giant ball of hot, glowing gas
- The nearest star to us (besides the Sun) is called Proxima Centauri — it's 4 light years away
- Light travels at 300,000 km every second — yet it still takes 4 years to reach that star!
- Our galaxy, the Milky Way, has over 200 billion stars 🌌

Space has no air, no sound, and very extreme temperatures — which is why astronauts wear special suits.

**Quick recap:** What gas do stars like our Sun mostly burn?`,

    quiz: `🌟 Space Quiz — Test Your Knowledge!

**Question 1:** What do we call the galaxy we live in?
- A) Andromeda
- B) The Milky Way ✅
- C) The Solar Galaxy
- D) Stardust Lane

**Question 2:** What keeps planets orbiting the Sun?
- A) Magnets
- B) Rocket engines
- C) Gravity ✅
- D) Wind

**Question 3:** True or False — The Moon makes its own light.
- False ✅ (It reflects light from the Sun!)

**Question 4:** Which planet is known for its beautiful rings?
- A) Jupiter
- B) Mars
- C) Saturn ✅
- D) Venus

Great job! You're a space explorer! 🚀`,
  },

  animals: {
    story: `🐘 Ellie's Big Journey

Ellie the elephant lived near a dry, dusty river. One hot summer, the river dried up! Her herd needed water — and fast.

Ellie remembered watching older elephants walk toward the mountains. She led her family for three whole days. The little ones were tired, but Ellie cheered them on with her trunk-trumpet: BRAAAT!

On the third morning — SPLASH! A cool river sparkled in the sunlight. Ellie had found it! The herd drank and played. Baby elephants sprayed water on each other and squealed with joy.

That night, the eldest elephant touched Ellie's head with her trunk — the highest honour. Ellie had used her memory and bravery to save her family. 🌟

**Think about it:** How do you think Ellie knew which direction to go?`,

    explanation: `🦁 Amazing Animal Adaptations

Animals have special features called **adaptations** that help them survive in their environment.

**Examples:**
- 🐪 **Camel** — stores fat (not water!) in its hump; can survive desert heat
- 🦎 **Chameleon** — changes colour to hide from predators
- 🦇 **Bat** — uses echolocation (sound bouncing) to "see" in the dark
- 🐧 **Penguin** — has a black-and-white belly to hide from predators in the ocean (camouflage!)
- 🐘 **Elephant** — has a long trunk to drink, pick food, and spray water to cool down

**Why does this matter?** If the environment changes (like climate change), animals that can adapt survive. Those that can't may become extinct.

**Quick question:** What body part does a bat use to navigate?`,

    quiz: `🐾 Animal Quiz!

**Q1:** What do we call animals that only eat plants?
- A) Carnivores
- B) Omnivores
- C) Herbivores ✅
- D) Insectivores

**Q2:** Which animal is the fastest on land?
- A) Lion
- B) Horse
- C) Cheetah ✅
- D) Ostrich

**Q3:** True or False — Fish breathe using lungs.
- False ✅ (They breathe through gills!)

**Q4:** How many legs does a spider have?
- A) 6
- B) 8 ✅
- C) 10
- D) 12

You're an animal expert! 🦁`,
  },

  math: {
    story: `🔢 The Number Kingdom

In the land of Mathoria, every citizen WAS a number. 7 was a brave knight. 2 was a quick messenger. And 0... was shy, because people kept saying 0 meant "nothing."

One day, a dragon threatened to steal all the gold (which happened to equal exactly 1,000 coins). Only a number with THREE digits could open the vault to save the gold.

The number 9 tried — but the vault needed three digits together. Then tiny 0 stepped forward: "What if… I stand beside 1 and 0?" Together they formed: **100 + 100 + 100 = 300?** No — they joined to form **1000**!

The vault opened! The kingdom cheered. Zero had saved the day — because zero gives numbers their power of place-value! 🎉

**Think:** Why is the 0 in 100 so important?`,

    explanation: `➕ How Multiplication Works

Multiplication is just **fast adding**!

Instead of adding 4 + 4 + 4 + 4 + 4, you can say: **4 × 5 = 20**

**Key ideas:**
- 3 × 4 means "3 groups of 4" = 12
- Any number × 0 = 0 (zero groups of anything is nothing)
- Any number × 1 = itself (one group of the number)
- Order doesn't matter: 3 × 4 = 4 × 3 = 12

**Real-life example:**
You have 6 bags of apples. Each bag has 5 apples. 
Total apples = 6 × 5 = **30 apples** 🍎

**Trick to remember your tables:** Say them out loud every day — rhythm helps your brain memorise!

**Quick check:** What is 7 × 8?`,

    quiz: `🔢 Math Quiz!

**Q1:** What is 9 × 6?
- A) 45
- B) 54 ✅
- C) 63
- D) 56

**Q2:** If you have 24 cookies and share equally with 3 friends, how many does each person get?
- A) 6 ✅
- B) 8
- C) 4
- D) 12

**Q3:** What is the value of the digit 5 in the number 350?
- A) 5
- B) 500
- C) 50 ✅
- D) 5000

**Q4:** True or False — Multiplication and addition are completely unrelated.
- False ✅ (Multiplication is repeated addition!)

Amazing maths skills! 🌟`,
  },

  science: {
    story: `🔬 Maya's Fizzing Experiment

Maya loved mixing things. One afternoon she mixed baking soda and vinegar in a bowl. FIZZ! WHOOSH! It bubbled like crazy!

"It's alive!" she screamed — then laughed. Her dad explained: it's a chemical reaction! The baking soda (a base) and vinegar (an acid) react together, making a NEW gas called carbon dioxide — those are the bubbles!

Maya built a papier-mâché volcano, poured the magic mix inside, and it erupted with red-coloured "lava" at her school science fair.

She won first place. But more than the trophy, Maya loved the feeling of discovering: science is just asking "what if?" — and then finding out! 🏆

**Try it:** What other liquids do you think might fizz with baking soda?`,

    explanation: `⚗️ States of Matter

Everything around you is made of **matter** — and matter comes in 3 main states:

**1. Solid 🧊**
- Particles packed tightly, fixed shape
- Examples: ice, rock, wood

**2. Liquid 💧**
- Particles close but can flow, takes shape of container
- Examples: water, juice, lava

**3. Gas 💨**
- Particles spread out fast, fills any space
- Examples: air, steam, oxygen

**Changing states:**
- **Melting:** Solid → Liquid (ice → water, needs heat)
- **Evaporation:** Liquid → Gas (water → steam)
- **Condensation:** Gas → Liquid (steam → water drops on cold glass)
- **Freezing:** Liquid → Solid (water → ice)

**Question:** When you see your breath on a cold day, what state change is happening?`,

    quiz: `🔬 Science Quiz!

**Q1:** What state of matter has no fixed shape AND no fixed volume?
- A) Solid
- B) Liquid
- C) Gas ✅
- D) Plasma

**Q2:** What do plants need to make food (photosynthesis)?
- A) Sugar and salt
- B) Sunlight, water, CO₂ ✅
- C) Darkness and soil only
- D) Oxygen and heat

**Q3:** True or False — The Earth is the closest planet to the Sun.
- False ✅ (Mercury is closest!)

**Q4:** What force pulls objects toward Earth?
- A) Friction
- B) Gravity ✅
- C) Magnetism
- D) Electricity

You're a scientist! 🔬`,
  },

  coding: {
    story: `💻 Pip the Robot Programmer

Pip was a tiny robot who wanted to draw a square. But Pip didn't know how — robots need *exact instructions*.

"Turn right. Move 10 steps. Turn right. Move 10 steps. Turn right. Move 10 steps. Turn right. Move 10 steps."

That made a square! But it was sooooo long to write. Pip's programmer friend said, "Use a LOOP!"

\`\`\`
repeat 4 times:
  move 10 steps
  turn right
\`\`\`

DONE! Same result, 4 lines! Pip drew 100 squares — in seconds.

Pip learned the magic of code: **loops, patterns, and repeating things efficiently**. That's what programmers do every day! 🤖

**Think:** Can you write instructions to draw a triangle?`,

    explanation: `💡 What Is Coding?

Coding means giving a computer a set of **step-by-step instructions** to follow.

**Computers are very literal** — they do exactly what you say, nothing more!

**Basic coding ideas:**
- **Sequence** — instructions happen in order (step 1, step 2, step 3)
- **Loop** — repeat an action multiple times
- **Condition** — "IF something is true, THEN do this" (like: IF it's raining, THEN take umbrella)
- **Variable** — a box that stores information (e.g., \`score = 0\`)

**Real example (like Python):**
\`\`\`python
for i in range(5):
    print("Hello!")
\`\`\`
This prints "Hello!" 5 times!

**Why learn coding?** Coders build apps, games, websites, AI — the tools everyone uses! 🌐

**Quick question:** What does a "loop" do in programming?`,

    quiz: `💻 Coding Quiz!

**Q1:** What do we call a set of instructions that repeat?
- A) Variable
- B) Condition  
- C) Loop ✅
- D) Function

**Q2:** In coding, what does IF/THEN do?
- A) Repeats code
- B) Makes a decision based on a condition ✅
- C) Stores a number
- D) Draws graphics

**Q3:** True or False — Computers can guess what you mean if you make a spelling mistake in your code.
- False ✅ (Computers are exact — code must be perfect!)

**Q4:** What is a "variable"?
- A) A type of loop
- B) A storage box for information ✅
- C) A colour in code
- D) A type of screen

Future coder unlocked! 💻🚀`,
  },
};

// Default fallback for topics not in the mock bank
export function getFallbackContent(topic: string, format: string, age: number): string {
  const ageGroup = age <= 7 ? 'young explorer' : age <= 10 ? 'curious learner' : 'smart thinker';
  return `✨ Hello, ${ageGroup}!

This is a special topic about **${topic}** — and we're preparing something amazing just for you!

In the meantime, here are 3 cool facts about ${topic}:
- 🌟 ${topic.charAt(0).toUpperCase() + topic.slice(1)} is one of the most fascinating subjects in the world
- 🔍 Scientists and explorers spend their whole lives studying ${topic}
- 💡 You can become an expert in ${topic} too — one question at a time!

**Your challenge:** Write down 3 questions you have about ${topic}. Then ask a parent, teacher, or search it up!

*More personalised content about ${topic} in the ${format} format is coming soon!* 🚀`;
}
