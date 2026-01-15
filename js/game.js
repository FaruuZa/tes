/**
 * GAME.JS - FIXED ENDGAME & LOGIC
 */

class GameEngine {
  constructor() {
    this.reset();
    this.loop = this.loop.bind(this);

    this.botCommander = null;
  }

  reset() {
    this.units = [];
    this.buildings = [];
    this.towers = [];
    this.projectiles = [];
    this.effects = [];
    this.pendingSpells = [];
    this.spellAreas = [];
    this.elixir = 5;
    this.botElixir = 5;
    this.gameOver = false;
    this.scale = 1;
    this.matchTime = 180;
    this.isOvertime = false;
    this.elixirRate = 1;
    this.tiebreaker = false;
    this.frameCount = 0;
    this.selectedCardIdx = -1;
    this.mouseX = 0;
    this.mouseY = 0;
  }

  startBattle(deck) {
    this.reset();
    this.playerDeck = [...deck];
    this.initArena();

    // === TAMBAHKAN INI ===
    // Pilih difficulty (bisa dari UI nanti)

    const difficulty = this.selectedDifficulty || "normal";
    this.botCommander = new BotCommander(difficulty);

    requestAnimationFrame(this.loop);

    // Hapus old bot interval
    if (this.botInterval) clearInterval(this.botInterval);
    // Tidak perlu lagi karena botCommander.makeDecision() dipanggil di loop
  }

  initArena() {
    Utils.resize(this);
    window.addEventListener("resize", () => Utils.resize(this));
    this.renderer = new Renderer();

    this.towers = [
      new Tower(100, 560, 0, "princess"),
      new Tower(340, 560, 0, "princess"),
      new Tower(220, 660, 0, "king"),
      new Tower(100, 140, 1, "princess"),
      new Tower(340, 140, 1, "princess"),
      new Tower(220, 40, 1, "king"),
    ];

    const shuf = [...this.playerDeck].sort(() => Math.random() - 0.5);
    this.playerHand = shuf.slice(0, 4);
    this.playerQueue = shuf.slice(4);
    this.nextCard = this.playerQueue[0];

    this.botDeck = this.generateBalancedBotDeck();
    this.botHand = this.botDeck.slice(0, 4);
    this.botQueue = this.botDeck.slice(4);

    UI.renderHand();
    this.setupInput();
  }

  generateBalancedBotDeck() {
    const allKeys = Object.keys(CARDS).filter((k) => !CARDS[k].hiddenInDeck);
    const winConds = allKeys.filter(
      (k) =>
        CARDS[k].tags &&
        (CARDS[k].tags.includes("building-hunter") ||
          CARDS[k].tags.includes("heavy"))
    );
    const spells = allKeys.filter((k) => CARDS[k].type === "spell");
    const others = allKeys.filter(
      (k) => !winConds.includes(k) && !spells.includes(k)
    );
    const deck = [];
    if (winConds.length)
      deck.push(winConds[Math.floor(Math.random() * winConds.length)]);
    if (spells.length)
      deck.push(spells[Math.floor(Math.random() * spells.length)]);
    while (deck.length < 8) {
      const p = others.length ? others : allKeys;
      const k = p[Math.floor(Math.random() * p.length)];
      if (!deck.includes(k)) deck.push(k);
    }
    return deck;
  }

  cycleCard(idx) {
    const used = this.playerHand[idx];
    this.playerHand[idx] = this.playerQueue.shift();
    this.playerQueue.push(used);
    this.nextCard = this.playerQueue[0];
  }

  botCycle(idx) {
    const used = this.botHand[idx];
    this.botHand[idx] = this.botQueue.shift();
    this.botQueue.push(used);
  }

  checkPlacement(x, y, type, radius = 20) {
    if (type === "building") {
      const obstacles = [...this.buildings, ...this.towers];
      for (let o of obstacles) {
        if (o.dead) continue;
        if (Utils.getDist({ x: x, y: y }, o) < o.radius + radius - 5)
          return false;
      }
    }
    return true;
  }

