# IBLM Core - The Breakthrough Context Engine

## 🧠 What is IBLM?

**IBLM** (Individual Behavior Learning Machine) is a revolutionary context management system that learns **WHO a user is**, not just what they've said. It acts as a "digital brain" between the user and any LLM.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              IBLM ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   USER ──────► INTERACTION ──────► IBLM ──────► LLM                        │
│                OBSERVER          KERNEL       (Any Model)                   │
│                    │                │                                       │
│                    ▼                ▼                                       │
│              Extract Signals → Compile Rules → Inject Context              │
│                    │                │                                       │
│                    ▼                ▼                                       │
│              [Corrections]    [Living Memory]                               │
│              [Preferences]    [User Profile]                                │
│              [Expertise]      [Style Vector]                                │
│              [Entities]       [Knowledge Graph]                             │
│                                                                             │
│                         GARBAGE COLLECTION                                  │
│                    Raw logs deleted after compilation                       │
│                         ↓                                                   │
│                    INFINITE SCALING                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔥 The Breakthrough: Why IBLM is Different

### Traditional RAG (Retrieval Augmented Generation)

```
User: "Use Python"              → Store: "Use Python"
AI: "Here's Python code..."     → Store: "Here's Python code..."
User: "No, use TypeScript"      → Store: "No, use TypeScript"  
AI: "Converting to TS..."       → Store: "Converting to TS..."
...1000 more messages...

Result: 100,000+ tokens stored
Problem: Token bloat, context window limits, slow retrieval
```

### IBLM (Recursive Context Compiler)

```
User: "Use Python"              → Signal: PREFERENCE(Python)
AI: "Here's Python code..."     → 
User: "No, use TypeScript"      → Signal: CORRECTION(TypeScript > Python)
AI: "Converting to TS..."       →

COMPILATION:
  Rule: "User prefers TypeScript over Python" (weight: 0.9)
  
GARBAGE COLLECTION:
  Source messages: DELETED
  
Result: ~20 tokens stored (the rule)
Scaling: O(log n) instead of O(n)
```

---

## 📊 Token Efficiency Comparison

| Interactions | Traditional RAG | IBLM Core |
|--------------|-----------------|-----------|
| 10           | ~5,000 tokens   | ~100 tokens |
| 100          | ~50,000 tokens  | ~300 tokens |
| 1,000        | ~500,000 tokens | ~500 tokens |
| 10,000       | ~5,000,000 tokens | ~800 tokens |

**IBLM grows logarithmically** because it *compiles* knowledge into rules.

---

## 🔄 The IBLM Workflow

### Phase 1: Observation

```python
from iblm import IBLM

brain = IBLM()

# Every interaction is observed
brain.observe(
    user_input="I'm building a FastAPI backend",
    ai_output="Great! Here's how to structure it..."
)
```

**What happens internally:**
1. `InteractionObserver` analyzes the input
2. Extracts signals: `ENTITY(FastAPI)`, `CONTEXT(backend)`
3. Signals are queued for compilation

### Phase 2: Signal Extraction

The Observer detects **implicit signals** without requiring explicit user input:

| User Says | Signal Detected | Confidence |
|-----------|-----------------|------------|
| "No, use TypeScript instead" | CORRECTION | 0.95 |
| "I prefer concise responses" | PREFERENCE | 0.80 |
| "I'm an expert in ML" | EXPERTISE | 0.85 |
| "Working on Project Alpha" | ENTITY | 0.70 |
| Short messages | STYLE(concise) | 0.60 |

### Phase 3: Evolution (The Brain)

```python
# The evolve() algorithm:
def evolve(signals):
    # 1. Detect contradictions with existing rules
    for signal in signals:
        if contradicts(existing_rules):
            penalize_contradicted_rules()
    
    # 2. Cluster similar signals
    clusters = cluster_by_similarity(signals)
    
    # 3. Compile clusters into rules
    for cluster in clusters:
        if cluster.count >= threshold:
            rule = compile_to_rule(cluster)
            add_to_kernel(rule)
            delete_source_signals()  # GARBAGE COLLECTION
    
    # 4. Decay and prune low-weight rules
    for rule in kernel:
        rule.weight -= DECAY_RATE
        if rule.weight < MIN_WEIGHT:
            delete(rule)
    
    # 5. Consolidate similar rules
    merge_similar_rules()
```

