class Projectile {
  constructor(
    x, y, target, dmg, team,
    isTower = false, isSplash = false, isBeam = false, splashRadius = 80, beamWidth = 2,
    isSlow = false, slowDuration = 0, slowAmount = 0, 
    projType = "normal", projSpeed = 7, maxRange = 0, owner = null,
    onHitEffects = [] // Menerima efek modular
  ) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.dmg = dmg;
    this.team = team;
    this.isSplash = isSplash;
    this.splashRadius = splashRadius;
    this.projType = projType;
    this.speed = (projType === "rolling" || projType === "rolling_log") ? 4 : (projType === "boomerang" ? 6 : projSpeed);
    this.maxRange = maxRange;
    this.owner = owner;
    
    // Simpan efek modular agar bisa dipakai saat kena hit
    this.onHitEffects = onHitEffects; 

    // Legacy (tetap disimpan biar aman)
    this.isSlow = isSlow;
    this.slowDuration = slowDuration;
    this.slowAmount = slowAmount;

    this.startX = x;
    this.startY = y;
    this.dead = false;
    this.bState = 0; 
    this.bTimer = 0;
    this.hitList = [];
    this.hitAir = true;

    if (target) this.angle = Math.atan2(target.y - y, target.x - x);
    if ((projType === "rolling" || projType === "rolling_log") && target) {
      this.dx = Math.cos(this.angle);
      this.dy = Math.sin(this.angle);
    }
  }

  update(game) {
    if (this.dead) return;

    if (this.projType === "boomerang") { this.updateBoomerang(game); return; }
    if (this.projType === "rolling" || this.projType === "rolling_log") { this.updateRolling(game); return; }

    if (this.target && !this.target.dead) {
      const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
      
      if (Utils.getDist(this, this.target) < 10) {
        this.dead = true;
        if (this.isSplash) {
          this.applySplashDamage(this.x, this.y, game);
        } else {
          this.applyHitEffect(this.target, game);
        }
      }
    } else {
      this.dead = true;
    }
  }

  applyHitEffect(target, game) {
    target.takeDamage(this.dmg);
    
    // Legacy Slow
    if (this.isSlow) {
      target.applySlow(this.slowDuration, this.slowAmount);
    }

    // Modular Effects Processing
    if (this.onHitEffects && this.onHitEffects.length > 0) {
        this.onHitEffects.forEach(eff => {
            if (eff.type === 'stun') target.applyStun(eff.duration, eff.visual || 'zap');
            if (eff.type === 'slow') target.applySlow(eff.duration, eff.amount);
            if (eff.type === 'heal') target.heal(eff.amount);
            
            // NEW: Damage Over Time support
            if (eff.type === 'damage') {
                if (eff.duration > 0) target.applyPoison(eff.duration, eff.amount);
                else target.takeDamage(eff.amount);
            }
        });
    }
  }

  applySplashDamage(x, y, game) {
    game.effects.push(new Effect(x, y, this.splashRadius, "orange"));
    const targets = [...game.units, ...game.buildings, ...game.towers];
    for (let t of targets) {
      if (t.team !== this.team && !t.dead && !t.isHidden) {
        if (this.hitAir === false && t.tags && t.tags.includes("air")) continue;
        if (Utils.getDist({ x, y }, t) < this.splashRadius + t.radius) {
          this.applyHitEffect(t, game);
        }
      }
    }
  }

  // ... (Sisa fungsi updateBoomerang, updateRolling, checkPiercingHit biarkan saja seperti sebelumnya)
  updateBoomerang(game) {
    this.rotation = (this.rotation || 0) + 0.5;
    if (this.bState === 0) {
      const dist = Math.hypot(this.x - this.startX, this.y - this.startY);
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      this.checkPiercingHit(game);
      if (dist >= this.maxRange) { this.bState = 1; this.bTimer = 20; }
    } else if (this.bState === 1) {
      this.bTimer--;
      if (this.bTimer <= 0) { this.bState = 2; this.hitList = []; }
    } else if (this.bState === 2) {
      if (!this.owner || this.owner.dead) { this.dead = true; return; }
      const ang = Math.atan2(this.owner.y - this.y, this.owner.x - this.x);
      this.x += Math.cos(ang) * this.speed;
      this.y += Math.sin(ang) * this.speed;
      this.checkPiercingHit(game);
      if (Utils.getDist(this, this.owner) < 15) {
        this.dead = true;
        this.owner.hasWeapon = true;
        this.owner.attackTimer = 30;
      }
    }
  }

  updateRolling(game) {
    this.rotation = (this.rotation || 0) + (this.team === 0 ? -0.2 : 0.2);
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
    this.checkPiercingHit(game);
    const dist = Math.hypot(this.x - this.startX, this.y - this.startY);
    if (dist >= this.maxRange) this.dead = true;
  }

  checkPiercingHit(game) {
    const targets = [...game.units, ...game.buildings, ...game.towers];
    for (let t of targets) {
      if (t.team !== this.team && !t.dead && !t.isHidden) {
        if (this.hitAir === false && t.tags && t.tags.includes("air")) continue;
        if (!this.hitList.includes(t) && Utils.getDist(this, t) < (this.splashRadius || 20) + t.radius) {
          this.applyHitEffect(t, game);
          this.hitList.push(t);
          game.effects.push(new Effect(t.x, t.y, 20, "#fff"));
        }
      }
    }
  }
}

