/* ═══════════════════════════════════════════════════════════════════════════
   KidOS Aurora – Frontend Logic
   ═══════════════════════════════════════════════════════════════════════════ */

const $ = (sel) => document.querySelector(sel);
const chatContainer = $("#chat-container");
const messagesEl = $("#messages");
const nexusView = $("#nexus-view");
const form = $("#chat-form");
const input = $("#user-input");
const sendBtn = $("#send-btn");

// ── App Startup ──────────────────────────────────────────────────────────
const startupScreen = $("#startup-screen");
const appWrapper = $("#app-wrapper");
const letsGoBtn = $("#lets-go-btn");

letsGoBtn.addEventListener("click", () => {
  startupScreen.classList.add("hidden");
  appWrapper.classList.remove("hidden");
});

// ── Tab Switching ────────────────────────────────────────────────────────
const tabButtons = document.querySelectorAll(".nav-tab");
const viewPanels = document.querySelectorAll(".view-panel");

const TAB_MAP = {
  "home": "home-view",
  "library": "library-view",
  "wondertv": "wondertv-view",
  "nexus": "nexus-view",
  "labs": "labs-view",
};

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetTab = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    viewPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === TAB_MAP[targetTab]);
    });
  });
});

// ── Nexus AI logic ───────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  // Switch to chat mode
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

    if (data.type === "image") {
      appendImage(data.content, data.caption);
    } else if (data.type === "error") {
      appendMessage("ai", data.content, true);
    } else {
      appendMessage("ai", data.content);
    }
  } catch (err) {
    loadingEl.remove();
    appendMessage("ai", "Lost connection to Nexus. Is the server running?", true);
  }
});

// Welcome card shortcuts
document.querySelectorAll(".welcome-card").forEach((card) => {
  card.addEventListener("click", () => {
    input.value = card.dataset.prompt;
    form.dispatchEvent(new Event("submit"));
  });
});

// ── Fact Feed Engine ─────────────────────────────────────────────────────
const factGenerateBtn = $("#fact-generate-btn");
const factFeedScroll = $("#fact-feed-scroll");
const factFeedEmpty = $("#fact-feed-empty");
let factCount = 0;
let isGenerating = false;

factGenerateBtn.addEventListener("click", () => {
  if (isGenerating) return;
  generateFactBatch(3);
});

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
const libraryGenerateBtn = $("#library-generate-btn");
const libraryShelf = $("#library-shelf");
const generatedBooks = [];
let isGeneratingBook = false;

libraryGenerateBtn.addEventListener("click", async () => {
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
const wtvGenerateBtn = $("#wtv-generate-btn");
const wtvFeed = $("#wtv-feed");
const wtvPlayer = $("#wtv-player");
const wtvSceneImg = $("#wtv-scene-img");
const wtvSubtitle = $("#wtv-subtitle");
const wtvProgress = $("#wtv-progress-fill");

wtvGenerateBtn.addEventListener("click", async () => {
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

async function playVideo(title, description) {
  wtvPlayer.classList.add("open");
  $("#wtv-player-title").innerText = title;
  $("#wtv-loading-screen").style.display = "flex";
  
  try {
    const res = await fetch("/wondertv/watch", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({title, description})
    });
    const data = await res.json();
    $("#wtv-loading-screen").style.display = "none";
    
    for (let i = 0; i < data.scenes.length; i++) {
       if (!wtvPlayer.classList.contains("open")) break;
       const scene = data.scenes[i];
       wtvSceneImg.src = scene.image;
       wtvSubtitle.innerText = scene.narration;
       wtvProgress.style.width = `${((i+1)/data.scenes.length)*100}%`;
       await speakText(scene.narration);
       await new Promise(r => setTimeout(r, 1000));
    }
  } catch (err) {}
}

$("#wtv-player-close").addEventListener("click", () => wtvPlayer.classList.remove("open"));

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
