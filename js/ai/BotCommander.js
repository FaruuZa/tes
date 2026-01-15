/**
 * BotCommander.js - Strategic Bot AI (Fixed & Smart)
 * Mengatur strategi, deck cycle, dan decision making bot
 */

class BotCommander {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty;
    this.threatAnalyzer = new ThreatAnalyzer();
    this.strategy = 'balanced';
    this.lastPlayTime = 0;
    this.playInterval = this.getPlayInterval();
    
    // Memory & Learning
    this.playerPatterns = {
      avgElixirSpent: 0,
      preferredLane: 'center',
      aggression: 0.5,
      rushTendency: 0
    };
    
    this.currentPlan = null;
  }

  getPlayInterval() {
    switch (this.difficulty) {
      case 'easy': return 3000;
      case 'normal': return 2000;
      case 'hard': return 1000;
      default: return 2000;
    }
  }

  makeDecision(game) {
    const now = Date.now();
    if (now - this.lastPlayTime < this.playInterval) return;

    // Analyze situation (Bot is Team 1)
    const battlefield = this.threatAnalyzer.evaluateBattlefield(game, 1);
    
    this.updateStrategy(game, battlefield);

    const action = this.decideAction(game, battlefield);
    if (action) {
      this.executeAction(action, game);
      this.lastPlayTime = now;
    }
  }

  updateStrategy(game, battlefield) {
    const elixirPct = game.botElixir / CONFIG.maxElixir;
    const timeLeft = game.matchTime;
    const isOvertimeNear = timeLeft < 60;

    if (battlefield.leftLane.isUnderAttack || battlefield.rightLane.isUnderAttack) {
      this.strategy = 'defend';
    } else if (battlefield.isWinning && !isOvertimeNear) {
      this.strategy = 'defend';
    } else if (!battlefield.isWinning && elixirPct > 0.85) {
      this.strategy = 'aggressive';
    } else if (isOvertimeNear) {
      this.strategy = 'aggressive';
    } else {
      this.strategy = 'balanced';
    }
  }

  decideAction(game, battlefield) {
    const actions = [];

    // 1. High Priority: Spell Logic (Finishing / Value Trade)
    const spellAction = this.considerSmartSpell(game, battlefield);
    if (spellAction) actions.push({ ...spellAction, priority: 100 });

    // 2. Defense (Jika ada ancaman)
    if (this.strategy === 'defend' || battlefield.overallThreat > 40) {
      const defenseAction = this.considerDefense(game, battlefield);
      if (defenseAction) actions.push({ ...defenseAction, priority: 90 });
    }

    // 3. Offensive push
    if (this.strategy === 'aggressive' || (game.botElixir > 8 && battlefield.overallThreat < 20)) {
      const attackAction = this.considerAttack(game, battlefield);
      if (attackAction) actions.push({ ...attackAction, priority: 60 });
    }

    // 4. Building placement (Passive Play)
    if (game.botElixir > 6 && battlefield.overallThreat < 10) {
        const buildingAction = this.considerBuilding(game);
        if (buildingAction) actions.push({ ...buildingAction, priority: 50 });
    }

    if (actions.length === 0) return null;
    
    // Sort by priority and pick best
    actions.sort((a, b) => b.priority - a.priority);
    return actions[0];
  }

  // --- SMART SPELL LOGIC ---
  considerSmartSpell(game, battlefield) {
    const spells = game.botHand.filter((k) => k && CARDS[k].type === 'spell' && game.botElixir >= CARDS[k].cost);
    if (spells.length === 0) return null;

    for (let spellKey of spells) {
        const card = CARDS[spellKey];
        const stats = card.stats;
        const radius = (stats.radius || 2.5) * CONFIG.gridSize;
        const dmg = stats.dmg || 0;

        // A. GOBLIN BARREL / MINER (Siege Units disguised as spells/units)
        // Selalu lempar ke Tower Pemain
        if (spellKey === 'goblin_barrel' || spellKey === 'miner') { 
            const targetTower = this.findWeakestEnemyTower(game);
            if (targetTower) {
                return { type: 'spell', key: spellKey, x: targetTower.x, y: targetTower.y, reason: 'siege_attack' };
            }
        }

        // B. THE LOG
        // Logika: Cari kerumunan unit darat musuh di area bot
        if (spellKey === 'the_log') {
            const groundEnemies = game.units.filter(u => u.team === 0 && !u.dead && !u.isAir && u.y < 350);
            if (groundEnemies.length >= 3) {
                const bestCluster = this.findBestCluster(groundEnemies, 60, 2); 
                if (bestCluster) {
                    let spawnY = Math.min(bestCluster.y - 50, 320); 
                    return { type: 'spell', key: spellKey, x: bestCluster.x, y: spawnY, reason: 'log_defense' };
                }
            }
        }

        // C. DIRECT DAMAGE (Fireball, Arrows, Zap, Lightning, Meteor)
        // Cek 1: Apakah bisa hancurkan Tower?
        const killableTower = game.towers.find(t => t.team === 0 && !t.dead && t.hp <= dmg);
        if (killableTower) {
            return { type: 'spell', key: spellKey, x: killableTower.x, y: killableTower.y, reason: 'finish_tower' };
        }

        // Cek 2: Positive Elixir Trade (Cluster Unit)
        const enemies = game.units.filter(u => u.team === 0 && !u.dead && !u.isHidden);
        // Filter target udara jika spell ground-only
        const validTargets = (card.tags && card.tags.includes('ground-only')) ? enemies.filter(u => !u.isAir) : enemies;

        for (let target of validTargets) {
            let totalValue = 0;
            // Hitung unit lain di sekitar target ini
            const neighbors = validTargets.filter(n => Utils.getDist(target, n) <= radius);
            
            neighbors.forEach(n => {
                const nCard = CARDS[n.key];
                if(nCard) totalValue += nCard.cost;
            });

            // Jika value > cost spell + 1 (agar untung), lempar!
            if (totalValue >= card.cost + 1) {
                return { type: 'spell', key: spellKey, x: target.x, y: target.y, reason: 'value_trade' };
            }
        }
    }
    return null;
  }

  // --- DEFENSE LOGIC ---
  considerDefense(game, battlefield) {
    // Cari ancaman terbesar yang sudah masuk wilayah (Y < 450)
    const threats = game.units.filter(u => u.team === 0 && !u.dead && u.y < 450); 
    if (threats.length === 0) return null;

    // Urutkan berdasarkan ancaman (HP tinggi / DPS tinggi)
    threats.sort((a, b) => (b.hp * b.dmg) - (a.hp * a.dmg));
    const target = threats[0];

    // Pilih kartu counter
    const counterKey = this.chooseCounter(target, game);
    if (!counterKey) return null;

    // --- POSISI PENEMPATAN PINTAR (KITING) ---
    let spawnX = 220; // Tengah
    let spawnY = Math.max(50, target.y - 100); 

    // Pull Logic: Tarik musuh ke tengah agar ditembak 2 tower
    if (target.x < 200) spawnX = 240; 
    else if (target.x > 240) spawnX = 200;
    else spawnX = target.x; 

    // Validasi Wilayah (Bot hanya bisa spawn di Y < 320)
    spawnY = Math.min(spawnY, 320); 
    spawnX = Math.max(40, Math.min(400, spawnX));

    return { type: 'unit', key: counterKey, x: spawnX, y: spawnY, reason: 'defense' };
  }

  chooseCounter(threat, game) {
    const candidates = game.botHand.filter(k => k && CARDS[k].type === 'unit' && game.botElixir >= CARDS[k].cost);
    if (candidates.length === 0) return null;

    let bestCard = null;
    let maxScore = -100;

    for (let key of candidates) {
        const card = CARDS[key];
        let score = 0;

        // Counter Udara
        if (threat.isAir) {
            if (!card.tags.includes('air-target')) score = -999; 
            else score += 50;
        }

        // Swarm vs Area
        if (threat.tags.includes('single') && card.tags.includes('area')) score += 20;

        // Tank Killer
        if (threat.tags.includes('heavy') && card.stats.dmg > 150) score += 30;

        // Murah lebih baik untuk defense
        score -= card.cost * 2;

        if (score > maxScore) {
            maxScore = score;
            bestCard = key;
        }
    }
    return bestCard;
  }

  // --- ATTACK LOGIC ---
  considerAttack(game, battlefield) {
    const tanks = game.botHand.filter(k => k && CARDS[k].tags && (CARDS[k].tags.includes('heavy') || CARDS[k].tags.includes('building-hunter')) && game.botElixir >= CARDS[k].cost);
    
    // Slow Push dengan Tank di belakang King Tower
    if (tanks.length > 0) {
        const tankKey = tanks[0];
        const targetTower = this.findWeakestEnemyTower(game);
        const laneX = targetTower.x; 
        return { type: 'unit', key: tankKey, x: laneX, y: 40, reason: 'slow_push' }; 
    }

    // Bridge Spam (Unit Cepat)
    const fastUnits = game.botHand.filter(k => k && CARDS[k].tags && CARDS[k].tags.includes('fast') && game.botElixir >= CARDS[k].cost);
    if (fastUnits.length > 0) {
        const rushKey = fastUnits[0];
        const targetTower = this.findWeakestEnemyTower(game);
        return { type: 'unit', key: rushKey, x: targetTower.x, y: 310, reason: 'bridge_rush' }; 
    }

    return null;
  }

  considerBuilding(game) {
      const buildings = game.botHand.filter(k => k && CARDS[k].type === 'building' && game.botElixir >= CARDS[k].cost);
      if (buildings.length === 0) return null;
      if (game.buildings.filter(b => b.team === 1).length > 0) return null; // Max 1 building

      const key = buildings[0];
      return { type: 'building', key: key, x: 220, y: 200, reason: 'passive_building' }; 
  }

  // --- UTILS ---
  findWeakestEnemyTower(game) {
      const towers = game.towers.filter(t => t.team === 0 && !t.dead && t.type === 'princess');
      if (towers.length === 0) return game.towers.find(t => t.team === 0 && t.type === 'king') || {x:220, y:600};
      towers.sort((a,b) => a.hp - b.hp);
      return towers[0];
  }

  findBestCluster(units, radius, minCount) {
      for (let u of units) {
          const count = units.filter(other => Utils.getDist(u, other) <= radius).length;
          if (count >= minCount) return { x: u.x, y: u.y, count: count };
      }
      return null;
  }

  executeAction(action, game) {
    if (!action) return;
    const idx = game.botHand.findIndex(k => k === action.key);
    if (idx === -1) return;

    const card = CARDS[action.key];
    if (game.botElixir < card.cost) return;

    game.botElixir -= card.cost;
    game.spawnCard(action.key, action.x, action.y, 1);
    game.botCycle(idx);

    if (this.difficulty === 'hard') {
      this.playInterval = Math.max(800, this.playInterval - 50);
    }
  }

  // --- MISSING FUNCTION ADDED HERE ---
  observePlayer(game) {
    // Fungsi ini dipanggil game.js untuk mempelajari pola pemain
    const playerUnits = game.units.filter(u => u.team === 0);
    
    if (playerUnits.length > 0) {
        let leftCount = 0;
        let rightCount = 0;
        
        playerUnits.forEach(u => {
            if (u.x < 220) leftCount++; else rightCount++;
        });

        // Update preferred lane
        if (leftCount > rightCount) this.playerPatterns.preferredLane = 'left';
        else if (rightCount > leftCount) this.playerPatterns.preferredLane = 'right';
        else this.playerPatterns.preferredLane = 'center';
    }
  }
}

if (typeof window !== 'undefined') {
  window.BotCommander = BotCommander;
}