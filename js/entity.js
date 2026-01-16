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

    // --- MODULAR EFFECTS SYSTEM (Moved to Parent) ---
    this.effects = {}; // Akan diisi oleh child class (Unit/Building)
    this.spawnEffectTriggered = false;
    this.deathEffectTriggered = false;
    this.spawnTimer = 0; // Untuk effect spawner
  }

  // =================================================================
  // CORE MECHANICS (Damage, Heal, Status)
  // =================================================================

  takeDamage(amount) {
    if (this.isHidden) return;

    // Shield Logic
    if (this.shield > 0) {
      this.shield -= amount;
      if (this.shield < 0) this.shield = 0;
      return; // Shield menyerap damage sepenuhnya (mekanik Clash Royale)
    }

    this.hp -= amount;
    if (this.hp <= 0) {
      this.dead = true;
      this.hp = 0;

      // Trigger Death Effect otomatis
      if (!this.deathEffectTriggered) {
        this.handleDeathEffect();
        this.deathEffectTriggered = true;
      }
    }
  }

  heal(amount) {
    if (this.dead || this.hp >= this.maxHp) return;
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  applyStun(duration, type) {
    if (this.isHidden) return;
    const durFrames = duration * 60;

    if (durFrames > this.stunned) {
      this.maxStunned = durFrames;
    }
    this.stunned = Math.max(this.stunned, durFrames);

    if (type === "freeze") this.freezeActive = true;
    else if (type === "zap") this.zapActive = true;

    // Reset status serangan jika terkena stun
    this.rampStage = 0;
    this.target = null;
    this.isAttacking = false;
    this.attackTimer = 60; // Delay setelah stun

    if (this.isCharging !== undefined) {
      this.isCharging = false;
      this.chargeTimer = 0;
    }
  }

  applyRage(boost) {
    this.rageBoosted = 10; // Refresh terus
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
    this.poisonDmg = dps;
  }

  // Dipanggil setiap frame oleh Update
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
      // Damage per frame untuk Poison
      this.takeDamage(this.poisonDmg / 60);
    }
    if (this.rageBoosted > 0) this.rageBoosted--;
    if (this.slowed > 0) this.slowed--;

    this.animFrame++;
    this.pushFactor = 1.0;
  }

  // =================================================================
  // MODULAR EFFECTS PROCESSING (The "Brain")
  // =================================================================

  /**
   * Menangani efek Pasif seperti Aura dan Spawner
   * Dipanggil di dalam update() anak
   */
  processActiveEffects(game) {
    if (this.effects.aura) this.processAura(game);
    if (this.effects.spawner) this.processSpawner(game);
  }

  /**
   * Menangani Efek Kematian
   * Menggunakan variabel global GAME sebagai fallback jika parameter game tidak ada
   */
  handleDeathEffect() {
    // Priority 1: Modular Effects (New System)
    if (this.effects && this.effects.onDeath) {
      // Kita gunakan global GAME karena takeDamage sering dipanggil tanpa passing context game
      if (typeof GAME !== "undefined") {
        this.triggerEffectsArea(GAME, "onDeath", this.x, this.y);
      }
    }
    // Priority 2: Legacy (Old System Backup)
    else if (this.deathEffect && typeof GAME !== "undefined") {
      this.doLegacyDeathEffect(GAME);
    }
  }

  /**
   * Trigger efek target tunggal (biasanya dari serangan/projectile)
   * Contoh: Ice Wizard hit (Slow), Poison hit (Damage over time)
   */
  triggerEffects(game, triggerName, targetEntity) {
    if (!this.effects[triggerName]) return;

    this.effects[triggerName].forEach((eff) => {
      let finalTarget = targetEntity;
      if (eff.target === "self") finalTarget = this;

      if (!finalTarget) return;

      if (eff.type === "damage") {
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
      if (eff.type === "rage") finalTarget.applyRage(eff.amount);
    });
  }

  /**
   * Trigger efek area (Spawn, Death, Area Damage)
   */
  triggerEffectsArea(game, triggerName, x, y, radiusOverride = null) {
    if (!this.effects[triggerName]) return;

    this.effects[triggerName].forEach((eff) => {
      const r =
        (eff.radius || 0) * CONFIG.gridSize ||
        radiusOverride ||
        this.splashRadius ||
        0;

      // 1. SPAWN UNIT (Golem, Witch, Tombstone)
      if (eff.type === "spawn") {
        for (let i = 0; i < eff.count; i++) {
          const ox = (Math.random() - 0.5) * 20;
          const oy = (Math.random() - 0.5) * 20;

          // Cek tipe data kartu yang akan di-spawn
          const spawnCardData = CARDS[eff.unit];
          if (spawnCardData) {
            if (spawnCardData.type === "building") {
              const b = new Building(x + ox, y + oy, this.team, eff.unit);
              game.buildings.push(b);
            } else {
              const u = new Unit(x + ox, y + oy, this.team, eff.unit);
              u.deployTimer = 20; // Waktu spawn singkat
              game.units.push(u);
            }
          }
        }
        return;
      }

      // 2. TRIGGER SPELL (Death Bomb, Rage, etc)
      if (eff.type === "spell") {
        const spellCard = CARDS[eff.spell];
        if (spellCard) {
          const delaySec =
            eff.delay !== undefined
              ? eff.delay
              : spellCard.stats.spawnDelay || 1.0;
          game.pendingSpells.push({
            key: eff.spell,
            x: x,
            y: y,
            team: this.team,
            timer: delaySec * 60,
            maxTimer: delaySec * 60,
            radius:
              r > 0 ? r : (spellCard.stats.radius || 2.5) * CONFIG.gridSize,
            overrideDmg: eff.amount,
            overrideDuration: eff.duration,
          });
        }
        return;
      }

      // 3. DIRECT AREA EFFECT (Instant Damage/Heal/Stun/Slow)
      // Cari target di sekitar
      const targets = [...game.units, ...game.buildings, ...game.towers].filter(
        (u) => !u.dead && Utils.getDist({ x, y }, u) <= r
      );

      targets.forEach((t) => {
        if (eff.target === "self") return; // Skip self check logic for area usually
        if (eff.type === "heal" && t.team !== this.team) return;
        if (eff.type !== "heal" && t.team === this.team) return;

        if (eff.type === "damage") {
          if (eff.duration > 0) t.applyPoison(eff.duration, eff.amount);
          else t.takeDamage(eff.amount);
        }
        if (eff.type === "heal") t.heal(eff.amount);
        if (eff.type === "stun") t.applyStun(eff.duration, eff.visual || "zap");
        if (eff.type === "slow") t.applySlow(eff.duration, eff.amount);
      });

      // Visual Effect Sederhana
      if (eff.type === "damage" && !eff.duration) {
        game.effects.push(new Effect(x, y, r, "orange"));
      }
    });
  }

  processAura(game) {
    if (!this.effects.aura) return;

    this.effects.aura.forEach((eff) => {
      const radius = (eff.radius || 3) * CONFIG.gridSize;

      // Aura ke Diri Sendiri (misal: Berserker Rage)
      if (eff.target === "self") {
        if (eff.type === "rage") this.applyRage(eff.amount);
        if (eff.type === "heal") this.heal(eff.amount / 60);

        // Visual Aura Self
        if (game.frameCount % 30 === 0) {
          game.effects.push(
            new Effect(this.x, this.y, this.radius + 5, "rgba(255, 0, 0, 0.3)")
          );
        }
        return;
      }

      // Aura Area (Healer, Flame Knight)
      const targets = [...game.units, ...game.buildings].filter(
        (u) => !u.dead && Utils.getDist(this, u) <= radius
      );

      targets.forEach((t) => {
        if (eff.target === "enemy" && t.team === this.team) return;
        if (eff.target === "ally" && t.team !== this.team) return;

        if (eff.type === "damage") t.takeDamage(eff.amount / 60); // DPS
        if (eff.type === "heal") t.heal(eff.amount / 60); // HPS
        if (eff.type === "slow") t.applySlow(0.1, eff.amount); // Constant refresh
        if (eff.type === "rage") t.applyRage(eff.amount); // Constant refresh
      });

      // Visual Aura Area
      if (game.frameCount % 30 === 0) {
        const color =
          eff.type === "heal" ? "rgba(0,255,0,0.1)" : "rgba(255,255,255,0.1)";
        game.effects.push(new Effect(this.x, this.y, radius, color));
      }
    });
  }

  processSpawner(game) {
    const sp = this.effects.spawner;
    if (!sp) return;

    if (!this.spawnTimer) this.spawnTimer = 0;
    this.spawnTimer++;

    // Cek interval (detik * 60 fps)
    if (this.spawnTimer >= sp.interval * 60) {
      this.spawnTimer = 0;
      for (let i = 0; i < sp.count; i++) {
        // Spawn sedikit acak di sekitar
        const ox = (Math.random() - 0.5) * 20;
        const oy = (Math.random() - 0.5) * 20;

        // Cek apakah spawn unit atau building (jarang building dispawn tapi support saja)
        const spawnData = CARDS[sp.unit];
        if (spawnData) {
          const u = new Unit(this.x + ox, this.y + oy, this.team, sp.unit);
          u.deployTimer = 20; // Waktu bangun sebentar
          game.units.push(u);
        }
      }
    }
  }

  // Legacy Death Effect (Untuk support data lama)
  doLegacyDeathEffect(game) {
    const de = this.deathEffect;
    if (!de) return;

    const radiusPx = (de.radius || 3) * CONFIG.gridSize;

    if (de.type === "explode" || de.dmg) {
      game.dealAreaDamage(
        this.x,
        this.y,
        radiusPx,
        de.dmg || 0,
        this.team,
        "damage"
      );
      game.effects.push(new Effect(this.x, this.y, radiusPx, "orange"));
    }
    if (de.type === "split") {
      for (let i = 0; i < de.count; i++) {
        const ox = (Math.random() - 0.5) * 20;
        const u = new Unit(this.x + ox, this.y, this.team, de.unit);
        u.deployTimer = 20;
        game.units.push(u);
      }
    }
    if (de.type === "spell" && de.spell) {
      game.executeSpellEffect({
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

    // --- PHYSICAL (DIPINDAHKAN KE ATAS) ---
    this.tags = data.tags || [];
    this.isAir = this.tags.includes("air");
    this.radius = this.tags.includes("heavy") ? 16 : 9;
    this.mass = this.tags.includes("heavy") ? 5.0 : 1.0;

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

    this.targetPreferences = data.stats.targetPreferences || [];

    // --- ATTACK CONFIG ---
    this.hitSpeed = (data.stats.hitSpeed || 1) * 60;

    // [FIX] KAMIKAZE INSTANT ATTACK
    if (this.tags.includes("kamikaze")) {
      this.firstHitDelay = 5; // Hampir instan (5 frame)
    } else {
      this.firstHitDelay = (data.stats.firstHitDelay || 0.5) * 60;
    }

    this.isMelee = this.range <= 20;
    this.projectileData = data.stats.projectile;
    this.splashRadius = (data.stats.splashRadius || 0) * CONFIG.gridSize;
    this.multiTarget = data.stats.multiTarget || 1;

    // --- TIMERS ---
    this.deployTimer = (data.stats.deployTime || 1) * 60;
    this.maxDeployTimer = this.deployTimer;

    // --- INHERITED EFFECTS ---
    this.effects = data.effects || {};
    this.deathEffect = data.deathEffect || null;

    // --- ABILITIES ---
    this.jumpConfig = data.abilities?.jumpAttack || null;
    this.chargeConfig = data.abilities?.charge || null;

    // --- STATES ---
    this.target = null;
    this.attackTimer = 0;
    this.lastX = x;
    this.lastY = y;
    this.stuckTimer = 0;
    this.isMoving = false;
    this.isAttacking = false;
    this.angle = team === 0 ? -Math.PI / 2 : Math.PI / 2;
    this.canJumpRiver =
      data.canJumpRiver || this.tags.includes("river-jumper") || this.isAir;

    this.isJumping = false;
    this.jumpPhase = 0;
    this.jumpTimer = 0;
    this.isCharging = false;
    this.chargeTimer = 0;
    this.hasWeapon = true;

    // [NEW] MELEE TYPE CONFIGURATION
    // 'single'   : Target tunggal (Default jika splashRadius 0)
    // 'circular' : Area 360 sekeliling badan (Valkyrie) - (Default jika splashRadius > 0)
    // 'cleave'   : Area di depan muka unit (Mega Knight, Dark Prince)
    this.meleeType =
      data.stats.meleeType || (this.splashRadius > 0 ? "circular" : "single");
  }

  update(game) {
    if (this.deployTimer > 0) {
      this.deployTimer--;
      if (this.deployTimer <= 0 && !this.spawnEffectTriggered) {
        this.triggerEffectsArea(game, "onSpawn", this.x, this.y);
        this.spawnEffectTriggered = true;
      }
      return;
    }

    // 1. Ability: Jump
    if (this.jumpConfig) this.handleJump(game);
    if (this.isJumping) return;

    // 2. Status & Effects
    this.updateStatus();
    this.processActiveEffects(game);

    if (this.stunned > 0) {
      this.resolveCollision(game);
      return;
    }

    // 3. Speed Calculation
    let speedMult = 1.0;
    let attackSpeedMult = 1.0;
    if (this.rageBoosted > 0) {
      speedMult += this.rageAmount;
      attackSpeedMult += this.rageAmount;
    }
    if (this.slowed > 0) {
      speedMult -= this.slowAmount;
      attackSpeedMult -= this.slowAmount;
    }
    if (speedMult < 0.2) speedMult = 0.2;
    if (attackSpeedMult < 0.2) attackSpeedMult = 0.2; // [FIX] Cegah attack speed negatif/nol

    // 4. Ability: Charge
    if (this.chargeConfig) {
      if (this.isMoving && !this.freezeActive) {
        this.chargeTimer++;
        if (this.chargeTimer > (this.chargeConfig.windup || 90))
          this.isCharging = true;
      } else {
        this.isCharging = false;
        this.chargeTimer = 0;
      }
    }
    if (this.isCharging) speedMult *= this.chargeConfig.speedMult || 2.0;

    // 5. Apply Movement Stats
    this.speed = this.baseSpeed * speedMult * this.pushFactor;

    // 6. AI Logic
    this.findTarget(game);

    if (this.target) {
      this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      const dist = Utils.getDist(this, this.target);
      const reach =
        (this.range > 0 ? this.range : 10) + this.target.radius + this.radius;

      if (dist <= reach) {
        // --- KONDISI: DALAM JARAK SERANG ---
        this.isMoving = false;
        this.isAttacking = true; // [FIX] Tetap true selama engaging agar animasi jalan

        if (this.isCharging) this.attackTimer = 0;

        if (this.attackTimer > 0) {
          // Sedang Cooldown / Reload
          this.attackTimer -= attackSpeedMult;
        } else {
          // Siap Tembak
          this.executeAttack(game);
          this.attackTimer = this.hitSpeed;
        }
      } else {
        // --- KONDISI: MENGEJAR TARGET ---
        this.isAttacking = false;
        this.isMoving = true;

        // [FIX] BUG ATTACK SPEED: Jangan reset timer jika cooldown masih panjang
        // Jika timer > firstHitDelay, biarkan turun alami (cooldown sambil jalan)
        // Jika timer sudah habis, set ke firstHitDelay (setup time)
        if (this.attackTimer > this.firstHitDelay) {
          this.attackTimer -= attackSpeedMult;
        } else {
          this.attackTimer = this.firstHitDelay;
        }

        this.moveTowards(this.target.x, this.target.y, game);
      }
    } else {
      // --- KONDISI: TIDAK ADA TARGET ---
      this.isAttacking = false;
      this.isMoving = true;
      this.attackTimer = this.firstHitDelay;

      // Logika unit support jalan pelan jika tidak ada teman (biar ga mati konyol)
      if (this.targetType === "allies-only") this.speed *= 0.5;

      this.laneMovement(game);
    }

    this.resolveCollision(game);
  }

  findTarget(game) {
    // 1. Stick to Target Logic
    if (this.target) {
      const dist = Utils.getDist(this, this.target);
      const reach =
        (this.range > 0 ? this.range : 10) + this.target.radius + this.radius;
      let stillValid =
        !this.target.dead &&
        !this.target.isHidden && // Cek Hidden saat tracking
        dist <= reach + 50 &&
        this.isValidTarget(this.target);

      if (
        this.targetType === "allies-only" &&
        this.target.hp >= this.target.maxHp
      )
        stillValid = false;

      if (stillValid) return;

      this.rampStage = 0;
      this.target = null;
      this.isAttacking = false;
    }

    let candidates = [];
    const isSupport = this.targetType === "allies-only";
    const searchRange = isSupport ? this.sightRange * 2.5 : this.sightRange;

    if (isSupport) {
      candidates = game.units.filter(
        (u) => u.team === this.team && u !== this && u.hp < u.maxHp
      );
    } else {
      candidates = [...game.units, ...game.buildings, ...game.towers].filter(
        (e) => e.team !== this.team && !e.dead && !e.isHidden
      );
    }

    let bestTarget = null;
    let highestScore = -Infinity;

    for (let c of candidates) {
      if (
        this.buildingHunter &&
        !(c instanceof Building) &&
        !(c instanceof Tower)
      )
        continue;
      if (!this.isValidTarget(c)) continue;

      const dist = Utils.getDist(this, c);

      if (dist <= searchRange) {
        let score = -dist;
        if (isSupport) {
          if (this.targetPreferences.length > 0 && c.tags) {
            const isPriority = this.targetPreferences.some((prefTag) =>
              c.tags.includes(prefTag)
            );
            if (isPriority) score += 2000;
          }
          score += c.maxHp;
        }
        if (score > highestScore) {
          highestScore = score;
          bestTarget = c;
        }
      }
    }

    // [FIX BUG 2 - PART B] GLOBAL AGGRO CHECK
    // Saat mencari target jauh (Tower/Building), pastikan tidak menarget Hidden Unit
    if (!bestTarget && !isSupport) {
      const globalTargets = [...game.towers, ...game.buildings].filter(
        (t) => t.team !== this.team && !t.dead && !t.isHidden // <--- TAMBAHKAN INI (PENTING)
      );

      let globalMin = 9999;
      for (let t of globalTargets) {
        // Jika building hunter, abaikan unit (walaupun globalTargets isinya towers/buildings, aman)
        const d = Utils.getDist(this, t);
        if (d < globalMin) {
          globalMin = d;
          bestTarget = t;
        }
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
    if (this.isCharging && this.chargeConfig) {
      dmg = this.chargeConfig.dmg || this.dmg * 2;
      this.isCharging = false;
      this.chargeTimer = 0;
      game.effects.push(new Effect(this.x, this.y, this.radius + 15, "#fff"));
    }

    const pData = this.projectileData || {};

    // Helper Multi-Target
    const getMultiTargets = (primaryTarget) => {
      let targets = [primaryTarget];
      if (this.multiTarget && this.multiTarget > 1) {
        const pool =
          this.targetType === "allies-only"
            ? game.units
            : [...game.units, ...game.buildings];
        const extras = pool
          .filter(
            (e) =>
              e.team ===
                (this.targetType === "allies-only"
                  ? this.team
                  : this.team === 0
                  ? 1
                  : 0) &&
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

    // 1. RAMP DAMAGE (Inferno)
    if (this.tags.includes("ramp-damage")) {
      this.rampStage = (this.rampStage || 0) + 1;
      let rampMult = 1.0;
      if (this.rampStage > 15) rampMult = 3.0;
      if (this.rampStage > 30) rampMult = 8.0;
      dmg *= rampMult;

      const targets = getMultiTargets(this.target);
      this.currentTargets = targets;
      targets.forEach((t) => {
        if (t) {
          t.takeDamage(dmg);
          this.triggerEffects(game, "onHit", t);
        }
      });
      return;
    }

    // 2. BEAM (Flat / Heal)
    if (pData.type === "instant" && pData.visual === "beam") {
      const targets = getMultiTargets(this.target);
      this.currentTargets = targets;
      targets.forEach((t) => {
        if (!t) return;
        if (this.targetType === "allies-only") {
          t.heal(dmg);
          this.triggerEffects(game, "onHit", t);
        } else {
          t.takeDamage(dmg);
          this.triggerEffects(game, "onHit", t);
        }
      });
      return;
    }

    // 3. INSTANT (Zap)
    if (pData.type === "instant") {
      const targets = getMultiTargets(this.target);
      targets.forEach((t) => {
        if (!t) return;
        t.takeDamage(dmg);
        this.triggerEffects(game, "onHit", t);
        if (pData.visual === "lightning")
          game.effects.push(new LightningEffect(this.x, this.y - 20, t.x, t.y));
      });
    }
    // 4. MELEE
    // 4. MELEE ATTACK (REMASTERED)
    else if (this.isMelee && !pData.type) {
      // A. TYPE: SINGLE TARGET
      if (this.meleeType === "single") {
        if (this.target) {
          this.target.takeDamage(dmg);
          this.triggerEffects(game, "onHit", this.target);
        }
      }

      // B. TYPE: AREA (CIRCULAR & CLEAVE)
      else {
        let hitX = this.x;
        let hitY = this.y;

        // [NEW] TYPE: CLEAVE (Area Depan)
        // Pusat ledakan digeser ke depan unit sesuai arah hadap (this.angle)
        // Offset dihitung agar area damage dimulai tepat dari depan badan unit
        if (this.meleeType === "cleave") {
          const offset = this.radius + this.splashRadius * 0.5;
          hitX = this.x + Math.cos(this.angle) * offset;
          hitY = this.y + Math.sin(this.angle) * offset;
        }

        // [OLD] TYPE: CIRCULAR (Valkyrie)
        // Pusat ledakan tetap di tengah unit (this.x, this.y)
        // Tidak perlu kode tambahan karena default hitX/hitY sudah diset this.x/this.y

        // Lakukan Damage Area di titik yang sudah ditentukan
        game.dealAreaDamage(
          hitX,
          hitY,
          this.splashRadius,
          dmg,
          this.team,
          "damage",
          this.targetType !== "ground-only"
        );

        // Visual Effect di lokasi pukulan
        game.effects.push(new Effect(hitX, hitY, this.splashRadius, "orange"));
        this.triggerEffectsArea(game, "onHit", hitX, hitY, this.splashRadius);
      }

      // Kamikaze Logic
      if (this.tags.includes("kamikaze")) this.takeDamage(9999);
    }
    // 5. PROJECTILE
    else {
      if (this.key === "executioner") this.hasWeapon = false;
      const targets = getMultiTargets(this.target);
      const pType = pData.type || "normal";
      const pSpeed = pData.speed || 7;
      const pMaxRange = pData.maxRange
        ? pData.maxRange * CONFIG.gridSize
        : this.range;
      const onHitEffects = this.effects.onHit || [];
      const pCount = pData.count || 1;
      const pSpread = pData.spread || 0;

      targets.forEach((t) => {
        if (!t) return;
        for (let i = 0; i < pCount; i++) {
          let spreadOffset = 0;
          if (pCount > 1)
            spreadOffset = (i - (pCount - 1) / 2) * (pSpread * 10);
          const perpAngle = this.angle + Math.PI / 2;
          const spawnX = this.x + Math.cos(perpAngle) * spreadOffset;
          const spawnY = this.y + Math.sin(perpAngle) * spreadOffset;

          const p = new Projectile(
            spawnX,
            spawnY,
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
        }
      });
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

  laneMovement(game) {
    // === LOGIKA BARU: SMART SUPPORT AI ===
    if (this.targetType === "allies-only") {
      // 1. Cari teman terdekat (apapun kondisinya) untuk diikuti/di-escort
      let closestAlly = null;
      let minAllyDist = 9999;

      // Cari unit teman yang TIDAK bertipe 'allies-only' (jangan saling follow sesama healer, nanti muter2)
      // Dan pastikan unit itu ada di DEPAN kita (y lebih kecil jika team 0, y lebih besar jika team 1)
      const forwardDir = this.team === 0 ? -1 : 1;

      for (let u of game.units) {
        if (
          u !== this &&
          u.team === this.team &&
          !u.dead &&
          u.targetType !== "allies-only"
        ) {
          const d = Utils.getDist(this, u);
          // Prioritaskan unit yang jaraknya dekat
          if (d < minAllyDist) {
            minAllyDist = d;
            closestAlly = u;
          }
        }
      }

      // KONDISI A: Ada teman untuk diikuti (Follow Leader)
      if (closestAlly) {
        // Bergerak menuju teman, tapi jaga jarak sedikit (jangan nempel banget)
        const safeDistance = closestAlly.radius + this.radius + 30;
        if (minAllyDist > safeDistance) {
          this.moveTowards(closestAlly.x, closestAlly.y, game);
        } else {
          // Jika sudah dekat teman, diam atau gerak pelan mengikuti arusnya
          this.isMoving = false;
        }
        return;
      }

      // KONDISI B: Sendirian -> Mundur ke Tower Terdekat (Safety)
      let closestTower = null;
      let minTowerDist = 9999;
      const myTowers = game.towers.filter(
        (t) => t.team === this.team && !t.dead
      );

      for (let t of myTowers) {
        const d = Utils.getDist(this, t);
        if (d < minTowerDist) {
          minTowerDist = d;
          closestTower = t;
        }
      }

      if (closestTower) {
        // Jika jauh dari tower, jalan pulang
        if (minTowerDist > 60) {
          this.moveTowards(closestTower.x, closestTower.y, game);
        } else {
          // Sudah aman di dekat tower, diam.
          this.isMoving = false;
        }
        return;
      }
    }

    // === LOGIKA LAMA (NORMAL UNIT) ===
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

  // DALAM FILE ENTITY.JS - CLASS UNIT

  moveTowards(tx, ty, game) {
    // 1. DETEKSI STUCK YANG LEBIH PINTAR (Accumulative)
    const moveDist = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    
    // Jika gerak lambat sekali (kurang dari 20% speed asli), anggap stuck
    if (moveDist < (this.speed * 0.2)) {
        this.stuckTimer += 2; // Naik cepat
    } else {
        if (this.stuckTimer > 0) this.stuckTimer--; // Turun perlahan (Hysteresis)
    }
    
    this.lastX = this.x; 
    this.lastY = this.y;

    // =========================================================
    // VEKTOR BASE NAVIGATION (Target + Avoidance + Bridge)
    // =========================================================

    // A. Vektor Menuju Target (Normalisasi)
    let dirX = tx - this.x;
    let dirY = ty - this.y;
    const distToTarget = Math.hypot(dirX, dirY);
    if (distToTarget > 0) {
        dirX /= distToTarget;
        dirY /= distToTarget;
    }

    // B. Vektor Penghindaran (Avoidance Force)
    let pushX = 0;
    let pushY = 0;

    if (game && !this.isAir) {
      const obstacles = [...game.buildings, ...game.towers].filter((b) => !b.dead && !b.isHidden);
      
      for (let b of obstacles) {
        const dist = Utils.getDist(this, b);
        // Radius deteksi agak besar agar kurvanya mulus (smooth turn)
        const avoidanceRadius = b.radius + this.radius + 15; 

        if (dist < avoidanceRadius) {
           // Vektor tolak dari pusat gedung ke unit
           let awayX = this.x - b.x;
           let awayY = this.y - b.y;
           
           // Normalisasi
           const distAway = Math.hypot(awayX, awayY);
           if (distAway > 0) {
               awayX /= distAway;
               awayY /= distAway;
           }

           // Kekuatan tolak: Semakin dekat, semakin kuat (Exponential)
           // Ini mencegah "masuk" ke dalam gedung
           const force = Math.pow((avoidanceRadius - dist) / avoidanceRadius, 2) * 5.0; 
           
           pushX += awayX * force;
           pushY += awayY * force;
        }
      }
    }

    // C. Gabungkan Vektor (Target + Avoidance)
    let finalDirX = dirX + pushX;
    let finalDirY = dirY + pushY;

    // D. Logika Anti-Stuck Sempurna (Random Noise)
    // Jika stuck timer tinggi, tambahkan "noise" tegak lurus untuk memecah kebuntuan
    if (this.stuckTimer > 30) {
        const noiseAngle = (Math.random() - 0.5) * Math.PI; // Random 90 derajat
        finalDirX += Math.cos(noiseAngle) * 3.0; // Dorongan kuat acak
        finalDirY += Math.sin(noiseAngle) * 3.0;
    }

    // E. Logika Jembatan (Bridge Funneling)
    // Hanya override jika TIDAK sedang menghindari gedung (pushX/Y kecil) 
    // dan BUKAN unit pelompat sungai/udara
    const isAvoidanceActive = (Math.abs(pushX) > 0.1 || Math.abs(pushY) > 0.1);
    
    if (!this.isAir) {
      const riverY = 350;
      
      // Cek apakah unit tipe pejalan kaki biasa (bukan jumper/flyer)
      if (!this.tags.includes("river-jumper")) {
          const isCrossing = (this.y < riverY && ty > riverY) || (this.y > riverY && ty < riverY);
          
          if (isCrossing && !this.canJumpRiver) {
            const bX = Math.abs(this.x - 100) < Math.abs(this.x - 340) ? 100 : 340; // Pilih jembatan terdekat
            const distToBridgeX = Math.abs(this.x - bX);
            
            if (distToBridgeX > 10) { // Toleransi diperkecil biar lebih akurat
              // OVERWRITE vektor gerak sepenuhnya ke mulut jembatan
              // Jangan pedulikan avoidance gedung lain jika mau nyebrang
              const bridgeEntryY = riverY + (this.y < riverY ? -20 : 20); // Titik masuk
              
              let bridgeDirX = bX - this.x;
              let bridgeDirY = bridgeEntryY - this.y;
              const bDist = Math.hypot(bridgeDirX, bridgeDirY);
              
              if (bDist > 0) {
                  finalDirX = bridgeDirX / bDist;
                  finalDirY = bridgeDirY / bDist;
              }
            } else {
              // Sudah di area X jembatan: Luruskan Y
              // Bias kecil ke tengah jembatan (bX) agar tidak jatuh
              finalDirX = (bX - this.x) * 0.5; 
              finalDirY = (ty - this.y) > 0 ? 1 : -1; 
            }
          }
      }
    }

    // =========================================================
    // EKSEKUSI GERAKAN (SMOOTHING)
    // =========================================================

    const targetAngle = Math.atan2(finalDirY, finalDirX);

    // [FIX JITTER] SMOOTH ROTATION
    // Jangan snap sudut langsung. Gunakan lerp untuk memutar badan perlahan.
    // 0.2 = Responsive tapi tidak kejang. 
    // Jika stuck, putar lebih cepat (0.5) agar bisa lepas.
    const turnSpeed = this.stuckTimer > 10 ? 0.5 : 0.2;
    this.angle = Utils.lerpAngle(this.angle, targetAngle, turnSpeed);

    // Gerak maju sesuai sudut hadap (seperti mobil/tank)
    // Ini menjamin unit tidak "sliding" ke samping, tapi benar-benar berjalan ke depan
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
  }

  resolveCollision(game) {
    const others = [...game.units, ...game.buildings]; // Tower biasanya statis jadi jarang perlu resolve fisik unit vs tower disini (towers dihandle terpisah atau di moveTowards)

    for (let u of others) {
      if (u === this || u.dead) continue;

      // [FIX BUG 2 - PART A] Jangan tabrak bangunan yang sedang sembunyi
      if (u.isHidden) continue;

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

        let uMass = u instanceof Unit ? u.mass : 9999; // Building mass infinity
        const myMass = this.mass;
        const totalMass = myMass + uMass;
        const myPushRatio = uMass / totalMass;

        this.x += Math.cos(angle) * overlap * myPushRatio;
        this.y += Math.sin(angle) * overlap * myPushRatio;

        if (u instanceof Unit) this.pushFactor = myMass > uMass ? 0.9 : 0.5;
      }
    }

    // Collision vs Towers (Static)
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

    if (!this.isAir && !this.tags.includes("river-jumper") && !this.canJumpRiver) {
        const riverTop = 335;
        const riverBottom = 365;
        
        // Cek apakah unit ada di dalam zona Y sungai
        if (this.y > riverTop && this.y < riverBottom) {
            // Cek apakah unit ada di X Jembatan (Kiri: 70-130, Kanan: 310-370)
            const onLeftBridge = this.x > 70 && this.x < 130;
            const onRightBridge = this.x > 310 && this.x < 370;

            if (!onLeftBridge && !onRightBridge) {
                // UNIT TENGGELAM! DORONG KELUAR!
                // Dorong ke sisi sungai terdekat
                const distToTop = Math.abs(this.y - riverTop);
                const distToBottom = Math.abs(this.y - riverBottom);

                if (distToTop < distToBottom) {
                    this.y = riverTop - 1; // Dorong ke atas
                } else {
                    this.y = riverBottom + 1; // Dorong ke bawah
                }
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
    this.isRampUp = this.tags.includes("ramp-damage");
    this.isHideIdle = this.tags.includes("hide-when-idle");

    this.projData = data.stats.projectile || { type: "normal", speed: 7 };
    this.stunDuration = data.stats.stunDuration || 0;
    this.rampStage = 0;
    this.angle = -Math.PI / 2;

    // --- INHERITED EFFECTS ---
    this.effects = data.effects || {};
  }

  update(game) {
    if (this.deployTimer > 0) {
      this.deployTimer--;
      return;
    }

    this.updateStatus();
    this.processActiveEffects(game); // Process Spawner / Aura for Building

    if (this.stunned > 0) return;

    this.lifetime--;
    this.hp -= this.maxHp / this.maxLifetime;

    if (this.lifetime <= 0 || this.hp <= 0) {
      this.dead = true;
      this.hp = 0;
      this.handleDeathEffect();
      return;
    }

    let speedMult = 1.0;
    if (this.slowed > 0) speedMult -= this.slowAmount;
    if (speedMult < 0.2) speedMult = 0.2;

    if (this.attackTimer > 0) this.attackTimer -= speedMult;

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
      const enemies = [...game.units, ...game.towers, ...game.buildings].filter(
        (e) => e.team !== this.team && !e.dead && !e.isHidden
      );
      let closest = null;
      let minD = this.range;
      for (let e of enemies) {
        if (!e.tags) e.tags = [];
        if (!this.tags.includes("air-target") && e.isAir) continue;
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
    if (!this.target) return;
    const spawnX = this.x + Math.cos(this.angle) * 20;
    const spawnY = this.y + Math.sin(this.angle) * 20;

    // RAMP
    if (this.isRampUp) {
      this.rampStage += 1;
      let rampMult = 1.0;
      if (this.rampStage > 30) rampMult = 3.0;
      if (this.rampStage > 90) rampMult = 8.0;
      const currentDmg = this.dmg * rampMult;
      this.target.takeDamage(currentDmg);
      return;
    }

    // INSTANT
    else if (this.projData.type === "instant") {
      this.target.takeDamage(this.dmg);
      if (this.tags.includes("stun-effect")) {
        this.target.applyStun(this.stunDuration || 0.5, "zap");
      }
      if (this.projData.visual === "lightning") {
        game.effects.push(
          new LightningEffect(this.x, this.y - 30, this.target.x, this.target.y)
        );
      }
    }
    // PROJECTILE
    else {
      game.projectiles.push(
        new Projectile(
          spawnX,
          spawnY,
          this.target,
          this.dmg,
          this.team,
          false,
          false,
          false,
          0,
          2,
          false,
          0,
          0,
          this.projData.type || "normal",
          this.projData.speed || 7
        )
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

    this.projData = stats.projectile || { type: "normal", speed: 7 };
    this.targetType = stats.targetType || "ground-air";

    // Tower juga bisa punya efek jika dikonfigurasi
    this.effects = {};
  }

  update(game) {
    this.updateStatus();
    this.processActiveEffects(game);

    if (this.stunned > 0) return;

    if (this.type === "king" && !this.active) {
      const princessAlive = game.towers.filter(
        (t) => t.team === this.team && t.type === "princess" && !t.dead
      ).length;
      if (this.hp < this.maxHp || princessAlive < 2) {
        this.active = true;
        this.activationTimer = 120;
      }
    }
    if (this.activationTimer > 0) this.activationTimer--;

    this.target = null;
    if (this.active) {
      const enemies = [...game.units, ...game.buildings].filter(
        (u) => u.team !== this.team && !u.dead && !u.isHidden
      );
      let closest = null;
      let minD = this.range;
      for (let e of enemies) {
        if (this.targetType === "ground-only" && e.isAir) continue;
        const d = Utils.getDist(this, e) - e.radius;
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
          this.doAttack(game);
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

  doAttack(game) {
    if (!this.target) return;
    const spawnX = this.x + Math.cos(this.angle) * 20;
    const spawnY = this.y + Math.sin(this.angle) * 20;

    if (this.projData.type === "instant") {
      this.target.takeDamage(this.dmg);
      if (this.projData.visual === "lightning") {
        game.effects.push(
          new LightningEffect(this.x, this.y - 20, this.target.x, this.target.y)
        );
      }
    } else {
      game.projectiles.push(
        new Projectile(
          spawnX,
          spawnY,
          this.target,
          this.dmg,
          this.team,
          true,
          false,
          false,
          0,
          2,
          false,
          0,
          0,
          this.projData.type || "normal",
          this.projData.speed || 7
        )
      );
    }
  }
}
