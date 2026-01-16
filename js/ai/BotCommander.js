/**
 * BotCommander.js - Advanced AI
 * - Counter-picking Deck Building
 * - Smart Spell Usage (Safety Checks)
 * - Kiting & Defense Logic
 */

class BotCommander {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty;
    this.threatAnalyzer = new ThreatAnalyzer();
    this.strategy = 'balanced';
    this.lastPlayTime = 0;
    this.playInterval = this.getPlayInterval();
    
    // Memory
    this.playerDeckAnalysis = {
        hasAir: false,
        hasSwarm: false,
        hasTank: false,
        avgCost: 3.0
    };
  }

  getPlayInterval() {
    // Hard bot berpikir lebih cepat
    switch (this.difficulty) {
      case 'easy': return 2500;
      case 'normal': return 1800;
      case 'hard': return 1000; 
      default: return 2000;
    }
  }

  // ==========================================
  // 1. INTELLIGENT DECK BUILDING
  // ==========================================
  generateDeck(playerDeckKeys) {
      // Analisis Deck Pemain
      this.analyzePlayerDeck(playerDeckKeys);

      const deck = [];
      const allCards = Object.keys(CARDS).filter(k => !CARDS[k].hiddenInDeck);
      
      // A. PILIH WIN CONDITION (1-2 Kartu)
      const winCons = allCards.filter(k => CARDS[k].tags && (CARDS[k].tags.includes('win_condition') || CARDS[k].tags.includes('building-hunter')));
      deck.push(Utils.randomPick(winCons));

      // B. PILIH SPELL (2 Kartu: 1 Kecil, 1 Besar)
      const smallSpells = allCards.filter(k => CARDS[k].type === 'spell' && CARDS[k].cost <= 3);
      const bigSpells = allCards.filter(k => CARDS[k].type === 'spell' && CARDS[k].cost >= 4);
      deck.push(Utils.randomPick(smallSpells));
      deck.push(Utils.randomPick(bigSpells));

      // C. PILIH COUNTER (Berdasarkan Difficulty)
      // Jika Hard, bot sengaja memilih counter spesifik
      if (this.difficulty === 'hard' || this.difficulty === 'normal') {
          if (this.playerDeckAnalysis.hasAir) {
              const antiAir = allCards.filter(k => CARDS[k].tags && CARDS[k].tags.includes('air-target') && CARDS[k].type === 'unit');
              deck.push(Utils.randomPick(antiAir));
              deck.push(Utils.randomPick(antiAir)); // 2 Anti air jika musuh main udara
          }
          if (this.playerDeckAnalysis.hasSwarm) {
              const splashUnits = allCards.filter(k => CARDS[k].tags && CARDS[k].tags.includes('area') && CARDS[k].type === 'unit');
              deck.push(Utils.randomPick(splashUnits));
          }
          if (this.playerDeckAnalysis.hasTank) {
              const tankKillers = allCards.filter(k => CARDS[k].tags && (CARDS[k].tags.includes('heavy') || CARDS[k].tags.includes('dps')) && CARDS[k].type === 'unit');
              deck.push(Utils.randomPick(tankKillers));
          }
      }

      // D. FILL SISANYA (Balanced)
      while (deck.length < 8) {
          const randomCard = Utils.randomPick(allCards);
          if (!deck.includes(randomCard)) {
              deck.push(randomCard);
          }
      }

      return deck;
  }

  analyzePlayerDeck(keys) {
      keys.forEach(k => {
          const c = CARDS[k];
          if (c.tags) {
              if (c.tags.includes('air')) this.playerDeckAnalysis.hasAir = true;
              if (c.tags.includes('swarm')) this.playerDeckAnalysis.hasSwarm = true;
              if (c.tags.includes('tank') || c.tags.includes('heavy')) this.playerDeckAnalysis.hasTank = true;
          }
      });
  }

  // ==========================================
  // 2. DECISION MAKING LOOP
  // ==========================================
  makeDecision(game) {
    const now = Date.now();
    if (now - this.lastPlayTime < this.playInterval) return;

    // Evaluasi Medan Perang (Bot is Team 1)
    const battlefield = this.threatAnalyzer.evaluateBattlefield(game, 1);
    
    // Tentukan Strategi
    this.updateStrategy(game, battlefield);

    // Cari Aksi Terbaik
    const action = this.decideAction(game, battlefield);
    
    if (action) {
      this.executeAction(action, game);
      this.lastPlayTime = now;
    }
  }

  updateStrategy(game, battlefield) {
    // Simple logic: Jika elixir penuh, serang. Jika terancam, bertahan.
    const elixirPct = game.botElixir / CONFIG.maxElixir;
    
    if (battlefield.overallThreat > 20 || battlefield.leftLane.isUnderAttack || battlefield.rightLane.isUnderAttack) {
        this.strategy = 'defend';
    } else if (elixirPct > 0.9) {
        this.strategy = 'aggressive';
    } else {
        this.strategy = 'balanced';
    }
  }

  decideAction(game, battlefield) {
    const actions = [];

    // 1. SPELL LOGIC (Cerdas)
    const spellAction = this.considerSmartSpell(game);
    if (spellAction) actions.push({ ...spellAction, priority: 100 });

    // 2. DEFENSE LOGIC (Kiting)
    if (this.strategy === 'defend') {
        const defAction = this.considerDefense(game, battlefield);
        if (defAction) actions.push({ ...defAction, priority: 90 });
    }

    // 3. ATTACK LOGIC
    if (this.strategy === 'aggressive' || (game.botElixir > 8 && battlefield.overallThreat < 10)) {
        const atkAction = this.considerAttack(game, battlefield);
        if (atkAction) actions.push({ ...atkAction, priority: 60 });
    }

    // Sort priority
    if (actions.length === 0) return null;
    actions.sort((a, b) => b.priority - a.priority);
    return actions[0];
  }

  // ==========================================
  // 3. SMART SPELL SYSTEM
  // ==========================================

  considerSmartSpell(game) {
      const spells = game.botHand.filter(k => k && CARDS[k].type === 'spell' && game.botElixir >= CARDS[k].cost);
      if (spells.length === 0) return null;

      const enemyKing = game.towers.find(t => t.team === 0 && t.type === 'king');

      for (let key of spells) {
          const card = CARDS[key];
          const stats = card.stats;
          const radius = (stats.radius || 2.5) * CONFIG.gridSize;
          
          // Estimasi Waktu Tempuh Spell (Deploy Delay + Travel Time rata-rata)
          // Fireball/Rocket butuh waktu ~2 detik untuk sampai target jauh
          const travelTime = (key === 'zap' || key === 'rage') ? 0.5 : 2.0;

          // A. SUPPORT SPELL (Rage) - Prediksi gerakan teman
          if (card.tags && (card.tags.includes('spell_support') || key === 'rage')) {
              const myUnits = game.units.filter(u => u.team === 1 && !u.dead);
              // Gunakan predictionDelay agar Rage mendarat DI DEPAN pasukan yang sedang lari
              const cluster = this.findBestCluster(myUnits, radius, 2, travelTime);
              
              if (cluster) {
                  const nearEnemy = game.units.some(e => e.team === 0 && Utils.getDist(cluster, e) < 200);
                  const nearTower = game.towers.some(t => t.team === 0 && Utils.getDist(cluster, t) < 200);
                  if (nearEnemy || nearTower) {
                      return { type: 'spell', key: key, x: cluster.x, y: cluster.y, reason: 'buff_push' };
                  }
              }
              continue; 
          }

          // B. DAMAGE SPELL
          // 1. Finish Tower (Static Target - Gak perlu prediksi)
          const killableTower = game.towers.find(t => t.team === 0 && !t.dead && t.hp <= (stats.dmg || 0));
          if (killableTower) {
              return { type: 'spell', key: key, x: killableTower.x, y: killableTower.y, reason: 'finish_game' };
          }

          // 2. Cluster Musuh (Gunakan Prediksi!)
          const enemies = game.units.filter(u => u.team === 0 && !u.dead && !u.isHidden);
          if (enemies.length > 0) {
              // Cari cluster berdasarkan posisi MASA DEPAN musuh
              const cluster = this.findBestCluster(enemies, radius, 2, travelTime); 
              
              if (cluster) {
                  // --- KING TOWER SAFETY CHECK ---
                  const distToKing = Utils.getDist(cluster, enemyKing);
                  const kingHitRadius = enemyKing.radius + radius + 5; 
                  
                  if (!enemyKing.active && distToKing < kingHitRadius) {
                      continue; // Skip biar gak bangunin raja
                  }

                  // Hitung Value (Pakai unit asli untuk cek cost)
                  let elixirValue = 0;
                  enemies.forEach(e => {
                      // Cek apakah unit ini (di masa depan) akan kena radius ledakan
                      const pred = this.predictPos(e, travelTime);
                      const distToBlast = Math.hypot(cluster.x - pred.x, cluster.y - pred.y);
                      
                      if (distToBlast <= radius) {
                          const cData = CARDS[e.key];
                          if (cData) elixirValue += cData.cost;
                      }
                  });

                  if (elixirValue >= card.cost + 1) {
                      return { type: 'spell', key: key, x: cluster.x, y: cluster.y, reason: 'value_trade' };
                  }
              }
          }
      }
      return null;
  }

  // ==========================================
  // 4. DEFENSE & KITING LOGIC
  // ==========================================
  considerDefense(game, battlefield) {
      // Cari ancaman terbesar di wilayah bot (Y < 350)
      const threats = game.units.filter(u => u.team === 0 && !u.dead && u.y < 400); // 400 agar antisipasi lebih awal
      if (threats.length === 0) return null;

      // Urutkan ancaman (Terdekat ke tower atau Damage terbesar)
      threats.sort((a, b) => b.y - a.y); // Yang paling masuk (Y kecil) prioritas
      const target = threats[0];

      // Cari kartu counter di tangan
      const counterKey = this.chooseCounter(target, game);
      if (!counterKey) return null;

      // --- PLACEMENT LOGIC (KITING) ---
      let spawnX = target.x;
      let spawnY = target.y - 100; // Default: Depan muka musuh

      // KITING STRATEGY:
      // Jika musuh sudah masuk jembatan tapi belum nempel tower, tarik ke tengah.
      // Kill Zone Bot (Team 1) ada di X: 220, Y: 150-250
      if (target.y < 350 && target.y > 100) {
          spawnX = 220; // Tarik ke tengah
          spawnY = 200; // Kill zone
          
          // Jika musuh di kiri (x < 220), taruh unit di agak kanan tengah (230) agar musuh jalan diagonal
          if (target.x < 200) spawnX = 240; 
          else if (target.x > 240) spawnX = 200;
      }

      // Validasi Area Spawn (Bot Team 1 hanya bisa spawn di Y < 330)
      spawnY = Math.min(spawnY, 320); 
      spawnY = Math.max(spawnY, 40); // Jangan di belakang king tower banget
      spawnX = Math.max(40, Math.min(400, spawnX));

      return { type: 'unit', key: counterKey, x: spawnX, y: spawnY, reason: 'defense_kiting' };
  }

  chooseCounter(threat, game) {
      const candidates = game.botHand.filter(k => k && CARDS[k].type === 'unit' && game.botElixir >= CARDS[k].cost);
      if (candidates.length === 0) return null;

      // Scoring Counter Terbaik
      let bestKey = null;
      let maxScore = -999;

      candidates.forEach(key => {
          const card = CARDS[key];
          let score = 0;

          // 1. Rules Dasar
          if (threat.isAir && !card.tags.includes('air-target')) score = -100; // Unit darat vs Udara = Bad
          
          // 2. Swarm vs Area
          if (threat.tags.includes('swarm') && card.tags.includes('area')) score += 30;
          
          // 3. Tank vs Tank Killer (DPS/Swarm)
          if (threat.tags.includes('heavy') && (card.tags.includes('swarm') || card.tags.includes('dps'))) score += 20;

          // 4. Distraction (Kiting)
          // Unit murah/bangunan bagus untuk defense
          if (card.type === 'building') score += 15;
          if (card.cost <= 3) score += 10; 

          // 5. Elixir Management (Jangan overcommit)
          if (card.cost > threat.cost + 2) score -= 10;

          if (score > maxScore) {
              maxScore = score;
              bestKey = key;
          }
      });

      return bestKey;
  }

  // ==========================================
  // 5. ATTACK LOGIC
  // ==========================================
  considerAttack(game, battlefield) {
      // Pilih Tank atau Win Condition
      const winCons = game.botHand.filter(k => k && CARDS[k].tags && 
          (CARDS[k].tags.includes('win_condition') || CARDS[k].tags.includes('heavy')) 
          && game.botElixir >= CARDS[k].cost);
      
      if (winCons.length > 0) {
          const card = winCons[0];
          // Serang lane yang paling lemah (tower HP terendah)
          const targetTower = this.findWeakestEnemyTower(game);
          
          // Jika pakai Tank berat (Golem), taruh di belakang (Y: 50)
          if (CARDS[card].tags.includes('heavy')) {
              return { type: 'unit', key: card, x: targetTower.x, y: 40, reason: 'slow_push' };
          } 
          // Jika Hog/Fast, taruh di jembatan (Y: 310)
          else {
              return { type: 'unit', key: card, x: targetTower.x, y: 310, reason: 'bridge_spam' };
          }
      }
      return null;
  }

  // --- HELPERS ---

  predictPos(unit, delaySeconds) {
      // 1. JIKA SEDANG DEPLOY = DIAM
      // Ini memanfaatkan deployTime. Unit deploying adalah target empuk.
      if (unit.deployTimer > 0 || unit.stunned > 0) {
          return { x: unit.x, y: unit.y };
      }

      // 2. JIKA BERGERAK = HITUNG LEAD
      // Prediksi posisi unit N detik ke depan
      // Rumus: Posisi Baru = Posisi Lama + (Kecepatan * Waktu)
      // Kita pakai faktor 60 karena speed dihitung per frame (60fps)
      const dist = unit.speed * (delaySeconds * 60); 
      
      const predX = unit.x + Math.cos(unit.angle) * dist;
      const predY = unit.y + Math.sin(unit.angle) * dist;

      // Clamp agar tidak memprediksi keluar arena
      return { 
          x: Math.max(20, Math.min(420, predX)), 
          y: Math.max(20, Math.min(680, predY)) 
      };
  }

  // Update logic cluster agar menggunakan posisi PREDIKSI, bukan posisi saat ini
  findBestCluster(units, radius, minCount, predictionDelay = 0) {
      if (units.length < minCount) return null;

      // Petakan unit ke posisi prediksinya
      const predictedPoints = units.map(u => {
          const pos = this.predictPos(u, predictionDelay);
          return { x: pos.x, y: pos.y, original: u };
      });

      let bestCluster = null;
      let maxCount = 0;

      // Cek setiap titik prediksi sebagai pusat ledakan potensial
      for (let i = 0; i < predictedPoints.length; i++) {
          const center = predictedPoints[i];
          let count = 0;
          let totalX = 0, totalY = 0;

          // Hitung berapa banyak unit (prediksi) yang masuk radius ini
          for (let j = 0; j < predictedPoints.length; j++) {
              const other = predictedPoints[j];
              const dist = Math.hypot(center.x - other.x, center.y - other.y);
              if (dist <= radius) {
                  count++;
                  totalX += other.x;
                  totalY += other.y;
              }
          }

          if (count >= minCount && count > maxCount) {
              maxCount = count;
              // Ambil titik tengah rata-rata dari cluster prediksi
              bestCluster = { x: totalX / count, y: totalY / count, count: count };
          }
      }
      return bestCluster;
  }

  findWeakestEnemyTower(game) {
      const pTowers = game.towers.filter(t => t.team === 0 && !t.dead);
      // Prioritaskan Princess Tower
      const princess = pTowers.filter(t => t.type === 'princess');
      if (princess.length > 0) {
          return princess.sort((a,b) => a.hp - b.hp)[0];
      }
      return pTowers[0] || {x: 100, y: 600}; // Fallback
  }

  executeAction(action, game) {
    if (!action) return;
    const idx = game.botHand.findIndex(k => k === action.key);
    if (idx === -1) return;

    game.botElixir -= CARDS[action.key].cost;
    game.spawnCard(action.key, action.x, action.y, 1); // 1 = Bot Team
    game.botCycle(idx);
  }

  observePlayer(game) {
      // Placeholder untuk learning, saat ini belum dipakai aktif
  }
}

// Helper Random Pick
Utils.randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

if (typeof window !== 'undefined') {
  window.BotCommander = BotCommander;
}