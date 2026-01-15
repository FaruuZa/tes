/**
 * GAME.JS - Fixed Bot Elixir, Timer Logic, Placement Validation
 */
class GameEngine {
  constructor() {
    this.reset();
    this.loop = this.loop.bind(this);
  }

  reset() {
    this.units = [];
    this.buildings = [];
    this.towers = [];
    this.projectiles = [];
    this.effects = [];
    this.pendingSpells = [];
    this.spellAreas = [];
    this.elixir = 5;
    this.botElixir = 5;
    this.gameOver = false;
    this.scale = 1;
    this.matchTime = 180;
    this.isOvertime = false;
    this.elixirRate = 1;
    this.tiebreaker = false;
    this.frameCount = 0;
    this.selectedCardIdx = -1;
    this.mouseX = 0;
    this.mouseY = 0;
  }

  startBattle(deck) {
    this.reset();
    this.playerDeck = [...deck];
    this.initArena();
    requestAnimationFrame(this.loop);
    if (this.botInterval) clearInterval(this.botInterval);
    this.botInterval = setInterval(() => this.botPlay(), CONFIG.botThinkRate);
  }

  initArena() {
    Utils.resize(this);
    window.addEventListener("resize", () => Utils.resize(this));

    this.towers = [
      new Tower(70, 600, 0, "princess"),
      new Tower(330, 600, 0, "princess"),
      new Tower(200, 650, 0, "king"),
      new Tower(70, 100, 1, "princess"),
      new Tower(330, 100, 1, "princess"),
      new Tower(200, 50, 1, "king"),
    ];

    // Setup Player Deck
    const shuf = [...this.playerDeck].sort(() => Math.random() - 0.5);
    this.playerHand = shuf.slice(0, 4);
    this.playerQueue = shuf.slice(4);
    this.nextCard = this.playerQueue[0];

    // --- LOGIC BARU: GENERATE BALANCED BOT DECK ---
    this.botDeck = this.generateBalancedBotDeck();
    this.botHand = this.botDeck.slice(0, 4);
    this.botQueue = this.botDeck.slice(4);

    UI.renderHand();
    this.setupInput();
  }

  // --- METHOD BARU: MEMBUAT DECK BOT YANG SEIMBANG (FIX CRASH) ---
  generateBalancedBotDeck() {
    const allKeys = Object.keys(CARDS).filter((k) => !CARDS[k].hiddenInDeck);
    
    // Kategori Kartu
    const winConds = allKeys.filter(k => {
        const c = CARDS[k];
        // FIX: Cek dulu apakah kartu punya tags
        if (!c.tags) return false; 
        return c.tags.includes('building-hunter') || c.tags.includes('heavy') || c.tags.includes('siege');
    });

    const spells = allKeys.filter(k => CARDS[k].type === 'spell');

    const airCounters = allKeys.filter(k => {
        const c = CARDS[k];
        // FIX: Cek tags sebelum includes
        return c.tags && c.tags.includes('air-target');
    });

    // Kartu sisanya (Bukan Win Condition & Bukan Spell)
    const others = allKeys.filter(k => !winConds.includes(k) && !spells.includes(k));

    const deck = [];
    const addCard = (arr) => {
        if (arr.length > 0) {
            // Coba pilih kartu random dari kategori
            for(let i=0; i<5; i++) { // Retry 5 kali biar gak infinite loop
                const pick = arr[Math.floor(Math.random() * arr.length)];
                if (!deck.includes(pick)) {
                    deck.push(pick);
                    break;
                }
            }
        }
    };

    // 1. Pastikan ada 1 Win Condition (Tank/Siege)
    addCard(winConds);
    // 2. Pastikan ada 1 Spell
    addCard(spells);
    // 3. Pastikan ada 1 Penyerang Udara (Anti-Air)
    addCard(airCounters);

    // 4. Isi sisa 5 slot dengan kartu acak dari pool 'others' atau 'allKeys'
    while (deck.length < 8) {
        // Prioritaskan 'others' dulu biar variatif
        const pool = others.length > 0 ? others : allKeys;
        const randomKey = pool[Math.floor(Math.random() * pool.length)];
        
        if (!deck.includes(randomKey)) {
            deck.push(randomKey);
        }
    }
    
    // Shuffle deck bot biar urutan keluarnya tidak ketebak
    return deck.sort(() => Math.random() - 0.5);
  }

  cycleCard(idx) {
    const used = this.playerHand[idx];
    this.playerHand[idx] = this.playerQueue.shift();
    this.playerQueue.push(used);
    this.nextCard = this.playerQueue[0];
  }
  botCycle(idx) {
    const used = this.botHand[idx];
    this.botHand[idx] = this.botQueue.shift();
    this.botQueue.push(used);
  }

  // --- CHECK VALID PLACEMENT (ANTI OVERLAP) ---
  checkPlacement(x, y, type, radius = 20) {
    // 1. Cek Area Terlarang (Sungai & Musuh)
    // Kecuali 'The Log' yang bisa ditaruh di jembatan
    if (type !== "spell") {
      // Area Bangunan/Unit
    }

    // 2. Cek Overlap Bangunan
    if (type === "building") {
      const obstacles = [...this.buildings, ...this.towers];
      for (let o of obstacles) {
        if (o.dead) continue;
        const dist = Utils.getDist({ x: x, y: y }, o);
        // Fix: Gunakan radius dari objek yang dicek + radius bangunan baru
        if (dist < o.radius + radius) return false;
      }
    }
    return true;
  }

