/* ═══════════════════════════════════════════════════════════════════════════
   KidOS Aurora – Frontend Logic
   ═══════════════════════════════════════════════════════════════════════════ */

const $ = (sel) => document.querySelector(sel);
let chatContainer, messagesEl, nexusView, form, input, sendBtn;
let tabButtons, viewPanels;
let factGenerateBtn, factFeedScroll, factFeedEmpty;
let libraryGenerateBtn, libraryShelf;
let bookReaderOverlay, bookReaderTitle, bookPageImg, bookPageText, bookPrevBtn, bookNextBtn, bookSpeakBtn;
let wtvGenerateBtn, wtvFeed, wtvPlayer, wtvSceneImg, wtvSubtitle, wtvProgress;
let gamePlayer, gamePlayerTitle, gameContent, gameTutorialBox, gameTutorialText;

// ── App Startup removed ──────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    // --- Element Assignments ---
    chatContainer = $("#chat-container");
    messagesEl = $("#messages");
    nexusView = $("#nexus-view");
    form = $("#chat-form");
    input = $("#user-input");
    sendBtn = $("#send-btn");
    tabButtons = document.querySelectorAll(".nav-tab");
    viewPanels = document.querySelectorAll(".view-panel");
    factGenerateBtn = $("#fact-generate-btn");
    factFeedScroll = $("#fact-feed-scroll");
    factFeedEmpty = $("#fact-feed-empty");
    libraryGenerateBtn = $("#library-generate-btn");
    libraryShelf = $("#library-shelf");
    bookReaderOverlay = $("#book-reader");
    bookReaderTitle = $("#book-reader-title");
    bookPageImg = $("#book-page-img")?.querySelector("img");
    bookPageText = $("#book-page-text");
    bookPrevBtn = $("#book-prev");
    bookNextBtn = $("#book-next");
    bookSpeakBtn = $("#book-speak-btn");
    wtvGenerateBtn = $("#wtv-generate-btn");
    wtvFeed = $("#wtv-feed");
    wtvPlayer = $("#wtv-player");
    wtvSceneImg = $("#wtv-scene-img");
    wtvSubtitle = $("#wtv-subtitle");
    wtvProgress = $("#wtv-progress-fill");
    gamePlayer = $("#game-player");
    gamePlayerTitle = $("#game-player-title");
    gameContent = $("#game-content");
    gameTutorialBox = $("#game-tutorial-box");
    gameTutorialText = $("#game-tutorial-text");

    // --- Tab Switching ---
    tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const targetTab = btn.dataset.tab;
            console.log("Switching to tab:", targetTab);
            tabButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            viewPanels.forEach((panel) => {
                panel.classList.toggle("active", panel.id === TAB_MAP[targetTab]);
            });
        });
    });

    // --- Other Listeners ---
    initNexusListeners();
    initFactListeners();
    initLibraryListeners();
    initWtvListeners();
    initGameListeners();
    
    console.log("KidOS Main UI: Initialization Complete.");
    fetch("/iblm/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "550e8400-e29b-41d4-a716-446655440000" })
    }).catch(() => null);
});

function initNexusListeners() {
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        nexusView.classList.add("active-chat");
        appendMessage("user", text);
        input.value = "";
        sendBtn.disabled = true;
        const loadingEl = appendLoading();
        try {
            const res = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            });
            const data = await res.json();
            loadingEl.remove();
            if (data.type === "image") appendImage(data.content, data.caption);
            else if (data.type === "error") appendMessage("ai", data.content, true);
            else appendMessage("ai", data.content);
        } catch (err) {
            loadingEl.remove();
            appendMessage("ai", "Lost connection to Nexus.", true);
        }
        sendBtn.disabled = false;
    });

    document.querySelectorAll(".welcome-card").forEach((card) => {
        card.addEventListener("click", () => {
            input.value = card.dataset.prompt;
            form.dispatchEvent(new Event("submit"));
        });
    });
}

