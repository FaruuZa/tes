/**
 * TroopBrain.js - Advanced Troop AI
 * FSM-based behaviour untuk semua unit
 */

class TroopBrain {
  constructor(unit) {
    this.unit = unit;
    this.fsm = this.createFSM();
    this.threatAnalyzer = new ThreatAnalyzer();
    this.pathfinder = new PathfindingAI();
    this.blackboard = new AICore.Blackboard();
    
    // Memory
    this.lastTargetPos = null;
    this.stuckCounter = 0;
    this.retreatTimer = 0;
  }

  /**
   * Create FSM untuk troop behaviour
   */
  createFSM() {
    const fsm = new AICore.StateMachine('IDLE');

    // ===== STATE: IDLE =====
    fsm.addState('IDLE',
      (unit) => {
        // onEnter
        unit.isMoving = false;
        unit.isAttacking = false;
      },
      (unit, game) => {
        // onUpdate: Cari target atau objective
        const target = this.findTarget(unit, game);
        if (target) {
          this.blackboard.set('target', target);
        }
      },
      (unit) => {
        // onExit
      }
    );

    // ===== STATE: MOVING =====
    fsm.addState('MOVING',
      (unit) => {
        unit.isMoving = true;
        unit.isAttacking = false;
        this.stuckCounter = 0;
      },
      (unit, game) => {
        const target = this.blackboard.get('target');
        
        if (!target || target.dead) {
          this.blackboard.delete('target');
          return;
        }

        // Move towards target
        this.pathfinder.moveTowardsTarget(unit, target, game);

        // Check stuck
        if (unit.lastX && Math.hypot(unit.x - unit.lastX, unit.y - unit.lastY) < 0.5) {
          this.stuckCounter++;
          if (this.stuckCounter > 40) {
            // Teleport sedikit untuk keluar dari stuck
            unit.x += (Math.random() - 0.5) * 30;
            unit.y += (Math.random() - 0.5) * 30;
            this.stuckCounter = 0;
          }
        } else {
          this.stuckCounter = 0;
        }

        unit.lastX = unit.x;
        unit.lastY = unit.y;
      }
    );

    // ===== STATE: ATTACKING =====
    fsm.addState('ATTACKING',
      (unit) => {
        unit.isMoving = false;
        unit.isAttacking = true;
      },
      (unit, game) => {
        const target = this.blackboard.get('target');
        
        if (!target || target.dead) {
          this.blackboard.delete('target');
          unit.rampStage = 0;
          return;
        }

        // Face target
        unit.angle = Math.atan2(target.y - unit.y, target.x - unit.x);

        // Handle attack timer with speed modifiers
        let speedMult = 1.0;
        if (unit.rageBoosted > 0) speedMult += unit.rageAmount;
        if (unit.slowed > 0) speedMult -= unit.slowAmount;
        speedMult = Math.max(0.2, speedMult);

        if (unit.attackTimer > 0) {
          unit.attackTimer -= speedMult;
        } else {
          // ATTACK!
          this.performAttack(unit, target, game);
          unit.attackTimer = unit.hitSpeed;
        }
      }
    );

    // ===== STATE: RETREATING =====
    fsm.addState('RETREATING',
      (unit) => {
        unit.isMoving = true;
        unit.isAttacking = false;
        this.retreatTimer = 120; // 2 seconds
        this.blackboard.set('retreatPos', this.pathfinder.findSafeRetreatPosition(unit, GAME));
      },
      (unit, game) => {
        this.retreatTimer--;
        const retreatPos = this.blackboard.get('retreatPos');
        if (retreatPos) {
          this.pathfinder.moveTowardsTarget(unit, retreatPos, game);
        }
      }
    );

    // ===== STATE: STUNNED =====
    fsm.addState('STUNNED',
      (unit) => {
        unit.isMoving = false;
        unit.isAttacking = false;
      },
      (unit) => {
        // Just wait...
      }
    );

    // ===== TRANSITIONS =====
    
    // Global: Stun overrides everything
    fsm.addGlobalTransition('STUNNED', 
      (unit) => unit.stunned > 0,
      100 // Highest priority
    );

    // From STUNNED -> back to IDLE
    fsm.addTransition('STUNNED', 'IDLE',
      (unit) => unit.stunned <= 0
    );

    // From IDLE -> MOVING (found target)
    fsm.addTransition('IDLE', 'MOVING',
      (unit) => {
        const target = this.blackboard.get('target');
        return target && !target.dead;
      }
    );

    // From MOVING -> ATTACKING (in range)
    fsm.addTransition('MOVING', 'ATTACKING',
      (unit) => {
        const target = this.blackboard.get('target');
        if (!target || target.dead) return false;
        
        const dist = Utils.getDist(unit, target);
        const reach = (unit.range > 0 ? unit.range : 10) + target.radius + unit.radius;
        return dist <= reach;
      }
    );

    // From ATTACKING -> MOVING (out of range)
    fsm.addTransition('ATTACKING', 'MOVING',
      (unit) => {
        const target = this.blackboard.get('target');
        if (!target || target.dead) return false;
        
        const dist = Utils.getDist(unit, target);
        const reach = (unit.range > 0 ? unit.range : 10) + target.radius + unit.radius;
        return dist > reach + 20; // Hysteresis
      }
    );

    // From ATTACKING -> IDLE (target dead/lost)
    fsm.addTransition('ATTACKING', 'IDLE',
      (unit) => {
        const target = this.blackboard.get('target');
        return !target || target.dead;
      }
    );

    // From MOVING -> IDLE (target lost)
    fsm.addTransition('MOVING', 'IDLE',
      (unit) => {
        const target = this.blackboard.get('target');
        return !target || target.dead;
      }
    );

    // Low HP retreat (conditional)
    fsm.addTransition('ATTACKING', 'RETREATING',
      (unit) => {
        if (unit.tags && unit.tags.includes('heavy')) return false; // Tanks don't retreat
        const healthPct = unit.hp / unit.maxHp;
        return healthPct < 0.2 && !unit.tags.includes('kamikaze');
      }
    );

    fsm.addTransition('MOVING', 'RETREATING',
      (unit) => {
        if (unit.tags && unit.tags.includes('heavy')) return false;
        const healthPct = unit.hp / unit.maxHp;
        return healthPct < 0.15;
      }
    );

    // From RETREATING -> IDLE (safe or time expired)
    fsm.addTransition('RETREATING', 'IDLE',
      (unit) => this.retreatTimer <= 0
    );

    return fsm;
  }