  spawnCard(key, x, y, team) {
    const cardData = CARDS[key];
    if (!cardData) return;

    // --- LOGIC DELAY SPELL ---
    if (cardData.type === "spell") {
      const delaySec =
        cardData.stats.spawnDelay !== undefined ? cardData.stats.spawnDelay : 1;
      const delayFrames = delaySec * 60;

      this.pendingSpells.push({
        key: key,
        x: x,
        y: y,
        team: team,
        timer: delayFrames,
        maxTimer: delayFrames,
        radius: cardData.stats.radius || 50,
      });
      return;
    }

    // --- FIX MULTI-UNIT SPAWN ---
    if (cardData.type === "unit") {
      const count = cardData.stats.count || 1;

      // TRIGGER SPAWN EFFECT (SEKETIKA SAAT DILETAKKAN)
      if (cardData.spawnEffect) {
        const eff = cardData.spawnEffect;

        // Visual Effect
        this.effects.push(new Effect(x, y, eff.radius, "white"));

        // Logic Effect
        if (eff.type === "zap") {
          this.dealAreaDamage(x, y, eff.radius, eff.dmg, team, "stun"); // Stun + Dmg
          this.effects.push(new Effect(x, y, eff.radius, "#ffeb3b"));
        } else if (eff.type === "slow") {
          // Deal 0 dmg, but apply slow. Ice Wiz spawn biasanya ada damage dikit, tapi disini kita buat slow aja sesuai req.
          // Kita pakai dealAreaDamage tapi modif dikit atau manual loop
          const targets = [...this.units, ...this.buildings];
          targets.forEach((t) => {
            if (
              t.team !== team &&
              !t.dead &&
              Utils.getDist({ x, y }, t) < eff.radius + t.radius
            ) {
              t.applySlow(eff.duration, eff.amount);
            }
          });
          this.spellAreas.push(
            new SpellArea(x, y, eff.radius, "freeze_visual", eff.duration, team)
          ); // Visual es
        } else if (eff.type === "damage") {
          // Mega Knight landing effect
          this.dealAreaDamage(x, y, eff.radius, eff.dmg, team, "damage");
          this.effects.push(new Effect(x, y, eff.radius, "orange"));
        }
      }

      // Spawn Units
      for (let i = 0; i < count; i++) {
        let ox = 0,
          oy = 0;
        if (count > 1) {
          if (count > 4) {
            const angle = ((Math.PI * 2) / count) * i;
            ox = Math.cos(angle) * 30;
            oy = Math.sin(angle) * 30;
          } else {
            ox = (i - (count - 1) / 2) * 20;
          }
        }
        const u = new Unit(x + ox, y + oy, team, key);
        if (team !== 0) u.deployTimer = 0;
        this.units.push(u);
      }
    } else if (cardData.type === "building") {
      const b = new Building(x, y, team, key);
      if (team !== 0) b.deployTimer = 0;
      this.buildings.push(b);
    }
  }

  castSpell(key, x, y, team) {
    const stats = CARDS[key].stats;
    if (key === "goblin_barrel") {
      for (let i = 0; i < 3; i++) {
        const angle = ((Math.PI * 2) / 3) * i;
        this.units.push(
          new Unit(
            x + Math.cos(angle) * 25,
            y + Math.sin(angle) * 25,
            team,
            "goblins"
          )
        );
      }
      return;
    }
    if (key === "fireball" || key === "rocket") {
      this.effects.push(new Effect(x, y, stats.radius, "orange"));
      const targets = [...this.units, ...this.towers, ...this.buildings];
      targets.forEach((t) => {
        if (
          t.team !== team &&
          !t.dead &&
          !t.isHidden &&
          Utils.getDist({ x, y }, t) < stats.radius + t.radius
        )
          t.takeDamage(stats.dmg);
      });
    } else if (key === "zap") {
      this.effects.push(new Effect(x, y, stats.radius, "#ffeb3b"));
      this.dealAreaDamage(x, y, stats.radius, stats.dmg, team, "stun");
    } else if (key === "freeze") {
      this.dealAreaDamage(x, y, stats.radius, 0, team, "freeze");
      this.spellAreas.push(
        new SpellArea(
          x,
          y,
          stats.radius,
          "freeze_visual",
          stats.stunDuration,
          team
        )
      );
    } else if (key === "rage") {
      this.spellAreas.push(
        new SpellArea(
          x,
          y,
          stats.radius,
          "rage",
          stats.rageDuration,
          team,
          stats.rageBoost
        )
      );
    } else if (key === "arrows" || key === "the_log") {
      this.dealAreaDamage(x, y, stats.radius || 100, stats.dmg, team);
      this.effects.push(new Effect(x, y, stats.radius || 100, "white"));
    }
  }

  dealAreaDamage(x, y, radius, dmg, team, type = "damage", hitAir = true) {
    const targets = [...this.units, ...this.towers, ...this.buildings];
    for (let t of targets) {
      if (t.team === team && type !== "rage") continue;
      if (t.team !== team && type === "rage") continue;
      if (t.isHidden) continue;

      // Fix Error: Cek t.tags sebelum includes
      if (t.tags && t.tags.includes("air") && !hitAir) continue;

      if (!t.dead && Utils.getDist({ x, y }, t) < radius + t.radius) {
        if (type === "damage") t.takeDamage(dmg);
        else if (type === "stun") t.applyStun(0.5, "zap");
        else if (type === "freeze") t.applyStun(4, "freeze");
        else if (type === "rage") t.applyRage(0.4);
      }
    }
  }

