/**
 * ENTITY.JS - Fixed Ice Spirit, Slow Logic, & Targeting
 */

class Entity {
  constructor(x, y, team) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.dead = false;
    this.maxHp = 100;
    this.hp = 100;
    this.shield = 0;
    this.maxShield = 0;
    this.radius = 15;
    
    // Status Effects
    this.stunned = 0;
    this.freezeActive = false;
    this.zapActive = false;
    this.rageBoosted = 0;
    this.rageAmount = 0;
    this.slowed = 0;
    this.slowAmount = 0;
    
    this.isHidden = false;
    this.animFrame = 0;
    this.pushFactor = 1.0;
  }

  takeDamage(amount) {
    if (this.isHidden) return;
    if (this.shield > 0) {
      this.shield -= amount;
      if (this.shield < 0) this.shield = 0;
      return;
    }
    this.hp -= amount;
    if (this.hp <= 0) this.dead = true;
  }

  applyStun(duration, type) {
    if (this.isHidden) return;
    this.stunned = Math.max(this.stunned, duration * 60);
    
    if (type === "freeze") this.freezeActive = true;
    else if (type === "zap") this.zapActive = true;

    // Reset status serangan saat stun (Retargeting Logic)
    this.rampStage = 0;
    this.target = null;
    this.isAttacking = false;
    this.attackTimer = 60; 

    // Reset Charge jika kena stun
    if (this.isCharging !== undefined) {
        this.isCharging = false;
        this.chargeTimer = 0;
    }
  }

  applyRage(boost) {
    this.rageBoosted = 2; // Refresh tiap frame
    this.rageAmount = boost;
  }

  applySlow(duration, amount) {
    if (!this.isHidden) {
      this.slowed = Math.max(this.slowed, duration * 60);
      this.slowAmount = amount;
    }
  }

  heal(amount) {
    if (this.dead || this.hp >= this.maxHp) return;
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  updateStatus() {
    if (this.stunned > 0) {
      this.stunned--;
      if (this.stunned <= 0) {
        this.freezeActive = false;
        this.zapActive = false;
      }
    }
    if (this.rageBoosted > 0) this.rageBoosted--;
    if (this.slowed > 0) this.slowed--;
    this.animFrame++;
    this.pushFactor = 1.0;
  }

  // Helper Outline (Dipanggil Renderer)
  drawOutline(ctx) {
    if (this.isHidden) return;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3;
    let color = null;
    
    if (this.stunned > 0) {
      color = this.freezeActive ? "#00e5ff" : "yellow";
      ctx.shadowBlur = 10;
    } else if (this.rageBoosted > 0) {
      color = "red"; ctx.shadowBlur = 10;
    } else if (this.slowed > 0) {
      color = "#00bcd4"; ctx.shadowBlur = 5;
    }

    if (color) {
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
  }
}

class Unit extends Entity {
  constructor(x, y, team, key) {
    super(x, y, team);
    const data = CARDS[key];
    this.key = key;
    this.maxHp = data.stats.hp || 100;
    this.hp = this.maxHp;
    this.shield = data.stats.shield || 0;
    this.maxShield = this.shield;
    this.dmg = data.stats.dmg || 0;
    this.baseSpeed = data.stats.speed || 1;
    this.speed = this.baseSpeed;
    
    this.range = (data.stats.range || 0) * CONFIG.gridSize; 
    this.sightRange = (data.stats.sightRange || 8) * CONFIG.gridSize; 

    this.hitSpeed = (data.stats.hitSpeed || 1) * 60;
    this.tags = data.tags || [];
    this.color = data.color || "#999";
    this.target = null;
    this.attackTimer = 0;
    this.firstHitDelay = this.tags.includes('heavy') ? 60 : 30;
    this.deployTimer = (data.stats.deployTime || 1) * 60;
    this.isAir = this.tags.includes("air");
    this.isBuildingHunter = this.tags.includes("building-hunter");
    this.isAreaDmg = this.tags.includes("area");
    this.splashRadius = (data.stats.splashRadius || 3) * CONFIG.gridSize;

    this.isSpawner = this.tags.includes("spawner");
    this.spawnUnitKey = data.stats.spawnUnitKey;
    this.spawnCount = data.stats.spawnCount || 1;
    this.spawnTimer = 0;
    this.spawnInterval = (data.stats.spawnInterval || 5) * 60;
    this.projType = data.stats.projectile;
    this.projSpeed = data.stats.projSpeed || 7;
    this.maxRange = (data.stats.maxRange || 0) * CONFIG.gridSize; 

    this.hasWeapon = true;
    this.isRampUp = this.tags.includes("ramp-damage");
    this.rampStage = 0;
    this.kamikaze = data.stats.kamikaze || false;
    this.hasSlowEffect = this.tags.includes("slow-effect");
    this.spawnZap = data.stats.spawnZap || false;
    this.radius = this.tags.includes("heavy") ? 22 : 12;
    this.mass = this.tags.includes("heavy") ? 5.0 : 1.0; 
    this.lastX = x; this.lastY = y; this.stuckTimer = 0;
    this.isMoving = false; this.isAttacking = false;
    this.angle = team === 0 ? -Math.PI / 2 : Math.PI / 2;
    this.canJumpRiver = data.canJumpRiver || false;
    this.multiTarget = data.multiTarget || 1;
    this.deathEffect = data.deathEffect || null;
    this.jumpStats = data.jumpAttack || null;
    this.isJumping = false;
    this.jumpTimer = 0;
    this.jumpStartX = 0; this.jumpStartY = 0;
    this.jumpTargetX = 0; this.jumpTargetY = 0;
    this.jumpPhase = 0; 

    // --- CHARGE MECHANIC ---
    this.isCharging = false;
    this.chargeTimer = 0;
  }

  takeDamage(amount) {
      super.takeDamage(amount);
      if (this.dead && this.deathEffect) {
          this.doDeathEffect();
      }
  }

  doDeathEffect() {
    // Ambil effect dari config, bukan dari 'this.deathEffect' instance (karena bisa null)
    const de = CARDS[this.key].deathEffect;
    if (!de) return;

    // Pastikan hanya trigger sekali
    if (this.deathEffectTriggered) return;
    this.deathEffectTriggered = true;

    if (typeof GAME !== "undefined") {
      const radiusPx = (de.radius || 3) * CONFIG.gridSize;

      // 1. Explode / Damage
      if (de.type === 'explode' || de.dmg) {
        GAME.dealAreaDamage(this.x, this.y, radiusPx, de.dmg || 0, this.team, "damage");
        GAME.effects.push(new Effect(this.x, this.y, radiusPx, "orange"));
      }
      
      // 2. Split / Spawn Units
      if (de.type === "split") {
        for (let i = 0; i < de.count; i++) {
          const ox = (Math.random() - 0.5) * 20;
          const oy = (Math.random() - 0.5) * 20;
          const u = new Unit(this.x + ox, this.y + oy, this.team, de.unit);
          u.deployTimer = 20;
          GAME.units.push(u);
        }
      }
      
      // 3. Trigger ANY Spell (Generic Handler)
      if (de.type === 'spell' && de.spell) {
          // Buat objek spell dummy untuk dikirim ke Game Engine
          const spellObj = {
              key: de.spell,
              x: this.x,
              y: this.y,
              team: this.team,
              radius: radiusPx,
              // Kirim override stats (agar death effect bisa punya damage/durasi beda)
              overrideDmg: de.amount, 
              overrideDuration: de.duration
          };
          GAME.executeSpellEffect(spellObj);
      }
    }
  }

  update(game) {
    if (this.deployTimer > 0) { this.deployTimer--; return; }
    
    // --- SPECIAL MOVEMENT: JUMP (Mega Knight style) ---
    if (this.jumpStats && this.target && !this.dead && !this.stunned) {
        const dist = Utils.getDist(this, this.target);
        const minJump = this.jumpStats.minRange * CONFIG.gridSize;
        const maxJump = this.jumpStats.maxRange * CONFIG.gridSize;
        
        if (!this.isJumping && dist > 50 && dist >= minJump && dist <= maxJump) {
            this.isJumping = true; this.jumpPhase = 0; this.jumpTimer = 40; 
        }
        if (this.isJumping) {
            this.isMoving = false; this.isAttacking = false;
            if (this.jumpPhase === 0) {
                this.jumpTimer--;
                if (this.jumpTimer <= 0) {
                    this.jumpPhase = 1; this.jumpStartX = this.x; this.jumpStartY = this.y; this.jumpTargetX = this.target.x; this.jumpTargetY = this.target.y;
                }
            } else {
                const angle = Math.atan2(this.jumpTargetY - this.y, this.jumpTargetX - this.x);
                const jumpSpeed = this.jumpStats.speed * 2.5; 
                this.x += Math.cos(angle) * jumpSpeed; this.y += Math.sin(angle) * jumpSpeed; this.angle = angle; 
                const distToLand = Math.hypot(this.jumpTargetX - this.x, this.jumpTargetY - this.y);
                if (distToLand < 15) {
                    this.isJumping = false;
                    const landRadius = 2.5 * CONFIG.gridSize; 
                    game.dealAreaDamage(this.x, this.y, landRadius, this.jumpStats.dmg, this.team, 'damage');
                    game.effects.push(new Effect(this.x, this.y, landRadius, "orange"));
                    this.attackTimer = 60; 
                }
            }
            return; 
        }
    }

    this.updateStatus();
    if (this.stunned > 0 || !this.hasWeapon) return;

    let speedMult = 1.0;
    let attackSpeedMult = 1.0;
    if (this.rageBoosted > 0) { speedMult += this.rageAmount; attackSpeedMult += this.rageAmount; }
    if (this.slowed > 0) { speedMult -= this.slowAmount; attackSpeedMult -= this.slowAmount; }
    if (speedMult < 0.2) speedMult = 0.2;
    if (attackSpeedMult < 0.2) attackSpeedMult = 0.2;

    if (this.tags.includes('charge')) {
        // Hanya charge jika bergerak, tidak stun, tidak freeze, tidak knockback
        if (this.isMoving && !this.stunned && !this.freezeActive) {
            this.chargeTimer++;
            if (this.chargeTimer > 90) { // 1.5 detik lari = Charge Aktif
                this.isCharging = true;
            }
        } else {
            // Reset jika berhenti atau terkena status effect
            this.isCharging = false;
            this.chargeTimer = 0;
        }
    }
    // Jika charging, speed naik 2x (atau lebih)
    if (this.isCharging) {
        speedMult *= 2.0;
    }

    let mult = speedMult * this.pushFactor; 
    this.speed = this.baseSpeed * mult;

    if (this.isSpawner) {
      this.spawnTimer++;
      if (this.spawnTimer >= this.spawnInterval) { this.spawnTimer = 0; this.spawnMinions(game); }
    }

    this.updateTargeting(game);

    if (this.target) {
      this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      const dist = Utils.getDist(this, this.target);
      const reach = (this.range > 0 ? this.range : 10) + this.target.radius + this.radius;

      if (dist <= reach) {
        this.isMoving = false;

        if (this.isCharging) {
            this.attackTimer = 0; // Hapus delay attackSpeed/firstHitDelay
        }

        if (this.attackTimer > 0) {
            this.attackTimer -= attackSpeedMult; 
            this.isAttacking = false;
        } else {
            this.isAttacking = true; 
            this.doAttack(game, 1); 
            this.attackTimer = this.hitSpeed; 
        }
      } else {
        this.isAttacking = false; this.rampStage = 0; this.isMoving = true;
        this.attackTimer = this.firstHitDelay;
        this.moveTowards(this.target.x, this.target.y, game);
      }
    } else {
      this.isAttacking = false; this.rampStage = 0; this.isMoving = true;
      this.attackTimer = this.firstHitDelay;
      this.laneMovement(game);
    }
    this.resolveCollision(game);
  }

  spawnMinions(game) { const key = this.spawnUnitKey || "skeleton"; for (let i = 0; i < this.spawnCount; i++) { const ox = (Math.random() - 0.5) * 20; const oy = (Math.random() - 0.5) * 20; const u = new Unit(this.x + ox, this.y + oy, this.team, key); u.deployTimer = 10; game.units.push(u); } }
  
  updateTargeting(game) { 
      if (this.target) { 
          let invalid = this.target.dead || this.target.isHidden || Utils.getDist(this, this.target) > this.sightRange * 1.5; 
          if (!this.tags.includes('air-target') && this.target.isAir) invalid = true;
          if (this.tags.includes('healer') && this.target.team === this.team && this.target.hp >= this.target.maxHp) invalid = true; 
          if (invalid) { this.target = null; this.rampStage = 0; this.isAttacking = false; } 
      } 
      if (this.target && this.isAttacking) return; 
      
      let bestTarget = this.target; let minD = this.target ? Utils.getDist(this, this.target) : 9999; 
      
      if (this.tags.includes('healer')) { 
          const allies = [...game.units, ...game.buildings].filter( u => u.team === this.team && !u.dead && u !== this && u.hp < u.maxHp ); 
          for (let a of allies) { 
              const d = Utils.getDist(this, a); 
              if (d <= this.sightRange) { if (d < minD) { minD = d; bestTarget = a; } } 
          } 
      } 
      if (!bestTarget || (this.key === 'healer' && !bestTarget)) { 
          const enemies = [...game.units, ...game.buildings, ...game.towers].filter( (e) => e.team !== this.team && !e.dead && !e.isHidden ); 
          for (let e of enemies) { 
              if (e === this) continue; 
              if (this.isBuildingHunter && !(e instanceof Tower) && !(e instanceof Building)) continue; 
              if (!this.tags.includes("air-target") && e.isAir) continue; 
              const d = Utils.getDist(this, e); 
              if (d <= this.sightRange) { if (d < minD - 30) { minD = d; bestTarget = e; } } 
          } 
      } 
      if (!bestTarget) { 
          const globalTargets = [...game.towers, ...game.buildings].filter((t) => t.team !== this.team && !t.dead); 
          let globalMinD = 9999; 
          for (let t of globalTargets) { const d = Utils.getDist(this, t); if (d < globalMinD) { globalMinD = d; bestTarget = t; } } 
      } 
      if (this.target !== bestTarget) { this.target = bestTarget; this.rampStage = 0; } 
  }
  
  moveTowards(tx, ty, game) { 
      const moveDist = Math.hypot(this.x - this.lastX, this.y - this.lastY); 
      if (moveDist < 0.5 && this.isMoving) this.stuckTimer++; else this.stuckTimer = 0; 
      this.lastX = this.x; this.lastY = this.y; 
      
      let moveAngle = Math.atan2(ty - this.y, tx - this.x); 
      if (this.stuckTimer > 30) { moveAngle += (Math.random() - 0.5) * 1.5; if (this.stuckTimer > 60) this.stuckTimer = 0; } 
      this.angle = moveAngle; 
      
      if (!this.isAir) { 
          const riverY = 350; 
          const isCrossing = (this.y < riverY && ty > riverY) || (this.y > riverY && ty < riverY); 
          if (isCrossing && !this.canJumpRiver) { 
              const bX = Math.abs(this.x - 100) < Math.abs(this.x - 340) ? 100 : 340; 
              const distToBridgeX = Math.abs(this.x - bX);
              if (distToBridgeX > 20) { 
                  const bridgeEntryY = riverY + (this.y < riverY ? -25 : 25); 
                  this.angle = Math.atan2(bridgeEntryY - this.y, bX - this.x); 
              } else {
                  this.angle = Math.atan2(ty - this.y, 0); 
                  const xCorrection = (bX - this.x) * 0.05;
                  this.x += xCorrection;
              }
          } 
          if (game) { 
              game.buildings.forEach((b) => { 
                  const dist = Utils.getDist(this, b); 
                  if (dist < b.radius + this.radius + 15) { 
                      const angleToBuilding = Math.atan2(b.y - this.y, b.x - this.x); 
                      let diff = this.angle - angleToBuilding; 
                      while (diff <= -Math.PI) diff += Math.PI*2; while (diff > Math.PI) diff -= Math.PI*2; 
                      if (Math.abs(diff) < 2.0) this.angle += diff > 0 ? 0.8 : -0.8; 
                  } 
              }); 
          } 
      } 
      this.x += Math.cos(this.angle) * this.speed; 
      this.y += Math.sin(this.angle) * this.speed; 
  }
  
  laneMovement(game) { 
      const towers = game.towers.filter((t) => t.team !== this.team && !t.dead); 
      const isLeftLane = this.x < 200; 
      const lanePrincess = towers.find((t) => t.type === "princess" && (isLeftLane ? t.x < 200 : t.x >= 200)); 
      const kingTower = towers.find((t) => t.type === "king"); 
      let target = lanePrincess || kingTower; 
      if (!target) { let minD = 9999; for (let t of towers) { const d = Utils.getDist(this, t); if (d < minD) { minD = d; target = t; } } } 
      if (target) { this.moveTowards(target.x, target.y, game); } 
      else { const dir = this.team === 0 ? -1 : 1; this.y += dir * this.speed; this.angle = this.team === 0 ? -Math.PI / 2 : Math.PI / 2; } 
  }
  
  resolveCollision(game) { 
      const others = [...game.units, ...game.buildings]; 
      for (let u of others) { 
          if (u === this || u.dead) continue; 
          const iAmAir = this.isAir; 
          const uIsAir = u.tags ? u.tags.includes("air") : false; 
          const uIsBuilding = u instanceof Building; 
          if (iAmAir !== uIsAir && !uIsBuilding) continue; 
          if (iAmAir && uIsBuilding) continue; 
          const dist = Utils.getDist(this, u); 
          const minDist = this.radius + u.radius; 
          if (dist < minDist) { 
              const angle = Math.atan2(this.y - u.y, this.x - u.x); 
              const overlap = minDist - dist; 
              let uMass = (u instanceof Unit) ? u.mass : 9999; 
              const myMass = this.mass; 
              const totalMass = myMass + uMass; 
              const myPushRatio = uMass / totalMass; 
              this.x += Math.cos(angle) * overlap * myPushRatio; 
              this.y += Math.sin(angle) * overlap * myPushRatio; 
              if (u instanceof Unit) this.pushFactor = (myMass > uMass) ? 0.9 : 0.5; 
          } 
      } 
  }

  doAttack(game, attackMult = 1) {
    let finalDmg = this.dmg * attackMult;
    let wasChargingAction = false; // Flag untuk menandai serangan ini adalah Charge

    // --- APPLY CHARGE DAMAGE ---
    if (this.isCharging) {
        const chargeDmg = CARDS[this.key]?.stats?.chargeDmg;
        if (chargeDmg) finalDmg = chargeDmg;
        
        wasChargingAction = true; // Tandai bahwa ini serangan charge
        
        // Reset charge state
        this.isCharging = false;
        this.chargeTimer = 0;
        
        // Visual effect benturan
        game.effects.push(new Effect(this.x, this.y, this.radius + 15, "#ffffff"));
    }
    // ---------------------------

    // 1. HEALER Logic
    if (this.tags.includes('healer')) {
        if (this.kamikaze) {
            game.effects.push(new Effect(this.x, this.y, this.splashRadius, "#00e676"));
            const allies = [...game.units, ...game.buildings].filter(u => u.team === this.team && !u.dead);
            allies.forEach(u => { if (Utils.getDist(this, u) <= this.splashRadius) u.heal(350); });
            this.takeDamage(9999);
            return;
        } else {
            this.heal(finalDmg * 0.5); 
            const allies = [...game.units].filter(u => u.team === this.team && u !== this && !u.dead);
            allies.forEach(u => { if (Utils.getDist(this, u) < 5 * CONFIG.gridSize) { u.heal(finalDmg * 0.5); game.effects.push(new Effect(u.x, u.y, 20, "#00e676")); } });
        }
    }

    // 2. LIGHTNING / INSTANT STUN
    if (this.tags.includes('stun-effect') && !this.projType && this.range > 0) {
        let targets = [];
        if (this.multiTarget && this.multiTarget > 1) {
            const enemies = [...game.units, ...game.buildings, ...game.towers].filter(e => e.team !== this.team && !e.dead && !e.isHidden && Utils.getDist(this, e) <= this.range + e.radius + 10);
            enemies.sort((a,b) => Utils.getDist(this, a) - Utils.getDist(this, b));
            targets = enemies.slice(0, this.multiTarget);
        } else if (this.target) {
            targets = [this.target];
        }

        if (targets.length > 0) {
            const stunDur = CARDS[this.key]?.stats?.stunDuration || 0.5;
            targets.forEach(t => { 
                t.takeDamage(finalDmg); 
                t.applyStun(stunDur, "zap"); 
                game.effects.push(new LightningEffect(this.x, this.y - 15, t.x, t.y)); 
            });
            return;
        }
    }

    // 3. KAMIKAZE
    if (this.kamikaze) {
      const canHitAir = this.tags.includes("air-target");
      const stats = CARDS[this.key]?.stats || {};
      const stunDur = stats.stunDuration || 0;
      const isFreeze = this.key === 'ice_spirit';

      const targets = [...game.units, ...game.buildings, ...game.towers];
      for (let t of targets) {
          if (t.team !== this.team && !t.dead && !t.isHidden) {
              if (t.tags && t.tags.includes("air") && !canHitAir) continue;
              if (Utils.getDist(this, t) < this.splashRadius + t.radius) {
                  t.takeDamage(finalDmg);
                  if (stunDur > 0) t.applyStun(stunDur, isFreeze ? "freeze" : "zap");
              }
          }
      }
      
      let fxColor = "orange";
      if (isFreeze) fxColor = "#00e5ff"; 
      else if (this.key === 'wall_breakers') fxColor = "#3e2723";
      
      game.effects.push(new Effect(this.x, this.y, this.splashRadius, fxColor));
      this.takeDamage(9999);
      return;
    }

    // 4. RAMP UP
    if (this.isRampUp) {
      this.rampStage += 0.5;
      if(this.rampStage > 40) this.rampStage = 40;
      finalDmg = this.dmg * (1 + this.rampStage * 0.1); 
      if (this.target) this.target.takeDamage(finalDmg); 
      return;
    }

    // 5. STANDARD PROJECTILE & MELEE
    if (this.projType || this.range > 0) {
        // Projectile Attack
        if (this.projType === "boomerang" || this.projType === "rolling" || this.range > 0) {
            const hitAir = this.tags.includes("air-target"); 
            const slowDur = CARDS[this.key]?.stats?.slowDuration || 0;
            const slowAmt = CARDS[this.key]?.stats?.slowAmount || 0;
            const hasSlow = this.tags.includes('slow-effect');

            const p = new Projectile(
                this.x, this.y, this.target, finalDmg, this.team, 
                false, this.isAreaDmg, false, this.splashRadius, 2, 
                hasSlow, slowDur, slowAmt, 
                this.projType || "normal", this.projSpeed, this.maxRange, this
            );
            
            p.hitAir = hitAir;
            if (this.projType === "rolling") { p.angle = this.angle; p.dx = Math.cos(p.angle); p.dy = Math.sin(p.angle); }
            if (this.projType === "boomerang") { this.hasWeapon = false; }
            
            game.projectiles.push(p);
        } 
    } 
    // MELEE AREA (Dark Prince Style)
    else if (this.isAreaDmg) {
        const canHitAir = this.tags.includes("air-target"); 
        
        // Simpan target mati atau tidak sebelum area damage
        // (Agak tricky di area dmg, kita cek target utama saja)
        const primaryTarget = this.target;

        game.dealAreaDamage(this.x, this.y, this.splashRadius, finalDmg, this.team, "damage", canHitAir);
        
        if (this.tags.includes('slow-effect')) {
             const slowD = CARDS[this.key]?.stats?.slowDuration || 1;
             const slowA = CARDS[this.key]?.stats?.slowAmount || 0.3;
             [...game.units, ...game.buildings, ...game.towers].forEach(t => {
                 if (t.team !== this.team && !t.dead && !t.isHidden && Utils.getDist(this, t) < this.splashRadius + t.radius) {
                     if (!canHitAir && (t.tags && t.tags.includes("air"))) return;
                     t.applySlow(slowD, slowA);
                 }
             });
        }

        let fxColor = "orange";
        if (this.tags.includes('slow-effect')) fxColor = "#29b6f6"; 
        game.effects.push(new Effect(this.x, this.y, this.splashRadius, fxColor));

        // --- PAUSE IF CHARGE KILL (AREA) ---
        if (wasChargingAction && primaryTarget && primaryTarget.dead) {
            this.attackTimer = this.hitSpeed; // Delay attack
            this.isMoving = false; // Stop moving
        }
    } 
    // MELEE SINGLE (Prince Style)
    else {
        if (this.target) {
            this.target.takeDamage(finalDmg);

            // --- PAUSE IF CHARGE KILL (SINGLE) ---
            // Jika ini serangan charge DAN target mati karenanya
            if (wasChargingAction && this.target.dead) {
                this.attackTimer = this.hitSpeed; // Paksa cooldown penuh (Jeda)
                this.isMoving = false; // Berhenti visual
                this.isCharging = false; // Pastikan charge mati
                this.chargeTimer = 0; // Reset timer charge
            }
        }
    }
  }
}

class Building extends Entity {
  constructor(x, y, team, key) {
    super(x, y, team);
    const data = CARDS[key];
    if (!data) {
      this.dead = true;
      return;
    }
    this.key = key;
    this.maxHp = data.stats.hp || 100;
    this.hp = this.maxHp;
    this.dmg = data.stats.dmg || 0;
    this.range = (data.stats.range || 0) * CONFIG.gridSize;
    this.hitSpeed = (data.stats.hitSpeed || 1) * 60;
    this.lifetime = (data.stats.lifetime || 30) * 60;
    this.maxLifetime = this.lifetime;
    this.tags = data.tags || [];
    this.radius = 20;
    this.deployTimer = (data.stats.deployTime || 1) * 60;
    this.target = null;
    this.attackTimer = 0;
    this.color = data.color || "#888";
    this.isSpawner = this.tags.includes("spawner");
    this.isRampUp = this.tags.includes("ramp-damage");
    this.isHideIdle = this.tags.includes("hide-when-idle");
    this.isSiege = this.tags.includes("siege");
    this.spawnUnitKey = data.stats.spawnUnitKey;
    this.spawnCount = data.stats.spawnCount || 1;
    this.spawnInterval = (data.stats.spawnInterval || 5) * 60;
    this.spawnTimer = 0;
    this.stunDuration = data.stats.stunDuration || 0;
    this.rampStage = 0;
    this.angle = -Math.PI / 2;
  }
  update(game) {
    if (this.deployTimer > 0) {
      this.deployTimer--;
      return;
    }
    this.updateStatus();
    if (this.stunned > 0) return;

    this.lifetime--;
    this.hp -= this.maxHp / this.maxLifetime;
    if (this.lifetime <= 0 || this.hp <= 0) {
      this.dead = true;
      return;
    }

    let speedMult = 1.0;
    if (this.slowed > 0) speedMult -= this.slowAmount;
    if (speedMult < 0.2) speedMult = 0.2;

    if (this.attackTimer > 0) this.attackTimer -= speedMult;

    if (this.isSpawner) {
      this.spawnTimer += speedMult;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnUnit(game);
      }
    }

    if (this.range > 0) {
      this.updateTargeting(game);
      if (this.isHideIdle) this.isHidden = this.target === null;
      if (this.target)
        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);

      if (this.target && this.attackTimer <= 0) {
        this.doAttack(game);
        this.attackTimer = this.hitSpeed;
      } else {
        if (this.isRampUp && !this.target) this.rampStage = 0;
      }
    }
  }
  spawnUnit(game) {
    const key = this.spawnUnitKey || "skeleton";
    for (let i = 0; i < this.spawnCount; i++) {
      const ox = (Math.random() - 0.5) * 10;
      const u = new Unit(this.x + ox, this.y + 20, this.team, key);
      u.deployTimer = 10;
      game.units.push(u);
    }
  }

  updateTargeting(game) {
    if (
      this.target &&
      (this.target.dead ||
        this.target.isHidden ||
        Utils.getDist(this, this.target) > this.range)
    ) {
      this.target = null;
      this.rampStage = 0;
    }

    if (!this.target) {
      const enemies = game.units.filter(
        (u) => u.team !== this.team && !u.dead && !u.isHidden
      );
      let closest = null;
      let minD = this.range;
      for (let e of enemies) {
        if (!e.tags) e.tags = [];

        // --- FIX TARGETING BUILDING ---
        if (!this.tags.includes("air-target") && e.isAir) continue;
        // ------------------------------

        const d = Utils.getDist(this, e);
        if (d <= minD) {
          minD = d;
          closest = e;
        }
      }
      this.target = closest;
    }
  }

  doAttack(game) {
    let currentDmg = this.dmg;
    const spawnX = this.x + Math.cos(this.angle) * 20;
    const spawnY = this.y + Math.sin(this.angle) * 20;

    if (this.isRampUp) {
      this.rampStage += 0.5;
      if (this.rampStage > 40) this.rampStage = 40;
      currentDmg = this.dmg * (1 + this.rampStage * 0.1);
      if (this.target) this.target.takeDamage(currentDmg);
    } else if (this.key === "tesla") {
      if (this.target) {
        this.target.takeDamage(this.dmg);
        this.target.applyStun(this.stunDuration, "zap");
        game.effects.push(
          new LightningEffect(this.x, this.y - 20, this.target.x, this.target.y)
        );
      }
    } else {
      game.projectiles.push(
        new Projectile(spawnX, spawnY, this.target, currentDmg, this.team, true)
      );
    }
  }
}


