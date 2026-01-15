/**
 * PathfindingAI.js - Intelligent Movement System
 * Handles pathing, collision avoidance, formation
 */

class PathfindingAI {
  constructor() {
    this.flowField = null;
    this.obstacleGrid = null;
  }

  /**
   * Improved movement dengan obstacle avoidance
   */
  moveTowardsTarget(entity, target, game) {
    if (!target) return;

    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 5) return; // Sudah sampai

    // Base angle
    let angle = Math.atan2(dy, dx);

    // ===== OBSTACLE AVOIDANCE =====
    const avoidanceForce = this.calculateAvoidanceForce(entity, game);
    angle += avoidanceForce.angle * avoidanceForce.strength;

    // ===== SEPARATION (Hindari menumpuk dengan teman) =====
    const separationForce = this.calculateSeparationForce(entity, game);
    angle += separationForce.angle * separationForce.strength;

    // ===== BRIDGE NAVIGATION =====
    if (!entity.isAir && !entity.canJumpRiver) {
      angle = this.adjustForBridge(entity, target, angle, game);
    }

    // Apply movement
    entity.angle = angle;
    
    let speedMult = 1.0;
    if (entity.rageBoosted > 0) speedMult += entity.rageAmount;
    if (entity.slowed > 0) speedMult -= entity.slowAmount;
    speedMult = Math.max(0.2, speedMult);

    const moveSpeed = entity.speed * speedMult;
    entity.x += Math.cos(angle) * moveSpeed;
    entity.y += Math.sin(angle) * moveSpeed;