const TAB_MAP = {
  "home": "home-view",
  "library": "library-view",
  "wondertv": "wondertv-view",
  "nexus": "nexus-view",
  "labs": "labs-view",
  "games": "games-view",
};

// ── Fact Feed Engine ─────────────────────────────────────────────────────
let factCount = 0;
let isGenerating = false;

function initFactListeners() {
    factGenerateBtn?.addEventListener("click", () => {
        if (isGenerating) return;
        generateFactBatch(3);
    });
}

async function generateFactBatch(count) {
  isGenerating = true;
  factGenerateBtn.disabled = true;
  const originalBtnHtml = factGenerateBtn.innerHTML;
  factGenerateBtn.innerHTML = `Casting Spells...`;

  if (factFeedEmpty) factFeedEmpty.style.display = "none";

  for (let i = 0; i < count; i++) {
    factCount++;
    const card = createLoadingCard();
    factFeedScroll.appendChild(card);
    card.scrollIntoView({ behavior: "smooth", block: "center" });

    try {
      const res = await fetch("/fact-feed/generate", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        replaceWithFactCard(card, data, factCount);
        sendIblmTelemetry("discovery_batch", [{ type: "engagement", value: 1 }], ["Exploration", "Facts"]);
      } else {
        replaceWithErrorCard(card, data.message || "Spell failed!");
      }
    } catch (err) {
      replaceWithErrorCard(card, "Nexus connection lost.");
    }
  }

  factGenerateBtn.innerHTML = originalBtnHtml;
  factGenerateBtn.disabled = false;
  isGenerating = false;
}

function createLoadingCard() {
  const card = document.createElement("div");
  card.className = "fact-short-card loading";
  card.innerHTML = `
    <div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px;">
      <div style="width:40px; height:40px; border:4px solid var(--aurora-cyan); border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite;"></div>
      <p style="color:var(--aurora-cyan); font-weight:800;">Weaving Discovery...</p>
    </div>`;
  return card;
}

function replaceWithFactCard(card, data, index) {
  card.className = "fact-short-card";
  card.innerHTML = `
    <img class="fact-card-bg" src="${data.image}" alt="Fact" />
    <div class="fact-card-overlay"></div>
    <div class="fact-card-content">
      <div class="fact-card-badge">✦ DISCOVERY #${index}</div>
      <div class="fact-card-text">${data.fact}</div>
      <button class="btn-generate-facts fact-listen-btn" style="margin-top:0; padding:8px 16px; font-size:12px;">Listen to Aurora</button>
    </div>
  `;
  card.querySelector(".fact-listen-btn").addEventListener("click", () => speakText(data.fact, card.querySelector(".fact-listen-btn")));
}

function replaceWithErrorCard(card, message) {
  card.innerHTML = `<div style="padding:40px; text-align:center; color:#f87171;">⚠️ ${message}</div>`;
}

// ── Library Engine ───────────────────────────────────────────────────────
const generatedBooks = [];
let isGeneratingBook = false;