  loop() {
    if (this.gameOver) return;
    this.frameCount++;

    // TIMER LOGIC FIX
    if (this.frameCount % 60 === 0) {
      if (this.matchTime > 0) this.matchTime--;
      else {
        if (!this.isOvertime) {
          this.isOvertime = true;
          this.matchTime = 120;
          this.elixirRate = 2;
        } else if (!this.tiebreaker) {
          this.tiebreaker = true;
          document.getElementById("tiebreaker-msg").style.display = "block";
        }
      }
      // Double Elixir di 1 menit terakhir waktu normal
      if (!this.isOvertime && this.matchTime <= 60) this.elixirRate = 2;

      const mins = Math.floor(this.matchTime / 60);
      const secs = this.matchTime % 60;
      const tb = document.getElementById("timer-box");
      if (tb) {
        tb.innerText = `${mins}:${secs < 10 ? "0" + secs : secs}`;
        if (this.isOvertime) tb.classList.add("overtime");
      }
      if (this.elixirRate === 2)
        document.getElementById("elixir-rate").style.display = "block";
    }

    if (this.tiebreaker && this.frameCount % 30 === 0)
      this.towers.forEach((t) => t.takeDamage(50));

    const eRate = CONFIG.baseElixirRate * this.elixirRate;
    if (this.elixir < CONFIG.maxElixir) {
      this.elixir += 0.01 * eRate;
      UI.updateElixirUI();
    }

    // FIX: Bot Elixir Updated outside the max check scope if maxed out,
    // but here we just update UI. Actually logic should be independent.
    if (this.botElixir < CONFIG.maxElixir) this.botElixir += 0.01 * eRate;

    // FIX: Always update Bot UI
    const bel = document.getElementById("bot-elixir-value");
    if (bel) bel.innerText = Math.floor(this.botElixir);

    [...this.units, ...this.towers, ...this.buildings].forEach((e) =>
      e.update(this)
    );
    this.projectiles.forEach((p) => p.update(this));
    this.effects.forEach((e) => e.update());
    this.spellAreas.forEach((s) => s.update(this));
    this.updatePendingSpells();

    this.units = this.units.filter((u) => !u.dead);
    this.buildings = this.buildings.filter((b) => !b.dead);
    this.towers = this.towers.filter((t) => !t.dead);
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.effects = this.effects.filter((e) => e.life > 0);
    this.spellAreas = this.spellAreas.filter((s) => !s.dead);

    const pk = this.towers.find((t) => t.team === 0 && t.type === "king");
    const ek = this.towers.find((t) => t.team === 1 && t.type === "king");
    if (!pk) this.endGame("ENEMY WINS");
    else if (!ek) this.endGame("YOU WIN");
    if (this.isOvertime) {
      const pTowers = this.towers.filter((t) => t.team === 0).length;
      const eTowers = this.towers.filter((t) => t.team === 1).length;
      if (pTowers < 3 && pTowers < eTowers) this.endGame("ENEMY WINS");
      if (eTowers < 3 && eTowers < pTowers) this.endGame("YOU WIN");
    }

    this.draw();
    requestAnimationFrame(this.loop);
  }

  botPlay() {
    if (this.gameOver || this.tiebreaker) return;

    // 1. CEK KESEMPATAN MENGGUNAKAN SPELL (Prioritas Tinggi)
    // Bot akan cek apakah bisa membunuh tower atau menghabisi kerumunan musuh
    if (this.botSmartSpell()) return;

    // 2. Analisa Ancaman (Defense)
    const enemies = this.units.filter(
      (u) => u.team === 0 && u.y < 360 && !u.dead && !u.isHidden
    );
    enemies.sort((a, b) => a.y - b.y); // Urutkan yang paling dekat dengan tower bot (y kecil)

    const mostDangerous = enemies[0];
    
    // Deteksi Siege (Princess/Xbow di jembatan)
    const siegeThreat = enemies.find(
      (e) => e.tags.includes("siege") || (e.range > 150 && e.y < 360)
    );

    // LOGIKA BERTAHAN
    if (mostDangerous) {
      const panicMode = mostDangerous.y < 150 || siegeThreat;
      // Jika panik (musuh dekat), defalut min elixir 2, jika santai tunggu 3
      if (this.botElixir >= (panicMode ? 2 : 3)) {
        this.botDefend(mostDangerous);
      }
      return;
    }

    // 3. LOGIKA MENYERANG (Attack)
    // Jika aman, tunggu elixir penuh baru push
    if (this.botElixir > 9) {
      this.botAttack();
    }
  }