### Phase 4: Context Injection

```python
# When user asks a new question
context = brain.inject("How do I implement auth?")

print(context.system_header)
# Output:
# USER CONTEXT: Software engineer, expert in Python and FastAPI.
# COMMUNICATION STYLE: Prefers concise, technical responses.
# PREFERENCES:
# - Use TypeScript over JavaScript
# - Include type hints
# - Prefer async/await patterns
# ACTIVE PROJECT: FastAPI Backend - API development
```

The LLM now has **"telepathic"** understanding of the user.

---

## 🎯 Individual Behavior Learning

The "Individual" in IBLM means we build a complete picture of **WHO the user is**:

### UserProfile (The Digital Twin)

```python
profile = {
    "role": "Senior Software Engineer",
    "industry": "FinTech",
    "expertise_domains": ["Python", "FastAPI", "PostgreSQL"],
    "expertise_levels": {"Python": 0.9, "FastAPI": 0.8},
    "preferred_languages": ["Python", "TypeScript"],
    "avoided_technologies": ["PHP", "jQuery"],
    "traits": {
        "perfectionist": 0.7,
        "pragmatic": 0.4,
        "systematic": 0.8
    },
    "active_goals": ["Build scalable API", "Migrate to microservices"],
    "profile_confidence": 0.85  # Increases with more interactions
}
```

### StyleVector (How to Communicate)

```python
style = {
    "formality": 0.3,      # More casual
    "verbosity": 0.2,      # Prefers concise
    "technicality": 0.9,   # Very technical
    "directness": 0.8,     # Prefers blunt
    "pace": 0.7            # Fast-paced
}
```

This vector is used to calibrate **how** the AI responds.

---

## 🔮 The Reflection Prompt

IBLM can generate a prompt that makes the LLM **embody the user**:

```python
reflection = brain.get_reflection_prompt()

# Output:
# "You are embodying the perspective of the following user. 
#  Respond as if you ARE this person:
#
#  I am a Senior Software Engineer in the FinTech industry. 
#  I'm an expert in Python, FastAPI. I prefer working with 
#  Python, TypeScript. I avoid PHP. My communication style: 
#  casual and friendly; prefers concise responses; comfortable 
#  with technical depth. I'm currently focused on: Build 
#  scalable API."
```

Use this for:
- **Planning**: "What would the user want next?"
- **Review**: "Evaluate this from the user's perspective"
- **Continuation**: AI can continue work in user's style

---

## 💾 Portability

The entire brain exports to a single file:

```python
# Save
brain.save("my_brain.json.gz")  # Compressed

# Load anywhere
brain = IBLM.load("my_brain.json.gz")

# Works with any LLM
# The context is model-agnostic!
```

**Brain size after 1000 interactions: ~50KB** (compressed)

---

## 🚀 Quick Start

```python
from iblm import IBLM

# Create a brain
brain = IBLM()

# Set project context
brain.set_project("MyApp", "React + FastAPI web application")

# Teach it directly
brain.teach("I'm an expert Python developer")
brain.teach("Always use type hints")
brain.teach("I prefer functional programming patterns")

# Observe interactions
brain.observe("Write me a login endpoint", "Here's the endpoint...")
brain.observe("Make it async", "Converting to async...")

# Get context for new prompt
injection = brain.inject("How do I add rate limiting?")
print(injection.system_header)

# Save for later
brain.save("my_brain.json.gz")
```

---

## 🏗️ Architecture Deep Dive

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `InteractionObserver` | Watches (user, AI) pairs, extracts signals |
| `LogicCompiler` | Converts signals → rules, implements evolve() |
| `UserKernel` | Stores rules, nodes, profile, style vector |
| `ContextInjector` | Builds optimized system headers |
| `EmbeddingEngine` | Semantic matching without external APIs |
| `IBLM` | Unified API orchestrating all components |

