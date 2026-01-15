/**
 * ENTITY.JS - AI Locking, Heavy Push Physics & Smart Pathing
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
    this.stunned = 0;
    this.freezeActive = false;
    this.zapActive = false;
    this.rageBoosted = 0;
    this.rageAmount = 0;
    this.slowed = 0;
    this.slowAmount = 0;
    this.isHidden = false;
    this.animFrame = 0;
    this.pushFactor = 1.0; // Faktor kecepatan akibat mendorong
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

  heal(amount) {
    if (this.dead || this.hp >= this.maxHp) return;
    this.hp = Math.min(this.hp + amount, this.maxHp);
    // Visual effect sederhana (warna hijau kedip)
    // (Bisa dikembangkan nanti di draw)
  }

  applyStun(duration, type) {
    if (this.isHidden) return;
    this.stunned = Math.max(this.stunned, duration * 60);
    if (type === "freeze") this.freezeActive = true;
    else if (type === "zap") this.zapActive = true;
  }

  applyRage(boost) {
    this.rageBoosted = 2;
    this.rageAmount = boost;
  }

  applySlow(duration, amount) {
    if (!this.isHidden) {
      this.slowed = Math.max(this.slowed, duration * 60);
      this.slowAmount = amount;
    }
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
    this.pushFactor = 1.0; // Reset setiap frame
  }

  drawOutline(ctx) {
    if (this.isHidden) return;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3;
    if (this.stunned > 0) {
      if (this.freezeActive) {
        ctx.shadowColor = "#00e5ff";
        ctx.strokeStyle = "#00e5ff";
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowColor = "yellow";
        ctx.strokeStyle = "yellow";
        ctx.shadowBlur = 10;
      }
    } else if (this.rageBoosted > 0) {
      ctx.shadowColor = "red";
      ctx.strokeStyle = "red";
      ctx.shadowBlur = 10;
    } else if (this.slowed > 0) {
      ctx.shadowColor = "#00bcd4";
      ctx.strokeStyle = "#00bcd4";
      ctx.shadowBlur = 5;
    } else return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawHp(ctx) {
    if (this.isHidden) return;
    const barY = this.y - this.radius - 20;

    // Label Nama
    let name = "";
    if (this instanceof Unit || this instanceof Building) {
      name = CARDS[this.key] ? CARDS[this.key].name : "";
    }
    if (name) {
      ctx.save();
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.strokeText(name, this.x, barY - 6);
      ctx.fillText(name, this.x, barY - 6);
      ctx.restore();
    }

    let c = "#000";
    if (this.freezeActive) c = "#00e5ff";
    else if (this.zapActive) c = "yellow";
    else if (this.rageBoosted > 0) c = "red";
    else if (this.slowed > 0) c = "#00bcd4";

    ctx.fillStyle = c;
    ctx.fillRect(this.x - 16, barY - 1, 32, 6);
    ctx.fillStyle = "#333";
    ctx.fillRect(this.x - 15, barY, 30, 4);

    const pct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = this.team === 0 ? "#4caf50" : "#f44336";
    ctx.fillRect(this.x - 15, barY, 30 * pct, 4);

    if (this.shield > 0) {
      ctx.fillStyle = "#b0bec5";
      ctx.fillRect(
        this.x - 15,
        barY - 5,
        30 * (this.shield / this.maxShield),
        3
      );
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
    this.range = data.stats.range || 0;
    this.sightRange = data.stats.sightRange || 200;
    this.hitSpeed = (data.stats.hitSpeed || 1) * 60;
    this.tags = data.tags || [];
    this.color = data.color || "#999";
    this.target = null;

    // --- ATTACK LOGIC ---
    this.attackTimer = 0;
    // Load Time: Waktu tunggu sebelum pukulan pertama (Default 0.5 detik / 30 frame)
    // Unit berat seperti Golem/Pekka biasanya butuh waktu lebih lama (60 frame)
    this.firstHitDelay = data.stats.loadTime ? data.stats.loadTime * 60 : 30;
    if (this.tags.includes("heavy")) this.firstHitDelay = 60;

    this.deployTimer = (data.stats.deployTime || 1) * 60;
    this.isAir = this.tags.includes("air");
    this.isBuildingHunter = this.tags.includes("building-hunter");
    this.isAreaDmg = this.tags.includes("area");
    this.splashRadius = data.stats.splashRadius || 60;
    this.isSpawner = this.tags.includes("spawner");
    this.spawnUnitKey = data.stats.spawnUnitKey;
    this.spawnCount = data.stats.spawnCount || 1;
    this.spawnTimer = 0;
    this.spawnInterval = (data.stats.spawnInterval || 5) * 60;
    this.projType = data.stats.projectile;
    this.projSpeed = data.stats.projSpeed || 7;
    this.maxRange = data.stats.maxRange || 0;
    this.hasWeapon = true;
    this.isRampUp = this.tags.includes("ramp-damage");
    this.rampStage = 0;
    this.kamikaze = data.stats.kamikaze || false;
    this.hasSlowEffect = this.tags.includes("slow-effect");
    this.spawnZap = data.stats.spawnZap || false;

    // PHYSICS
    this.radius = this.tags.includes("heavy") ? 22 : 12;
    this.mass = this.tags.includes("heavy") ? 5.0 : 1.0;
    this.lastX = x;
    this.lastY = y;
    this.stuckTimer = 0;
    this.isMoving = false;
    this.isAttacking = false;
    this.angle = team === 0 ? -Math.PI / 2 : Math.PI / 2;

    // --- NEW TRAITS ---
    this.canJumpRiver = data.canJumpRiver || false; // Hog/Prince
    this.multiTarget = data.multiTarget || 1; // E-Wiz
    this.deathEffect = data.deathEffect || null; // Golem

    // MEGA KNIGHT JUMP
    this.jumpStats = data.jumpAttack || null;
    this.isJumping = false;
    this.jumpTimer = 0;
    this.jumpTargetX = 0;
    this.jumpTargetY = 0;
    this.jumpPhase = 0; // 0: Charge, 1: Air
  }

  // Override takeDamage untuk Handle Death Effect (Golem)
  takeDamage(amount) {
    super.takeDamage(amount);
    if (this.dead && this.deathEffect) {
      this.doDeathEffect();
    }
  }

  doDeathEffect() {
    // Mencegah trigger berulang
    this.deathEffect = null;

    // Efek Ledakan / Split
    // Kita butuh akses ke GAME engine. Karena entity tidak simpan ref ke game,
    // kita akan push effect di update loop berikutnya atau pakai Global GAME (agak hacky tapi works disini)
    if (typeof GAME !== "undefined") {
      const de = CARDS[this.key].deathEffect;

      // 1. Area Damage Explosion
      if (de.type === "explode" || de.dmg) {
        GAME.dealAreaDamage(
          this.x,
          this.y,
          de.radius,
          de.dmg,
          this.team,
          "damage"
        );
        GAME.effects.push(new Effect(this.x, this.y, de.radius, "orange"));
      }

      // 2. Split Unit (Golem -> Golemites)
      if (de.type === "split") {
        for (let i = 0; i < de.count; i++) {
          const ox = (Math.random() - 0.5) * 20;
          const oy = (Math.random() - 0.5) * 20;
          const u = new Unit(this.x + ox, this.y + oy, this.team, de.unit);
          u.deployTimer = 20; // Jeda sebentar sebelum aktif
          GAME.units.push(u);
        }
      }

      if (de.type === "spell") {
        if (de.spell === "rage") {
          GAME.spellAreas.push(
            new SpellArea(
              this.x,
              this.y,
              de.radius,
              "rage",
              de.duration,
              this.team,
              de.amount
            )
          );
        }
      }
    }
  }

  update(game) {
    if (this.deployTimer > 0) {
      this.deployTimer--;
      return;
    }

    // --- MEGA KNIGHT JUMP LOGIC ---
    if (this.jumpStats && this.target && !this.dead && !this.stunned) {
      const dist = Utils.getDist(this, this.target);
      if (
        !this.isJumping &&
        dist > 50 &&
        dist >= this.jumpStats.minRange &&
        dist <= this.jumpStats.maxRange
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
            this.jumpTargetX = this.target.x;
            this.jumpTargetY = this.target.y;
          }
        } else {
          const angle = Math.atan2(
            this.jumpTargetY - this.y,
            this.jumpTargetX - this.x
          );
          const jumpSpeed = this.jumpStats.speed * 2;
          this.x += Math.cos(angle) * jumpSpeed;
          this.y += Math.sin(angle) * jumpSpeed;
          this.angle = angle;

          const distToLand = Math.hypot(
            this.jumpTargetX - this.x,
            this.jumpTargetY - this.y
          );
          if (distToLand < 10) {
            this.isJumping = false;
            game.dealAreaDamage(
              this.x,
              this.y,
              80,
              this.jumpStats.dmg,
              this.team,
              "damage"
            );
            game.effects.push(new Effect(this.x, this.y, 80, "orange"));
            this.attackTimer = this.hitSpeed;
          }
        }
        return;
      }
    }

    this.updateStatus();
    if (this.stunned > 0 || !this.hasWeapon) return;

    let mult = this.rageBoosted > 0 ? 1 + this.rageAmount : 1;
    if (this.slowed > 0) mult *= 1 - this.slowAmount;
    mult *= this.pushFactor;
    this.speed = this.baseSpeed * mult;

    if (this.isSpawner) {
      this.spawnTimer++;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnMinions(game);
      }
    }

    this.updateTargeting(game);

    if (this.target) {
      this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      const dist = Utils.getDist(this, this.target);
      const reach =
        (this.range > 0 ? this.range : 5) + this.target.radius + this.radius;

      if (dist <= reach) {
        // --- SUDAH SAMPAI DI TARGET ---
        this.isMoving = false;

        // Cek Attack Timer
        if (this.attackTimer > 0) {
          // SEDANG RELOAD / WIND-UP
          this.attackTimer--;
          this.isAttacking = false;
        } else {
          // SIAP MENYERANG
          this.isAttacking = true;
          this.doAttack(game, mult);
          this.attackTimer = this.hitSpeed / mult; // Reset timer ke hit speed normal
        }
      } else {
        // --- MASIH MENGEJAR (MOVING) ---
        this.isAttacking = false;
        this.rampStage = 0;
        this.isMoving = true;

        // PENTING: Saat bergerak, tahan timer serangan agar tidak 0.
        // Set ke 'firstHitDelay' agar saat sampai, dia harus nunggu dulu (wind-up).
        this.attackTimer = this.firstHitDelay;

        this.moveTowards(this.target.x, this.target.y, game);
      }
    } else {
      // --- TIDAK ADA TARGET (JALAN DI LANE) ---
      this.isAttacking = false;
      this.rampStage = 0;
      this.isMoving = true;
      this.attackTimer = this.firstHitDelay; // Tahan timer
      this.laneMovement(game);
    }

    this.resolveCollision(game);
  }

  spawnMinions(game) {
    const key = this.spawnUnitKey || "skeleton";
    for (let i = 0; i < this.spawnCount; i++) {
      const ox = (Math.random() - 0.5) * 20;
      const oy = (Math.random() - 0.5) * 20;
      const u = new Unit(this.x + ox, this.y + oy, this.team, key);
      u.deployTimer = 10;
      game.units.push(u);
    }
  }

  updateTargeting(game) {
    // 1. Validasi Target Lama
    // Jika target mati, hilang (hidden), atau kabur jauh dari jarak pandang -> Lepaskan
    if (this.target) {
      let invalid =
        this.target.dead ||
        this.target.isHidden ||
        Utils.getDist(this, this.target) > this.sightRange * 1.5;

      // Khusus Healer: Jika target adalah TEMAN dan HP-nya sudah penuh, cari yang lain
      if (
        this.tags.includes("healer") &&
        this.target.team === this.team &&
        this.target.hp >= this.target.maxHp
      ) {
        invalid = true;
      }

      if (invalid) {
        this.target = null;
        this.rampStage = 0;
        this.isAttacking = false;
      }
    }

    // 2. LOGIC LOCKING (KUNCI TARGET SAAT MENYERANG)
    // Jika kita sudah punya target, DAN target itu berada dalam jangkauan serangan kita...
    // JANGAN CARI TARGET LAIN. Fokus serang ini sampai mati atau keluar range.
    if (this.target) {
      const distToCurrent = Utils.getDist(this, this.target);
      // Hitung jangkauan serangan (Range unit + Radius badan musuh + Radius badan sendiri)
      const attackReach =
        (this.range > 0 ? this.range : 5) + this.target.radius + this.radius;

      // Jika dalam jangkauan serang, return (keluar fungsi, jangan scan musuh lain)
      if (distToCurrent <= attackReach) {
        return;
      }
    }

    // 3. SCANNING / RETARGETING (Hanya jalan jika belum punya target atau target di luar jangkauan serang)
    // Ini memungkinkan unit untuk ganti target JIKA dia sedang berjalan mengejar (belum memukul).

    const enemies = [...game.units, ...game.buildings, ...game.towers].filter(
      (e) => e.team !== this.team && !e.dead && !e.isHidden
    );

    let bestTarget = this.target;
    // Jarak target saat ini (jika tidak ada set infinity)
    let minD = this.target ? Utils.getDist(this, this.target) : 9999;
    if (this.tags.includes("healer")) {
      // Cari teman yang terluka (HP < MaxHP)
      const allies = [...game.units, ...game.buildings].filter(
        (u) => u.team === this.team && !u.dead && u !== this && u.hp < u.maxHp
      );

      for (let a of allies) {
        const d = Utils.getDist(this, a);
        if (d <= this.sightRange) {
          // Prioritas yang paling dekat
          if (d < minD) {
            minD = d;
            bestTarget = a;
          }
        }
      }

      // Jika tidak ada teman terluka, Heal Spirit bisa diam atau lari ke depan (fallback ke musuh nanti)
      // Battle Healer (Unit) tetap bisa nyerang musuh, jadi biarkan dia lanjut ke logic musuh di bawah
      // Tapi Heal Spirit (Kamikaze) sebaiknya lari ke lane jika tidak ada teman
    }
    if (!bestTarget || (this.key === "healer" && !bestTarget)) {
      const enemies = [...game.units, ...game.buildings, ...game.towers].filter(
        (e) => e.team !== this.team && !e.dead && !e.isHidden
      );

      // ... (Logic loop musuh yang lama) ...
      for (let e of enemies) {
        if (e === this) continue;
        // ... filter air/ground ...
        if (
          this.isBuildingHunter &&
          !(e instanceof Tower) &&
          !(e instanceof Building)
        )
          continue;
        if (
          this.isAir &&
          !this.tags.includes("air-target") &&
          !(e instanceof Tower) &&
          !(e instanceof Building)
        )
          continue;

        const d = Utils.getDist(this, e);
        if (d <= this.sightRange) {
          if (d < minD - 30) {
            // Sticky factor
            minD = d;
            bestTarget = e;
          }
        }
      }
    }

    // C. Fallback Global (Tower Musuh) - Agar tidak diam
    if (!bestTarget) {
      // ... (Logic global target lama) ...
      // Khusus Heal Spirit: Lari ke Tower musuh kalau ga ada temen
      const globalTargets = [...game.towers, ...game.buildings].filter(
        (t) => t.team !== this.team && !t.dead
      );
      let globalMinD = 9999;
      for (let t of globalTargets) {
        const d = Utils.getDist(this, t);
        if (d < globalMinD) {
          globalMinD = d;
          bestTarget = t;
        }
      }
    }
    // Sticky Factor: Memberikan prioritas pada target lama agar unit tidak plin-plan
    // Kalau target lama ada, musuh baru harus lebih dekat 30px daripada target lama untuk bisa mengalihkan perhatian
    const stickyFactor = this.target ? 30 : 0;

    for (let e of enemies) {
      // Skip diri sendiri & filter tipe target
      if (e === this) continue;
      if (
        this.isBuildingHunter &&
        !(e instanceof Tower) &&
        !(e instanceof Building)
      )
        continue;
      if (
        e.isAir &&
        !this.tags.includes("air-target") &&
        !(e instanceof Tower) &&
        !(e instanceof Building)
      )
        continue;

      const d = Utils.getDist(this, e);

      // Hanya pertimbangkan musuh dalam jarak pandang (Sight Range)
      if (d <= this.sightRange) {
        // Jika musuh ini LEBIH DEKAT (dikurangi sticky factor) dibanding target sekarang
        if (d < minD - stickyFactor) {
          minD = d;
          bestTarget = e;
        }
      }
    }

    if (this.target !== bestTarget) {
        this.target = bestTarget;
        this.rampStage = 0;
    }
  }

  moveTowards(tx, ty, game) {
    const moveDist = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    if (moveDist < 0.5 && this.isMoving) this.stuckTimer++;
    else this.stuckTimer = 0;
    this.lastX = this.x;
    this.lastY = this.y;

    let moveAngle = Math.atan2(ty - this.y, tx - this.x);
    if (this.stuckTimer > 30) {
      moveAngle += (Math.random() - 0.5) * 1.5;
      if (this.stuckTimer > 60) this.stuckTimer = 0;
    }
    this.angle = moveAngle;

    if (!this.isAir) {
      const riverY = 350;
      const isCrossing =
        (this.y < riverY && ty > riverY) || (this.y > riverY && ty < riverY);

      // LOGIC LOMPAT SUNGAI (Hog/Prince)
      // Jika punya skill canJumpRiver, dia mengabaikan logic jembatan
      // tapi collision unit tetap berlaku di resolveCollision
      if (isCrossing && !this.canJumpRiver) {
        const bX = Math.abs(this.x - 80) < Math.abs(this.x - 320) ? 80 : 320;
        if (Math.abs(this.x - bX) > 25) {
          const bridgeEntryY = riverY + (this.y < riverY ? -20 : 20);
          this.angle = Math.atan2(bridgeEntryY - this.y, bX - this.x);
        }
      }

      // Hindari Bangunan
      if (game) {
        game.buildings.forEach((b) => {
          const dist = Utils.getDist(this, b);
          if (dist < b.radius + this.radius + 15) {
            const angleToBuilding = Math.atan2(b.y - this.y, b.x - this.x);
            let diff = this.angle - angleToBuilding;
            while (diff <= -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
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

      // Filter Tabrakan: Ground vs Ground, Air vs Air
      const iAmAir = this.isAir;
      const uIsAir = u.tags ? u.tags.includes("air") : false;
      const uIsBuilding = u instanceof Building;

      // Udara vs Darat tembus
      if (iAmAir !== uIsAir && !uIsBuilding) continue;
      // Unit Udara tembus Bangunan (kecuali bangunan itu tinggi banget? default tembus)
      if (iAmAir && uIsBuilding) continue;

      const dist = Utils.getDist(this, u);
      const minDist = this.radius + u.radius;

      if (dist < minDist) {
        // Terjadi Tabrakan
        const angle = Math.atan2(this.y - u.y, this.x - u.x);
        const overlap = minDist - dist;

        // --- LOGIKA MASA / BERAT ---
        // Unit berat (mass 5) mendorong unit ringan (mass 1).
        // Bangunan (uIsBuilding) dianggap mass tak terhingga (fixed).

        let uMass = u instanceof Unit ? u.mass : 9999;
        const myMass = this.mass;

        // Ratio Dorong: Seberapa banyak SAYA harus mundur?
        // Jika lawan Bangunan (9999), ratio mendekati 1 (Saya mundur full).
        // Jika Heavy(5) vs Light(1), total=6. Heavy mundur 1/6, Light mundur 5/6.
        const totalMass = myMass + uMass;
        const myPushRatio = uMass / totalMass;

        // Geser posisi saya
        this.x += Math.cos(angle) * overlap * myPushRatio;
        this.y += Math.sin(angle) * overlap * myPushRatio;

        // --- PENALTI KECEPATAN ---
        // Jika saya mencoba bergerak MAJU ke arah tabrakan, perlambat speed saya
        // Ini mensimulasikan "mendorong beban".
        if (u instanceof Unit && !this.isMoving) {
          // Jika saya diam dan didorong, tidak ada penalti speed (hanya geser)
        } else if (u instanceof Unit) {
          // Jika saya mendorong yang lebih ringan, speed saya turun sedikit (misal 90%)
          // Jika mendorong yang setara/lebih berat, speed turun drastis (misal 50% atau berhenti)
          if (myMass > uMass) this.pushFactor = 0.8;
          else this.pushFactor = 0.3;
        }
      }
    }
  }

  doAttack(game, attackMult = 1) {
    let finalDmg = this.dmg * attackMult;


    if (this.key === "healer") {
      // Heal diri sendiri
      this.heal(finalDmg * 0.5); // Heal 50% dari damage
      // Heal teman di sekitar (Radius 80)
      const allies = [...game.units].filter(
        (u) => u.team === this.team && u !== this && !u.dead
      );
      allies.forEach((u) => {
        if (Utils.getDist(this, u) < 80) {
          u.heal(finalDmg * 0.5);
          game.effects.push(new Effect(u.x, u.y, 20, "#00e676")); // Efek visual heal
        }
      });
    }

    if (this.key === 'healer_spirit') {
        // Efek Heal Area
        game.effects.push(new Effect(this.x, this.y, this.splashRadius, "#00e676")); // Hijau
        
        // Cari teman di radius ledakan
        const allies = [...game.units, ...game.buildings].filter(u => u.team === this.team && !u.dead);
        let hitCount = 0;
        allies.forEach(u => {
            if (Utils.getDist(this, u) <= this.splashRadius) {
                u.heal(350); // Heal amount besar
                hitCount++;
            }
        });
        
        // Bunuh diri
        this.takeDamage(9999);
        return;
    }

    if (this.multiTarget && this.multiTarget > 1) {
      // Cari target tambahan
      const enemies = [...game.units, ...game.buildings, ...game.towers].filter(
        (e) =>
          e.team !== this.team &&
          !e.dead &&
          !e.isHidden &&
          Utils.getDist(this, e) <= this.range + e.radius + 10
      );
      // Sort by distance
      enemies.sort((a, b) => Utils.getDist(this, a) - Utils.getDist(this, b));

      const targets = enemies.slice(0, this.multiTarget); // Ambil 2 terdekat

      targets.forEach((t) => {
        t.takeDamage(finalDmg);
        t.applyStun(0.5, "zap");
        // Visual Petir ke setiap target
        game.effects.push(new LightningEffect(this.x, this.y - 15, t.x, t.y));
      });
      return;
    }
    // -----------------------------------

    if (this.kamikaze) {
      const canHitAir = this.tags.includes("air-target");
      game.dealAreaDamage(
        this.x,
        this.y,
        this.splashRadius,
        finalDmg,
        this.team,
        "damage",
        canHitAir
      );
      game.effects.push(
        new Effect(this.x, this.y, this.splashRadius, "orange")
      );
      this.takeDamage(9999);
      return;
    }

    if (this.isRampUp) {
      this.rampStage++;
      finalDmg = this.dmg * (1 + this.rampStage * 0.05);
      if (this.target) this.target.takeDamage(finalDmg);
      return;
    }

    // Ice Wizard (Slow Effect Attack)
    if (this.hasSlowEffect) {
      // Sudah dihandle di properti projectile, tapi jika melee:
      // (Ice wiz is range, so it goes to projectile logic below)
    }

    // Projectiles
    const stun = CARDS[this.key]?.stats?.stunDuration || 0;
    const slow = CARDS[this.key]?.stats?.slowAmount || 0;
    const slowDur = CARDS[this.key]?.stats?.slowDuration || 0;

    if (this.projType === "boomerang") {
      this.hasWeapon = false;
      const hitAir = this.tags.includes("air-target");
      const p = new Projectile(
        this.x,
        this.y,
        this.target,
        finalDmg,
        this.team,
        false,
        true,
        false,
        0,
        0,
        false,
        0,
        0,
        this.projType,
        this.projSpeed,
        this.maxRange,
        this
      );
      p.hitAir = hitAir;
      game.projectiles.push(p);
      return;
    }

    if (this.projType === "rolling") {
      const hitAir = this.tags.includes("air-target");
      const p = new Projectile(
        this.x,
        this.y,
        this.target,
        finalDmg,
        this.team,
        false,
        true,
        false,
        0,
        0,
        false,
        0,
        0,
        this.projType,
        this.projSpeed,
        this.maxRange,
        this
      );
      p.hitAir = hitAir;
      p.angle = this.angle;
      p.dx = Math.cos(p.angle);
      p.dy = Math.sin(p.angle);
      game.projectiles.push(p);
      return;
    }

    if (this.range > 0) {
      const hitAir = this.tags.includes("air-target");
      const p = new Projectile(
        this.x,
        this.y,
        this.target,
        finalDmg,
        this.team,
        false,
        this.isAreaDmg,
        false,
        this.splashRadius,
        2,
        this.hasSlowEffect,
        slowDur,
        slow
      );
      p.hitAir = hitAir;
      game.projectiles.push(p);
    } else {
      // Melee
      if (this.isAreaDmg) {
        const canHitAir = this.tags.includes("air-target");
        game.dealAreaDamage(
          this.x,
          this.y,
          this.splashRadius,
          finalDmg,
          this.team,
          "damage",
          canHitAir
        );
        game.effects.push(
          new Effect(this.x, this.y, this.splashRadius, "orange")
        );
      } else {
        this.target.takeDamage(finalDmg);
      }
    }
  }

  // --- HELPER VISUAL UPDATE ---
  getVisualTraits() {
    const k = this.key;
    let t = super.getVisualTraits
      ? super.getVisualTraits()
      : this._defaultVisuals(k); // Fallback if helper missing

    if (
      [
        "skeletons",
        "skarmy",
        "skeleton",
        "witch",
        "guards",
        "bomber",
        "tombstone",
        "balloon",
        "giant_skeleton",
      ].includes(k)
    ) {
      t.skin = "#ffffff";
      t.head = "skull";
      t.body = "ribs";
      t.weapon = "dagger";
      if (k === "witch") {
        t.head = "hood";
        t.weapon = "staff";
        t.skin = "#e0f7fa";
      }
      if (k === "guards") {
        t.weapon = "spear";
        t.head = "helm";
        t.body = "armor";
      }
      if (k === "balloon") {
        t.head = "skull";
        t.weapon = "none";
        t.scale = 1.5;
      }
    } else if (k.includes("goblin")) {
      t.skin = "#76ff03";
      t.head = "bandana";
      t.weapon = "dagger";
      if (k === "spear_goblins" || k === "goblin_hut") t.weapon = "spear";
      if (k === "goblin_barrel") t.head = "barrel";
    } else if (["minions", "mega_minion", "bats"].includes(k)) {
      t.skin = "#80d8ff";
      t.head = "demon";
      t.weapon = "wings";
      if (k === "bats") t.skin = "#b39ddb";
    } else if (["golem", "ice_golem"].includes(k)) {
      t.skin = "#a1887f";
      t.head = "bald";
      t.weapon = "fist";
      t.scale = 1.4;
      if (k === "ice_golem") t.skin = "#b3e5fc";
    } else if (k === "hog_rider") {
      t.weapon = "hammer";
      t.head = "mohawk";
      t.skin = "#d7ccc8";
    } else if (k === "valkyrie") {
      t.weapon = "axe";
      t.head = "hair_orange";
    } else if (k === "wizard") {
      t.weapon = "staff";
      t.head = "hood";
    } else if (k === "pekka" || k === "mini_pekka") {
      t.skin = "#5c6bc0";
      t.head = "horned_helm";
      t.weapon = "big_sword";
    } else if (k === "archer" || k === "princess") {
      t.weapon = "bow";
      t.head = "hood";
    } else if (k === "mega_knight") {
      t.skin = "#212121";
      t.head = "full_helm";
      t.weapon = "mace_hands";
      t.scale = 1.4;
    }

    if (k === "giant" || k === "royal_giant" || k === "pekka") t.scale = 1.3;
    if (k === "golem" || k === "lava_hound") t.scale = 1.4;
    return t;
  }

  _defaultVisuals(k) {
    let t = {
      weapon: "sword",
      head: "helm",
      body: "armor",
      scale: 1,
      skin: "#ffe0b2",
      colorOverride: null,
    };
    if (
      [
        "skeletons",
        "skarmy",
        "skeleton",
        "witch",
        "guards",
        "bomber",
        "tombstone",
        "balloon",
        "giant_skeleton",
      ].includes(k)
    ) {
      t.skin = "#ffffff";
      t.head = "skull";
      t.body = "ribs";
      t.weapon = "dagger";
      if (k === "witch") {
        t.head = "hood";
        t.weapon = "staff";
        t.skin = "#e0f7fa";
      }
      if (k === "guards") {
        t.weapon = "spear";
        t.head = "helm";
        t.body = "armor";
      }
      if (k === "balloon") {
        t.head = "skull";
        t.weapon = "none";
        t.scale = 1.5;
      }
    } else if (k.includes("goblin")) {
      t.skin = "#76ff03";
      t.head = "bandana";
      t.weapon = "dagger";
      if (k === "spear_goblins" || k === "goblin_hut") t.weapon = "spear";
      if (k === "goblin_barrel") t.head = "barrel";
    } else if (["minions", "mega_minion", "bats"].includes(k)) {
      t.skin = "#80d8ff";
      t.head = "demon";
      t.weapon = "wings";
      if (k === "bats") t.skin = "#b39ddb";
    } else if (["golem", "ice_golem", "golemite"].includes(k)) {
      t.skin = "#a1887f";
      t.head = "bald";
      t.weapon = "fist";
      t.scale = 1.4;
      if (k === "ice_golem") t.skin = "#b3e5fc";
      if (k === "golemite") t.scale = 0.8;
    } else if (k === "hog_rider") {
      t.weapon = "hammer";
      t.head = "mohawk";
      t.skin = "#d7ccc8";
    } else if (k === "valkyrie") {
      t.weapon = "axe";
      t.head = "hair_orange";
    } else if (k === "wizard" || k === "ice_wizard" || k === "electro_wizard") {
      t.weapon = "staff";
      t.head = "hood";
    } else if (k === "pekka" || k === "mini_pekka") {
      t.skin = "#5c6bc0";
      t.head = "horned_helm";
      t.weapon = "big_sword";
    } else if (k === "archer" || k === "princess") {
      t.weapon = "bow";
      t.head = "hood";
    }

    if (k === "giant" || k === "royal_giant" || k === "pekka") t.scale = 1.3;
    if (k === "golem" || k === "lava_hound") t.scale = 1.4;
    return t;
  }

  draw(ctx, isGhost = false) {
    const traits = this.getVisualTraits();
    const r = this.radius * traits.scale;
    const isBlue = this.team === 0;

    let teamColor = isBlue ? "#42a5f5" : "#ef5350";
    let teamDark = isBlue ? "#1565c0" : "#c62828";
    let skinColor = traits.skin;
    if (traits.colorOverride) teamDark = "#999";

    // Hitung Offset Lompatan
    let jumpOffset = 0;
    if (this.isJumping) {
      // Simulasikan parabola lompatan
      // jumpTimer menghitung mundur dari 40 (charge) -> jump (air) -> 0
      if (this.jumpPhase === 1) {
        // Sedang di udara
        // Gunakan jarak ke target mendarat untuk menghitung ketinggian visual
        const totalDist = Utils.getDist(
          { x: this.lastX, y: this.lastY },
          { x: this.jumpTargetX, y: this.jumpTargetY }
        );
        const currentDist = Utils.getDist(this, {
          x: this.jumpTargetX,
          y: this.jumpTargetY,
        });
        // Ketinggian sederhana berbasis sine wave
        // Ini visual hack, logic fisikanya sudah di update()
        jumpOffset = -80; // Terbang konstan 80px di atas tanah
      }
    }

    ctx.save();
    if (isGhost) ctx.globalAlpha = 0.6;
    else if (this.deployTimer > 0) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.arc(this.x, this.y, r + 5, 0, Math.PI * 2 * (this.deployTimer / 60));
      ctx.stroke();
    }

    // 1. DRAW SHADOW (SELALU DI TANAH = this.y)
    if (!isGhost) this.drawOutline(ctx); // Status effect ring (di tanah)

    const shadowOff = this.isAir ? r : r * 0.2;
    const shadowScale = this.isAir || this.isJumping ? 0.6 : 1;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(
      this.x,
      this.y + shadowOff,
      r * shadowScale,
      r * 0.6 * shadowScale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 2. DRAW BODY (TERAPKAN JUMP OFFSET)
    ctx.save();
    // Pindahkan koordinat ke posisi unit + ketinggian lompat
    ctx.translate(this.x, this.y + jumpOffset - (this.isAir ? 15 : 0));
    ctx.rotate(this.angle + Math.PI / 2);

    // --- KODE GAMBAR KARAKTER (COPY PASTE LAMA) ---
    // BADAN
    if (traits.body === "ribs") {
      ctx.strokeStyle = skinColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r / 2, 0);
      ctx.lineTo(r / 2, 0);
      ctx.moveTo(-r / 2, r / 3);
      ctx.lineTo(r / 2, r / 3);
      ctx.stroke();
    } else {
      const grad = ctx.createLinearGradient(-r / 2, 0, r / 2, 0);
      grad.addColorStop(0, teamDark);
      grad.addColorStop(0.5, teamColor);
      grad.addColorStop(1, teamDark);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, 0);
      ctx.lineTo(r * 0.6, 0);
      ctx.lineTo(r * 0.4, r * 0.5);
      ctx.lineTo(-r * 0.4, r * 0.5);
      ctx.fill();
    }
    // KEPALA
    if (traits.head === "skull") {
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(0, -r * 0.2, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(-r * 0.2, -r * 0.2, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.2, -r * 0.2, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    } else if (traits.head === "demon") {
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.3, r * 0.6, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(0, -r * 0.3, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(0, -r * 0.3, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (traits.head === "mohawk") {
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(0, -r * 0.2, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#333";
      ctx.fillRect(-2, -r * 0.9, 4, r * 0.8);
    } else {
      ctx.fillStyle = traits.head === "bald" ? skinColor : teamColor;
      if (traits.head === "bandana") {
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, -r * 0.2, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = teamColor;
        ctx.beginPath();
        ctx.rect(-r * 0.6, -r * 0.7, r * 1.2, r * 0.3);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, -r * 0.2, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (traits.head === "horned_helm") {
        ctx.fillStyle = "#7986cb";
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, -r * 0.2);
        ctx.lineTo(-r, -r);
        ctx.lineTo(-r * 0.3, -r * 0.5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.6, -r * 0.2);
        ctx.lineTo(r, -r);
        ctx.lineTo(r * 0.3, -r * 0.5);
        ctx.fill();
      }
      if (traits.head === "full_helm") {
        // Mega Knight
        ctx.fillStyle = "#455a64";
        ctx.beginPath();
        ctx.arc(0, -r * 0.2, r * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.fillRect(-r * 0.4, -r * 0.3, r * 0.8, r * 0.15); // Visor
      }
    }
    // SENJATA
    if (this.hasWeapon) {
      ctx.fillStyle = "#cfd8dc";
      if (traits.weapon === "sword" || traits.weapon === "big_sword") {
        const wLen = traits.weapon === "big_sword" ? r * 1.8 : r * 1.2;
        ctx.fillRect(-2, -wLen, 4, wLen);
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(-6, -r * 0.4, 12, 4);
      } else if (traits.weapon === "hammer") {
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(-2, -r * 1.5, 4, r * 1.5);
        ctx.fillStyle = "#8d6e63";
        ctx.fillRect(-r * 0.8, -r * 1.8, r * 1.6, r * 0.6);
      } else if (traits.weapon === "bow") {
        ctx.strokeStyle = "#5d4037";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -r * 0.6, r * 0.6, Math.PI, 0);
        ctx.stroke();
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, -r * 0.6);
        ctx.lineTo(r * 0.6, -r * 0.6);
        ctx.stroke();
      } else if (traits.weapon === "wings") {
        ctx.fillStyle = "#e1f5fe";
        ctx.beginPath();
        ctx.ellipse(-r * 0.8, -r * 0.2, r * 0.4, r * 0.8, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.8, -r * 0.2, r * 0.4, r * 0.8, 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (traits.weapon === "spear") {
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(-2, -r * 1.5, 4, r * 1.5);
        ctx.fillStyle = "#cfd8dc";
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.8);
        ctx.lineTo(4, -r * 1.5);
        ctx.lineTo(-4, -r * 1.5);
        ctx.fill();
      } else if (traits.weapon === "staff") {
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(r * 0.4, -r * 1.2, 3, r * 1.5);
        ctx.fillStyle = "#ffa000";
        ctx.beginPath();
        ctx.arc(r * 0.4, -r * 1.2, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (traits.weapon === "gun") {
        ctx.fillStyle = "#333";
        ctx.fillRect(-2, -r * 1.2, 4, r);
      } else if (traits.weapon === "mace_hands") {
        // Mega Knight Hands
        ctx.fillStyle = "#263238";
        ctx.beginPath();
        ctx.arc(-r * 0.7, -r * 0.5, r * 0.4, 0, Math.PI * 2);
        ctx.fill(); // Kiri
        ctx.beginPath();
        ctx.arc(r * 0.7, -r * 0.5, r * 0.4, 0, Math.PI * 2);
        ctx.fill(); // Kanan
        // Duri
        ctx.fillStyle = "#eceff1";
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, -r * 0.9);
        ctx.lineTo(-r * 0.8, -r * 0.6);
        ctx.lineTo(-r * 0.6, -r * 0.6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.7, -r * 0.9);
        ctx.lineTo(r * 0.8, -r * 0.6);
        ctx.lineTo(r * 0.6, -r * 0.6);
        ctx.fill();
      }
    }
    if (this.isAttacking) {
      const jab = Math.sin(this.attackTimer * 0.5) * 5;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(-r / 2, -r - jab, r, jab);
    }
    ctx.restore(); // Restore Rotasi dan Translation Body

    // INFERNO DRAGON VISUAL
    if (
      !isGhost &&
      this.key === "inferno_dragon" &&
      this.target &&
      this.isAttacking
    ) {
      ctx.save();
      ctx.translate(0, jumpOffset); // Ikut naik jika ada offset (walau inferno drag unit terbang biasa)
      ctx.strokeStyle = "#ff9100";
      ctx.lineWidth = Math.min(6, 2 + this.rampStage * 0.5);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 15);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.stroke();
      ctx.restore();
    }

    // 3. DRAW HP BAR (IKUT NAIK JUGA)
    if (!isGhost) {
      // Kita gambar HP bar manual di sini agar bisa kena jumpOffset
      // ATAU ubah method drawHp di class Entity agar menerima offset.
      // Cara termudah: Override posisi Y sementara.
      const originalY = this.y;
      this.y += jumpOffset; // Hack posisi Y untuk drawHp
      this.drawHp(ctx);
      this.y = originalY; // Kembalikan posisi Y asli
    }

    ctx.restore(); // Restore Global Alpha dll
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
    this.range = data.stats.range || 0;
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
    if (this.attackTimer > 0) this.attackTimer--;
    if (this.isSpawner) {
      this.spawnTimer++;
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
        if (this.isRampUp) this.rampStage = 0;
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
        if (e.isAir && !this.tags.includes("air-target")) continue;
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
      this.rampStage++;
      currentDmg = this.dmg * (1 + this.rampStage * 0.05);
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

  draw(ctx, isGhost, isValidPlacement = true) {
    ctx.save();
    const k = this.key;
    const isBlue = this.team === 0;
    const mainColor = isBlue ? "#42a5f5" : "#ef5350";
    const darkColor = isBlue ? "#1565c0" : "#c62828";
    const woodColor = "#8d6e63";
    const woodDark = "#5d4037";
    const stoneColor = "#bdbdbd";
    const stoneDark = "#757575";
    const metalColor = "#cfd8dc";
    const metalDark = "#90a4ae";

    if (isGhost) {
      ctx.globalAlpha = 0.6;
      if (this.range > 0) {
        ctx.strokeStyle = isValidPlacement ? "#fff" : "#f44336";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = isValidPlacement ? mainColor : "#f44336";
    } else {
      this.drawOutline(ctx);
    }

    ctx.translate(this.x, this.y);

    if (this.isHidden && !isGhost) {
      ctx.fillStyle = woodDark;
      ctx.fillRect(-18, -18, 36, 36);
      ctx.fillStyle = woodColor;
      ctx.fillRect(-15, -15, 14, 30);
      ctx.fillRect(1, -15, 14, 30);
      ctx.strokeStyle = "#3e2723";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(0, 18);
      ctx.stroke();
    } else {
      if (k === "cannon") {
        ctx.fillStyle = woodDark;
        ctx.beginPath();
        ctx.arc(-12, 5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(12, 5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-15, 0, 30, 10);
        ctx.save();
        ctx.rotate(this.angle);
        const gradCannon = ctx.createLinearGradient(0, -10, 0, 10);
        gradCannon.addColorStop(0, "#455a64");
        gradCannon.addColorStop(0.5, "#78909c");
        gradCannon.addColorStop(1, "#455a64");
        ctx.fillStyle = gradCannon;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(25, -8);
        ctx.lineTo(25, 8);
        ctx.lineTo(0, 10);
        ctx.fill();
        ctx.fillStyle = "#263238";
        ctx.fillRect(25, -6, 4, 12);
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (k === "tesla") {
        ctx.fillStyle = woodDark;
        ctx.fillRect(-15, -5, 30, 10);
        ctx.fillStyle = metalDark;
        ctx.fillRect(-8, -35, 16, 30);
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const yPos = -30 + i * 7;
          ctx.moveTo(-12, yPos);
          ctx.lineTo(12, yPos);
        }
        ctx.stroke();
        ctx.fillStyle = "#80d8ff";
        ctx.beginPath();
        ctx.arc(0, -40, 10, 0, Math.PI * 2);
        ctx.fill();
        if (this.attackTimer > 0) {
          ctx.shadowColor = "#00e5ff";
          ctx.shadowBlur = 20;
          ctx.fillStyle = "#fff";
          ctx.fill();
        }
      } else if (k === "inferno_tower") {
        ctx.fillStyle = stoneDark;
        ctx.beginPath();
        ctx.ellipse(0, 10, 25, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#212121";
        ctx.beginPath();
        ctx.moveTo(-15, 10);
        ctx.lineTo(-10, -50);
        ctx.lineTo(10, -50);
        ctx.lineTo(15, 10);
        ctx.fill();
        ctx.fillStyle = stoneColor;
        ctx.fillRect(12, -30, 12, 30);
        const magmaGrad = ctx.createLinearGradient(14, -28, 22, 0);
        magmaGrad.addColorStop(0, "#ff5722");
        magmaGrad.addColorStop(1, "#ffca28");
        ctx.fillStyle = magmaGrad;
        ctx.fillRect(14, -28, 8, 26);
        ctx.fillStyle = "#bf360c";
        ctx.beginPath();
        ctx.arc(0, -55, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffab91";
        ctx.beginPath();
        ctx.arc(0, -55, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (k === "xbow") {
        ctx.fillStyle = woodDark;
        ctx.fillRect(-25, -10, 50, 20);
        ctx.save();
        ctx.rotate(this.angle);
        ctx.strokeStyle = woodColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(-10, 0, 30, Math.PI * 0.7, Math.PI * 1.3);
        ctx.stroke();
        ctx.fillStyle = woodDark;
        ctx.fillRect(-15, -8, 35, 16);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -28);
        ctx.lineTo(20, 0);
        ctx.lineTo(-10, 28);
        ctx.stroke();
        ctx.restore();
      } else if (k === "tombstone") {
        ctx.fillStyle = "#78909c";
        ctx.beginPath();
        ctx.moveTo(-20, 15);
        ctx.lineTo(-18, -25);
        ctx.arc(0, -30, 15, Math.PI, 0);
        ctx.lineTo(18, -25);
        ctx.lineTo(20, 15);
        ctx.fill();
        ctx.strokeStyle = "#37474f";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(0, -15);
        ctx.moveTo(-8, -25);
        ctx.lineTo(8, -25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(5, 10);
        ctx.lineTo(-5, 15);
        ctx.stroke();
        ctx.fillStyle = "#263238";
        ctx.beginPath();
        ctx.arc(0, 5, 10, Math.PI, 0);
        ctx.fill();
      } else if (this.isSpawner) {
        const roofColor = k.includes("goblin") ? "#66bb6a" : "#ffca28";
        ctx.fillStyle = woodColor;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(0, -10 + i * 10, 15 - i * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.moveTo(-20, -15);
        ctx.lineTo(0, -40);
        ctx.lineTo(20, -15);
        ctx.fill();
        ctx.fillStyle = darkColor;
        ctx.fillRect(-8, 0, 16, 20);
      } else {
        ctx.fillStyle = stoneColor;
        ctx.fillRect(-15, -15, 30, 30);
        ctx.fillStyle = mainColor;
        ctx.fillRect(-10, -10, 20, 20);
      }
    }

    if (
      !isGhost &&
      k === "inferno_tower" &&
      this.target &&
      !this.target.dead &&
      this.rampStage > 0
    ) {
      if (
        Utils.getDist(
          { x: 0, y: 0 },
          { x: this.target.x - this.x, y: this.target.y - this.y }
        ) <= this.range
      ) {
        ctx.save();
        ctx.strokeStyle = this.rampStage > 20 ? "red" : "orange";
        ctx.lineWidth = Math.min(8, 2 + this.rampStage * 0.2);
        ctx.beginPath();
        ctx.moveTo(0, -55);
        ctx.lineTo(this.target.x - this.x, this.target.y - this.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
    if (!isGhost) {
      const lifePct = this.lifetime / this.maxLifetime;
      ctx.fillStyle = "#b388ff";
      ctx.fillRect(this.x - 15, this.y + 18, 30 * lifePct, 3);
      this.drawHp(ctx);
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
    this.range = stats.range * 30;
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
      const enemies = game.units.filter(
        (u) => u.team !== this.team && !u.dead && !u.isHidden
      );
      let closest = null;
      let minD = this.range;
      for (let e of enemies) {
        const d = Utils.getDist(this, e);
        if (d <= minD) {
          minD = d;
          closest = e;
        }
      }
      this.target = closest;
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
              true
            )
          );
          this.attackTimer = this.hitSpeed;
        }
      }
    }
    if (this.attackTimer > 0) this.attackTimer--;
  }

  draw(ctx) {
    ctx.save();
    const isBlue = this.team === 0;
    const mainColor = isBlue ? "#42a5f5" : "#ef5350";
    const darkerColor = isBlue ? "#1565c0" : "#c62828";
    const stoneColor = isBlue ? "#90a4ae" : "#5d4037";
    const stoneDark = isBlue ? "#546e7a" : "#3e2723";

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(
      this.x,
      this.y + 5,
      this.type === "king" ? 35 : 25,
      this.type === "king" ? 25 : 18,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    if (this.type === "king") {
      const size = 50,
        half = size / 2;
      const gradBase = ctx.createLinearGradient(
        this.x,
        this.y - half,
        this.x,
        this.y + half
      );
      gradBase.addColorStop(0, stoneColor);
      gradBase.addColorStop(1, stoneDark);
      ctx.fillStyle = gradBase;
      ctx.beginPath();
      ctx.moveTo(this.x - half, this.y - half + 10);
      ctx.lineTo(this.x + half, this.y - half + 10);
      ctx.lineTo(this.x + half - 5, this.y + half);
      ctx.lineTo(this.x - half + 5, this.y + half);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#263238";
      ctx.fillRect(this.x - 10, this.y + 5, 20, 20);
      if (!this.active) {
        ctx.strokeStyle = "#546e7a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 5);
        ctx.lineTo(this.x, this.y + 25);
        ctx.stroke();
      }
      ctx.fillStyle = mainColor;
      ctx.beginPath();
      ctx.moveTo(this.x - half, this.y - 10);
      ctx.lineTo(this.x - half - 10, this.y - 5);
      ctx.lineTo(this.x - half, this.y);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(this.x + half, this.y - 10);
      ctx.lineTo(this.x + half + 10, this.y - 5);
      ctx.lineTo(this.x + half, this.y);
      ctx.fill();
    } else {
      const radius = 22;
      const gradCyl = ctx.createLinearGradient(
        this.x - radius,
        this.y,
        this.x + radius,
        this.y
      );
      gradCyl.addColorStop(0, stoneDark);
      gradCyl.addColorStop(0.5, stoneColor);
      gradCyl.addColorStop(1, stoneDark);
      ctx.fillStyle = gradCyl;
      ctx.beginPath();
      ctx.arc(this.x, this.y + 5, radius, 0, Math.PI, false);
      ctx.lineTo(this.x - radius, this.y - 15);
      ctx.arc(this.x, this.y - 15, radius, Math.PI, 0, false);
      ctx.lineTo(this.x + radius, this.y + 5);
      ctx.fill();
      ctx.fillStyle = mainColor;
      ctx.fillRect(this.x - 10, this.y - 2, 20, 4);
    }

    ctx.save();
    ctx.translate(this.x, this.y - (this.type === "king" ? 15 : 20));
    ctx.rotate(this.angle);

    if (this.type === "king") {
      if (this.active) {
        ctx.fillStyle = "#ffd54f";
        ctx.strokeStyle = "#e65100";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(0, -14, 32, 28);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#3e2723";
        ctx.fillRect(30, -10, 4, 20);
        ctx.fillStyle = darkerColor;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = stoneDark;
      ctx.fillRect(-5, -5, 10, 10);
      ctx.fillStyle = darkerColor;
      ctx.fillRect(0, -8, 25, 16);
      ctx.fillStyle = mainColor;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isBlue ? "#fff" : "#333";
      ctx.beginPath();
      ctx.arc(5, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (this.type === "king" && !this.active) {
      ctx.fillStyle = stoneDark;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y - 15, 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Zzz...", this.x, this.y - 30);
    }
    if (this.type === "king" && this.activationTimer > 0) {
      ctx.fillStyle = "#ffeb3b";
      ctx.font = "bold 30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("!", this.x, this.y - 40);
    }

    // VISUAL LASER INFERNO TOWER
    if (
      this.type === "inferno_tower" &&
      this.target &&
      !this.target.dead &&
      this.active
    ) {
      ctx.save();
      ctx.strokeStyle = "red";
      ctx.lineWidth = Math.min(8, 2 + (120 - this.attackTimer) / 10);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 20);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.stroke();
      ctx.restore();
    }

    this.drawOutline(ctx);
    this.drawHp(ctx);
    ctx.restore();
  }
}