  // --- METHOD BARU: BOT MENGGUNAKAN SPELL DENGAN PINTAR ---
  botSmartSpell() {
    // Cari spell di tangan bot
    const spellIdx = this.botHand.findIndex(k => k && CARDS[k].type === 'spell');
    if (spellIdx === -1) return false;

    const key = this.botHand[spellIdx];
    const card = CARDS[key];
    
    // Jangan pakai spell jika elixir kritis (kecuali finish tower)
    if (this.botElixir < card.cost) return false;

    const stats = card.stats;
    const dmg = stats.dmg || 0;
    const radius = stats.radius || 0;

    // A. CEK FINISH TOWER (Prioritas Utama)
    // Cari tower pemain (Team 0) yang HP-nya di bawah damage spell
    const killableTower = this.towers.find(t => t.team === 0 && !t.dead && t.hp <= dmg);
    
    if (killableTower) {
        // Serang Tower!
        this.botElixir -= card.cost;
        this.spawnCard(key, killableTower.x, killableTower.y, 1);
        this.botCycle(spellIdx);
        return true;
    }

    // B. CEK CLUSTER UNIT (Area Damage)
    // Hanya jika spell punya damage area (Fireball, Arrows, Zap, Rocket, Log)
    if (dmg > 0 && radius > 0) {
        // Ambil semua unit pemain
        const playerUnits = this.units.filter(u => u.team === 0 && !u.dead && !u.isHidden);
        
        // Cari posisi terbaik untuk melempar spell
        // Kita iterasi setiap unit pemain sebagai "pusat" ledakan
        let bestTarget = null;
        let maxValue = 0;

        for (let centerUnit of playerUnits) {
            // Hitung berapa total elixir musuh yang kena jika dilempar ke sini
            let elixirValueHit = 0;
            let countHit = 0;

            for (let other of playerUnits) {
                if (Utils.getDist(centerUnit, other) <= radius) {
                    // Prediksi nilai tukar (Estimasi cost kartu musuh berdasarkan key-nya di CARDS)
                    // Karena kita tidak simpan cost di entity, kita tebak rata-rata value = 3
                    // Atau ambil dari CARDS[other.key].cost jika ada akses
                    const unitCost = CARDS[other.key] ? CARDS[other.key].cost : 3;
                    elixirValueHit += unitCost;
                    countHit++;
                }
            }

            // Aturan Pakai Spell:
            // 1. Total nilai unit yang kena HARUS lebih besar dari cost spell (Positive Elixir Trade)
            // 2. Minimal kena 2 unit (kecuali unit mahal > 4 elixir)
            if (elixirValueHit >= card.cost + 1 && countHit >= 1) {
                if (elixirValueHit > maxValue) {
                    maxValue = elixirValueHit;
                    bestTarget = centerUnit;
                }
            }
        }

        // Eksekusi jika ketemu target bagus
        if (bestTarget) {
            // Khusus The Log, harus ditaruh di jembatan/sisi bot
            let castX = bestTarget.x;
            let castY = bestTarget.y;

            if (key === 'the_log') {
                castY = Math.min(castY, 320); // Clamp di jembatan
            }

            this.botElixir -= card.cost;
            this.spawnCard(key, castX, castY, 1);
            this.botCycle(spellIdx);
            return true;
        }
    }

    // C. CEK SWARM (Khusus Zap/Log/Arrows vs Skeleton/Goblin)
    // Jika musuh pakai barrel, bot langsung respon
    const barrels = this.pendingSpells.filter(s => s.team === 0 && s.key === 'goblin_barrel');
    if (barrels.length > 0 && (key === 'zap' || key === 'arrows' || key === 'the_log')) {
         const barrel = barrels[0];
         // Counter barrel saat mendarat
         if (barrel.timer < 30) {
             this.botElixir -= card.cost;
             this.spawnCard(key, barrel.x, barrel.y, 1);
             this.botCycle(spellIdx);
             return true;
         }
    }

    return false;
  }