  spawnCard(key, x, y, team) {
    const cardData = CARDS[key];
    if (!cardData) return;

    if (cardData.type === "spell") {
      const delaySec =
        cardData.stats.spawnDelay !== undefined ? cardData.stats.spawnDelay : 1;
      this.pendingSpells.push({
        key: key,
        x: x,
        y: y,
        team: team,
        timer: delaySec * 60,
        maxTimer: delaySec * 60,
        radius: (cardData.stats.radius || 2.5) * CONFIG.gridSize,
      });
      return;
    }

    if (cardData.type === "unit") {
      const count = cardData.stats.count || 1;

      if (cardData.spawnEffect) {
        const eff = cardData.spawnEffect;
        const rPx = eff.radius * CONFIG.gridSize;
        this.effects.push(new Effect(x, y, rPx, "white"));
        if (eff.type === "zap") {
          this.dealAreaDamage(x, y, rPx, eff.dmg, team, "stun");
          this.effects.push(new Effect(x, y, rPx, "#ffeb3b"));
        } else if (eff.type === "slow") {
          this.spellAreas.push(
            new SpellArea(x, y, rPx, "freeze_visual", eff.duration, team)
          );
        } else if (eff.type === "damage") {
          this.dealAreaDamage(x, y, rPx, eff.dmg, team, "damage");
          this.effects.push(new Effect(x, y, rPx, "orange"));
        }
      }

      for (let i = 0; i < count; i++) {
        let ox = 0,
          oy = 0;
        if (count > 1) {
          if (count > 4) {
            const angle = ((Math.PI * 2) / count) * i;
            ox = Math.cos(angle) * 30;
            oy = Math.sin(angle) * 30;
          } else {
            ox = (i - (count - 1) / 2) * 20;
          }
        }
        const u = new Unit(x + ox, y + oy, team, key);
        if (team !== 0) u.deployTimer = 0;
        this.units.push(u);
      }
    } else if (cardData.type === "building") {
      const b = new Building(x, y, team, key);
      if (team !== 0) b.deployTimer = 0;
      this.buildings.push(b);
    }
  }

  botPlay() {
    if (this.gameOver || this.tiebreaker) return;

    // === GUNAKAN BOT COMMANDER ===
    if (this.botCommander) {
      this.botCommander.makeDecision(this);
      this.botCommander.observePlayer(this);
    }
  }

  botSmartSpell() {
    const spellIdx = this.botHand.findIndex(
      (k) => k && CARDS[k].type === "spell"
    );
    if (spellIdx === -1) return false;
    const key = this.botHand[spellIdx];
    const card = CARDS[key];
    if (this.botElixir < card.cost) return false;

    // Finish Tower Logic
    const killableTower = this.towers.find(
      (t) => t.team === 0 && !t.dead && t.hp <= (card.stats.dmg || 0)
    );
    if (killableTower) {
      this.botElixir -= card.cost;
      this.spawnCard(key, killableTower.x, killableTower.y, 1);
      this.botCycle(spellIdx);
      return true;
    }
    return false;
  }

  botDefend(enemy) {
    let idx = this.botHand.findIndex(
      (k) => CARDS[k].type === "unit" && CARDS[k].cost <= this.botElixir
    );
    if (idx !== -1) {
      const key = this.botHand[idx];
      this.botElixir -= CARDS[key].cost;
      this.spawnCard(key, enemy.x, enemy.y - 100, 1);
      this.botCycle(idx);
    }
  }

  botAttack() {
    const idx = this.botHand.findIndex((k) => CARDS[k].type === "unit");
    if (idx !== -1) {
      const key = this.botHand[idx];
      this.botElixir -= CARDS[key].cost;
      this.spawnCard(key, 100 + Math.random() * 200, 100, 1);
      this.botCycle(idx);
    }
  }

  dealAreaDamage(x, y, radius, dmg, team, type = "damage", hitAir = true) {
    const targets = [...this.units, ...this.towers, ...this.buildings];
    for (let t of targets) {
      if (t.team === team && type !== "rage") continue;
      if (t.team !== team && type === "rage") continue;
      if (t.isHidden) continue;
      if (t.tags && t.tags.includes("air") && !hitAir) continue;

      if (!t.dead && Utils.getDist({ x, y }, t) < radius + t.radius) {
        if (type === "damage") t.takeDamage(dmg);
        else if (type === "stun") t.applyStun(0.5, "zap");
        else if (type === "freeze") t.applyStun(4, "freeze");
        else if (type === "rage") t.applyRage(0.4);
      }
    }
  }

  updatePendingSpells() {
    for (let i = this.pendingSpells.length - 1; i >= 0; i--) {
      const spell = this.pendingSpells[i];
      spell.timer--;
      if (spell.timer <= 0) {
        this.executeSpellEffect(spell);
        this.pendingSpells.splice(i, 1);
      }
    }
  }

