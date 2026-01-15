/**
 * ThreatAnalyzer.js - Smart Threat Assessment System
 * Mengevaluasi ancaman dan prioritas target
 */

class ThreatAnalyzer {
  constructor() {
    this.threatCache = new Map(); // Cache untuk performa
    this.cacheExpiry = 10; // Frame
  }

  // ============================================
  // CORE THREAT CALCULATION
  // ============================================
  
  /**
   * Menghitung threat score untuk sebuah entity
   * @returns {number} Threat score (0-100+)
   */
  calculateThreat(entity, fromPerspectiveOf, game) {
    const cacheKey = `${entity.x}_${entity.y}_${entity.hp}_${fromPerspectiveOf.team}`;
    
    if (this.threatCache.has(cacheKey)) {
      const cached = this.threatCache.get(cacheKey);
      if (cached.frame > game.frameCount - this.cacheExpiry) {
        return cached.value;
      }
    }

    let threat = 0;

    // 1. Base threat dari DPS
    if (entity.dmg && entity.hitSpeed) {
      threat += (entity.dmg / entity.hitSpeed) * 10;
    }

    // 2. Proximity threat (semakin dekat semakin berbahaya)
    const dist = Utils.getDist(entity, fromPerspectiveOf);
    const maxDist = 300;
    const proximityFactor = Math.max(0, 1 - dist / maxDist);
    threat += proximityFactor * 30;

    // 3. Health factor (unit sehat lebih prioritas)
    const healthPct = entity.hp / entity.maxHp;
    threat += healthPct * 20;

    // 4. Type-based modifiers
    if (entity instanceof Tower) {
      threat += 50; // Tower always high priority
    } else if (entity instanceof Building) {
      if (entity.tags && entity.tags.includes('spawner')) {
        threat += 30; // Spawner adalah ancaman jangka panjang
      } else {
        threat += 15;
      }
    } else if (entity instanceof Unit) {
      // Tank threats
      if (entity.tags && entity.tags.includes('heavy')) {
        threat += 25;
      }
      
      // Fast threats
      if (entity.tags && entity.tags.includes('fast')) {
        threat += 15;
      }

      // Splash damage threats
      if (entity.tags && entity.tags.includes('area')) {
        threat += 20;
      }

      // Building hunter = ancaman tower
      if (entity.tags && entity.tags.includes('building-hunter')) {
        threat += 35;
      }
    }

    // 5. Range advantage
    if (entity.range > fromPerspectiveOf.range) {
      threat += 10;
    }

    // Cache result
    this.threatCache.set(cacheKey, {
      value: threat,
      frame: game.frameCount
    });

    return threat;
  }

  /**
   * Mencari target terbaik berdasarkan multiple factors
   */
  findBestTarget(entity, game, options = {}) {
    const {
      maxRange = entity.sightRange || 300,
      preferType = null, // 'tower', 'building', 'unit'
      avoidTanks = false,
      prioritizeWeak = false
    } = options;

    let candidates = [
      ...game.units,
      ...game.buildings,
      ...game.towers
    ].filter(e => 
      e.team !== entity.team &&
      !e.dead &&
      !e.isHidden &&
      Utils.getDist(entity, e) <= maxRange
    );

    // Filter air/ground
    if (!entity.tags || !entity.tags.includes('air-target')) {
      candidates = candidates.filter(e => {
        if (e instanceof Unit) return !e.isAir;
        return true;
      });
    }

    // Apply preferences
    if (preferType) {
      const preferred = candidates.filter(e => {
        if (preferType === 'tower') return e instanceof Tower;
        if (preferType === 'building') return e instanceof Building;
        if (preferType === 'unit') return e instanceof Unit;
        return false;
      });
      if (preferred.length > 0) candidates = preferred;
    }

    if (avoidTanks) {
      const nonTanks = candidates.filter(e => 
        !(e.tags && e.tags.includes('heavy'))
      );
      if (nonTanks.length > 0) candidates = nonTanks;
    }

    // Score each candidate
    let bestTarget = null;
    let bestScore = -Infinity;

    for (let target of candidates) {
      let score = this.calculateThreat(target, entity, game);

      // Boost score if target is in range RIGHT NOW
      const inRange = Utils.getDist(entity, target) <= (entity.range || 0) + target.radius + entity.radius;
      if (inRange) score += 50;

      // Prioritize weak if requested
      if (prioritizeWeak) {
        const weaknessFactor = 1 - (target.hp / target.maxHp);
        score += weaknessFactor * 30;
      }

      // Penalize targets already being attacked by allies (spread damage)
      const alliesTargetingThis = game.units.filter(u => 
        u.team === entity.team && 
        u.target === target &&
        u !== entity
      ).length;
      score -= alliesTargetingThis * 10;

      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }

    return bestTarget;
  }

  /**
   * Analisis situasi lane (untuk bot AI)
   */
  analyzeLane(game, team, isLeft) {
    const laneX = isLeft ? 100 : 340;
    const laneRange = 120;

    const enemyUnits = game.units.filter(u => 
      u.team !== team &&
      !u.dead &&
      Math.abs(u.x - laneX) < laneRange
    );

    const friendlyUnits = game.units.filter(u => 
      u.team === team &&
      !u.dead &&
      Math.abs(u.x - laneX) < laneRange
    );

    let pressure = 0;
    let enemyThreat = 0;

    for (let e of enemyUnits) {
      const yFactor = team === 0 ? 
        (e.y < 350 ? 2 : 1) : // Enemy di area kita
        (e.y > 350 ? 2 : 1);
      
      pressure += (e.hp / 100) * yFactor;
      enemyThreat += this.calculateThreat(e, { x: laneX, y: team === 0 ? 600 : 100, team }, game);
    }

    let defense = 0;
    for (let f of friendlyUnits) {
      defense += f.hp / 100;
    }

    return {
      pressure: Math.round(pressure),
      defense: Math.round(defense),
      enemyThreat: Math.round(enemyThreat),
      isUnderAttack: pressure > defense + 2,
      needsDefense: enemyThreat > 50
    };
  }

  /**
   * Evaluasi overall battlefield state
   */
  evaluateBattlefield(game, team) {
    const leftLane = this.analyzeLane(game, team, true);
    const rightLane = this.analyzeLane(game, team, false);

    const enemyUnitsTotal = game.units.filter(u => u.team !== team && !u.dead).length;
    const friendlyUnitsTotal = game.units.filter(u => u.team === team && !u.dead).length;

    const myTowers = game.towers.filter(t => t.team === team && !t.dead);
    const enemyTowers = game.towers.filter(t => t.team !== team && !t.dead);

    return {
      leftLane,
      rightLane,
      unitAdvantage: friendlyUnitsTotal - enemyUnitsTotal,
      towerAdvantage: myTowers.length - enemyTowers.length,
      criticalLane: leftLane.pressure > rightLane.pressure ? 'left' : 'right',
      overallThreat: leftLane.enemyThreat + rightLane.enemyThreat,
      isWinning: myTowers.length > enemyTowers.length || 
                 (myTowers.length === enemyTowers.length && friendlyUnitsTotal > enemyUnitsTotal)
    };
  }

  clearCache() {
    this.threatCache.clear();
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ThreatAnalyzer = ThreatAnalyzer;
}