class LightningEffect {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.life = 1.0;
    this.points = [];
    const dist = Math.hypot(x2 - x1, y2 - y1),
      steps = dist / 15;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.points.push({
        x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20,
        y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20,
      });
    }
  }
  update() {
    this.life -= 0.15;
  }
}

class SpellArea {
  constructor(x, y, radius, type, duration, team, amount = 0) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.type = type;
    this.duration = duration * 60;
    this.maxDuration = this.duration;
    this.team = team;
    this.amount = amount;
    this.dead = false;
    this.tickTimer = 0;
  }
  update(game) {
    this.duration--;
    if (this.duration <= 0) {
      this.dead = true;
      return;
    }

    if (this.type === "rage") {
      [...game.units, ...game.buildings, ...game.towers].forEach((e) => {
        if (
          e.team === this.team &&
          !e.dead &&
          Utils.getDist(this, e) < this.radius
        )
          e.applyRage(this.amount);
      });
    } else if (this.type === "earthquake") {
      [...game.units].forEach((e) => {
        if (
          e.team !== this.team &&
          !e.dead &&
          !e.isAir &&
          Utils.getDist(this, e) < this.radius
        )
          e.applySlow(0.1, 0.5);
      });
      this.tickTimer++;
      if (this.tickTimer % 30 === 0) {
        const dmg = this.amount / (this.maxDuration / 60);
        [...game.buildings, ...game.towers].forEach((b) => {
          if (
            b.team !== this.team &&
            !b.dead &&
            Utils.getDist(this, b) < this.radius
          )
            b.takeDamage(dmg * 3);
        });
        [...game.units].forEach((u) => {
          if (
            u.team !== this.team &&
            !u.dead &&
            !u.isAir &&
            Utils.getDist(this, u) < this.radius
          )
            u.takeDamage(dmg);
        });
      }
    } else if (this.type === "void") {
      this.tickTimer++;
      if (this.tickTimer % 30 === 0) {
        const targets = [
          ...game.units,
          ...game.buildings,
          ...game.towers,
        ].filter(
          (t) =>
            t.team !== this.team &&
            !t.dead &&
            Utils.getDist(this, t) < this.radius
        );
        if (targets.length > 0) {
          const share = this.amount / targets.length;
          targets.forEach((t) => {
            t.takeDamage(share);
            game.effects.push(new Effect(t.x, t.y, 20, "#6a1b9a"));
          });
        }
      }
    }
  }
}

class Effect {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.life = 1.0;
  }
  update() {
    this.life -= 0.08;
  }
}