  executeSpellEffect(spell) {
    const key = spell.key;
    const x = spell.x;
    const y = spell.y;
    const team = spell.team;
    const cardData = CARDS[key];
    const stats = cardData.stats;
    const radius = spell.radius;
    const dmg = stats.dmg || 0;

    if (key === "goblin_barrel") {
      for (let i = 0; i < 3; i++) {
        const angle = ((Math.PI * 2) / 3) * i;
        const u = new Unit(
          x + Math.cos(angle) * 30,
          y + Math.sin(angle) * 30,
          team,
          "goblins"
        );
        u.deployTimer = 45;
        this.units.push(u);
      }
      this.effects.push(new Effect(x, y, radius, "#4caf50"));
      return;
    }

    if (key === "the_log") {
      const angle = team === 0 ? -Math.PI / 2 : Math.PI / 2;
      const p = new Projectile(
        x,
        y,
        null,
        dmg,
        team,
        false,
        true,
        false,
        0,
        0,
        false,
        0,
        0,
        "rolling_log",
        stats.projSpeed || 3.5,
        (stats.range || 10.5) * CONFIG.gridSize,
        null
      );
      p.angle = angle;
      p.dx = Math.cos(angle);
      p.dy = Math.sin(angle);
      p.hitAir = false;
      this.projectiles.push(p);
      return;
    }

    if (key === "earthquake") {
      this.spellAreas.push(
        new SpellArea(x, y, radius, "earthquake", 3, team, dmg)
      );
      return;
    }
    if (key === "void") {
      this.spellAreas.push(new SpellArea(x, y, radius, "void", 2, team, dmg));
      return;
    }
    if (key === "meteor") {
      this.effects.push(new Effect(x, y, radius + 20, "#d84315"));
      this.dealAreaDamage(x, y, radius, dmg, team, "damage");
      return;
    }

    let effectColor = "orange";
    if (key === "freeze") effectColor = "#00e5ff";
    if (key === "rage") effectColor = "#ab47bc";
    if (key === "zap" || key === "lightning") effectColor = "#ffeb3b";

    if (key === "rage" || key === "freeze") {
      this.spellAreas.push(
        new SpellArea(
          x,
          y,
          radius,
          key === "rage" ? "rage" : "freeze_visual",
          key === "rage" ? stats.rageDuration : stats.stunDuration,
          team,
          stats.rageBoost
        )
      );
      if (key === "freeze")
        this.dealAreaDamage(x, y, radius, 0, team, "freeze");
      else if (key === "rage")
        this.dealAreaDamage(x, y, radius, 0, team, "rage");
    } else if (key === "lightning") {
      let targets = [...this.units, ...this.buildings, ...this.towers].filter(
        (t) =>
          t.team !== team &&
          !t.dead &&
          !t.isHidden &&
          Utils.getDist({ x, y }, t) < radius
      );
      targets.sort((a, b) => b.hp - a.hp);
      targets.slice(0, 3).forEach((t, i) => {
        setTimeout(() => {
          if (!t.dead) {
            t.takeDamage(dmg);
            t.applyStun(0.5, "zap");
            this.effects.push(new LightningEffect(x, y - 100, t.x, t.y));
          }
        }, i * 200);
      });
    } else {
      this.effects.push(new Effect(x, y, radius, effectColor));
      if (key === "zap") this.dealAreaDamage(x, y, radius, dmg, team, "stun");
      else this.dealAreaDamage(x, y, radius, dmg, team);
    }
  }

  // --- RESTORED ENDGAME FUNCTION ---
  endGame(msg) {
    this.gameOver = true;
    const ov = document.getElementById("message-overlay");
    const txt = document.getElementById("msg-text");
    if (ov && txt) {
      ov.style.display = "flex";
      txt.innerText = msg;
    }
  }

