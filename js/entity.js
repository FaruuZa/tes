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
    this.radius = 10;

    // Status Effects
    this.stunned = 0;
    this.freezeActive = false;
    this.zapActive = false;
    this.rageBoosted = 0;
    this.rageAmount = 0;
    this.slowed = 0;
    this.slowAmount = 0;

    this.maxStunned = 0;
    this.maxSlow = 0;

    this.isHidden = false;
    this.animFrame = 0;
    this.pushFactor = 1.0;

    this.poisoned = 0;
    this.poisonDmg = 0;
    this.maxPoison = 0;
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
    const durFrames = duration * 60;

    // Set max hanya jika durasi baru lebih besar dari sisa durasi sekarang
    // Ini agar progress bar "refill" penuh lagi
    if (durFrames > this.stunned) {
      this.maxStunned = durFrames;
    }
    this.stunned = Math.max(this.stunned, durFrames);

    if (type === "freeze") this.freezeActive = true;
    else if (type === "zap") this.zapActive = true;

    this.rampStage = 0;
    this.target = null;
    this.isAttacking = false;
    this.attackTimer = 60;

    if (this.isCharging !== undefined) {
      this.isCharging = false;
      this.chargeTimer = 0;
    }
  }

  applyRage(boost) {
    // Rage di-refresh terus, jadi visualnya akan selalu penuh
    this.rageBoosted = 10;
    this.maxRage = 10;
    this.rageAmount = boost;
  }

  applySlow(duration, amount) {
    if (!this.isHidden) {
      const durFrames = duration * 60;
      if (durFrames > this.slowed) {
        this.maxSlow = durFrames;
      }
      this.slowed = Math.max(this.slowed, durFrames);
      this.slowAmount = amount;
    }
  }

  applyPoison(duration, dps) {
    if (this.isHidden || this.dead) return;
    const durFrames = duration * 60;
    if (durFrames > this.poisoned) this.maxPoison = durFrames;
    this.poisoned = Math.max(this.poisoned, durFrames);
    this.poisonDmg = dps; // Damage per detik
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
    if (this.poisoned > 0) {
      this.poisoned--;
      this.takeDamage(this.poisonDmg / 60);
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
      color = "red";
      ctx.shadowBlur = 10;
    } else if (this.slowed > 0) {
      color = "#00bcd4";
      ctx.shadowBlur = 5;
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

    // --- CORE STATS ---
    this.maxHp = data.stats.hp || 100;
    this.hp = this.maxHp;
    this.shield = data.stats.shield || 0;
    this.maxShield = this.shield;
    this.dmg = data.stats.dmg || 0;
    this.baseSpeed = data.stats.speed || 1;
    this.speed = this.baseSpeed;

    // --- TARGETING ---
    this.range = (data.stats.range || 0) * CONFIG.gridSize;
    this.sightRange = (data.stats.sightRange || 6) * CONFIG.gridSize;
    this.targetType = data.stats.targetType || "ground-air";
    this.buildingHunter = data.tags && data.tags.includes("building-hunter");

    // --- ATTACK CONFIG ---
    this.hitSpeed = (data.stats.hitSpeed || 1) * 60;
    this.firstHitDelay = (data.stats.firstHitDelay || 0.5) * 60;
    this.isMelee = this.range <= 20;
    this.projectileData = data.stats.projectile;
    this.splashRadius = (data.stats.splashRadius || 0) * CONFIG.gridSize;
    this.multiTarget = data.stats.multiTarget || 1;

    // --- TIMERS (Untuk Visual Progress) ---
    this.deployTimer = (data.stats.deployTime || 1) * 60;
    this.maxDeployTimer = this.deployTimer; // PENTING: Untuk visual lingkaran putih

    // --- PHYSICAL ---
    this.tags = data.tags || [];
    this.isAir = this.tags.includes("air");
    this.radius = this.tags.includes("heavy") ? 16 : 9;
    this.mass = this.tags.includes("heavy") ? 5.0 : 1.0;

    // --- MODULAR EFFECTS & ABILITIES ---
    this.effects = data.effects || {};
    this.jumpConfig = data.abilities?.jumpAttack || null;
    this.chargeConfig = data.abilities?.charge || null;

    // Legacy Support (Agar kode lama tidak error)
    this.deathEffect = data.deathEffect || null;

    // --- STATES ---
    this.target = null;
    this.attackTimer = 0;
    this.lastX = x;
    this.lastY = y;
    this.stuckTimer = 0;
    this.isMoving = false;
    this.isAttacking = false;
    this.isSleeping = false;
    this.angle = team === 0 ? -Math.PI / 2 : Math.PI / 2;
    this.canJumpRiver =
      data.canJumpRiver || this.tags.includes("river-jumper") || this.isAir;

    this.isJumping = false;
    this.jumpPhase = 0;
    this.jumpTimer = 0;
    this.isCharging = false;
    this.chargeTimer = 0;
    this.spawnEffectTriggered = false;
    this.deathEffectTriggered = false;

    this.hasWeapon = true; // Default punya senjata
  }
  update(game) {
    if (this.deployTimer > 0) { 
        this.deployTimer--; 
        if (this.deployTimer <= 0 && !this.spawnEffectTriggered) {
            this.triggerEffectsArea(game, 'onSpawn', this.x, this.y);
            this.spawnEffectTriggered = true;
        }
        return; 
    }

    // 1. Ability: Jump (Mega Knight)
    if (this.jumpConfig) this.handleJump(game);
    if (this.isJumping) return; 

    // 2. Status Updates
    this.updateStatus();
    if (this.effects.aura) this.processAura(game); 
    
    if (this.stunned > 0) {
        this.resolveCollision(game);
        return;
    }

    // 3. Speed Calculation
    let speedMult = 1.0;
    let attackSpeedMult = 1.0;
    if (this.rageBoosted > 0) { speedMult += this.rageAmount; attackSpeedMult += this.rageAmount; }
    if (this.slowed > 0) { speedMult -= this.slowAmount; attackSpeedMult -= this.slowAmount; }
    if (speedMult < 0.2) speedMult = 0.2;

    // 4. Ability: Charge (Prince)
    if (this.chargeConfig) {
        if (this.isMoving && !this.freezeActive) {
            this.chargeTimer++; 
            if (this.chargeTimer > (this.chargeConfig.windup || 90)) this.isCharging = true;
        } else {
            this.isCharging = false; this.chargeTimer = 0;
        }
    }
    if (this.isCharging) speedMult *= (this.chargeConfig.speedMult || 2.0);

    // 5. Apply Movement Stats
    this.speed = this.baseSpeed * speedMult * this.pushFactor;
    
    // 6. Spawner Logic
    if (this.effects.spawner) this.processSpawner(game);

    // 7. AI Logic
    this.findTarget(game);

    // HAPUS LOGIKA SLEEPING DISINI.
    // Dulu unit diam jika tidak ada teman. Sekarang kita biarkan dia jalan (di blok else bawah).

    if (this.target) {
        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        const dist = Utils.getDist(this, this.target);
        const reach = (this.range > 0 ? this.range : 10) + this.target.radius + this.radius;

        if (dist <= reach) {
            this.isMoving = false;
            
            if (this.isCharging) this.attackTimer = 0; 

            if (this.attackTimer > 0) {
                this.attackTimer -= attackSpeedMult;
                this.isAttacking = false;
            } else {
                this.isAttacking = true;
                this.executeAttack(game); 
                this.attackTimer = this.hitSpeed;
            }
        } else {
            this.isAttacking = false;
            this.isMoving = true;
            this.attackTimer = this.firstHitDelay;
            this.moveTowards(this.target.x, this.target.y, game);
        }
    } else {
        // NO TARGET -> JALAN MAJU (LANE MOVEMENT)
        this.isAttacking = false;
        this.isMoving = true;
        this.attackTimer = this.firstHitDelay;
        
        // --- LOGIKA JALAN PERLAHAN (IDLE SUPPORT) ---
        // Jika unit support tidak punya target teman, dia jalan pelan (50% speed)
        if (this.targetType === 'allies-only') {
            this.speed *= 0.5;
        }

        this.laneMovement(game);
    }

    this.resolveCollision(game);
  }

  // =================================================================
  // DAMAGE & DEATH (FIXED)
  // =================================================================
  takeDamage(amount) {
    super.takeDamage(amount);

    if (this.dead && !this.deathEffectTriggered) {
      this.deathEffectTriggered = true;

      // Priority 1: Modular Effects (New System)
      if (this.effects && this.effects.onDeath) {
        this.triggerEffectsArea(GAME, "onDeath", this.x, this.y);
      }
      // Priority 2: Legacy (Old System Backup)
      else if (this.deathEffect) {
        this.doDeathEffect();
      }
    }
  }

  doDeathEffect() {
    // Fungsi lama untuk compatibility
    const de = this.deathEffect;
    if (!de) return;

    if (typeof GAME !== "undefined") {
      const radiusPx = (de.radius || 3) * CONFIG.gridSize;
      if (de.type === "explode" || de.dmg) {
        GAME.dealAreaDamage(
          this.x,
          this.y,
          radiusPx,
          de.dmg || 0,
          this.team,
          "damage"
        );
        GAME.effects.push(new Effect(this.x, this.y, radiusPx, "orange"));
      }
      if (de.type === "split") {
        for (let i = 0; i < de.count; i++) {
          const ox = (Math.random() - 0.5) * 20;
          const oy = (Math.random() - 0.5) * 20;
          const u = new Unit(this.x + ox, this.y + oy, this.team, de.unit);
          u.deployTimer = 20;
          GAME.units.push(u);
        }
      }
      if (de.type === "spell" && de.spell) {
        GAME.executeSpellEffect({
          key: de.spell,
          x: this.x,
          y: this.y,
          team: this.team,
          radius: radiusPx,
          overrideDmg: de.amount,
          overrideDuration: de.duration,
        });
      }
    }
  }

  triggerEffects(game, triggerName, targetEntity) {
    if (!this.effects[triggerName]) return;

    this.effects[triggerName].forEach((eff) => {
      let finalTarget = targetEntity;
      if (eff.target === "self") finalTarget = this;

      if (eff.type === "damage") {
        // Jika ada durasi, jadikan Poison/DOT
        if (eff.duration > 0) {
          finalTarget.applyPoison(eff.duration, eff.amount);
        } else {
          finalTarget.takeDamage(eff.amount);
        }
      }
      if (eff.type === "heal") finalTarget.heal(eff.amount);
      if (eff.type === "stun")
        finalTarget.applyStun(eff.duration, eff.visual || "zap");
      if (eff.type === "slow") finalTarget.applySlow(eff.duration, eff.amount);
    });
  }
  triggerEffectsArea(game, triggerName, x, y, radiusOverride = null) {
    if (!this.effects[triggerName]) return;

    this.effects[triggerName].forEach((eff) => {
      const r =
        (eff.radius || 0) * CONFIG.gridSize ||
        radiusOverride ||
        this.splashRadius;

      // 1. SPAWN UNIT (Golem, Witch, Tombstone)
      if (eff.type === "spawn") {
        for (let i = 0; i < eff.count; i++) {
          const ox = (Math.random() - 0.5) * 20;
          const oy = (Math.random() - 0.5) * 20;
          const contextGame = game || GAME;
          if (contextGame) {
            // Cek tipe data kartu yang akan di-spawn
            const spawnCardData = CARDS[eff.unit];

            if (spawnCardData && spawnCardData.type === "building") {
              // Spawn sebagai Building (Diam, punya lifetime) - misal: Phoenix Egg
              const b = new Building(x + ox, y + oy, this.team, eff.unit);
              contextGame.buildings.push(b);
            } else {
              // Spawn sebagai Unit (Bergerak) - misal: Skeleton, Golemite
              const u = new Unit(x + ox, y + oy, this.team, eff.unit);
              u.deployTimer = 20;
              contextGame.units.push(u);
            }
          }
        }
        return;
      }

      // 2. TRIGGER SPELL (FIX: PENDING DELAY SUPPORT)
      if (eff.type === "spell") {
        const contextGame = game || GAME;
        const spellCard = CARDS[eff.spell];

        if (contextGame && spellCard) {
          // Prioritas Delay:
          // 1. Custom Delay di effect (misal: deathEffect: { delay: 3 })
          // 2. Default Delay dari kartu spell
          // 3. Default 1 detik
          const delaySec =
            eff.delay !== undefined
              ? eff.delay
              : spellCard.stats.spawnDelay || 1.0;

          // Masukkan ke Pending Spells (Agar muncul indikator visual dulu)
          contextGame.pendingSpells.push({
            key: eff.spell,
            x: x,
            y: y,
            team: this.team,
            timer: delaySec * 60, // Konversi ke frame
            maxTimer: delaySec * 60,
            radius: r,
            overrideDmg: eff.amount, // Override stats
            overrideDuration: eff.duration,
          });
        }
        return;
      }

      // 3. DIRECT AREA EFFECT (Damage/Heal/Stun/Slow biasa)
      this.effects[triggerName].forEach((eff) => {
        if (eff.type === "spawn" || eff.type === "spell") return; // Skip yg sudah dihandle

        const targets = [
          ...(game || GAME).units,
          ...(game || GAME).buildings,
        ].filter((u) => !u.dead && Utils.getDist({ x, y }, u) <= r);

        targets.forEach((t) => {
          if (eff.target === "self") return;
          if (eff.type === "heal" && t.team !== this.team) return;
          if (eff.type !== "heal" && t.team === this.team) return;

          // Logic Damage/DOT
          if (eff.type === "damage") {
            if (eff.duration > 0) t.applyPoison(eff.duration, eff.amount);
            else t.takeDamage(eff.amount);
          }
          if (eff.type === "heal") t.heal(eff.amount);
          if (eff.type === "stun")
            t.applyStun(eff.duration, eff.visual || "zap");
          if (eff.type === "slow") t.applySlow(eff.duration, eff.amount);
        });
      });
    });
  }

  // =================================================================
  // TARGETING & MOVEMENT
  // =================================================================
  findTarget(game) {
      // Stick to Target Logic
      if (this.target) {
          const dist = Utils.getDist(this, this.target);
          const reach = (this.range > 0 ? this.range : 10) + this.target.radius + this.radius;
          
          let stillValid = !this.target.dead && 
                           !this.target.isHidden && 
                           dist <= reach + 50 && 
                           this.isValidTarget(this.target);
          
          if (this.targetType === 'allies-only' && this.target.hp >= this.target.maxHp) stillValid = false;

          if (stillValid) return; 
          
          this.rampStage = 0;
          this.target = null;
          this.isAttacking = false;
      }

      let candidates = [];
      
      // --- PERBAIKAN LOGIKA ALLIES-ONLY ---
      if (this.targetType === 'allies-only') {
          // Hanya cari UNIT teman yang HP-nya belum penuh.
          // JANGAN masukkan game.buildings atau game.towers.
          candidates = game.units.filter(u => u.team === this.team && u !== this && u.hp < u.maxHp);
      } else {
          // Musuh (Unit, Building, Tower)
          candidates = [...game.units, ...game.buildings, ...game.towers].filter(e => e.team !== this.team && !e.dead && !e.isHidden);
      }

      let bestTarget = null;
      let minDist = 9999;

      for (let c of candidates) {
          if (this.buildingHunter && !(c instanceof Building) && !(c instanceof Tower)) continue;
          if (!this.isValidTarget(c)) continue;

          const dist = Utils.getDist(this, c);
          if (dist <= this.sightRange) {
              if (dist < minDist) {
                  minDist = dist;
                  bestTarget = c;
              }
          }
      }

      // Global Aggro ke Tower (Hanya untuk penyerang musuh)
      if (!bestTarget && this.targetType !== 'allies-only') {
          const globalTargets = [...game.towers, ...game.buildings].filter(t => t.team !== this.team && !t.dead);
          let globalMin = 9999;
          for (let t of globalTargets) {
              const d = Utils.getDist(this, t);
              if (d < globalMin) { globalMin = d; bestTarget = t; }
          }
      }
      this.target = bestTarget;
  }

  isValidTarget(entity) {
    if (entity.dead || entity.isHidden) return false;
    if (this.targetType === "ground-only" && entity.isAir) return false;
    if (this.targetType === "air-only" && !entity.isAir) return false;
    return true;
  }

  executeAttack(game) {
    let dmg = this.dmg;
    let isChargeHit = false;

    // Charge Logic
    if (this.isCharging && this.chargeConfig) {
      dmg = this.chargeConfig.dmg || this.dmg * 2;
      isChargeHit = true;
      this.isCharging = false;
      this.chargeTimer = 0;
      game.effects.push(new Effect(this.x, this.y, this.radius + 15, "#fff"));
    }

    const pData = this.projectileData || {};

    // FUNGSI PENCARI MULTI-TARGET
    const getMultiTargets = (primaryTarget) => {
      let targets = [primaryTarget];
      if (this.multiTarget && this.multiTarget > 1) {
        const extras = [...game.units, ...game.buildings]
          .filter(
            (e) =>
              e.team !== this.team &&
              !e.dead &&
              !e.isHidden &&
              e !== primaryTarget &&
              this.isValidTarget(e) &&
              Utils.getDist(this, e) <= this.range + 2
          )
          .sort((a, b) => Utils.getDist(this, a) - Utils.getDist(this, b))
          .slice(0, this.multiTarget - 1);
        targets = targets.concat(extras);
      }
      return targets;
    };

    // --- LOGIKA RAMP DAMAGE (INFERNO) ---
    if (this.tags.includes("ramp-damage")) {
      // Naikkan stage (Tier 1, 2, 3)
      this.rampStage = (this.rampStage || 0) + 1;
      let rampMult = 1.0;

      // Logika Ramp Up (mirip Clash Royale: detik 0-2 (x1), 2-4 (x3), 4+ (x8))
      // Asumsi hitSpeed Inferno Dragon ~0.4 detik (24 frame)
      if (this.rampStage > 15) rampMult = 3.0; // Setelah ~6 detik in-game ticks
      if (this.rampStage > 30) rampMult = 8.0; // Setelah ~12 detik in-game ticks

      dmg *= rampMult;

      // Inferno adalah tipe INSTANT (Beam)
      if (this.target) {
        this.target.takeDamage(dmg);
        // Tidak push projectile, damage langsung masuk
      }
      return; // Selesai, jangan spawn projectile
    }

    // 1. INSTANT ATTACK (Petir / Laser / Zap)
    if (pData.type === "instant") {
      const targets = getMultiTargets(this.target);
      targets.forEach((t) => {
        if (!t) return;
        t.takeDamage(dmg);
        this.triggerEffects(game, "onHit", t);
        if (pData.visual === "lightning") {
          game.effects.push(new LightningEffect(this.x, this.y - 20, t.x, t.y));
        }
      });
    }

    // 2. MELEE ATTACK
    else if (this.isMelee && !pData.type) {
      if (this.splashRadius > 0) {
        game.dealAreaDamage(
          this.x,
          this.y,
          this.splashRadius,
          dmg,
          this.team,
          "damage",
          this.targetType !== "ground-only"
        );
        game.effects.push(
          new Effect(this.x, this.y, this.splashRadius, "orange")
        );
        this.triggerEffectsArea(
          game,
          "onHit",
          this.x,
          this.y,
          this.splashRadius
        );
      } else {
        if (this.target) {
          this.target.takeDamage(dmg);
          this.triggerEffects(game, "onHit", this.target);
        }
      }
      if (this.tags.includes("kamikaze")) this.takeDamage(9999);
      if (isChargeHit && this.target && this.target.dead) {
        this.attackTimer = this.hitSpeed;
        this.isMoving = false;
      }
    }

    // 3. PROJECTILE ATTACK
    else {
      if (this.key === "executioner") {
        this.hasWeapon = false; // Kapak dilempar!
      }

      const targets = getMultiTargets(this.target);
      const pType = pData.type || "normal";
      const pSpeed = pData.speed || 7;
      const pMaxRange = pData.maxRange
        ? pData.maxRange * CONFIG.gridSize
        : this.range;
      const onHitEffects = this.effects.onHit || [];

      targets.forEach((t) => {
        if (!t) return;
        const p = new Projectile(
          this.x,
          this.y,
          t,
          dmg,
          this.team,
          false,
          this.splashRadius > 0,
          false,
          this.splashRadius,
          2,
          false,
          0,
          0,
          pType,
          pSpeed,
          pMaxRange,
          this,
          onHitEffects
        );
        p.hitAir = this.targetType !== "ground-only";
        game.projectiles.push(p);
      });
    }
  }
  processAura(game) {
    this.effects.aura.forEach((eff) => {
      const radius = (eff.radius || 3) * CONFIG.gridSize;

      if (eff.target === "self") {
        if (eff.type === "rage") this.applyRage(eff.amount);
        // Visual Aura Self
        if (game.frameCount % 30 === 0) {
          game.effects.push(
            new Effect(this.x, this.y, this.radius + 5, "rgba(255, 0, 0, 0.3)")
          );
        }
        return;
      }

      const targets = [...game.units, ...game.buildings].filter(
        (u) => !u.dead && Utils.getDist(this, u) <= radius
      );
      targets.forEach((t) => {
        if (eff.target === "enemy" && t.team === this.team) return;
        if (eff.target === "ally" && t.team !== this.team) return;
        if (eff.type === "damage") t.takeDamage(eff.amount / 60);
        if (eff.type === "heal") t.heal(eff.amount / 60);
        if (eff.type === "slow") t.applySlow(0.1, eff.amount);
        if (eff.type === "rage") t.applyRage(eff.amount);
      });
      if (game.frameCount % 30 === 0) {
        const color =
          eff.type === "heal" ? "rgba(0,255,0,0.1)" : "rgba(255,255,255,0.1)";
        game.effects.push(new Effect(this.x, this.y, radius, color));
      }
    });
  }

  processSpawner(game) {
    const sp = this.effects.spawner;
    if (!this.spawnTimer) this.spawnTimer = 0;
    this.spawnTimer++;
    if (this.spawnTimer >= sp.interval * 60) {
      this.spawnTimer = 0;
      for (let i = 0; i < sp.count; i++) {
        const u = new Unit(
          this.x + (Math.random() - 0.5) * 20,
          this.y,
          this.team,
          sp.unit
        );
        u.deployTimer = 20;
        game.units.push(u);
      }
    }
  }

  handleJump(game) {
    const cfg = this.jumpConfig;
    const dist = this.target ? Utils.getDist(this, this.target) : 0;
    const minJ = cfg.minRange * CONFIG.gridSize;
    const maxJ = cfg.maxRange * CONFIG.gridSize;
    if (
      !this.isJumping &&
      this.target &&
      dist >= minJ &&
      dist <= maxJ &&
      !this.stunned
    ) {
      this.isJumping = true;
      this.jumpPhase = 0;
      this.jumpTimer = 40;
    }
    if (this.isJumping) {
      this.isMoving = false;
      this.isAttacking = false;
      if (this.jumpPhase === 0) {
        this.jumpTimer--;
        if (this.jumpTimer <= 0) {
          this.jumpPhase = 1;
          this.jumpStartX = this.x;
          this.jumpStartY = this.y;
          this.jumpTargetX = this.target.x;
          this.jumpTargetY = this.target.y;
        }
      } else {
        const angle = Math.atan2(
          this.jumpTargetY - this.y,
          this.jumpTargetX - this.x
        );
        const speed = cfg.speed * 2.5;
        this.x += Math.cos(angle) * speed;
        this.y += Math.sin(angle) * speed;
        this.angle = angle;
        if (
          Math.hypot(this.jumpTargetX - this.x, this.jumpTargetY - this.y) < 15
        ) {
          this.isJumping = false;
          const rad = (cfg.radius || 2.5) * CONFIG.gridSize;
          game.dealAreaDamage(
            this.x,
            this.y,
            rad,
            cfg.dmg,
            this.team,
            "damage"
          );
          game.effects.push(new Effect(this.x, this.y, rad, "orange"));
          this.attackTimer = 60;
        }
      }
    }
  }

  moveTowards(tx, ty, game) {
    const moveDist = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    if (moveDist < 0.5 && this.isMoving) this.stuckTimer++;
    else this.stuckTimer = 0;
    this.lastX = this.x;
    this.lastY = this.y;

    let moveAngle = Math.atan2(ty - this.y, tx - this.x);

    // LOGIKA ANTI-STUCK (Random wiggle jika macet parah)
    if (this.stuckTimer > 30) {
      moveAngle += (Math.random() - 0.5) * 2.0;
      if (this.stuckTimer > 60) this.stuckTimer = 0;
    }

    // LOGIKA HINDARI BANGUNAN (Pathfinding Sederhana)
    if (game && !this.isAir) {
      const obstacles = [...game.buildings, ...game.towers].filter(
        (b) => !b.dead
      );

      for (let b of obstacles) {
        const dist = Utils.getDist(this, b);
        const avoidDist = b.radius + this.radius + 15; // Jarak aman

        if (dist < avoidDist) {
          // Hitung vektor dari pusat bangunan ke unit
          const angleFromBuilding = Math.atan2(this.y - b.y, this.x - b.x);

          // Periksa apakah bangunan ada "di depan" arah jalan kita
          const angleDiff = Math.abs(
            moveAngle - Math.atan2(b.y - this.y, b.x - this.x)
          );

          // Jika bangunan menghalangi jalan (di depan)
          if (angleDiff < Math.PI / 2) {
            // Geser sudut gerak menjauhi bangunan
            // Kita blend sudut tujuan asli dengan sudut menghindar
            // Semakin dekat, semakin kuat menghindarnya
            const avoidanceStrength = 1.5 * (1 - dist / avoidDist);

            // Tentukan belok kiri atau kanan yang lebih efisien
            let avoidAngle = angleFromBuilding;

            // Smooth steering
            moveAngle = Utils.lerpAngle(moveAngle, avoidAngle, 0.2);
          }
        }
      }
    }

    // Set angle akhir
    this.angle = moveAngle;

    // ... (Logika Jembatan/Sungai Tetap Sama - Copy paste bagian bawah ini dari kode sebelumnya)
    if (!this.isAir) {
      const riverY = 350;
      if (this.tags.includes("river-jumper")) {
        if (Math.abs(this.y - riverY) < 35) {
          const onLeftBridge = this.x > 70 && this.x < 130;
          const onRightBridge = this.x > 310 && this.x < 370;
          if (!onLeftBridge && !onRightBridge) this.speed *= 0.5;
        }
      } else {
        const isCrossing =
          (this.y < riverY && ty > riverY) || (this.y > riverY && ty < riverY);
        if (isCrossing && !this.canJumpRiver) {
          const bX =
            Math.abs(this.x - 100) < Math.abs(this.x - 340) ? 100 : 340;
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
      }
    }
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
  }

  laneMovement(game) {
    const towers = game.towers.filter((t) => t.team !== this.team && !t.dead);
    const isLeftLane = this.x < 200;
    const lanePrincess = towers.find(
      (t) => t.type === "princess" && (isLeftLane ? t.x < 200 : t.x >= 200)
    );
    const kingTower = towers.find((t) => t.type === "king");
    let target = lanePrincess || kingTower;
    if (!target) {
      let minD = 9999;
      for (let t of towers) {
        const d = Utils.getDist(this, t);
        if (d < minD) {
          minD = d;
          target = t;
        }
      }
    }
    if (target) {
      this.moveTowards(target.x, target.y, game);
    } else {
      const dir = this.team === 0 ? -1 : 1;
      this.y += dir * this.speed;
      this.angle = this.team === 0 ? -Math.PI / 2 : Math.PI / 2;
    }
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
        let uMass = u instanceof Unit ? u.mass : 9999;
        const myMass = this.mass;
        const totalMass = myMass + uMass;
        const myPushRatio = uMass / totalMass;
        this.x += Math.cos(angle) * overlap * myPushRatio;
        this.y += Math.sin(angle) * overlap * myPushRatio;
        if (u instanceof Unit) this.pushFactor = myMass > uMass ? 0.9 : 0.5;
      }
    }
    if (!this.isAir) {
      for (let t of game.towers) {
        if (t.dead) continue;
        const dist = Utils.getDist(this, t);
        const minDist = this.radius + t.radius;
        if (dist < minDist) {
          const angle = Math.atan2(this.y - t.y, this.x - t.x);
          const overlap = minDist - dist;
          this.x += Math.cos(angle) * overlap;
          this.y += Math.sin(angle) * overlap;
        }
      }
    }
  }
}