  /**
   * Smart target finding
   */
  findTarget(unit, game) {
    // Special case: Healer
    if (unit.tags && unit.tags.includes('healer')) {
      return this.findHealTarget(unit, game);
    }

    // Special case: Building Hunter
    if (unit.isBuildingHunter) {
      const target = this.threatAnalyzer.findBestTarget(unit, game, {
        preferType: 'tower',
        maxRange: unit.sightRange * 1.5
      });
      if (target) return target;
    }

    // Standard target finding
    return this.threatAnalyzer.findBestTarget(unit, game, {
      maxRange: unit.sightRange,
      avoidTanks: unit.tags && unit.tags.includes('fast'),
      prioritizeWeak: unit.tags && unit.tags.includes('area')
    });
  }

  findHealTarget(unit, game) {
    const allies = [...game.units, ...game.buildings].filter(u =>
      u.team === unit.team &&
      !u.dead &&
      u !== unit &&
      u.hp < u.maxHp &&
      Utils.getDist(unit, u) <= unit.sightRange
    );

    if (allies.length === 0) return null;

    // Prioritize lowest HP percentage
    allies.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
    return allies[0];
  }

  /**
   * Execute attack with all special effects
   */
  performAttack(unit, target, game) {
    // Healer special case
    if (unit.key === 'healer') {
      unit.heal(unit.dmg * 0.5);
      const nearbyAllies = game.units.filter(u =>
        u.team === unit.team &&
        u !== unit &&
        !u.dead &&
        Utils.getDist(unit, u) < 5 * CONFIG.gridSize
      );
      nearbyAllies.forEach(u => {
        u.heal(unit.dmg * 0.5);
        game.effects.push(new Effect(u.x, u.y, 20, "#00e676"));
      });
      return;
    }

    // Kamikaze units
    if (unit.kamikaze) {
      const canHitAir = unit.tags.includes("air-target");
      game.dealAreaDamage(unit.x, unit.y, unit.splashRadius, unit.dmg, unit.team, "damage", canHitAir);
      game.effects.push(new Effect(unit.x, unit.y, unit.splashRadius, "orange"));
      unit.takeDamage(9999);
      return;
    }

    // Ramp damage (Inferno Dragon, Inferno Tower)
    if (unit.isRampUp) {
      unit.rampStage = Math.min(40, unit.rampStage + 0.5);
      const finalDmg = unit.dmg * (1 + unit.rampStage * 0.1);
      target.takeDamage(finalDmg);
      return;
    }

    // Multi-target (Electro Wizard)
    if (unit.multiTarget && unit.multiTarget > 1) {
      const enemies = [...game.units, ...game.buildings, ...game.towers].filter(e =>
        e.team !== unit.team &&
        !e.dead &&
        !e.isHidden &&
        Utils.getDist(unit, e) <= unit.range + e.radius + 10
      );
      enemies.sort((a, b) => Utils.getDist(unit, a) - Utils.getDist(unit, b));
      const targets = enemies.slice(0, unit.multiTarget);
      targets.forEach(t => {
        t.takeDamage(unit.dmg);
        t.applyStun(0.5, "zap");
        game.effects.push(new LightningEffect(unit.x, unit.y - 15, t.x, t.y));
      });
      return;
    }

    // Projectile attacks
    if (unit.range > 0) {
      // Lead shooting for ranged units
      const predictedPos = this.pathfinder.predictTargetPosition(unit, target, unit.projSpeed || 7);
      const shootTarget = predictedPos || target;

      const p = new Projectile(
        unit.x,
        unit.y,
        shootTarget,
        unit.dmg,
        unit.team,
        false,
        unit.isAreaDmg,
        false,
        unit.splashRadius,
        2,
        unit.hasSlowEffect,
        unit.slowDuration || 0,
        unit.slowAmount || 0
      );
      p.hitAir = unit.tags.includes("air-target");
      game.projectiles.push(p);
    } else {
      // Melee attack
      if (unit.isAreaDmg) {
        const canHitAir = unit.tags.includes("air-target");
        game.dealAreaDamage(unit.x, unit.y, unit.splashRadius, unit.dmg, unit.team, "damage", canHitAir);
        game.effects.push(new Effect(unit.x, unit.y, unit.splashRadius, "orange"));
      } else {
        target.takeDamage(unit.dmg);
      }
    }
  }

  /**
   * Main update loop
   */
  update(game) {
    // Skip if deploying
    if (this.unit.deployTimer > 0) return;

    // Update FSM
    this.fsm.update(this.unit, game);

    // Update status effects (handled by Entity)
    this.unit.updateStatus();
  }

  getState() {
    return this.fsm.getState();
  }
}

// Export
if (typeof window !== 'undefined') {
  window.TroopBrain = TroopBrain;
}