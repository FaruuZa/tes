class Projectile {
  constructor(
    x,
    y,
    target,
    dmg,
    team,
    isTower = false,
    isSplash = false,
    isBeam = false,
    splashRadius = 80,
    beamWidth = 2,
    isSlow = false,
    slowDuration = 0,
    slowAmount = 0,
    projType = "normal",
    projSpeed = 7,
    maxRange = 0,
    owner = null
  ) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.dmg = dmg;
    this.team = team;
    this.isSplash = isSplash;
    this.splashRadius = splashRadius;
    this.projType = projType;
    this.speed =
      projType === "rolling" ? 4 : projType === "boomerang" ? 6 : projSpeed;
    this.maxRange = maxRange;
    this.owner = owner;
    this.startX = x;
    this.startY = y;
    this.dead = false;

    // Boomerang State: 0=Out, 1=Pause, 2=Return
    this.bState = 0;
    this.bTimer = 0;
    this.hitList = []; // For piercing (units hit per cycle)
    if (target) this.angle = Math.atan2(target.y - y, target.x - x);
    if (projType === "rolling" && target) {
      this.dx = Math.cos(this.angle);
      this.dy = Math.sin(this.angle);
    }
  }

  update(game) {
    if (this.dead) return;

    // --- BOOMERANG LOGIC (Executioner) ---
    if (this.projType === "boomerang") {
      this.rotation = (this.rotation || 0) + 0.5;
      if (this.bState === 0) {
        // OUT
        const distTraveled = Math.hypot(
          this.x - this.startX,
          this.y - this.startY
        );
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.checkPiercingHit(game);
        if (distTraveled >= this.maxRange) {
          this.bState = 1;
          this.bTimer = 20;
        }
      } else if (this.bState === 1) {
        // PAUSE
        this.bTimer--;
        if (this.bTimer <= 0) {
          this.bState = 2;
          this.hitList = [];
        } // Reset hitlist for return
      } else if (this.bState === 2) {
        // RETURN
        if (!this.owner || this.owner.dead) {
          this.dead = true;
          return;
        }
        const angleToOwner = Math.atan2(
          this.owner.y - this.y,
          this.owner.x - this.x
        );
        this.x += Math.cos(angleToOwner) * this.speed;
        this.y += Math.sin(angleToOwner) * this.speed;
        this.checkPiercingHit(game);
        // ... di dalam method update class Projectile
        if (Utils.getDist(this, this.target) < 10) {
          this.dead = true;

          // --- LOGIKA HEAL SPIRIT ---
          // Jika projectile ini milik Heal Spirit (kita bisa cek owner key atau custom logic)
          // Cara simpel: Cek jika dmg negatif? Atau cek owner type.
          // Disini kita pakai cek nama unit ownernya jika ada, atau cek properti khusus.
          // Untuk sekarang kita implementasi generik "IsSplash" logic.

          if (this.isSplash) {
            game.effects.push(
              new Effect(this.x, this.y, this.splashRadius, "orange")
            );

            if (this.owner && this.owner.key === "healer_spirit") {
              // Heal teman
              const allies = [...game.units, ...game.buildings]; // Heal unit & building
              allies.forEach((a) => {
                if (
                  a.team === this.team &&
                  !a.dead &&
                  Utils.getDist(this, a) < this.splashRadius
                ) {
                  a.heal(300); // Heal amount fix
                  game.effects.push(new Effect(a.x, a.y, 20, "#00e676"));
                }
              });
            }

            // Deal Damage ke Musuh
            game.dealAreaDamage(
              this.x,
              this.y,
              this.splashRadius,
              this.dmg,
              this.team
            );
          } else {
            this.target.takeDamage(this.dmg);
          }
        }
      }
      return;
    }

    // --- ROLLING LOGIC (Bowler/Log) ---
    if (this.projType === "rolling" || this.projType === "rolling_log") {
      // Rotasi Visual (Gelinding)
      this.rotation = (this.rotation || 0) + (this.team === 0 ? -0.2 : 0.2);

      // Gerak Lurus berdasarkan dx/dy yang diset di game.js
      this.x += this.dx * this.speed;
      this.y += this.dy * this.speed;

      // Cek Tabrakan (Piercing)
      this.checkPiercingHit(game);

      // Cek Jarak Tempuh Maksimal
      const dist = Math.hypot(this.x - this.startX, this.y - this.startY);
      if (dist >= this.maxRange) {
        this.dead = true; // Hilang setelah mencapai range
      }
      return;
    }

    // --- NORMAL PROJECTILE ---
    if (this.target && !this.target.dead) {
      const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
      if (Utils.getDist(this, this.target) < 10) {
        this.dead = true;
        if (this.isSplash) {
          game.effects.push(
            new Effect(this.x, this.y, this.splashRadius, "orange")
          );
          game.dealAreaDamage(
            this.x,
            this.y,
            this.splashRadius,
            this.dmg,
            this.team
          );
        } else {
          this.target.takeDamage(this.dmg);
        }
      }
    } else {
      this.dead = true;
    }
  }

  // Ganti checkPiercingHit(game) dengan ini:
  checkPiercingHit(game) {
    const targets = [...game.units, ...game.buildings, ...game.towers];

    for (let t of targets) {
      if (t.team !== this.team && !t.dead && !t.isHidden) {
        // --- FIX PROJECTILE: Cek Hit Air ---
        // Jika projectile ini (Log/Boulder) tidak bisa kena udara, skip target udara
        if (this.hitAir === false && t.tags && t.tags.includes("air")) continue;

        if (
          !this.hitList.includes(t) &&
          Utils.getDist(this, t) < (this.splashRadius || 20) + t.radius
        ) {
          t.takeDamage(this.dmg);
          this.hitList.push(t);
          game.effects.push(new Effect(t.x, t.y, 20, "#fff"));
        }
      }
    }
  }

  draw(ctx) {
    if (this.isBeam) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.projType === "rolling_log") {
      ctx.rotate(this.angle + Math.PI / 2); // Log berguling vertikal relatif terhadap arah gerak
      // Gambar Batang Kayu
      ctx.fillStyle = "#5d4037"; // Coklat Kayu
      ctx.fillRect(-15, -30, 30, 60);
      // Duri
      ctx.fillStyle = "#bdbdbd"; // Metal
      ctx.beginPath();
      ctx.moveTo(-15, -20);
      ctx.lineTo(-20, -25);
      ctx.lineTo(-15, -10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(15, 10);
      ctx.lineTo(20, 5);
      ctx.lineTo(15, 20);
      ctx.fill();

      // Efek menggelinding sederhana (garis kayu)
      const roll = (Date.now() / 50) % 20;
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(-15, -30 + roll * 3, 30, 2);
    } else if (this.projType === "boomerang") {
      // ... (visual executioner sama) ...
      ctx.rotate(this.rotation || 0);
      ctx.fillStyle = "#b0bec5";
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#333";
      ctx.fillRect(-2, -10, 4, 20);
      ctx.fillStyle = "#e91e63";
      ctx.beginPath();
      ctx.arc(0, -10, 6, 0, Math.PI, true);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 10, 6, 0, Math.PI, false);
      ctx.fill();
    } else if (this.projType === "rolling") {
      // VISUAL BATU BOWLER
      ctx.rotate(this.rotation || 0);
      ctx.fillStyle = "#3949ab"; // Ungu Bowler
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.arc(5, 5, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal projectile
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 5;
      ctx.shadowColor = "#fff";
    }
    ctx.restore();
  }
}