// DALAM FILE ENTITY.JS

class Building extends Entity {
  constructor(x, y, team, key) {
    super(x, y, team);
    const data = CARDS[key];
    if (!data) { this.dead = true; return; }
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
    this.projType = data.stats.projectile;
    this.projSpeed = data.stats.projSpeed || 7;
    this.effects = data.effects || {};
  }
  
  update(game) {
    if (this.deployTimer > 0) { this.deployTimer--; return; }
    this.updateStatus();
    if (this.stunned > 0) return;

    this.lifetime--;
    this.hp -= this.maxHp / this.maxLifetime; // Decay HP

    // --- FIX: TRIGGER EFFECT SAAT LIFETIME HABIS ---
    if (this.lifetime <= 0 || this.hp <= 0) { 
        this.dead = true; 
        // Trigger onDeath (untuk Phoenix Egg menetas)
        if (this.effects.onDeath) {
             // Pastikan kita mengirim game context
             // Jika di dalam class ini tidak ada akses ke variabel global GAME, 
             // kita andalkan parameter 'game' dari update loop.
             this.effects.onDeath.forEach(eff => {
                 if (eff.type === 'spawn') {
                     // Logic spawn manual karena triggerEffectsArea ada di Unit, bukan Building (kecuali dicopy)
                     // Atau lebih baik panggil helper global jika ada.
                     // Di sini kita copy logic spawn sederhana:
                     for(let i=0; i<eff.count; i++) {
                         const ox = (Math.random()-0.5)*10;
                         const u = new Unit(this.x + ox, this.y, this.team, eff.unit);
                         u.deployTimer = 20;
                         game.units.push(u);
                     }
                 }
                 // Handle spell death effect (Lumberjack/Bomb Tower logic)
                 if (eff.type === 'spell' && CARDS[eff.spell]) {
                     game.pendingSpells.push({
                        key: eff.spell, x: this.x, y: this.y, team: this.team,
                        timer: 60, maxTimer: 60, radius: (eff.radius||3)*CONFIG.gridSize,
                        overrideDmg: eff.amount, overrideDuration: eff.duration
                     });
                 }
             });
        }
        return; 
    }

    let speedMult = 1.0;
    if (this.slowed > 0) speedMult -= this.slowAmount;
    if (speedMult < 0.2) speedMult = 0.2;

    if (this.attackTimer > 0) this.attackTimer -= speedMult;

    if (this.effects.spawner) {
        const sp = this.effects.spawner;
        if (!this.spawnTimer) this.spawnTimer = 0;
        this.spawnTimer += speedMult;
        if (this.spawnTimer >= sp.interval * 60) {
            this.spawnTimer = 0;
            this.spawnUnit(game, sp.unit, sp.count);
        }
    } else if (this.isSpawner) {
        this.spawnTimer += speedMult;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnUnit(game, this.spawnUnitKey, this.spawnCount);
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

  takeDamage(amount) {
      super.takeDamage(amount);
      // Trigger OnDeath saat hancur diserang (Logic duplikat dengan update, tapi perlu untuk instant kill)
      if (this.dead && this.effects.onDeath) {
          // Sama seperti di update(), jalankan efek
          // (Idealnya buat method helper, tapi inline saja biar aman di copy-paste)
          const gameRef = (typeof GAME !== 'undefined') ? GAME : null; 
          if(gameRef) {
              this.effects.onDeath.forEach(eff => {
                 if (eff.type === 'spawn') {
                     for(let i=0; i<eff.count; i++) {
                         const u = new Unit(this.x, this.y, this.team, eff.unit);
                         u.deployTimer = 20; gameRef.units.push(u);
                     }
                 }
                 if (eff.type === 'spell') {
                     // ... logic spell ...
                 }
              });
          }
      }
  }

  spawnUnit(game, unitKey, count) {
    if(!unitKey) return;
    for (let i = 0; i < (count || 1); i++) {
      const ox = (Math.random() - 0.5) * 10;
      const u = new Unit(this.x + ox, this.y + 20, this.team, unitKey);
      u.deployTimer = 10;
      game.units.push(u);
    }
  }

  // --- FIX TARGETING BUILDING ---
  updateTargeting(game) {
    if (this.target && (this.target.dead || this.target.isHidden || Utils.getDist(this, this.target) > this.range)) {
      this.target = null;
      this.rampStage = 0;
    }

    if (!this.target) {
      // FIX: TARGET KANDIDAT = UNIT + TOWER + BUILDING MUSUH
      const enemies = [
          ...game.units, 
          ...game.towers, 
          ...game.buildings
      ].filter(e => e.team !== this.team && !e.dead && !e.isHidden);

      let closest = null;
      let minD = this.range;
      
      for (let e of enemies) {
        if (!e.tags) e.tags = [];
        if (!this.tags.includes("air-target") && e.isAir) continue;
        
        // Perhitungkan radius target agar X-Bow bisa nembak tower
        const dist = Utils.getDist(this, e) - e.radius; 
        
        if (dist <= minD) { 
            minD = dist; 
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
    } else if (this.tags.includes('stun-effect')) { 
      if (this.target) {
        this.target.takeDamage(this.dmg);
        this.target.applyStun(this.stunDuration || 0.5, "zap");
        game.effects.push(new LightningEffect(this.x, this.y - 20, this.target.x, this.target.y));
      }
    } else {
      game.projectiles.push(new Projectile(spawnX, spawnY, this.target, currentDmg, this.team, true));
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
        const princessAlive = game.towers.filter(
          (t) => t.team === this.team && t.type === "princess" && !t.dead
        ).length;
        if (this.hp < this.maxHp || princessAlive < 2) {
          this.active = true;
          this.activationTimer = 120;
        }
      }
    }
    if (this.activationTimer > 0) this.activationTimer--;

    this.target = null;
    if (this.active) {
      // --- FIX TARGETING TOWER: INCLUDE BUILDING MUSUH ---
      const enemies = [
          ...game.units,
          ...game.buildings
      ].filter(u => u.team !== this.team && !u.dead && !u.isHidden);
      
      let closest = null;
      let minD = this.range;
      for (let e of enemies) {
        const d = Utils.getDist(this, e) - e.radius; // Hitung radius body
        if (d <= minD) {
          minD = d;
          closest = e;
        }
      }
      this.target = closest;

      let speedMult = 1.0;
      if (this.slowed > 0) speedMult -= this.slowAmount;
      if (speedMult < 0.2) speedMult = 0.2;

      if (this.target) {
        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        if (this.attackTimer <= 0) {
          const spawnX = this.x + Math.cos(this.angle) * 20;
          const spawnY = this.y + Math.sin(this.angle) * 20;
          game.projectiles.push(
            new Projectile(
              spawnX,
              spawnY,
              this.target,
              this.dmg,
              this.team,
              true // isTower = true
            )
          );
          this.attackTimer = this.hitSpeed;
        }
      }
    }

    if (this.attackTimer > 0) {
      let speedMult = 1.0;
      if (this.slowed > 0) speedMult -= this.slowAmount;
      if (speedMult < 0.2) speedMult = 0.2;
      this.attackTimer -= speedMult;
    }
  }
}