### The evolve() Algorithm

```
┌──────────────────────────────────────────────────────────────┐
│                     evolve() ALGORITHM                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUT: New signals from observer                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. CONTRADICTION DETECTION                              ││
│  │    For each CORRECTION signal:                          ││
│  │    - Find rules with high semantic similarity           ││
│  │    - If negation detected → mark as contradicted        ││
│  │    - Apply weight penalty (-0.5)                        ││
│  └─────────────────────────────────────────────────────────┘│
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 2. SIGNAL CLUSTERING                                    ││
│  │    Group signals by:                                    ││
│  │    - Signal type (PREFERENCE, STYLE, etc.)              ││
│  │    - Semantic similarity (>0.75)                        ││
│  └─────────────────────────────────────────────────────────┘│
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 3. RULE COMPILATION                                     ││
│  │    For each cluster:                                    ││
│  │    - If count >= threshold AND confidence >= 0.5        ││
│  │    - Generate rule with computed weight                 ││
│  │    - Corrections get +0.3 weight boost                  ││
│  │    - Add to kernel                                      ││
│  └─────────────────────────────────────────────────────────┘│
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 4. PROFILE & STYLE UPDATES                              ││
│  │    - Update expertise domains                           ││
│  │    - Update language/tool preferences                   ││
│  │    - Adjust style vector dimensions                     ││
│  └─────────────────────────────────────────────────────────┘│
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 5. GARBAGE COLLECTION                                   ││
│  │    - Delete processed interaction logs                  ││
│  │    - Keep only content hashes (deduplication)           ││
│  └─────────────────────────────────────────────────────────┘│
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 6. DECAY & PRUNING                                      ││
│  │    - Apply time-based decay to all rule weights         ││
│  │    - Remove rules with weight < 0.1                     ││
│  └─────────────────────────────────────────────────────────┘│
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 7. CONSOLIDATION                                        ││
│  │    - Find rules with similarity > 0.8                   ││
│  │    - Merge into single rule                             ││
│  │    - Combine weights                                    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  OUTPUT: EvolutionReport with statistics                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🆚 IBLM vs Existing Solutions

| Feature | Mem0/etc | RAG Systems | IBLM Core |
|---------|----------|-------------|-----------|
| Storage | Raw text | Raw text + vectors | Compiled rules |
| Scaling | O(n) | O(n) | **O(log n)** |
| Learning | Passive | Passive | **Active** |
| User Model | None | None | **Complete profile** |
| Corrections | Manual | Manual | **Automatic** |
| Portability | Limited | Complex | **Single file** |
| Token Usage | High | High | **Minimal** |
| External APIs | Required | Required | **Optional** |

---

## 📁 File Structure

```
IBLM/
├── __init__.py      # Package exports
├── models.py        # Data structures (Signal, Rule, Node, etc.)
├── embeddings.py    # Lightweight embedding engine
├── kernel.py        # UserKernel (living memory)
├── observer.py      # InteractionObserver (signal extraction)
├── compiler.py      # LogicCompiler (evolve algorithm)
├── injector.py      # ContextInjector (prompt enhancement)
├── iblm.py          # Main IBLM class (unified API)
└── tests/
    └── test_iblm.py # Comprehensive test suite
```

---

## 🔒 Production Features (v2.0)

IBLM v2.0 introduces enterprise-ready features for security, reliability, and scalability.

### Input Validation & Sanitization

```python
from iblm import IBLM, IBLMConfig

# Enable validation (on by default)
config = IBLMConfig(enable_validation=True)
brain = IBLM(config)

# All inputs are automatically:
# - Sanitized for XSS attacks
# - Truncated to safe lengths
# - Checked for injection patterns
brain.observe(user_input, ai_output)  # Safe!
```

### Thread Safety

```python
# Thread-safe operations (on by default)
config = IBLMConfig(enable_thread_safety=True)
brain = IBLM(config)