class Tower extends Entity {
  constructor(x, y, team, type) {
    super(x, y, team);
    const stats = TOWER_DATA[type];
    this.type = type;
    this.maxHp = stats.hp;
    this.hp = this.maxHp;
    this.dmg = stats.dmg;
    this.range = (stats.range || 0) * CONFIG.gridSize; 
    this.hitSpeed = stats.hitSpeed * 60;
    this.radius = stats.radius;
    this.active = type !== "king";
    this.activationTimer = 0;
    this.attackTimer = 0;
    this.angle = team === 0 ? -Math.PI / 2 : Math.PI / 2;
    this.target = null;
    this.tags = [];
  }
  update(game) { 
      this.updateStatus(); 
      if (this.stunned > 0) return; 
      
      if (this.type === "king") { 
          if (!this.active) { 
              const princessAlive = game.towers.filter( (t) => t.team === this.team && t.type === "princess" && !t.dead ).length; 
              if (this.hp < this.maxHp || princessAlive < 2) { this.active = true; this.activationTimer = 120; } 
          } 
      } 
      if (this.activationTimer > 0) this.activationTimer--; 
      
      this.target = null; 
      if (this.active) { 
          const enemies = game.units.filter( (u) => u.team !== this.team && !u.dead && !u.isHidden ); 
          let closest = null; let minD = this.range; 
          for (let e of enemies) { const d = Utils.getDist(this, e); if (d <= minD) { minD = d; closest = e; } } 
          this.target = closest; 
          
          let speedMult = 1.0;
          if(this.slowed > 0) speedMult -= this.slowAmount;
          if(speedMult < 0.2) speedMult = 0.2;

          if (this.target) { 
              this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x); 
              if (this.attackTimer <= 0) { 
                  const spawnX = this.x + Math.cos(this.angle) * 20; 
                  const spawnY = this.y + Math.sin(this.angle) * 20; 
                  game.projectiles.push( new Projectile( spawnX, spawnY, this.target, this.dmg, this.team, true ) ); 
                  this.attackTimer = this.hitSpeed; 
              } 
          } 
      } 
      
      if (this.attackTimer > 0) {
          let speedMult = 1.0;
          if(this.slowed > 0) speedMult -= this.slowAmount;
          if(speedMult < 0.2) speedMult = 0.2;
          this.attackTimer -= speedMult;
      }
  }

  
}