// ... (Class LightningEffect, SpellArea, Effect SAMA SEPERTI SEBELUMNYA)
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
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00e5ff";
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    this.points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
    ctx.restore();
  }
}
class SpellArea {
  constructor(x, y, radius, type, duration, team, amount = 0) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.type = type;
    this.duration = duration * 60; // Convert detik ke frame
    this.maxDuration = this.duration;
    this.team = team;
    this.amount = amount;
    this.dead = false;
    this.tickTimer = 0; // Untuk DoT (Damage over Time)
  }

  update(game) {
    this.duration--;
    if (this.duration <= 0) {
      this.dead = true;
      return;
    }

    // RAGE
    if (this.type === "rage") {
      [...game.units, ...game.buildings, ...game.towers].forEach((e) => {
        if (
          e.team === this.team &&
          !e.dead &&
          Utils.getDist(this, e) < this.radius
        ) {
          e.applyRage(this.amount);
        }
      });
    }

    // EARTHQUAKE (Slow + Damage per detik)
    if (this.type === "earthquake") {
      // Slow effect (hanya ground)
      [...game.units].forEach((e) => {
        if (
          e.team !== this.team &&
          !e.dead &&
          !e.isAir &&
          Utils.getDist(this, e) < this.radius
        ) {
          e.applySlow(0.1, 0.5); // Slow 50% terus menerus selama di area
        }
      });

      // Damage Tick (setiap 0.5 detik / 30 frame)
      this.tickTimer++;
      if (this.tickTimer % 30 === 0) {
        const dmgPerTick = this.amount / (this.maxDuration / 60); // Total damage dibagi durasi
        // Damage x3 ke Bangunan
        [...game.buildings, ...game.towers].forEach((b) => {
          if (
            b.team !== this.team &&
            !b.dead &&
            Utils.getDist(this, b) < this.radius
          ) {
            b.takeDamage(dmgPerTick * 3);
          }
        });
        // Damage ke Unit Darat
        [...game.units].forEach((u) => {
          if (
            u.team !== this.team &&
            !u.dead &&
            !u.isAir &&
            Utils.getDist(this, u) < this.radius
          ) {
            u.takeDamage(dmgPerTick);
          }
        });
      }
    }

    // VOID (Damage Tick Tinggi)
    if (this.type === "void") {
      this.tickTimer++;
      if (this.tickTimer % 30 === 0) {
        // Hit tiap 0.5 detik
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
          // Damage dibagi rata ke semua target di dalam
          // (Simulasi Void CR: Sedikit target = damage besar, Banyak target = damage kecil)
          // Disini kita set damage base (this.amount) dibagi jumlah target
          const dmgShare = this.amount / targets.length;
          targets.forEach((t) => {
            t.takeDamage(dmgShare);
            // Visual efek per target
            game.effects.push(new Effect(t.x, t.y, 20, "#6a1b9a"));
          });
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    const alpha = Math.min(0.4, this.duration / 30);

    if (this.type === "rage") ctx.fillStyle = `rgba(170,0,255,${alpha})`;
    else if (this.type === "freeze_visual")
      ctx.fillStyle = `rgba(129,212,250,${alpha})`;
    else if (this.type === "earthquake") {
      ctx.fillStyle = `rgba(121, 85, 72, ${alpha})`;
      // Efek getar visual
      const shake = (Math.random() - 0.5) * 5;
      ctx.translate(shake, shake);
    } else if (this.type === "void")
      ctx.fillStyle = `rgba(74, 20, 140, ${alpha})`;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life * 0.6;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