  // B. LOGIKA COUNTER BOT (Update agar Spawn Unit tepat di kepala Princess)
  botDefend(enemy) {
    let bestCardIdx = -1;
    let bestScore = -999;

    this.botHand.forEach((key, idx) => {
      if (!key) return;
      const card = CARDS[key];
      if (this.botElixir < card.cost) return;

      let score = 0;

      // Counter Logic
      if (card.type === "spell") {
        if (card.stats.radius && enemy.maxHp < 400) score += 8; // Spell bunuh unit kecil (Princess/Skeleton)
        if (key === "the_log" && !enemy.tags.includes("air")) score += 10;
      } else if (card.type === "building") {
        if (enemy.tags.includes("building-hunter")) score += 10;
      } else {
        // Unit vs Unit
        if (enemy.tags.includes("air") && !card.tags.includes("air-target"))
          score -= 50; // JANGAN spawn melee vs air
        if (enemy.tags.includes("air") && card.tags.includes("air-target"))
          score += 10;
        if (card.tags.includes("area") && enemy.tags.includes("swarn"))
          score += 5;

        // Khusus lawan Princess/Siege: Unit Cepat/Melee murah sangat bagus
        if (enemy.tags.includes("siege") || enemy.range > 150) {
          if (card.stats.speed > 1.2 || key === "miner") score += 15;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestCardIdx = idx;
      }
    });

    if (bestCardIdx === -1) {
      let minCost = 10;
      this.botHand.forEach((k, i) => {
        const c = CARDS[k];
        if (c && c.cost < minCost && this.botElixir >= c.cost) {
          
          if (enemy.tags.includes("air")) {
              if (c.type !== "spell" && (!c.tags || !c.tags.includes("air-target"))) {
                  return; // Jangan spawn unit darat melee vs musuh terbang
              }
          }
          
          minCost = c.cost;
          bestCardIdx = i;
        }
      });
    }

    if (bestCardIdx !== -1) {
      const key = this.botHand[bestCardIdx];
      const card = CARDS[key];

      // --- PLACEMENT LOGIC YANG DIPERBAIKI ---
      let px, py;

      if (card.type === "spell") {
        px = enemy.x;
        py = enemy.y;
      } else {
        // Jika musuh adalah Siege/Princess (Range Jauh), JANGAN KITING.
        // Langsung taruh di atas kepalanya (atau sedekat mungkin di jembatan).
        if (enemy.tags.includes("siege") || enemy.range > 150) {
          px = enemy.x;
          py = enemy.y;
          // Clamp agar tidak spawn di area merah (musuh) jika belum jebol
          if (py > 320) py = 320;
        } else {
          // Musuh biasa -> Kiting ke tengah
          py = enemy.y - 80;
          if (enemy.x < 200) px = Math.min(220, enemy.x + 40);
          else px = Math.max(180, enemy.x - 40);

          if (py > 300) py = 280;
          if (py < 50) py = 80;
        }
      }

      this.botElixir -= card.cost;
      this.spawnCard(key, px, py, 1);
      this.botCycle(bestCardIdx);
    }
  }

  // 3. METHOD BARU: LOGIKA BERTAHAN DETAIL
  botDefend(enemy) {
    // Cari kartu di tangan yang bagus untuk counter musuh ini
    let bestCardIdx = -1;
    let bestScore = -1;

    this.botHand.forEach((key, idx) => {
      if (!key) return;
      const card = CARDS[key];
      if (this.botElixir < card.cost) return; // Skip jika elixir kurang

      let score = 0;

      // Counter Logic Sederhana
      if (card.type === "spell") {
        // Spell bagus jika musuh 'swarn' (banyak) atau darah tipis
        if (card.stats.radius && enemy.maxHp < 400) score += 5;
        if (
          key === "zap" &&
          (enemy.key === "sparky" || enemy.key === "inferno_dragon")
        )
          score += 10; // Reset charge
      } else if (card.type === "building") {
        // Building bagus untuk menarik Giant/Hog/Golem
        if (enemy.tags.includes("building-hunter")) score += 8;
        else score += 2;
      } else {
        // Unit vs Unit Logic
        if (enemy.tags.includes("air")) {
          // Musuh terbang? Cari anti-air
          if (card.tags.includes("air-target")) score += 10;
          else score = -5; // Jangan spawn ground-only vs air
        } else {
          // Musuh darat
          if (card.tags.includes("air")) score += 5; // Kita terbang vs darat = aman
          if (card.tags.includes("area") && enemy.tags.includes("swarn"))
            score += 5; // Splash vs Swarm
          if (card.tags.includes("heavy") && enemy.tags.includes("heavy"))
            score += 5; // Tank killer
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestCardIdx = idx;
      }
    });

    // Jika tidak ketemu counter spesifik, pakai kartu termurah (cycle) untuk mancing
    if (bestCardIdx === -1) {
      // Cari kartu termurah
      let minCost = 10;
      this.botHand.forEach((k, i) => {
        if (k && CARDS[k].cost < minCost && this.botElixir >= CARDS[k].cost) {
          minCost = CARDS[k].cost;
          bestCardIdx = i;
        }
      });
    }

    if (bestCardIdx !== -1) {
      const key = this.botHand[bestCardIdx];
      const card = CARDS[key];

      // Tentukan Posisi Taruh (Placement)
      let px = enemy.x;
      let py = enemy.y - 80; // Taruh di depan musuh (di sisi bot)

      // Kiting Logic: Taruh agak ke tengah untuk menarik musuh menjauh dari tower
      if (card.type !== "spell") {
        // Jika musuh di kiri (x < 200), tarik ke kanan dikit (x + offset), dan sebaliknya
        if (enemy.x < 200) px = Math.min(220, enemy.x + 40);
        else px = Math.max(180, enemy.x - 40);

        // Jangan taruh di sungai
        if (py > 300) py = 280;
        if (py < 50) py = 80;
      } else {
        // Spell langsung di atas kepala musuh
        px = enemy.x;
        py = enemy.y;
      }

      this.botElixir -= card.cost;
      this.spawnCard(key, px, py, 1);
      this.botCycle(bestCardIdx);
    }
  }

  // 4. METHOD BARU: LOGIKA SERANGAN
  botAttack() {
    // Cari "Win Condition" (Tank atau Building Hunter)
    let tankIdx = this.botHand.findIndex((k) => {
      const c = CARDS[k];
      return c.tags.includes("heavy") || c.tags.includes("building-hunter");
    });

    // Jika tidak punya tank, cari unit apa saja
    if (tankIdx === -1) tankIdx = Math.floor(Math.random() * 4);

    const key = this.botHand[tankIdx];
    const card = CARDS[key];
    if (!card || this.botElixir < card.cost) return;

    // Random Lane (Kiri atau Kanan)
    // Cek tower musuh mana yang HP-nya paling sedikit
    const pTowers = this.towers.filter(
      (t) => t.team === 0 && t.type === "princess" && !t.dead
    );
    let targetX = 100; // Default Kiri
    if (pTowers.length > 0) {
      // Serang tower yang darahnya lebih sedikit
      const weakest = pTowers.reduce((prev, curr) =>
        prev.hp < curr.hp ? prev : curr
      );
      targetX = weakest.x;
    } else {
      // Kejar King Tower
      targetX = 200;
    }

    // Placement Logic Attack:
    // Jika Heavy/Slow, taruh di paling belakang (dekat King) untuk "Bank Elixir"
    let spawnY = 50;
    if (
      card.tags.includes("fast") ||
      card.key === "hog_rider" ||
      card.key === "miner"
    ) {
      spawnY = 280; // Bridge spam
    }

    this.botElixir -= card.cost;
    this.spawnCard(key, targetX + (Math.random() - 0.5) * 20, spawnY, 1);
    this.botCycle(tankIdx);
  }

  // Helper untuk Spell (bisa dipanggil terpisah jika mau lebih canggih)
  checkBotSpellOpportunity() {
    // Logic untuk melihat kerumunan musuh dan melempar Fireball/Arrows
    // (Bisa dikembangkan nanti)
  }

  draw() {
    CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
    CTX.save();
    const ox = (CANVAS.width - CONFIG.logicWidth * this.scale) / 2,
      oy = (CANVAS.height - CONFIG.logicHeight * this.scale) / 2;
    CTX.translate(ox, oy);
    CTX.scale(this.scale, this.scale);

    // Background Arena
    CTX.fillStyle = "#4caf50";
    CTX.fillRect(0, 0, CONFIG.logicWidth, CONFIG.logicHeight);
    CTX.fillStyle = "#03a9f4";
    CTX.fillRect(0, 335, CONFIG.logicWidth, 30); // Sungai
    // Jembatan
    CTX.fillStyle = "#795548";
    CTX.fillRect(60, 330, 40, 40);
    CTX.fillRect(300, 330, 40, 40);

    // Grid Visual
    CTX.strokeStyle = "rgba(255,255,255,0.1)";
    CTX.lineWidth = 1;
    for (let x = 0; x <= CONFIG.logicWidth; x += CONFIG.gridSize) {
      CTX.beginPath();
      CTX.moveTo(x, 0);
      CTX.lineTo(x, CONFIG.logicHeight);
      CTX.stroke();
    }
    for (let y = 0; y <= CONFIG.logicHeight; y += CONFIG.gridSize) {
      CTX.beginPath();
      CTX.moveTo(0, y);
      CTX.lineTo(CONFIG.logicWidth, y);
      CTX.stroke();
    }

    // Area Merah (No Build Zone) - Digambar tipis
    CTX.fillStyle = "rgba(255,0,0,0.1)";
    CTX.fillRect(0, 0, CONFIG.logicWidth, 335); // Area Musuh

    // Draw Entities
    this.spellAreas.forEach((s) => s.draw(CTX));
    [...this.towers, ...this.buildings, ...this.units]
      .sort((a, b) => a.y - b.y)
      .forEach((e) => e.draw(CTX));
    this.projectiles.forEach((p) => p.draw(CTX));
    this.effects.forEach((e) => e.draw(CTX));

    // PENDING SPELLS
    CTX.save();
    this.pendingSpells.forEach((spell) => {
      const progress = 1 - spell.timer / spell.maxTimer;
      // Indikator The Log (Persegi Panjang)
      if (spell.key === "the_log") {
        CTX.fillStyle = "rgba(255, 255, 255, 0.3)";
        const range = CARDS["the_log"].stats.range;
        const w = 60; // Lebar log
        // Log menggelinding ke atas (musuh)
        CTX.fillRect(spell.x - w / 2, spell.y - range, w, range);

        // Gambar batang kayu turun
        CTX.fillStyle = "#5d4037";
        const dropY = spell.y - (1 - progress) * 200;
        CTX.fillRect(spell.x - 15, dropY, 30, 15);
      } else {
        // Indikator Lingkaran Biasa
        CTX.strokeStyle = spell.team === 0 ? "#42a5f5" : "#ef5350";
        CTX.lineWidth = 2;
        CTX.globalAlpha = 0.5 + progress * 0.5;
        CTX.beginPath();
        CTX.setLineDash([5, 5]);
        CTX.arc(spell.x, spell.y, spell.radius, 0, Math.PI * 2);
        CTX.stroke();

        // ... (Animasi proyektil jatuh sama seperti sebelumnya) ...
        if (
          ["fireball", "rocket", "arrows", "goblin_barrel"].includes(spell.key)
        ) {
          const height = (1 - progress) * 300;
          const projY = spell.y - height;
          CTX.fillStyle =
            spell.key === "goblin_barrel"
              ? "#2e7d32"
              : spell.key === "rocket"
              ? "#5d4037"
              : "#ff5722";
          CTX.beginPath();
          CTX.arc(spell.x, projY, 10, 0, Math.PI * 2);
          CTX.fill();
        }
      }
    });
    CTX.restore();

    // GHOST / PLACEMENT INDICATOR
    if (this.selectedCardIdx !== -1) {
      const k = this.playerHand[this.selectedCardIdx];
      const d = CARDS[k];
      if (d) {
        CTX.save();
        const gx = Math.round(this.mouseX / CONFIG.gridSize) * CONFIG.gridSize;
        const gy = Math.round(this.mouseY / CONFIG.gridSize) * CONFIG.gridSize;

        // VALIDASI PLACEMENT YANG LEBIH KETAT
        let isValid = true;

        if (d.type === "spell") {
          // The Log hanya boleh di sisi kita + jembatan
          if (d.tags && d.tags.includes("log")) {
            if (gy < 320) isValid = false; // Harus di belakang jembatan/sungai
          }
        } else {
          // Unit & Building
          if (gy > 335 && gy < 365) isValid = false; // Sungai
          if (gy < CONFIG.logicHeight / 2 - 20) isValid = false; // Area Musuh
          if (
            d.type === "building" &&
            !this.checkPlacement(gx, gy, d.type, d.stats.radius || 20)
          )
            isValid = false;
        }

        // INDIKATOR WARNA (MERAH JIKA INVALID)
        if (!isValid) {
          CTX.globalAlpha = 0.5;
          CTX.fillStyle = "red";
          const r = d.stats.radius || 20;
          CTX.beginPath();
          CTX.arc(gx, gy, r + 10, 0, Math.PI * 2);
          CTX.fill();
        }

        if (d.type === "spell") {
          const radius = d.stats.radius || 50;
          CTX.fillStyle = isValid
            ? "rgba(255, 255, 255, 0.4)"
            : "rgba(255, 0, 0, 0.4)";

          if (d.tags && d.tags.includes("log")) {
            // Kotak Log
            const range = d.stats.range;
            CTX.fillRect(gx - 30, gy - range, 60, range);
          } else {
            // Lingkaran Biasa
            CTX.beginPath();
            CTX.arc(this.mouseX, this.mouseY, radius, 0, Math.PI * 2);
            CTX.fill();
          }
        } else {
          if (d.spawnEffect) {
            CTX.save();
            // Warna Kuning/Emas Transparan untuk efek spawn
            CTX.fillStyle = "rgba(255, 215, 0, 0.3)";
            CTX.strokeStyle = "rgba(255, 215, 0, 0.8)";
            CTX.lineWidth = 2;
            CTX.setLineDash([5, 3]); // Garis putus-putus

            CTX.beginPath();
            // Gambar lingkaran sesuai radius efek spawn
            CTX.arc(gx, gy, d.spawnEffect.radius, 0, Math.PI * 2);
            CTX.fill();
            CTX.stroke();
            CTX.restore();
          }
          // Draw Unit/Building Ghost
          const count = d.stats.count || 1;
          for (let i = 0; i < count; i++) {
            // ... (Logic posisi count sama) ...
            let ox = 0,
              oy = 0; // Sederhana saja untuk contoh
            if (count > 1) {
              ox = (i - (count - 1) / 2) * 20;
            }

            let dummy;
            if (d.type === "building") dummy = new Building(gx, gy, 0, k);
            else dummy = new Unit(gx + ox, gy + oy, 0, k);

            dummy.draw(CTX, true, isValid);
          }
        }
        CTX.restore();
      }
    }
    CTX.restore();
  }

  setupInput() {
    // Helper untuk update posisi mouse/touch secara akurat
    const updateInputPos = (clientX, clientY) => {
      const r = CANVAS.getBoundingClientRect();
      const ox = (CANVAS.width - CONFIG.logicWidth * this.scale) / 2;
      const oy = (CANVAS.height - CONFIG.logicHeight * this.scale) / 2;
      this.mouseX = (clientX - r.left - ox) / this.scale;
      this.mouseY = (clientY - r.top - oy) / this.scale;
    };

    CANVAS.addEventListener("mousemove", (e) => {
      updateInputPos(e.clientX, e.clientY);
    });

    const tap = (e) => {
      // Prevent default agar tidak zoom/scroll di HP
      e.preventDefault();

      if (this.gameOver || this.selectedCardIdx === -1 || this.tiebreaker)
        return;

      // FIX UTAMA: Update posisi saat TAP/KLIK terjadi.
      // MouseMove seringkali tidak terpanggil di HP sebelum event TouchStart.
      let cx, cy;
      if (e.touches && e.touches.length > 0) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else {
        cx = e.clientX;
        cy = e.clientY;
      }
      updateInputPos(cx, cy);

      const idx = this.selectedCardIdx;
      const k = this.playerHand[idx];
      if (!k || !CARDS[k]) return;

      const d = CARDS[k];

      // Grid Snap
      const gx = Math.round(this.mouseX / CONFIG.gridSize) * CONFIG.gridSize;
      const gy = Math.round(this.mouseY / CONFIG.gridSize) * CONFIG.gridSize;

      let isValid = true;
      if (d.type !== "spell") {
        if (gy > 335 && gy < 365) isValid = false; // Sungai
        if (gy < CONFIG.logicHeight / 2 - 20) isValid = false; // Area Musuh
        if (!this.checkPlacement(gx, gy, d.type)) isValid = false; // Tabrakan
      }

      // SPAWN LOGIC
      if (isValid) {
        // FIX ELIXIR: Gunakan toleransi kecil (epsilon) untuk mengatasi floating point issue
        // Contoh: Elixir 3.999999 harus dianggap cukup untuk cost 4
        if (this.elixir >= d.cost - 0.01) {
          this.elixir -= d.cost;
          this.spawnCard(k, gx, gy, 0);
          this.cycleCard(idx);
          this.selectedCardIdx = -1; // Reset pilihan
          UI.renderHand();
        } else {
          console.log("Not enough elixir! Need:", d.cost, "Have:", this.elixir);
          // Opsional: Efek visual jika elixir kurang
          const hud = document.getElementById("hud-layer");
          hud.style.animation = "none";
          hud.offsetHeight; /* trigger reflow */
          hud.style.animation = "shake 0.3s";
        }
      }
    };

    CANVAS.addEventListener("mousedown", tap);
    CANVAS.addEventListener("touchstart", tap, { passive: false }); // Passive false penting untuk preventDefault
  }

  endGame(msg) {
    this.gameOver = true;
    const ov = document.getElementById("message-overlay");
    const txt = document.getElementById("msg-text");
    if (ov && txt) {
      ov.style.display = "flex";
      txt.innerText = msg;
    }
  }

  // METHOD BARU UNTUK UPDATE TIMER SPELL
  updatePendingSpells() {
    for (let i = this.pendingSpells.length - 1; i >= 0; i--) {
      const spell = this.pendingSpells[i];
      spell.timer--;

      // Jika timer habis, eksekusi efek spell
      if (spell.timer <= 0) {
        this.executeSpellEffect(spell);
        this.pendingSpells.splice(i, 1); // Hapus dari antrian
      }
    }
  }

  // METHOD BARU UNTUK EKSEKUSI EFEK SPELL (Pindahan dari spawnCard lama)
  executeSpellEffect(spell) {
    const key = spell.key;
    const x = spell.x;
    const y = spell.y;
    const team = spell.team;
    const cardData = CARDS[key];
    const stats = cardData.stats;
    const radius = stats.radius || 50;
    const dmg = stats.dmg || 0;

    // Fix Goblin Barrel: Spawn Unit
    if (key === "goblin_barrel") {
      // Spawn 3 Goblin melingkar
      for (let i = 0; i < 3; i++) {
        const angle = ((Math.PI * 2) / 3) * i;
        const ox = Math.cos(angle) * 30;
        const oy = Math.sin(angle) * 30;
        // Gunakan delay 0 agar langsung muncul
        const u = new Unit(x + ox, y + oy, team, "goblins");
        u.deployTimer = 45; // 0.75 detik stun time saat mendarat
        this.units.push(u);
      }
      this.effects.push(new Effect(x, y, radius, "#4caf50"));
      return;
    }

    if (key === 'earthquake') {
        this.spellAreas.push(new SpellArea(x, y, radius, 'earthquake', 3, team, dmg)); // Durasi 3 detik
        return;
    }

    // 2. VOID (Single Target High Damage / Distributed)
    if (key === 'void') {
        // Logika Void: Damage besar, dibagi ke jumlah unit yang ada di area
        // Kita simulasikan dengan SpellArea yang tick damage tinggi
        this.spellAreas.push(new SpellArea(x, y, radius, 'void', 2, team, dmg));
        return;
    }

    // 3. METEOR (Huge Impact)
    if (key === 'meteor') {
        this.effects.push(new Effect(x, y, radius + 20, "#d84315")); // Ledakan besar
        this.dealAreaDamage(x, y, radius, dmg, team, 'damage');
        // Pushback effect (dorong unit menjauh)
        [...this.units].forEach(u => {
            if (u.team !== team && Utils.getDist({x,y}, u) < radius + 50) {
                const angle = Math.atan2(u.y - y, u.x - x);
                u.x += Math.cos(angle) * 40;
                u.y += Math.sin(angle) * 40;
                u.applyStun(1.0, 'zap'); // Stun 1 detik
            }
        });
        return;
    }

    // Fix The Log: Spawn Proyektil Log Menggelinding
    if (key === "the_log") {
      // Arah Log: Selalu menjauh dari sisi pemain
      // Team 0 (Player, Bawah) -> Arah ke Atas (-PI/2)
      // Team 1 (Bot, Atas) -> Arah ke Bawah (PI/2)
      const angle = team === 0 ? -Math.PI / 2 : Math.PI / 2;

      const p = new Projectile(
        x,
        y,
        null, // Target null karena dia area effect berjalan
        dmg,
        team,
        false, // isTower
        true, // isSplash (tapi logikanya pakai piercingHit nanti)
        false, // isBeam
        0, // splashRadius (dihandle radius projectile)
        0, // beamWidth
        false, // isSlow
        0,
        0, // slow param
        "rolling_log", // Tipe Proyektil Khusus
        stats.projSpeed || 3.5, // Kecepatan (Lambat)
        stats.range || 350, // Jarak Tempuh
        null
      );

      // Set Manual Vektor Gerak (PENTING)
      p.angle = angle;
      p.dx = Math.cos(angle);
      p.dy = Math.sin(angle);

      // Logika Log: Tidak kena udara
      p.hitAir = false;

      this.projectiles.push(p);
      return;
    }

    // ... (lanjut ke efek spell lain)

    // Efek Visual Standard
    let effectColor = "orange";
    if (key === "freeze") effectColor = "#00e5ff";
    if (key === "rage" || key === "poison") effectColor = "#ab47bc";
    if (key === "zap" || key === "lightning") effectColor = "#ffeb3b";

    // Spell Area (Rage/Freeze)
    if (key === "rage" || key === "freeze") {
      this.spellAreas.push(
        new SpellArea(
          x,
          y,
          radius,
          key === "rage" ? "rage" : "freeze_visual",
          key === "rage" ? stats.rageDuration : stats.stunDuration,
          team,
          stats.rageBoost
        )
      );
      // Apply instant effect
      if (key === "freeze")
        this.dealAreaDamage(x, y, radius, 0, team, "freeze");
      else if (key === "rage")
        this.dealAreaDamage(x, y, radius, 0, team, "rage");
    }
    // Instant Damage
    else if (key !== "lightning") {
      this.effects.push(new Effect(x, y, radius, effectColor));
      if (key === "zap") this.dealAreaDamage(x, y, radius, dmg, team, "stun");
      else this.dealAreaDamage(x, y, radius, dmg, team);
    }
    // Lightning (tetap sama)
    else if (key === "lightning") {
      // ... (Logic lightning sama) ...
      let targets = [...this.units, ...this.buildings, ...this.towers].filter(
        (t) =>
          t.team !== team &&
          !t.dead &&
          !t.isHidden &&
          Utils.getDist({ x, y }, t) < radius
      );
      targets.sort((a, b) => b.hp - a.hp);
      targets = targets.slice(0, 3);
      targets.forEach((t, idx) => {
        setTimeout(() => {
          if (!t.dead) {
            t.takeDamage(dmg);
            t.applyStun(0.5, "zap");
            this.effects.push(new LightningEffect(x, y - 100, t.x, t.y));
          }
        }, idx * 200);
      });
    }
  }
}

const GAME = new GameEngine();
