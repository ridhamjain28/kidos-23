/**
 * CogniLabs - Feedback-Driven AI Content Generation
 * Implements the loop: Signal -> Profile Update -> Synthesis -> Visible Improvement
 */

const COG_TAGS = ["Tech", "Cooking", "Fitness", "Travel", "Gaming", "Finance", "Art", "Science"];

// Initial State
let userScores = Object.fromEntries(COG_TAGS.map(t => [t, 0]));
let currentCards = [
    { title: "Digital Gold", body: "Bitcoin isn't just money; it's a protocol. Understanding the code is more valuable than tracking the price.", tags: ["Tech", "Finance"] },
    { title: "The Perfect Sear", body: "A steak only needs to be flipped once. Heat management is the difference between a dinner and a masterpiece.", tags: ["Cooking", "Science"] },
];

const cardsContainer = document.getElementById('cogni-cards-container');
const tagBarsContainer = document.getElementById('tag-bars');
const synthesizeBtn = document.getElementById('synthesize-btn');
const genLabel = document.getElementById('gen-label');

// ── Initialization ──────────────────────────────────────────────────────────
function initCogni() {
    renderBars();
    renderCards();
}

// ── Rendering ───────────────────────────────────────────────────────────────
function renderBars() {
    tagBarsContainer.innerHTML = '';
    COG_TAGS.forEach(tag => {
        const score = userScores[tag];
        // Map -5/10 to 0-100%
        const percentage = ((score + 5) / 15) * 100;
        
        const barWrapper = document.createElement('div');
        barWrapper.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px;">
                <span style="font-weight:700;">${tag}</span>
                <span style="color:var(--text-muted);">${score > 0 ? '+' : ''}${score}</span>
            </div>
            <div style="height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;">
                <div style="height:100%; width:${percentage}%; background:var(--aurora-cyan); transition:width 0.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow:0 0 10px var(--aurora-cyan);"></div>
            </div>
        `;
        tagBarsContainer.appendChild(barWrapper);
    });
}

function renderCards() {
    cardsContainer.innerHTML = '';
    currentCards.forEach((card, idx) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'fact-short-card';
        cardEl.style.minHeight = '400px';
        cardEl.style.flex = '1';
        cardEl.style.scrollSnapAlign = 'none';
        cardEl.style.background = 'var(--bg-void)';
        
        cardEl.innerHTML = `
            <div class="fact-card-content" style="position:relative; height:100%; display:flex; flex-direction:column; padding:32px;">
                <div style="display:flex; gap:8px; margin-bottom:16px;">
                    ${card.tags.map(t => `<span class="fact-card-badge" style="margin:0;">${t}</span>`).join('')}
                </div>
                <h3 style="font-size:22px; font-weight:800; margin-bottom:12px; color:#fff;">${card.title}</h3>
                <p style="font-size:16px; color:var(--text-muted); line-height:1.5; margin-bottom:auto;">${card.body}</p>
                
                <div style="display:flex; gap:12px; margin-top:24px;">
                    <button class="btn-action like-btn" style="flex:1; background:rgba(74, 222, 128, 0.1); border:1px solid var(--aurora-green); color:var(--aurora-green); padding:10px; border-radius:12px; cursor:pointer; font-weight:700; transition:0.3s;">👍 Like</button>
                    <button class="btn-action skip-btn" style="flex:1; background:rgba(236, 72, 153, 0.1); border:1px solid var(--aurora-pink); color:var(--aurora-pink); padding:10px; border-radius:12px; cursor:pointer; font-weight:700; transition:0.3s;">👎 Skip</button>
                </div>
                <button class="btn-action view-btn" style="width:100%; margin-top:12px; background:rgba(255,255,255,0.05); border:1px solid var(--border-glass); color:#fff; padding:10px; border-radius:12px; cursor:pointer; font-size:12px;">👀 View Details (3s)</button>
            </div>
        `;
        
        // Listeners
        cardEl.querySelector('.like-btn').onclick = () => handleSignal('like', card.tags);
        cardEl.querySelector('.skip-btn').onclick = () => handleSignal('skip', card.tags);
        cardEl.querySelector('.view-btn').onclick = () => handleSignal('view', card.tags);
        
        cardsContainer.appendChild(cardEl);
    });
}

// ── Interaction Logic ───────────────────────────────────────────────────────
function handleSignal(type, tags) {
    const change = type === 'like' ? 3 : type === 'skip' ? -2 : 1;
    
    // UI Feedback: disable buttons temporarily
    document.querySelectorAll('.btn-action').forEach(b => b.disabled = true);
    
    // 300ms Intentional Delay
    setTimeout(() => {
        tags.forEach(tag => {
            userScores[tag] = Math.max(-5, Math.min(10, userScores[tag] + change));
        });
        renderBars();
        document.querySelectorAll('.btn-action').forEach(b => b.disabled = false);
    }, 300);
}

// ── Synthesis Logic ─────────────────────────────────────────────────────────
synthesizeBtn.onclick = async () => {
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    
    // UI State
    synthesizeBtn.disabled = true;
    btnText.style.opacity = '0';
    btnLoader.style.display = 'flex';
    
    // Determine Top Tags
    const sorted = [...COG_TAGS].sort((a, b) => userScores[b] - userScores[a]);
    const topTags = userScores[sorted[0]] > 0 ? [sorted[0], sorted[1]] : ["Tech", "Science"];
    
    try {
        const start = Date.now();
        const res = await fetch('/cognicards/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topTags })
        });
        const data = await res.json();
        
        // Ensure 2s delay for "Synthesis" feel
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, 2000 - elapsed);
        
        setTimeout(() => {
            currentCards = data;
            renderCards();
            
            // Show label
            genLabel.innerText = `Generated for: ${topTags[0]} + ${topTags[1]}`;
            genLabel.style.opacity = '1';
            
            // Reset Button
            btnText.style.opacity = '1';
            btnLoader.style.display = 'none';
            synthesizeBtn.disabled = false;
        }, remaining);

    } catch (err) {
        console.error(err);
        btnLoader.innerText = "Error - Reverting";
        setTimeout(() => {
            btnText.style.opacity = '1';
            btnLoader.style.display = 'none';
            btnLoader.innerText = "Synthesizing...";
            synthesizeBtn.disabled = false;
        }, 1000);
    }
};

// Start
document.addEventListener('DOMContentLoaded', initCogni);