function initLibraryListeners() {
    libraryGenerateBtn?.addEventListener("click", async () => {
        if (isGeneratingBook) return;
        isGeneratingBook = true;
        libraryGenerateBtn.disabled = true;
        libraryGenerateBtn.innerHTML = "Writing Story...";

        const placeholder = document.createElement("div");
        placeholder.className = "book-cover-card";
        placeholder.innerHTML = `<div style="height:100%; display:flex; align-items:center; justify-content:center;"><div style="width:30px; height:30px; border:3px solid var(--aurora-cyan); border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite;"></div></div>`;
        libraryShelf.appendChild(placeholder);

        try {
            const res = await fetch("/library/generate", { method: "POST" });
            const data = await res.json();
            if (data.status === "success") {
                const bookIndex = generatedBooks.length;
                generatedBooks.push(data);
                placeholder.innerHTML = `
                    <img class="book-cover-img" src="${data.cover}" alt="Book" />
                    <div class="book-cover-label">${data.title}</div>
                `;
                placeholder.addEventListener("click", () => openBook(bookIndex));
                sendIblmTelemetry("library_creation", [{ type: "engagement", value: 3 }], ["Literacy", "Creation"]);
            } else {
                placeholder.innerHTML = `<div style="padding:10px; font-size:10px; color:#f87171;">Failed to write.</div>`;
            }
        } catch (err) {
            placeholder.innerHTML = `<div style="padding:10px; font-size:10px; color:#f87171;">Connection error.</div>`;
        }

        libraryGenerateBtn.innerHTML = "Write a New Story";
        libraryGenerateBtn.disabled = false;
        isGeneratingBook = false;
    });

    $("#book-reader-close")?.addEventListener("click", () => bookReaderOverlay.classList.remove("open"));
    bookPrevBtn?.addEventListener("click", () => { if (currentBook && currentPage > 0) { currentPage--; renderBookPage(); } });
    bookNextBtn?.addEventListener("click", () => { if (currentBook && currentPage < currentBook.pages.length - 1) { currentPage++; renderBookPage(); } });
    bookSpeakBtn?.addEventListener("click", () => { if (currentBook) speakText(currentBook.pages[currentPage].text, bookSpeakBtn); });
}

// ── Book Reader ──────────────────────────────────────────────────────────
const bookReaderOverlay = $("#book-reader");
const bookReaderTitle = $("#book-reader-title");
const bookPageImg = $("#book-page-img").querySelector("img");
const bookPageText = $("#book-page-text");
const bookPrevBtn = $("#book-prev");
const bookNextBtn = $("#book-next");
const bookSpeakBtn = $("#book-speak-btn");
let currentBook = null;
let currentPage = 0;

function openBook(index) {
  currentBook = generatedBooks[index];
  currentPage = 0;
  bookReaderTitle.innerText = currentBook.title;
  bookReaderOverlay.classList.add("open");
  renderBookPage();
}

function renderBookPage() {
  const page = currentBook.pages[currentPage];
  bookPageImg.src = page.image;
  bookPageText.innerText = page.text;
  bookPrevBtn.disabled = currentPage === 0;
  bookNextBtn.disabled = currentPage === currentBook.pages.length - 1;
}

bookPrevBtn.addEventListener("click", () => { if (currentPage > 0) { currentPage--; renderBookPage(); } });
bookNextBtn.addEventListener("click", () => { if (currentPage < currentBook.pages.length - 1) { currentPage++; renderBookPage(); } });
$("#book-reader-close").addEventListener("click", () => bookReaderOverlay.classList.remove("open"));
bookSpeakBtn.addEventListener("click", () => speakText(currentBook.pages[currentPage].text, bookSpeakBtn));

