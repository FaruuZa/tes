/**
 * UI.JS - Deck Builder & Interaction Logic (Final Clean)
 */
const UI = {
  myDeck: [],
  currentFilter: "all",
  sortAsc: true,
  searchQuery: "",

  init: () => {
    UI.renderDeckBuilder();
    UI.setupEventListeners();
  },

  setupEventListeners: () => {
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
    if (UI.currentFilter !== "all")
      keys = keys.filter((k) => CARDS[k].type === UI.currentFilter);
    if (UI.searchQuery)
      keys = keys.filter((k) =>
        CARDS[k].name.toLowerCase().includes(UI.searchQuery)
      );
    keys.sort((a, b) =>
      UI.sortAsc ? CARDS[a].cost - CARDS[b].cost : CARDS[b].cost - CARDS[a].cost
    );

    keys.forEach((key) => {
      const data = CARDS[key];
      const el = document.createElement("div");
      el.className = "db-card" + (UI.myDeck.includes(key) ? " selected" : "");
      el.innerHTML = `<div class="db-card-cost">${data.cost}</div><div class="db-card-icon">${data.icon}</div><div class="db-card-name">${data.name}</div>`;
      el.onclick = () => UI.toggleCard(key);
      el.oncontextmenu = (e) => {
        e.preventDefault();
        UI.showInfo(key);
      };
      container.appendChild(el);
    });
  },

  toggleCard: (key) => {
    if (UI.myDeck.includes(key)) {
      UI.myDeck = UI.myDeck.filter((k) => k !== key);
    } else {
      if (UI.myDeck.length < 8) UI.myDeck.push(key);
    }
    UI.renderDeckBuilder();
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
    document.getElementById(
      "selected-count"
    ).innerText = `${UI.myDeck.length} / 8 Kartu`;
    if (UI.myDeck.length === 8) {
      btn.classList.add("ready");
      btn.disabled = false;
      btn.innerText = "BATTLE!";
    } else {
      btn.classList.remove("ready");
      btn.disabled = true;
      btn.innerText = `Pilih ${8 - UI.myDeck.length} lagi`;
    }
  },
  showInfo: (key) => {
    const d = CARDS[key];
    const s = d.stats;
    document.getElementById("ci-icon").innerText = d.icon;
    document.getElementById("ci-name").innerText = d.name;
    document.getElementById("ci-type").innerText = d.type.toUpperCase();
    document.getElementById("ci-desc").innerText = d.desc || "-";
    let html = `<div class="stat-row"><span>Elixir</span><span class="stat-val">${d.cost}</span></div>`;
    if (s.hp)
      html += `<div class="stat-row"><span>HP</span><span class="stat-val">${s.hp}</span></div>`;
    if (s.dmg)
      html += `<div class="stat-row"><span>Damage</span><span class="stat-val">${s.dmg}</span></div>`;
    if (s.count > 1)
      html += `<div class="stat-row"><span>Count</span><span class="stat-val">x${s.count}</span></div>`;
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
      cvs.width = cvs.clientWidth;
      cvs.height = cvs.clientHeight * 0.75;
    }
    if (typeof GAME !== "undefined") GAME.startBattle(UI.myDeck);
  },

 renderHand: () => {
    if (typeof GAME === "undefined") return;
    const con = document.getElementById("hand-cards");
    if (!con) return;

    // Update Next Card Icon
    const nextIcon = document.getElementById("next-card-icon");
    if (nextIcon && GAME.nextCard && CARDS[GAME.nextCard]) {
       // Cek biar tidak repaint text jika tidak berubah
       if(nextIcon.innerText !== CARDS[GAME.nextCard].icon) {
          nextIcon.innerText = CARDS[GAME.nextCard].icon;
       }
    }

    GAME.playerHand.forEach((k, idx) => {
      // AMBIL ELEMEN YANG SUDAH ADA (JANGAN DIHAPUS/BUAT ULANG)
      let div = con.children[idx];

      // Jika elemen belum ada (saat pertama kali main), baru kita buat
      if (!div) {
        div = document.createElement("div");
        div.className = "hand-card";
        // Event listener cukup dipasang sekali saat elemen dibuat
        div.onclick = () => {
          if (!GAME.tiebreaker) {
            // Toggle select
            GAME.selectedCardIdx = GAME.selectedCardIdx === idx ? -1 : idx;
            // Kita panggil renderHand manual untuk update border active
            UI.renderHand();
          }
        };
        con.appendChild(div);
      }

      // Jika slot kosong (misal error), sembunyikan
      if (!k || !CARDS[k]) {
        div.style.visibility = "hidden";
        return;
      }
      div.style.visibility = "visible";

      const d = CARDS[k];

      // 1. UPDATE CLASS (ACTIVE SELECTION)
      // Kita atur class secara manual agar tidak mereset state hover/active browser
      if (idx === GAME.selectedCardIdx) {
        if (!div.classList.contains("active")) div.classList.add("active");
      } else {
        if (div.classList.contains("active")) div.classList.remove("active");
      }

      // 2. VISUAL UPDATE (GRAYSCALE JIKA ELIXIR KURANG)
      // Ini inti perbaikannya: Hanya ubah style, jangan innerHTML
      if (GAME.elixir < d.cost) {
        div.style.filter = "grayscale(1) opacity(0.6)";
      } else {
        div.style.filter = "none";
      }

      // 3. UPDATE KONTEN HANYA JIKA KARTU BERUBAH (CYCLE)
      // Kita gunakan atribut 'data-card' untuk mengecek apakah kartu di tangan berubah
      if (div.getAttribute("data-card") !== k) {
        div.setAttribute("data-card", k);
        div.innerHTML = `
            <div class="card-cost">${d.cost}</div>
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