# Safe for concurrent access
import threading
threads = [
    threading.Thread(target=brain.observe, args=(input, output))
    for input, output in messages
]
```

### Resource Limits (DoS Protection)

```python
# Prevent unbounded memory growth
config = IBLMConfig(
    max_rules=1000,      # Maximum behavioral rules
    max_nodes=500,       # Maximum knowledge nodes
    max_pending_signals=100,  # Signal buffer limit
)
brain = IBLM(config)
```

### Encrypted Persistence

```python
# Save with AES-256 equivalent encryption
brain.save_encrypted("brain.iblm.enc", password="secure_password_123")

# Load encrypted brain
brain = IBLM.load_encrypted("brain.iblm.enc", password="secure_password_123")

# Wrong password → IntegrityError (tamper detection)
```

### Health Checks

```python
# Monitor brain health
health = brain.health_check()
print(health)
# {
#     "status": "healthy",
#     "id": "abc12345",
#     "rules_count": 42,
#     "nodes_count": 15,
#     "observations": 500,
#     "profile_confidence": 0.85,
#     "kernel_metrics": {...}
# }
```

### Context Manager

```python
# Automatic cleanup
with IBLM() as brain:
    brain.teach("I'm a Python developer")
    brain.observe(user_input, ai_output)
    # ...
# Brain automatically closes and optionally saves
```

### Production Configuration

```python
# Full production config
config = IBLMConfig(
    # Security
    enable_validation=True,
    enable_thread_safety=True,
    enable_rate_limiting=True,
    
    # Behavior
    auto_evolve=True,
    auto_gc=True,
    gc_threshold=20,
    
    # Limits
    max_rules=1000,
    max_nodes=500,
)
brain = IBLM(config)
```

### Custom Exceptions

```python
from iblm import (
    IBLMError,           # Base exception
    ValidationError,     # Input validation failed
    SecurityError,       # Security issue
    ResourceLimitError,  # Limit exceeded
    IntegrityError,      # Data corruption/tampering
    EncryptionError,     # Encryption/decryption failed
    RateLimitError,      # Rate limit exceeded
)

try:
    brain.observe(malicious_input, output)
except ValidationError as e:
    print(f"Input rejected: {e}")
```

---

## 📁 File Structure (v2.0)

```
IBLM/
├── __init__.py      # Package exports (v2.0)
├── models.py        # Data structures (Signal, Rule, Node, etc.)
├── embeddings.py    # Lightweight embedding engine
├── kernel.py        # UserKernel (thread-safe living memory)
├── observer.py      # InteractionObserver (signal extraction)
├── compiler.py      # LogicCompiler (evolve algorithm)
├── injector.py      # ContextInjector (prompt enhancement)
├── iblm.py          # Main IBLM class (unified API)
├── config.py        # Centralized configuration
├── validators.py    # Input validation & sanitization
├── security.py      # Encryption, rate limiting, integrity
├── exceptions.py    # Custom exception hierarchy
├── examples/
│   ├── demo.py            # Basic usage demo
│   └── production_demo.py # Production features demo
└── tests/
    └── test_iblm.py # Comprehensive test suite
```

---

## 🎓 Key Takeaways

1. **IBLM compiles interactions into rules** - not stores them
2. **Garbage collection enables infinite scaling** - source logs are deleted
3. **The user profile is a "digital twin"** - captures WHO the user is
4. **Context injection gives LLMs telepathy** - personalized from word one
5. **Corrections are high-priority learning events** - the system self-corrects
6. **Everything exports to one file** - complete portability

---

## 🚀 The Future

IBLM is designed to be the foundation for:
- **Multi-session memory** - remember users across conversations
- **Team kernels** - shared context for teams
- **Kernel merging** - combine knowledge from multiple sources
- **Continuous learning** - always improving understanding
- **Cross-LLM portability** - same brain, any model

The goal: **AI that truly knows you.**