// ── WonderTV Engine ──────────────────────────────────────────────────────
function initWtvListeners() {
    wtvGenerateBtn?.addEventListener("click", async () => {
        wtvGenerateBtn.disabled = true;
        wtvGenerateBtn.innerHTML = "Refreshing...";
        wtvFeed.innerHTML = "";
        try {
            const res = await fetch("/wondertv/generate-feed", { method: "POST" });
            const data = await res.json();
            if (data.status === "success") {
                data.feed.forEach(item => {
                    const card = document.createElement("div");
                    card.className = "book-cover-card";
                    card.style.aspectRatio = "16/9";
                    card.innerHTML = `
                        <img src="${item.thumbnail}" style="width:100%; height:100%; object-fit:cover;">
                        <div class="book-cover-label" style="font-size:14px;">${item.title}</div>
                    `;
                    card.addEventListener("click", () => playVideo(item.title, item.description));
                    wtvFeed.appendChild(card);
                });
            }
        } catch (err) {}
        wtvGenerateBtn.disabled = false;
        wtvGenerateBtn.innerHTML = "Refresh Channel";
    });

    $("#wtv-play-pause-btn")?.addEventListener("click", () => {
        isPaused = !isPaused;
        $("#wtv-play-pause-btn").innerHTML = isPaused ? "▶️ Play" : "⏸️ Pause";
        sendIblmTelemetry(isPaused ? "pause" : "play", [{ type: "engagement", value: isPaused ? -0.5 : 1 }], currentVideoTags);
    });

    $("#wtv-back-btn")?.addEventListener("click", () => {
        currentSceneIndex = Math.max(0, currentSceneIndex - 1);
        sceneJumpTriggered = true;
        sendIblmTelemetry("back_5s", [{ type: "engagement", value: 0.5 }], currentVideoTags);
    });

    $("#wtv-forward-btn")?.addEventListener("click", () => {
        currentSceneIndex = currentSceneIndex + 1;
        sceneJumpTriggered = true;
        sendIblmTelemetry("forward_5s", [{ type: "engagement", value: 0.5 }], currentVideoTags);
    });

    $("#wtv-skip-btn")?.addEventListener("click", () => {
        isSkipped = true;
        sendIblmTelemetry("skip", [{ type: "frustration", value: 2 }, { type: "engagement", value: -1 }], currentVideoTags);
    });

    $("#wtv-speed-btn")?.addEventListener("click", () => {
        if (currentSpeed === 1.0) currentSpeed = 1.5;
        else if (currentSpeed === 1.5) currentSpeed = 2.0;
        else currentSpeed = 1.0;
        $("#wtv-speed-btn").innerHTML = `⚡ Speed: ${currentSpeed}x`;
        sendIblmTelemetry("speed_change", [{ type: "engagement", value: 1 }], currentVideoTags);
    });

    $("#wtv-player-close")?.addEventListener("click", () => {
        wtvPlayer.classList.remove("open");
        isPaused = false;
    });
}
// --- IBLM Telemetry Helper ---
function sendIblmTelemetry(eventType, signals, tags) {
    fetch("/iblm/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID for Supabase
            event_type: eventType,
            signals: signals,
            content_tags: tags
        })
    }).catch(err => console.error("IBLM Telemetry Error:", err));
}

let isPaused = false;
let isSkipped = false;
let currentSpeed = 1.0;
let currentVideoTags = ["Exploration"]; // Default tag
let currentSceneIndex = 0;
let sceneJumpTriggered = false;

$("#wtv-play-pause-btn")?.addEventListener("click", () => {
  isPaused = !isPaused;
  $("#wtv-play-pause-btn").innerHTML = isPaused ? "▶️ Play" : "⏸️ Pause";
  sendIblmTelemetry(isPaused ? "pause" : "play", [{ type: "engagement", value: isPaused ? -0.5 : 1 }], currentVideoTags);
});

$("#wtv-back-btn")?.addEventListener("click", () => {
  currentSceneIndex = Math.max(0, currentSceneIndex - 1);
  sceneJumpTriggered = true;
  sendIblmTelemetry("back_5s", [{ type: "engagement", value: 0.5 }], currentVideoTags);
});

$("#wtv-forward-btn")?.addEventListener("click", () => {
  currentSceneIndex = currentSceneIndex + 1; // Handled by loop bounds
  sceneJumpTriggered = true;
  sendIblmTelemetry("forward_5s", [{ type: "engagement", value: 0.5 }], currentVideoTags);
});

$("#wtv-skip-btn")?.addEventListener("click", () => {
  isSkipped = true;
  sendIblmTelemetry("skip", [{ type: "frustration", value: 2 }, { type: "engagement", value: -1 }], currentVideoTags);
});

