/**
 * UI.JS - Updated
 */
const UI = {
  myDeck: [],
  currentFilter: "all",
  sortAsc: true,
  searchQuery: "",

  init: () => {
    UI.renderDeckBuilder();
    UI.renderDeckSlots(); // <-- Render slot kosong awal
    UI.setupEventListeners();
    UI.selectedDifficulty = "normal";
  },

  setupEventListeners: () => {
    document.querySelectorAll(".diff-btn").forEach((btn) => {
      btn.onclick = () => {
        document
          .querySelectorAll(".diff-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        UI.selectedDifficulty = btn.getAttribute("data-diff");
      };
    });

    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.onclick = () => {
        document
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
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

    // Filter Logic
    if (UI.currentFilter !== "all")
      keys = keys.filter((k) => CARDS[k].type === UI.currentFilter);
    if (UI.searchQuery)
      keys = keys.filter((k) =>
        CARDS[k].name.toLowerCase().includes(UI.searchQuery)
      );

    // Sort Logic
    keys.sort((a, b) =>
      UI.sortAsc ? CARDS[a].cost - CARDS[b].cost : CARDS[b].cost - CARDS[a].cost
    );

    keys.forEach((key) => {
      const data = CARDS[key];
      const isSelected = UI.myDeck.includes(key);
      const el = document.createElement("div");

      // Visual feedback jika sudah dipilih (dimmed/grayed out agar fokus ke deck)
      el.className = "db-card" + (isSelected ? " selected" : "");
      if (isSelected) el.style.opacity = "0.5";

      el.innerHTML = `<div class="db-card-cost">${data.cost}</div><div class="db-card-icon">${data.icon}</div><div class="db-card-name">${data.name}</div>`;

      // Klik untuk tambah/hapus
      el.onclick = () => UI.toggleCard(key);

      // Klik kanan/tahan untuk info
      el.oncontextmenu = (e) => {
        e.preventDefault();
        UI.showInfo(key);
      };

      container.appendChild(el);
    });
  },

  // --- FITUR BARU: RENDER SLOT DECK DI FOOTER ---
  renderDeckSlots: () => {
    const slotContainer = document.getElementById("db-deck-slots");
    if (!slotContainer) return;
    slotContainer.innerHTML = "";

    // Buat 8 slot fix
    for (let i = 0; i < 8; i++) {
      const key = UI.myDeck[i]; // Ambil kartu di index ini
      const slot = document.createElement("div");
      slot.className = "deck-slot" + (key ? " filled" : "");

      if (key) {
        const d = CARDS[key];
        slot.innerHTML = `
                <div>${d.icon}</div>
                <div class="slot-cost">${d.cost}</div>
              `;
        // Klik slot untuk menghapus kartu dari deck
        slot.onclick = () => UI.toggleCard(key);
      } else {
        slot.innerHTML = `<div style="opacity:0.2; font-size:12px;">+</div>`;
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
    UI.renderDeckSlots(); // Refresh slot bawah
    UI.updateStartBtn();
  },

  setFilter: (t) => {
    UI.currentFilter = t;
    UI.renderDeckBuilder();
  },
  toggleSort: () => {
    UI.sortAsc = !UI.sortAsc;
    UI.renderDeckBuilder();
  },
  updateStartBtn: () => {
    const btn = document.getElementById("start-btn");
    const countDiv = document.getElementById("selected-count");

    // Hitung rata-rata elixir
    let avgElixir = 0;
    if (UI.myDeck.length > 0) {
      const total = UI.myDeck.reduce((sum, k) => sum + CARDS[k].cost, 0);
      avgElixir = (total / UI.myDeck.length).toFixed(1);
    }

    countDiv.innerHTML = `<span style="color:${
      UI.myDeck.length === 8 ? "#00e5ff" : "#aaa"
    }">${
      UI.myDeck.length
    }/8</span> <span style="font-size:10px; color:#d000ff;">(Avg: ${avgElixir})</span>`;

    if (UI.myDeck.length === 8) {
      btn.classList.add("ready");
      btn.disabled = false;
      btn.innerText = "BATTLE!";
    } else {
      btn.classList.remove("ready");
      btn.disabled = true;
      btn.innerText = "LENGKAPI";
    }
  },

  // --- STATISTIK KARTU LENGKAP & CANTIK ---
  showInfo: (key) => {
    const d = CARDS[key];
    const s = d.stats;

    document.getElementById("ci-icon").innerText = d.icon;
    document.getElementById("ci-name").innerText = d.name;
    document.getElementById("ci-type").innerText =
      d.type.toUpperCase() +
      (d.tags ? " • " + d.tags.join(", ").toUpperCase() : "");
    document.getElementById("ci-desc").innerText =
      d.desc || "Tidak ada deskripsi.";

    // Helper untuk membuat baris stat
    const row = (label, val, icon) => `
        <div class="stat-row">
            <span class="stat-label">${icon} ${label}</span>
            <span class="stat-val">${val}</span>
        </div>`;

    let html = "";

    // Stats Dasar
    html += row("Elixir", d.cost, "💧");
    if (s.hp) html += row("Hitpoints", s.hp, "❤️");
    if (s.shield) html += row("Shield", s.shield, "🛡️");

    // Damage & DPS
    if (s.dmg) {
      html += row("Damage", s.dmg, "⚔️");
      if (s.hitSpeed) {
        const dps = Math.round(s.dmg / s.hitSpeed);
        html += row("DPS", dps, "🔥");
        html += row("Hit Speed", s.hitSpeed + "s", "⚡");
      }
    }

    // Range & Target
    if (s.range !== undefined)
      html += row(
        "Range",
        s.range > 0 ? (s.range / CONFIG.gridSize).toFixed(1) : "Melee",
        "🎯"
      );
    if (d.tags) {
      let targets = "Ground";
      if (d.tags.includes("air-target")) targets = "Air & Ground";
      if (d.tags.includes("building-hunter")) targets = "Buildings";
      if (d.type === "spell") targets = "Area";
      html += row("Targets", targets, "👀");
    }

    // Special Stats
    if (s.count > 1) html += row("Count", "x" + s.count, "👥");
    if (s.speed) {
      let spdText = "Medium";
      if (s.speed > 1.5) spdText = "Very Fast";
      else if (s.speed > 1.2) spdText = "Fast";
      else if (s.speed < 0.8) spdText = "Slow";
      html += row("Speed", spdText, "👟");
    }
    if (s.deployTime) html += row("Deploy", s.deployTime + "s", "⏳");
    if (s.radius || s.splashRadius)
      html += row(
        "Radius",
        ((s.radius || s.splashRadius) / 10).toFixed(1),
        "⭕"
      );

    // Efek Khusus
    if (s.stunDuration) html += row("Stun", s.stunDuration + "s", "😵");
    if (s.slowDuration) html += row("Slow", s.slowDuration + "s", "❄️");
    if (d.deathEffect)
      html += row("Death", d.deathEffect.type.toUpperCase(), "💀");
    if (d.spawnEffect)
      html += row("Spawn", d.spawnEffect.type.toUpperCase(), "✨");

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

    // Reset Canvas Size
    const cvs = document.getElementById("gameCanvas");
    if (cvs) {
      // Force resize saat game mulai agar akurat
      setTimeout(() => {
        Utils.resize(GAME);
      }, 100);
    }

    if (typeof GAME !== "undefined") {
      GAME.selectedDifficulty = UI.selectedDifficulty;
      GAME.startBattle(UI.myDeck);
    }

  },

  renderHand: () => {
    // (Biarkan fungsi renderHand yang lama di sini, tidak perlu diubah kecuali mau update visual)
    // Gunakan kode renderHand terakhir Anda.
    if (typeof GAME === "undefined") return;
    const con = document.getElementById("hand-cards");
    if (!con) return;
    const nextIcon = document.getElementById("next-card-icon");
    if (
      nextIcon &&
      GAME.nextCard &&
      CARDS[GAME.nextCard] &&
      nextIcon.innerText !== CARDS[GAME.nextCard].icon
    ) {
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
        return;
      }
      div.style.visibility = "visible";
      const d = CARDS[k];
      if (idx === GAME.selectedCardIdx) {
        if (!div.classList.contains("active")) div.classList.add("active");
      } else {
        if (div.classList.contains("active")) div.classList.remove("active");
      }
      if (GAME.elixir < d.cost) div.style.filter = "grayscale(1) opacity(0.6)";
      else div.style.filter = "none";
      if (div.getAttribute("data-card") !== k) {
        div.setAttribute("data-card", k);
        div.innerHTML = `<div class="card-cost">${d.cost}</div><div class="card-icon">${d.icon}</div><div class="card-name">${d.name}</div>`;
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