    // Anti-stuck mechanism
    entity.isMoving = true;
  }

  /**
   * Calculate force untuk menghindari obstacle
   */
  calculateAvoidanceForce(entity, game) {
    const detectionRadius = 60;
    const obstacles = [
      ...game.buildings.filter(b => b.team !== entity.team || b.radius > 20),
      ...game.towers
    ];

    let totalForceX = 0;
    let totalForceY = 0;
    let obstacleCount = 0;

    for (let obs of obstacles) {
      const dist = Utils.getDist(entity, obs);
      const minDist = entity.radius + obs.radius + 20;

      if (dist < detectionRadius) {
        const strength = 1 - (dist / detectionRadius);
        const angle = Math.atan2(entity.y - obs.y, entity.x - obs.x);
        
        totalForceX += Math.cos(angle) * strength;
        totalForceY += Math.sin(angle) * strength;
        obstacleCount++;
      }
    }

    if (obstacleCount === 0) {
      return { angle: 0, strength: 0 };
    }

    const avgAngle = Math.atan2(totalForceY, totalForceY);
    const avgStrength = Math.min(1, obstacleCount * 0.3);

    return { angle: avgAngle, strength: avgStrength };
  }

  /**
   * Separation force - hindari menumpuk dengan allies
   */
  calculateSeparationForce(entity, game) {
    const separationRadius = entity.radius * 3;
    const nearbyAllies = game.units.filter(u => 
      u !== entity &&
      u.team === entity.team &&
      !u.dead &&
      u.isAir === entity.isAir &&
      Utils.getDist(entity, u) < separationRadius
    );

    if (nearbyAllies.length === 0) {
      return { angle: 0, strength: 0 };
    }

    let totalX = 0;
    let totalY = 0;

    for (let ally of nearbyAllies) {
      const dist = Utils.getDist(entity, ally);
      const strength = 1 - (dist / separationRadius);
      const angle = Math.atan2(entity.y - ally.y, entity.x - ally.x);
      
      totalX += Math.cos(angle) * strength;
      totalY += Math.sin(angle) * strength;
    }

    const avgAngle = Math.atan2(totalY, totalX);
    const avgStrength = Math.min(0.5, nearbyAllies.length * 0.15);

    return { angle: avgAngle, strength: avgStrength };
  }

  /**
   * Bridge navigation yang lebih smooth
   */
  adjustForBridge(entity, target, currentAngle, game) {
    const riverY = 350;
    const isCrossing = (entity.y < riverY && target.y > riverY) || 
                       (entity.y > riverY && target.y < riverY);

    if (!isCrossing) return currentAngle;

    const bridgeLeft = 100;
    const bridgeRight = 340;
    const bridgeWidth = 50;

    // Cek apakah sudah di jembatan
    const onBridge = (Math.abs(entity.x - bridgeLeft) < bridgeWidth) || 
                     (Math.abs(entity.x - bridgeRight) < bridgeWidth);

    if (onBridge) {
      // Sudah di jembatan, jalan lurus saja
      const targetBridgeY = entity.y < riverY ? riverY + 50 : riverY - 50;
      return Math.atan2(targetBridgeY - entity.y, target.x - entity.x);
    }

    // Belum di jembatan, cari yang terdekat
    const distToLeft = Math.abs(entity.x - bridgeLeft);
    const distToRight = Math.abs(entity.x - bridgeRight);
    const targetBridgeX = distToLeft < distToRight ? bridgeLeft : bridgeRight;

    // Entry point jembatan
    const entryY = entity.y < riverY ? riverY - 30 : riverY + 30;

    return Math.atan2(entryY - entity.y, targetBridgeX - entity.x);
  }

  /**
   * Formation movement - units bergerak dalam formasi
   */
  getFormationPosition(entity, leader, formationType = 'line') {
    if (!leader) return { x: entity.x, y: entity.y };

    const allies = entity.nearbyAllies || [];
    const myIndex = allies.indexOf(entity);

    if (myIndex === -1) return { x: entity.x, y: entity.y };

    const spacing = entity.radius * 2.5;

    switch (formationType) {
      case 'line': {
        const perpAngle = leader.angle + Math.PI / 2;
        const offset = (myIndex - allies.length / 2) * spacing;
        return {
          x: leader.x + Math.cos(perpAngle) * offset,
          y: leader.y + Math.sin(perpAngle) * offset
        };
      }
      case 'wedge': {
        const row = Math.floor(Math.sqrt(myIndex));
        const col = myIndex - (row * row);
        const perpAngle = leader.angle + Math.PI / 2;
        return {
          x: leader.x - Math.cos(leader.angle) * row * spacing + Math.cos(perpAngle) * col * spacing,
          y: leader.y - Math.sin(leader.angle) * row * spacing + Math.sin(perpAngle) * col * spacing
        };
      }
      default:
        return { x: entity.x, y: entity.y };
    }
  }

  /**
   * Predict collision dengan projectile (dodge)
   */
  shouldDodge(entity, game) {
    const dodgeRadius = 100;
    const incomingProjectiles = game.projectiles.filter(p => 
      p.team !== entity.team &&
      Utils.getDist(entity, p) < dodgeRadius &&
      !p.dead
    );

    if (incomingProjectiles.length === 0) return null;

    // Cari projectile terdekat
    let closest = null;
    let minDist = Infinity;

    for (let proj of incomingProjectiles) {
      const dist = Utils.getDist(entity, proj);
      if (dist < minDist) {
        minDist = dist;
        closest = proj;
      }
    }

    if (!closest) return null;

    // Calculate dodge angle (perpendicular ke projectile)
    const projAngle = Math.atan2(closest.dy || 0, closest.dx || 0);
    const dodgeAngle = projAngle + Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);

    return {
      angle: dodgeAngle,
      urgency: 1 - (minDist / dodgeRadius)
    };
  }

  /**
   * Predict target position (lead shooting)
   */
  predictTargetPosition(entity, target, projectileSpeed = 7) {
    if (!target) return null;

    const dist = Utils.getDist(entity, target);
    const timeToReach = dist / projectileSpeed;

    // Estimate target position after timeToReach frames
    const futureX = target.x + (target.lastX ? (target.x - target.lastX) : 0) * timeToReach;
    const futureY = target.y + (target.lastY ? (target.y - target.lastY) : 0) * timeToReach;

    return { x: futureX, y: futureY };
  }

  /**
   * Find safe position saat retreat
   */
  findSafeRetreatPosition(entity, game) {
    const safeY = entity.team === 0 ? 600 : 100;
    const safeLaneX = entity.x < 220 ? 100 : 340;

    return {
      x: safeLaneX + (Math.random() - 0.5) * 60,
      y: safeY + (Math.random() - 0.5) * 40
    };
  }
}

// Export
if (typeof window !== 'undefined') {
  window.PathfindingAI = PathfindingAI;
}