  setupInput() {
    const updateInputPos = (cx, cy) => {
      const r = CANVAS.getBoundingClientRect();
      const ox = (CANVAS.width - CONFIG.logicWidth * this.scale) / 2;
      const oy = (CANVAS.height - CONFIG.logicHeight * this.scale) / 2;
      this.mouseX = (cx - r.left - ox) / this.scale;
      this.mouseY = (cy - r.top - oy) / this.scale;
    };

    const handleInput = (e) => {
      let cx = e.touches ? e.touches[0].clientX : e.clientX;
      let cy = e.touches ? e.touches[0].clientY : e.clientY;
      updateInputPos(cx, cy);
    };

    CANVAS.addEventListener("mousemove", handleInput);

    const tap = (e) => {
      e.preventDefault();
      handleInput(e);
      if (this.gameOver || this.selectedCardIdx === -1 || this.tiebreaker)
        return;

      const idx = this.selectedCardIdx;
      const k = this.playerHand[idx];
      if (!k || !CARDS[k]) return;
      const d = CARDS[k];
      const gx = Math.round(this.mouseX / CONFIG.gridSize) * CONFIG.gridSize;
      const gy = Math.round(this.mouseY / CONFIG.gridSize) * CONFIG.gridSize;

      let isValid = true;
      if (gx < 20 || gx >= CONFIG.logicWidth - 20) isValid = false;
      if (d.type !== "spell") {
        if (gy > 335 && gy < 365) isValid = false;
        if (gy < 330) isValid = false; // Area Musuh
        if (!this.checkPlacement(gx, gy, d.type)) isValid = false;
      } else {
        if (d.tags && d.tags.includes("log") && gy < 320) isValid = false;
      }

      if (isValid) {
        if (this.elixir >= d.cost - 0.01) {
          this.elixir -= d.cost;
          this.spawnCard(k, gx, gy, 0);
          this.cycleCard(idx);
          this.selectedCardIdx = -1;
          UI.renderHand();
        } else {
          const hud = document.getElementById("hud-layer");
          hud.style.animation = "none";
          hud.offsetHeight;
          hud.style.animation = "shake 0.3s";
        }
      }
    };
    CANVAS.addEventListener("mousedown", tap);
    CANVAS.addEventListener("touchstart", tap, { passive: false });
  }

  loop() {
    if (this.gameOver) return;
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      if (this.matchTime > 0) this.matchTime--;
      else {
        if (!this.isOvertime) {
          this.isOvertime = true;
          this.matchTime = 120;
          this.elixirRate = 2;
        } else if (!this.tiebreaker) {
          this.tiebreaker = true;
          document.getElementById("tiebreaker-msg").style.display = "block";
        }
      }
      if (!this.isOvertime && this.matchTime <= 60) this.elixirRate = 2;
      const mins = Math.floor(this.matchTime / 60);
      const secs = this.matchTime % 60;
      const tb = document.getElementById("timer-box");
      if (tb) {
        tb.innerText = `${mins}:${secs < 10 ? "0" + secs : secs}`;
        if (this.isOvertime) tb.classList.add("overtime");
      }
      if (this.elixirRate === 2)
        document.getElementById("elixir-rate").style.display = "block";
    }

    if (this.tiebreaker && this.frameCount % 30 === 0)
      this.towers.forEach((t) => t.takeDamage(50));

    const eRate = CONFIG.baseElixirRate * this.elixirRate;
    if (this.elixir < CONFIG.maxElixir) {
      this.elixir += 0.016 * eRate;
      UI.updateElixirUI();
    }
    if (this.botElixir < CONFIG.maxElixir) this.botElixir += 0.016 * eRate;
    const bel = document.getElementById("bot-elixir-value");
    if (bel) bel.innerText = Math.floor(this.botElixir);

    this.botPlay();

    [...this.units, ...this.towers, ...this.buildings].forEach((e) =>
      e.update(this)
    );
    this.projectiles.forEach((p) => p.update(this));
    this.effects.forEach((e) => e.update());
    this.spellAreas.forEach((s) => s.update(this));
    this.updatePendingSpells();

    this.units = this.units.filter((u) => !u.dead);
    this.buildings = this.buildings.filter((b) => !b.dead);
    this.towers = this.towers.filter((t) => !t.dead);
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.effects = this.effects.filter((e) => e.life > 0);
    this.spellAreas = this.spellAreas.filter((s) => !s.dead);

    const pk = this.towers.find((t) => t.team === 0 && t.type === "king");
    const ek = this.towers.find((t) => t.team === 1 && t.type === "king");
    if (!pk) this.endGame("ENEMY WINS");
    else if (!ek) this.endGame("YOU WIN");

    this.renderer.renderGame(this);
    requestAnimationFrame(this.loop);
  }
}

const GAME = new GameEngine();