$("#wtv-speed-btn")?.addEventListener("click", () => {
  if (currentSpeed === 1.0) currentSpeed = 1.5;
  else if (currentSpeed === 1.5) currentSpeed = 2.0;
  else currentSpeed = 1.0;
  $("#wtv-speed-btn").innerHTML = `⚡ Speed: ${currentSpeed}x`;
  sendIblmTelemetry("speed_change", [{ type: "engagement", value: 1 }], currentVideoTags);
});

async function playVideo(title, description, tags = ["Exploration"]) {
  currentVideoTags = tags; // Update global state for telemetry
  wtvPlayer.classList.add("open");
  $("#wtv-player-title").innerText = title;
  $("#wtv-loading-screen").style.display = "flex";
  $("#wtv-recommendations").style.display = "none";
  isPaused = false;
  isSkipped = false;
  $("#wtv-play-pause-btn").innerHTML = "⏸️ Pause";
  
  sendIblmTelemetry("watch", [{ type: "engagement", value: 2 }], currentVideoTags);
  
  try {
    const res = await fetch("/wondertv/watch", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({title, description})
    });
    const data = await res.json();
    $("#wtv-loading-screen").style.display = "none";
    
    currentSceneIndex = 0;
    while (currentSceneIndex < data.scenes.length) {
       if (!wtvPlayer.classList.contains("open")) break;
       
       sceneJumpTriggered = false;
       
       while(isPaused) {
           await new Promise(r => setTimeout(r, 100));
           if (!wtvPlayer.classList.contains("open")) return;
       }
       if(isSkipped) {
           isSkipped = false;
           break; 
       }

       const scene = data.scenes[currentSceneIndex];
       wtvSceneImg.src = scene.image;
       wtvSubtitle.innerText = scene.narration;
       wtvProgress.style.width = `${((currentSceneIndex+1)/data.scenes.length)*100}%`;
       
       // Speak and Wait
       await speakText(scene.narration);
       
       // Scene Duration: wait 5s normally, or until jump/skip
       const waitTime = 5000 / currentSpeed;
       const startWait = Date.now();
       while (Date.now() - startWait < waitTime) {
           if (sceneJumpTriggered || isSkipped || isPaused || !wtvPlayer.classList.contains("open")) break;
           await new Promise(r => setTimeout(r, 100));
       }
       
       if (sceneJumpTriggered) {
           // currentSceneIndex already updated by button listeners
           continue;
       }
       if (isSkipped) break;

       currentSceneIndex++;
    }
    
    // Show Recommendations when finished
    if (wtvPlayer.classList.contains("open")) {
        showRecommendations(tags);
    }
  } catch (err) {}
}

