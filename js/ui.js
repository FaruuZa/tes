/**
 * UI.JS - Updated for "Juicy" 3D Style
 * Menyesuaikan struktur HTML dengan CSS baru (Droplet Elixir, Rotasi Span, dll)
 */
const UI = {
  myDeck: [],
  currentFilter: "all",
  sortAsc: true,
  searchQuery: "",
  selectedDifficulty: "normal",

  init: () => {
    UI.renderDeckBuilder();
    UI.renderDeckSlots(); 
    UI.setupEventListeners();
  },

  setupEventListeners: () => {
    // Difficulty Buttons
    document.querySelectorAll(".diff-btn").forEach((btn) => {
      btn.onclick = () => {
        document.querySelectorAll(".diff-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        UI.selectedDifficulty = btn.getAttribute("data-diff");
      };
    });

    // Filter Buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.onclick = () => {
        document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        UI.setFilter(btn.getAttribute("data-filter") || "all");
      };
    });

    const sortBtn = document.getElementById("sort-btn");
    if (sortBtn) sortBtn.onclick = UI.toggleSort;

    const searchInput = document.getElementById("db-search");
    if (searchInput)
      searchInput.onkeyup = (e) => {
        UI.searchQuery = e.target.value.toLowerCase();
        UI.renderDeckBuilder();
      };

    const startBtn = document.getElementById("start-btn");
    if (startBtn) startBtn.onclick = UI.startGame;

    const closeInfoBtn = document.getElementById("close-info");
    if (closeInfoBtn) closeInfoBtn.onclick = UI.closeInfo;
  },

  renderDeckBuilder: () => {
    const container = document.getElementById("db-cards");
    if (!container) return;
    container.innerHTML = "";
    
    let keys = Object.keys(CARDS).filter((k) => !CARDS[k].hiddenInDeck);

    // 1. Filter Logic
    if (UI.currentFilter !== "all")
      keys = keys.filter((k) => CARDS[k].type === UI.currentFilter);
    if (UI.searchQuery)
      keys = keys.filter((k) => CARDS[k].name.toLowerCase().includes(UI.searchQuery));

    // 2. Sort Logic
    keys.sort((a, b) => {
        const cA = CARDS[a];
        const cB = CARDS[b];

        if (UI.currentFilter === "all") {
            const typePriority = { 'unit': 1, 'building': 2, 'spell': 3 };
            const typeA = typePriority[cA.type] || 99;
            const typeB = typePriority[cB.type] || 99;
            if (typeA !== typeB) return typeA - typeB;
        }
        return UI.sortAsc ? cA.cost - cB.cost : cB.cost - cA.cost;
    });

    keys.forEach((key) => {
      const data = CARDS[key];
      const isSelected = UI.myDeck.includes(key);
      const el = document.createElement("div");

      el.className = "db-card" + (isSelected ? " selected" : "");
      if (isSelected) el.style.opacity = "0.6";

      // UPDATE: Menggunakan struktur .card-cost > span agar konsisten dengan CSS baru
      el.innerHTML = `
        <div class="card-cost" style="width:20px; height:20px; font-size:10px; top:-4px; left:-4px;">
            <span>${data.cost}</span>
        </div>
        <div class="db-card-icon">${data.icon}</div>
        <div class="db-card-name">${data.name}</div>
      `;

      el.onclick = () => UI.toggleCard(key);
      el.oncontextmenu = (e) => { e.preventDefault(); UI.showInfo(key); };

      container.appendChild(el);
    });
  },

  renderDeckSlots: () => {
    const slotContainer = document.getElementById("db-deck-slots");
    if (!slotContainer) return;
    slotContainer.innerHTML = "";

    for (let i = 0; i < 8; i++) {
      const key = UI.myDeck[i]; 
      const slot = document.createElement("div");
      slot.className = "deck-slot" + (key ? " filled" : "");

      if (key) {
        const d = CARDS[key];
        // UPDATE: Menggunakan struktur droplet card-cost juga disini
        slot.innerHTML = `
            <div class="card-cost" style="width:18px; height:18px; font-size:9px; top:-5px; left:-5px;">
                <span>${d.cost}</span>
            </div>
            <div>${d.icon}</div>
        `;
        slot.onclick = () => UI.toggleCard(key);
      } else {
        slot.innerHTML = `<div style="opacity:0.2; font-size:18px; font-weight:bold;">+</div>`;
      }
      slotContainer.appendChild(slot);
    }
  },

  toggleCard: (key) => {
    if (UI.myDeck.includes(key)) {
      UI.myDeck = UI.myDeck.filter((k) => k !== key);
    } else {
      if (UI.myDeck.length < 8) UI.myDeck.push(key);
    }
    UI.renderDeckBuilder();
    UI.renderDeckSlots(); 
    UI.updateStartBtn();
  },

  setFilter: (t) => {
    UI.currentFilter = t;
    UI.renderDeckBuilder();
  },

  toggleSort: () => {
    UI.sortAsc = !UI.sortAsc;
    const btn = document.getElementById("sort-btn");
    if(btn) btn.innerText = UI.sortAsc ? "COST ⬆️" : "COST ⬇️";
    UI.renderDeckBuilder();
  },
  
  updateStartBtn: () => {
    const btn = document.getElementById("start-btn");
    const countDiv = document.getElementById("selected-count");

    let avgElixir = 0;
    if (UI.myDeck.length > 0) {
      const total = UI.myDeck.reduce((sum, k) => sum + CARDS[k].cost, 0);
      avgElixir = (total / UI.myDeck.length).toFixed(1);
    }

    // Update warna teks agar kontras dengan background gelap
    const countColor = UI.myDeck.length === 8 ? "#ffce00" : "#aaa"; // Gold jika penuh
    countDiv.innerHTML = `
        <span style="color:${countColor}; font-weight:bold;">${UI.myDeck.length}/8</span> 
        <span style="font-size:11px; color:#d000ff; margin-left:5px; font-weight:bold;">(Avg: ${avgElixir})</span>
    `;

    if (UI.myDeck.length === 8) {
      btn.classList.add("ready");
      btn.disabled = false;
      btn.innerText = "BATTLE!";
    } else {
      btn.classList.remove("ready");
      btn.disabled = true;
      btn.innerText = "LENGKAPI DECK";
    }
  },

  showInfo: (key) => {
    const d = CARDS[key];
    const s = d.stats;

    document.getElementById("ci-icon").innerText = d.icon;
    document.getElementById("ci-name").innerText = d.name;
    document.getElementById("ci-type").innerText = d.type.toUpperCase() + (d.tags ? " • " + d.tags.join(", ").toUpperCase() : "");
    document.getElementById("ci-desc").innerText = d.desc || "Tidak ada deskripsi.";

    const row = (label, val, icon) => `
        <div class="stat-row">
            <span class="stat-label">${icon} ${label}</span>
            <span class="stat-val">${val}</span>
        </div>`;

    let html = "";
    html += row("Elixir", d.cost, "💧");
    if (s.hp) html += row("Hitpoints", s.hp, "❤️");
    if (s.shield) html += row("Shield", s.shield, "🛡️");

    if (s.dmg) {
      html += row("Damage", s.dmg, "⚔️");
      if (s.hitSpeed) {
        const dps = Math.round(s.dmg / s.hitSpeed);
        html += row("DPS", dps, "🔥");
        html += row("Hit Speed", s.hitSpeed + "s", "⚡");
      }
    }

    if (s.range !== undefined) html += row("Range", s.range > 0 ? (s.range / CONFIG.gridSize).toFixed(1) : "Melee", "🎯");
    if (s.count > 1) html += row("Count", "x" + s.count, "👥");
    if (s.speed) html += row("Speed", s.speed, "👟");
    if (s.deployTime) html += row("Deploy", s.deployTime + "s", "⏳");
    
    document.getElementById("ci-stats").innerHTML = html;
    document.getElementById("card-info-modal").style.display = "block";
  },

  closeInfo: () => {
    document.getElementById("card-info-modal").style.display = "none";
  },

  startGame: () => {
    if (UI.myDeck.length !== 8) return;
    document.getElementById("deck-builder").style.display = "none";
    document.getElementById("game-viewport").style.display = "flex";

    const cvs = document.getElementById("gameCanvas");
    if (cvs) {
      setTimeout(() => { Utils.resize(GAME); }, 100);
    }

    if (typeof GAME !== "undefined") {
      GAME.selectedDifficulty = UI.selectedDifficulty;
      GAME.startBattle(UI.myDeck);
    }
  },

  // --- BAGIAN PENTING: Render Hand dengan Struktur Baru ---
  renderHand: () => {
    if (typeof GAME === "undefined") return;
    const con = document.getElementById("hand-cards");
    if (!con) return;
    
    const nextIcon = document.getElementById("next-card-icon");
    if (nextIcon && GAME.nextCard && CARDS[GAME.nextCard]) {
      nextIcon.innerText = CARDS[GAME.nextCard].icon;
    }

    GAME.playerHand.forEach((k, idx) => {
      let div = con.children[idx];
      if (!div) {
        div = document.createElement("div");
        div.className = "hand-card";
        div.onclick = () => {
          if (!GAME.tiebreaker) {
            GAME.selectedCardIdx = GAME.selectedCardIdx === idx ? -1 : idx;
            UI.renderHand();
          }
        };
        con.appendChild(div);
      }
      
      if (!k || !CARDS[k]) {
        div.style.visibility = "hidden";
        // Reset atribut agar tidak ada data sisa
        div.removeAttribute("data-card");
        return;
      }
      
      div.style.visibility = "visible";
      const d = CARDS[k];
      
      // Handle Selection State
      if (idx === GAME.selectedCardIdx) {
        if (!div.classList.contains("active")) div.classList.add("active");
      } else {
        if (div.classList.contains("active")) div.classList.remove("active");
      }
      
      // Handle Cost/Disabled State
      const isAffordable = GAME.elixir >= d.cost;
      if (!isAffordable) {
          if (!div.classList.contains("disabled")) div.classList.add("disabled");
      } else {
          if (div.classList.contains("disabled")) div.classList.remove("disabled");
      }

      // Render Content (Hanya jika kartu berubah)
      if (div.getAttribute("data-card") !== k) {
        div.setAttribute("data-card", k);
        // INI BAGIAN UTAMA YANG DIUBAH:
        // Menambahkan <span> di dalam .card-cost
        div.innerHTML = `
            <div class="card-cost"><span>${d.cost}</span></div>
            <div class="card-icon">${d.icon}</div>
            <div class="card-name">${d.name}</div>
        `;
      }
    });
  },

  updateElixirUI: () => {
    if (typeof GAME === "undefined") return;
    const txt = document.getElementById("elixir-text");
    const fill = document.getElementById("elixir-fill");
    
    if (txt) txt.innerText = Math.floor(GAME.elixir);
    if (fill) fill.style.width = (GAME.elixir / CONFIG.maxElixir) * 100 + "%";
    
    UI.renderHand();
  },
};

UI.init();