function showRecommendations(tags) {
    $("#wtv-recommendations").style.display = "block";
    const recFeed = $("#wtv-rec-feed");
    recFeed.innerHTML = "";
    
    const recommendations = [
        {title: "Mysteries of " + tags[0], thumb: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80"},
        {title: "Deep Dive: " + tags[0], thumb: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=400&q=80"},
        {title: "Next Adventure", thumb: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&q=80"}
    ];
    
    recommendations.forEach(rec => {
        const card = document.createElement("div");
        card.style.background = "rgba(255,255,255,0.1)";
        card.style.borderRadius = "12px";
        card.style.overflow = "hidden";
        card.style.cursor = "pointer";
        card.innerHTML = `
          <img src="${rec.thumb}" style="width:100%; height:120px; object-fit:cover;">
          <div style="padding:12px; font-weight:700; color:#fff;">${rec.title}</div>
        `;
        card.addEventListener("click", () => {
            playVideo(rec.title, "Recommended content", tags);
        });
        recFeed.appendChild(card);
    });
}

$("#wtv-player-close").addEventListener("click", () => {
    wtvPlayer.classList.remove("open");
    isPaused = false;
});

// ── Helpers ──────────────────────────────────────────────────────────────
async function speakText(text, btn = null) {
  if (btn) btn.innerHTML = "Listening...";
  try {
    await fetch("/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {}
  if (btn) btn.innerHTML = "Listen to Aurora";
}

function appendMessage(role, text, isError = false) {
  const msg = document.createElement("div");
  msg.style.padding = "16px";
  msg.style.borderRadius = "16px";
  msg.style.background = role === "user" ? "var(--bg-panel)" : "rgba(255,255,255,0.05)";
  msg.style.alignSelf = role === "user" ? "flex-end" : "flex-start";
  msg.style.maxWidth = "80%";
  msg.style.color = isError ? "#f87171" : "#fff";
  msg.innerText = text;
  messagesEl.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoading() {
  const loader = document.createElement("div");
  loader.innerText = "Nexus is thinking...";
  loader.style.fontSize = "12px";
  loader.style.color = "var(--aurora-cyan)";
  messagesEl.appendChild(loader);
  return loader;
}

function appendImage(src, caption) {
  const msg = document.createElement("div");
  msg.style.background = "rgba(255,255,255,0.05)";
  msg.style.padding = "16px";
  msg.style.borderRadius = "16px";
  msg.style.maxWidth = "80%";
  msg.innerHTML = `<img src="${src}" style="width:100%; border-radius:12px; margin-bottom:8px;"><p style="font-size:14px;">${caption}</p>`;
  messagesEl.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function initGameListeners() {
    document.querySelectorAll(".game-card").forEach(card => {
        card.addEventListener("click", async () => {
            const gameType = card.dataset.game;
            const title = card.querySelector("h3").innerText;
            console.log("Starting game:", title);
            
            gamePlayerTitle.innerText = title;
            gamePlayer.classList.add("open");
            
            gameTutorialBox.style.display = "block";
            gameTutorialText.innerText = "Nexus is preparing your game and tutorial...";
            
            const tutorials = {
                "chess": "Move your pieces to capture the king! Pawns go forward, Knights jump in L-shapes, and Queens move everywhere.",
                "memory": "Flip the cards to find matching pairs! Remember where the items are to win.",
                "painting": "Use your brush to create a masterpiece! Every color tells a story.",
                "puzzles": "Fit the pieces together to reveal the hidden picture. Start with the corners!"
            };

            gameTutorialText.innerText = tutorials[gameType] || "Have fun playing this game!";
            speakText(gameTutorialText.innerText);

            if (gameType === "chess") {
                const pieces = {
                    0: '♜', 1: '♞', 2: '♝', 3: '♛', 4: '♚', 5: '♝', 6: '♞', 7: '♜',
                    8: '♟', 9: '♟', 10: '♟', 11: '♟', 12: '♟', 13: '♟', 14: '♟', 15: '♟',
                    48: '♙', 49: '♙', 50: '♙', 51: '♙', 52: '♙', 53: '♙', 54: '♙', 55: '♙',
                    56: '♖', 57: '♘', 58: '♗', 59: '♕', 60: '♔', 61: '♗', 62: '♘', 63: '♖'
                };
                gameContent.innerHTML = `
                    <div style="display:grid; grid-template-columns:repeat(8, 1fr); width:100%; max-width:500px; aspect-ratio:1/1; border:8px solid #374151; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
                        ${Array(64).fill(0).map((_, i) => {
                            const row = Math.floor(i / 8);
                            const col = i % 8;
                            const isBlack = (row + col) % 2 === 1;
                            const pieceColor = row < 2 ? '#1e293b' : '#f8fafc';
                            return `
                                <div style="background:${isBlack ? '#4b5563' : '#e5e7eb'}; display:flex; align-items:center; justify-content:center; font-size:40px; color:${pieceColor}; cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" onclick="this.style.background='var(--aurora-cyan)'">
                                    ${pieces[i] || ''}
                                </div>`;
                        }).join('')}
                    </div>
                `;
            } else if (gameType === "memory") {
                const items = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥝', '🍉'];
                let board = [...items, ...items].sort(() => Math.random() - 0.5);
                let first = null;
                window.flip = (el, icon) => {
                    if (el.innerText !== '❓') return;
                    el.innerText = icon;
                    el.style.background = 'var(--aurora-cyan)';
                    if (!first) {
                        first = { el, icon };
                    } else {
                        if (first.icon === icon) {
                            speakText("Match!");
                            first = null;
                        } else {
                            const f = first;
                            first = null;
                            setTimeout(() => {
                                el.innerText = '❓';
                                el.style.background = 'rgba(255,255,255,0.1)';
                                f.el.innerText = '❓';
                                f.el.style.background = 'rgba(255,255,255,0.1)';
                            }, 500);
                        }
                    }
                };
                gameContent.innerHTML = `
                    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:15px; width:100%; max-width:500px;">
                        ${board.map(emoji => `
                            <div style="aspect-ratio:1/1; background:rgba(255,255,255,0.1); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:40px; cursor:pointer; border:1px solid var(--border-glass);" onclick="window.flip(this, '${emoji}')">
                                ❓
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (gameType === "numbers") {
                let score = 0;
                window.checkAns = (val, correct) => {
                    if (val === correct) {
                        score++;
                        speakText("Correct!");
                        window.nextQ();
                    } else {
                        speakText("Oops!");
                    }
                };
                window.nextQ = () => {
                    const a = Math.floor(Math.random() * 10) + 1;
                    const b = Math.floor(Math.random() * 10) + 1;
                    const ans = a + b;
                    const choices = [ans, ans+1, ans-1, ans+2].sort(() => Math.random()-0.5);
                    gameContent.innerHTML = `
                        <div style="text-align:center;">
                            <div style="font-size:32px; color:var(--aurora-cyan); margin-bottom:20px;">Score: ${score}</div>
                            <div style="font-size:84px; font-weight:800; margin-bottom:40px;">${a} + ${b}</div>
                            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:20px;">
                                ${choices.map(c => `<button class="btn-generate-facts" style="padding:20px; font-size:32px;" onclick="window.checkAns(${c}, ${ans})">${c}</button>`).join('')}
                            </div>
                        </div>
                    `;
                };
                window.nextQ();
            } else if (gameType === "words") {
                const words = ["GALAXY", "NEBULA", "ROBOT", "AURORA", "SPACE", "PLANET"];
                window.checkWord = (correct) => {
                    const val = document.getElementById('word-input').value.toUpperCase();
                    if (val === correct) {
                        speakText("Great!");
                        window.nextW();
                    } else {
                        speakText("Try again!");
                    }
                };
                window.nextW = () => {
                    const word = words[Math.floor(Math.random() * words.length)];
                    const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
                    gameContent.innerHTML = `
                        <div style="text-align:center;">
                            <div style="font-size:24px; color:var(--aurora-cyan); margin-bottom:10px;">Unscramble!</div>
                            <div style="font-size:64px; font-weight:900; letter-spacing:10px; margin-bottom:40px;">${scrambled}</div>
                            <input id="word-input" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-glass); padding:15px; border-radius:12px; color:#fff; font-size:24px; text-align:center; width:280px; margin-bottom:20px;" placeholder="...">
                            <br>
                            <button class="btn-generate-facts" onclick="window.checkWord('${word}')">Submit</button>
                        </div>
                    `;
                };
                window.nextW();
            }
            sendIblmTelemetry("game_start", [{ type: "engagement", value: 2 }], ["Gaming", gameType]);
        });
    });

    $("#game-player-close")?.addEventListener("click", () => {
        gamePlayer.classList.remove("open");
    });
}

$("#game-player-close")?.addEventListener("click", () => {
    gamePlayer.classList.remove("open");
});

// ── Session Startup ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    console.log("KidOS Main UI: Starting IBLM Session...");
    fetch("/iblm/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "550e8400-e29b-41d4-a716-446655440000" })
    }).catch(() => null);
});
