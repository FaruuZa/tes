class Renderer {
    constructor() {
        this.frameCount = 0;
    }

    renderGame(game) {
        const ctx = CTX; 
        const canvas = CANVAS;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        
        const ox = (canvas.width - CONFIG.logicWidth * game.scale) / 2;
        const oy = (canvas.height - CONFIG.logicHeight * game.scale) / 2;
        ctx.translate(ox, oy);
        ctx.scale(game.scale, game.scale);

        this.drawBoard(ctx);
        game.spellAreas.forEach(s => this.drawSpellArea(ctx, s));

        const allEntities = [...game.towers, ...game.buildings, ...game.units];
        allEntities.sort((a, b) => a.y - b.y);
        allEntities.forEach(e => this.drawEntity(ctx, e));

        game.projectiles.forEach(p => this.drawProjectile(ctx, p));
        game.effects.forEach(e => {
            if (e.x1 !== undefined) this.drawLightning(ctx, e);
            else this.drawEffect(ctx, e);
        });

        this.drawPendingSpells(ctx, game);
        this.drawPlacementGhost(ctx, game);

        ctx.restore();
    }

    drawBoard(ctx) {
        ctx.fillStyle = "#1b5e20"; ctx.fillRect(0, 0, CONFIG.logicWidth, CONFIG.logicHeight);
        ctx.fillStyle = "#4caf50"; ctx.fillRect(20, 0, CONFIG.logicWidth - 40, CONFIG.logicHeight);
        ctx.fillStyle = "#03a9f4"; ctx.fillRect(0, 335, CONFIG.logicWidth, 30); 
        ctx.fillStyle = "#795548"; ctx.fillRect(70, 330, 60, 40); ctx.fillRect(310, 330, 60, 40);
        ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
        for (let x = 20; x <= CONFIG.logicWidth - 20; x += CONFIG.gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CONFIG.logicHeight); ctx.stroke(); }
        for (let y = 0; y <= CONFIG.logicHeight; y += CONFIG.gridSize) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(CONFIG.logicWidth - 20, y); ctx.stroke(); }
        ctx.fillStyle = "rgba(255,0,0,0.1)"; ctx.fillRect(20, 0, CONFIG.logicWidth - 40, 335);
    }

    drawEntity(ctx, entity, isGhost = false) {
        if (!entity.visuals && CARDS[entity.key]) entity.visuals = CARDS[entity.key].visuals || {};
        const v = entity.visuals || {};
        
        if(entity instanceof Tower) { this.drawTower(ctx, entity); return; }
        if(entity instanceof Building) { this.drawBuilding(ctx, entity, isGhost); return; }

        const scale = (v.scale || 1.0);
        let visualBase = 12; 
        if(entity.tags && entity.tags.includes('heavy')) visualBase = 22;
        const r = visualBase * scale; 

        const teamColor = entity.team === 0 ? "#42a5f5" : "#ef5350";
        
        ctx.save();
        if (isGhost) ctx.globalAlpha = 0.6;

        // Draw Aura (Lantai)
        if (!isGhost) this.drawAuraVisuals(ctx, entity);

        // 1. AREA DAMAGE INDICATOR (Lingkaran Putih/Merah putus-putus)
        if (!isGhost && entity.splashRadius > 0) {
            ctx.save();
            ctx.strokeStyle = entity.team === 0 ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 0, 0, 0.2)";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(entity.x, entity.y, entity.splashRadius, 0, Math.PI*2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw Status & Timer
        if (entity.deployTimer > 0 && !isGhost) this.drawDeployTimer(ctx, entity, r);
        if (!isGhost) this.drawStatusOutline(ctx, entity, r);
        
        // Shadow
        const shadowY = entity.isAir ? entity.y + r * 1.5 : entity.y + r * 0.2;
        ctx.fillStyle = "rgba(0,0,0,0.2)"; 
        ctx.beginPath(); ctx.ellipse(entity.x, shadowY, r, r*0.6, 0, 0, Math.PI*2); ctx.fill();

        // Transformasi Rotasi & Jump
        let jumpOffset = 0;
        if (entity.isJumping && entity.jumpPhase === 1 && typeof Utils !== 'undefined') {
             const totalDist = Utils.getDist({x:entity.jumpStartX, y:entity.jumpStartY}, {x:entity.jumpTargetX, y:entity.jumpTargetY});
             const currentDist = Utils.getDist(entity, {x:entity.jumpStartX, y:entity.jumpStartY});
             if(totalDist > 0) jumpOffset = -Math.sin((currentDist/totalDist) * Math.PI) * 150;
        }
        
        const drawY = entity.y + jumpOffset - (entity.isAir ? 15 : 0);
        ctx.translate(entity.x, drawY);
        
        // Charge Trail (Prince/Dark Prince)
        if (entity.isCharging) {
            ctx.save(); ctx.rotate(entity.angle + Math.PI/2);
            ctx.globalAlpha = 0.3; ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.arc(0, 15, r * 0.8, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(0, 30, r * 0.6, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }

        ctx.rotate(entity.angle + Math.PI/2); 

        // 2. DRAW BODY (Include Wings & Propellers Animation)
        this.drawModularBody(ctx, v.body, r, teamColor, v);
        this.drawModularHead(ctx, v.head, r, teamColor, v);
        
        // 3. DRAW WEAPON (Include Attack Animation)
        let anim = 0;
        if (entity.isAttacking) {
            // Animasi tusukan saat akan hit
            const progress = 1 - (entity.attackTimer / entity.hitSpeed);
            if (progress > 0.7) { 
                anim = Math.sin((progress - 0.7) * 10) * 12; 
            }
        }
        
        // Pass 'entity' untuk cek hasWeapon (Executioner)
        this.drawModularWeapon(ctx, v.weapon, r, anim, v, entity);

        ctx.restore();

        // Inferno Laser Beam
        if (!isGhost && entity.key === 'inferno_dragon' && entity.target && !entity.target.dead && entity.stunned <= 0) {
             const dist = Utils.getDist(entity, entity.target);
             if (dist <= entity.range + entity.target.radius + 10) {
                 ctx.save();
                 ctx.translate(0, jumpOffset);
                 ctx.strokeStyle = "#ff9100";
                 // Semakin lama nembak (rampStage naik), laser makin tebal
                 const thickness = Math.min(8, 2 + (entity.rampStage || 0) * 0.2);
                 ctx.lineWidth = thickness;
                 
                 // Efek getar laser
                 const jitter = (Math.random() - 0.5) * thickness;
                 
                 ctx.beginPath(); 
                 ctx.moveTo(entity.x, entity.y - 15); 
                 ctx.lineTo(entity.target.x + jitter, entity.target.y + jitter); 
                 ctx.stroke();
                 
                 // Kilatan di target
                 ctx.fillStyle = "yellow";
                 ctx.beginPath(); ctx.arc(entity.target.x, entity.target.y, thickness*1.5, 0, Math.PI*2); ctx.fill();
                 ctx.restore();
             }
        }

        if (!isGhost) {
            const oldY = entity.y;
            entity.y = drawY; 
            this.drawHpAndName(ctx, entity, r); 
            entity.y = oldY;
        }
    }

    // --- NEW: AURA VISUALIZATION SYSTEM ---
    drawAuraVisuals(ctx, entity) {
        // Cek apakah unit punya efek aura di datanya
        if (!entity.effects || !entity.effects.aura) return;

        const t = Date.now() / 1000; // Timer untuk animasi

        entity.effects.aura.forEach(eff => {
            const r = (eff.radius || 3) * CONFIG.gridSize;

            ctx.save();
            ctx.translate(entity.x, entity.y);

            // 1. HEAL AURA (Battle Healer style: Hijau + Cincin Berputar)
            if (eff.type === 'heal') {
                // Background Soft
                const alpha = 0.1 + Math.abs(Math.sin(t * 2)) * 0.1; // Denyut transparansi
                ctx.fillStyle = `rgba(0, 230, 118, ${alpha})`;
                ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

                // Cincin Putus-putus Berputar
                ctx.rotate(t * 0.5);
                ctx.strokeStyle = "rgba(0, 230, 118, 0.4)";
                ctx.lineWidth = 2;
                ctx.setLineDash([15, 10]); // Garis putus-putus
                ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
            }
            
            // 2. RAGE / DAMAGE AURA (Merah/Ungu + Gelombang Keluar)
            else if (eff.type === 'rage' || eff.type === 'damage') {
                const colorBase = eff.type === 'rage' ? "170, 0, 255" : "255, 87, 34"; // Ungu / Merah Orange
                
                // Base
                ctx.fillStyle = `rgba(${colorBase}, 0.1)`;
                ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

                // Ripple (Gelombang membesar)
                const pulse = (t * 1.5) % 1; // 0 ke 1
                ctx.strokeStyle = `rgba(${colorBase}, ${1 - pulse})`; // Fade out saat membesar
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(0, 0, r * pulse, 0, Math.PI * 2); ctx.stroke();
            }

            // 3. SLOW AURA (Ice Wiz style: Biru + Partikel Salju Statis)
            else if (eff.type === 'slow') {
                ctx.fillStyle = "rgba(41, 182, 246, 0.15)";
                ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
                
                // Border Es
                ctx.strokeStyle = "rgba(41, 182, 246, 0.5)";
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
            }

            ctx.restore();
        });
    }

    // --- MODULAR HELPERS ---
    drawModularBody(ctx, type, r, color, visuals) {
        // --- ANIMASI SAYAP (WINGS) ---
        if (visuals.hasWings) {
            const time = Date.now() / 1000;
            const flapSpeed = 15;
            const flapAmp = 0.3;
            const flap = Math.sin(time * flapSpeed) * flapAmp;
            
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            
            // Sayap Kiri
            ctx.save();
            ctx.translate(-r * 0.8, 0);
            ctx.rotate(-0.2 + flap); 
            ctx.beginPath(); ctx.ellipse(-r*0.5, 0, r*0.6, r*0.8, 0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
            
            // Sayap Kanan
            ctx.save();
            ctx.translate(r * 0.8, 0);
            ctx.rotate(0.2 - flap);
            ctx.beginPath(); ctx.ellipse(r*0.5, 0, r*0.6, r*0.8, 0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
            
            ctx.restore();
        }

        // Render Body
        if (VISUALS.bodies[type]) {
            VISUALS.bodies[type](ctx, r, visuals.skin || color);
        } else {
            VISUALS.bodies['default'](ctx, r, visuals.skin || color);
        }
        
        // --- ANIMASI PROPELLER (BALING-BALING) ---
        if (visuals.hasPropeller) {
            ctx.save();
            ctx.rotate(Date.now() / 100); 
            ctx.fillStyle = "#bdbdbd";
            const propSize = r * 2.8;
            ctx.fillRect(-2, -propSize/2, 4, propSize);
            ctx.fillRect(-propSize/2, -2, propSize, 4);
            ctx.fillStyle = "#3e2723";
            ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
    }

    drawModularHead(ctx, type, r, color, visuals) {
        if (VISUALS.heads[type]) {
            VISUALS.heads[type](ctx, r, color);
        } else {
            VISUALS.heads['default'](ctx, r, color);
        }
    }

    drawModularWeapon(ctx, type, r, anim, visuals, entity) {
        if (!type || type === 'none') return;
        
        // Cek jika Executioner sedang melempar senjata
        if (entity && entity.hasWeapon === false) return;

        // Tentukan Posisi Tangan
        const positions = [];
        if (type.startsWith('dual_') || type === 'fist' || type === 'mace_hands') {
            positions.push({ x: -r * 0.6, y: 0 }); // Kiri
            positions.push({ x: r * 0.6, y: 0 });  // Kanan
        } else if (type === 'bow' || type.includes('rifle') || type === 'cannon_hand') {
            positions.push({ x: 0, y: -r * 0.2 }); // Tengah
        } else {
            positions.push({ x: r * 0.7, y: 0 }); // Kanan
        }

        const drawFn = VISUALS.weapons[type] || VISUALS.weapons['sword'];

        positions.forEach(pos => {
            ctx.save();
            // Terapkan animasi serangan (maju mundur)
            ctx.translate(0, -anim); 
            drawFn(ctx, r, pos);
            ctx.restore();
        });
    }

    drawDeployTimer(ctx, entity, r) {
        if (!entity.maxDeployTimer) return;
        const progress = entity.deployTimer / entity.maxDeployTimer;
        ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.arc(entity.x, entity.y, r + 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; ctx.beginPath(); ctx.moveTo(entity.x, entity.y);
        ctx.arc(entity.x, entity.y, r + 3, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress)); ctx.lineTo(entity.x, entity.y); ctx.fill(); ctx.restore();
    }

    // DALAM CLASS RENDERER
    drawStatusOutline(ctx, entity, r) {
        if (entity.isHidden) return;
        let color = null; let progress = 1;
        
        if (entity.stunned > 0) { 
            color = entity.freezeActive ? "#00e5ff" : "yellow"; 
            progress = entity.stunned / (entity.maxStunned || 60); 
        } 
        else if (entity.rageBoosted > 0) { 
            color = "#f50057"; progress = 1; 
        } 
        else if (entity.slowed > 0) { 
            color = "#00bcd4"; progress = entity.slowed / (entity.maxSlow || 60); 
        }
        // NEW: POISON VISUAL
        else if (entity.poisoned > 0) {
            color = "#76ff03"; // Lime Green
            progress = entity.poisoned / (entity.maxPoison || 60);
        }

        progress = Math.max(0, Math.min(1, progress));
        
        if (color) {
            ctx.save(); 
            ctx.shadowBlur = 5; ctx.shadowColor = color; 
            ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = "round";
            
            // Gambar ring status
            ctx.beginPath(); 
            ctx.arc(entity.x, entity.y, r + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress)); 
            ctx.stroke(); 
            
            // Icon Poison kecil
            if (entity.poisoned > 0) {
                ctx.fillStyle = color; ctx.font = "10px Arial"; ctx.fillText("☠️", entity.x + r, entity.y - r);
            }
            
            ctx.restore();
        }
    }

    drawHpAndName(ctx, entity, visualRadius) {
        if (entity.isHidden) return;
        const r = visualRadius || entity.radius;
        const barY = entity.y - r - 15;
        this.drawHpBarOnly(ctx, entity, barY);
        const name = CARDS[entity.key] ? CARDS[entity.key].name : "";
        if(name) { ctx.save(); ctx.font = "bold 10px Arial"; ctx.textAlign = "center"; ctx.lineWidth = 3; ctx.strokeStyle = "black"; ctx.strokeText(name, entity.x, barY - 5); ctx.fillStyle = "white"; ctx.fillText(name, entity.x, barY - 5); ctx.restore(); }
    }

    drawHpBarOnly(ctx, entity, yPos) {
        ctx.fillStyle = "#000"; ctx.fillRect(entity.x - 16, yPos - 1, 32, 6);
        ctx.fillStyle = "#333"; ctx.fillRect(entity.x - 15, yPos, 30, 4);
        const pct = Math.max(0, entity.hp / entity.maxHp);
        ctx.fillStyle = entity.team === 0 ? "#4caf50" : "#f44336";
        ctx.fillRect(entity.x - 15, yPos, 30 * pct, 4);
        if (entity.shield > 0) { 
            const shieldPct = Math.min(1, entity.shield / entity.maxShield);
            ctx.fillStyle = "#ffffff"; ctx.fillRect(entity.x - 15, yPos, 30 * shieldPct, 4); 
            ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.strokeRect(entity.x - 15, yPos, 30 * shieldPct, 4);
        }
    }

    drawTower(ctx, t) {
        ctx.save();
        const stoneColor = t.team === 0 ? "#90a4ae" : "#5d4037";
        const teamColor = t.team === 0 ? "#42a5f5" : "#ef5350";
        const darkerColor = t.team === 0 ? "#1565c0" : "#c62828";
        ctx.save(); ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(t.x, t.y+5, 30, 20, 0, 0, Math.PI*2); ctx.fill();
        if(t.type==='king') {
            const size = 50; const half = size / 2;
            ctx.fillStyle = stoneColor; ctx.fillRect(t.x - half, t.y - half, size, size);
            ctx.fillStyle = '#222'; ctx.fillRect(t.x - 10, t.y + 10, 20, 15); 
        } else {
            ctx.fillStyle = stoneColor; ctx.beginPath(); ctx.arc(t.x, t.y, 22, 0, Math.PI*2); ctx.fill();
        }
        ctx.save(); 
        const turretOffset = t.type === 'king' ? 5 : 5; 
        ctx.translate(t.x, t.y - turretOffset);
        ctx.rotate(t.angle);
        if(t.type==='king') {
            if (t.active) {
                ctx.fillStyle = "#ffd54f"; ctx.fillRect(0, -14, 32, 28); 
                ctx.fillStyle = darkerColor; ctx.beginPath(); ctx.arc(0,0, 18, 0, Math.PI*2); ctx.fill();
            } else {
                ctx.fillStyle = darkerColor; ctx.beginPath(); ctx.arc(0,0, 16, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = teamColor; ctx.beginPath(); ctx.arc(0,0, 10, 0, Math.PI*2); ctx.fill();
            }
        } else {
            ctx.fillStyle = darkerColor; ctx.fillRect(0, -8, 25, 16); 
            ctx.fillStyle = teamColor; ctx.beginPath(); ctx.arc(0,0, 12, 0, Math.PI*2); ctx.fill(); 
        }
        ctx.restore();
        if(t.type==='king' && !t.active) { ctx.fillStyle = '#fff'; ctx.font = "bold 20px Arial"; ctx.textAlign="center"; ctx.fillText("Zzz", t.x, t.y-35); }
        this.drawStatusOutline(ctx, t, t.radius + 5);
        if (t.type === "inferno_tower" && t.active && t.target && !t.target.dead && t.stunned <= 0) {
            const dist = Utils.getDist(t, t.target);
            if (dist <= t.range + t.target.radius) {
                ctx.save(); ctx.strokeStyle = "red"; ctx.lineWidth = Math.min(8, 2 + (120 - t.attackTimer) / 10); ctx.beginPath(); ctx.moveTo(t.x, t.y - 20); ctx.lineTo(t.target.x, t.target.y); ctx.stroke(); ctx.restore();
            }
        }
        const isEnemy = t.team === 1; const barY = isEnemy ? t.y + 45 : t.y - 65; this.drawHpBarOnly(ctx, t, barY); ctx.restore();
    }

    // DALAM FILE RENDERER.JS

    drawBuilding(ctx, b, isGhost) {
        ctx.save();
        if(isGhost) ctx.globalAlpha = 0.6;
        
        const data = CARDS[b.key];
        const color = data ? (data.color || '#888') : '#888';
        const teamColor = b.team === 0 ? "#42a5f5" : "#ef5350";
        const visuals = data ? data.visuals : null; // Cek visual custom
        
        ctx.translate(b.x, b.y);
        
        // --- LOGIKA VISUAL BARU ---
        // Jika building punya visual body (seperti Phoenix Egg), gunakan drawModularBody
        if (visuals && visuals.body) {
            const scale = visuals.scale || 1.0;
            const r = 20 * scale; // Radius building
            
            // Render Modular Body (seperti unit)
            this.drawModularBody(ctx, visuals.body, r, visuals.skin || color, visuals);
            
            // Render Head (jika ada)
            if (visuals.head && visuals.head !== 'none') {
                this.drawModularHead(ctx, visuals.head, r, teamColor, visuals);
            }
        } 
        // --- VISUAL KOTAK DEFAULT (Legacy) ---
        else {
            if (b.isHidden && !isGhost) { 
                ctx.fillStyle = '#5d4037'; ctx.fillRect(-18, -18, 36, 36); 
            } else {
                // Base
                ctx.fillStyle = '#757575'; ctx.fillRect(-20, -20, 40, 40); 
                ctx.fillStyle = color; ctx.fillRect(-15, -15, 30, 30); 
                ctx.fillStyle = teamColor;
                
                // Visual Spesifik Sederhana
                if(b.key && (b.key.includes('hut') || b.key==='furnace')) { 
                    ctx.beginPath(); ctx.moveTo(-20,-15); ctx.lineTo(0,-35); ctx.lineTo(20,-15); ctx.fill(); 
                } else if (b.key && (b.key === 'cannon' || b.key === 'xbow' || b.key === 'mortar')) { 
                    ctx.save(); ctx.rotate(b.angle); ctx.fillStyle = '#333'; ctx.fillRect(0, -10, 30, 20); ctx.restore(); 
                }
            }
        }
        ctx.restore();
        
        if (!isGhost) {
            this.drawStatusOutline(ctx, b, 25);
            
            // Visual Inferno Laser
            if (b.key === 'inferno_tower' && b.target && !b.target.dead && b.rampStage > 0) {
                 if (typeof Utils !== 'undefined' && Utils.getDist({x:0,y:0}, {x:b.target.x - b.x, y:b.target.y - b.y}) <= b.range + b.target.radius) {
                     ctx.save();
                     ctx.strokeStyle = b.rampStage > 20 ? "red" : "orange";
                     ctx.lineWidth = Math.min(8, 2 + b.rampStage * 0.2);
                     ctx.beginPath(); ctx.moveTo(b.x, b.y - 30); ctx.lineTo(b.target.x, b.target.y); ctx.stroke();
                     ctx.restore();
                 }
            }

            // Lifetime Bar
            const lifePct = b.lifetime / b.maxLifetime;
            ctx.fillStyle = "#b388ff"; ctx.fillRect(b.x - 15, b.y + 18, 30 * lifePct, 3);
            
            this.drawHpAndName(ctx, b);
        }
    }

    drawPlacementGhost(ctx, game) {
        if (game.selectedCardIdx === -1) return;
        const k = game.playerHand[game.selectedCardIdx];
        const d = CARDS[k];
        if (!d) return;

        // Snap to Grid
        const gx = Math.round(game.mouseX / CONFIG.gridSize) * CONFIG.gridSize;
        const gy = Math.round(game.mouseY / CONFIG.gridSize) * CONFIG.gridSize;
        
        // Cek Validitas Posisi
        let isValid = true;
        if (gx < 20 || gx >= CONFIG.logicWidth - 20) isValid = false;
        
        if (d.type !== "spell") { 
            if (gy > 335 && gy < 365) isValid = false; // Sungai
            if (gy < 330) isValid = false; // Area musuh
            if (!game.checkPlacement(gx, gy, d.type)) isValid = false; 
        } else { 
            if (d.tags && d.tags.includes("log") && gy < 320) isValid = false; 
        }
        
        // 1. Gambar Indikator Merah jika Invalid
        if (!isValid) { 
            ctx.save();
            ctx.globalAlpha = 0.5; ctx.fillStyle = "red"; 
            ctx.beginPath(); ctx.arc(gx, gy, 20, 0, Math.PI*2); ctx.fill(); 
            ctx.restore();
        }
        
        // 2. Gambar Indikator Area Efek (Spawn/Death Effect)
        if (d.effects && d.effects.onSpawn) {
            d.effects.onSpawn.forEach(eff => {
                if (eff.radius) {
                    const color = eff.type === 'damage' ? "orange" : (eff.type === 'heal' ? "#00e676" : "#29b6f6");
                    this.drawAreaIndicator(ctx, gx, gy, eff.radius * CONFIG.gridSize, color);
                }
            });
        }
        
        // 3. INDICATOR RANGE SERANGAN (NEW)
        // Muncul untuk Building (Tower) dan Unit Ranged (range > 0)
        if (d.type !== "spell" && d.stats.range && d.stats.range > 0) {
            const rangePx = d.stats.range * CONFIG.gridSize;
            ctx.save();
            ctx.translate(gx, gy);
            
            // Lingkaran Range Putih Putus-putus
            ctx.beginPath(); 
            ctx.arc(0, 0, rangePx, 0, Math.PI * 2);
            
            // Fill Sangat Tipis
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fill();
            
            // Border Putus-putus
            ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 4]); 
            ctx.stroke();
            
            ctx.restore();
        }
        
        // 4. Gambar Ghost (Unit / Building / Spell)
        if (d.type === "spell") { 
            const r = (d.stats.radius || 2.5) * CONFIG.gridSize; 
            const color = isValid ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 0, 0, 0.4)";
            
            ctx.beginPath(); ctx.arc(game.mouseX, game.mouseY, r, 0, Math.PI*2); 
            ctx.fillStyle = color; ctx.fill(); 
            
            if (d.tags && d.tags.includes("log")) {
                const range = (d.stats.range || 10) * CONFIG.gridSize;
                ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
                ctx.strokeRect(gx - 30, gy - range, 60, range);
            }
        } 
        else { 
            const count = d.stats.count || 1; 
            for (let i = 0; i < count; i++) { 
                let ox = 0, oy = 0; 
                if (count > 1) { 
                    if (count > 4) { 
                        const angle = ((Math.PI * 2) / count) * i; 
                        ox = Math.cos(angle) * 30; oy = Math.sin(angle) * 30; 
                    } else { 
                        ox = (i - (count - 1) / 2) * 20; 
                    } 
                } 
                
                const dummy = {
                    x: gx + ox, y: gy + oy,
                    team: 0, key: k,
                    radius: (d.tags && d.tags.includes('heavy')) ? 16 : 9, 
                    angle: -Math.PI/2,
                    visuals: d.visuals || {},
                    tags: d.tags || [],
                    deployTimer: 0, hp: 100, maxHp: 100, shield: 0, maxShield: 0,
                    lifetime: 100, maxLifetime: 100, isHidden: false
                };
                
                if (d.type === 'building') {
                    this.drawBuilding(ctx, dummy, true); 
                } else {
                    this.drawEntity(ctx, dummy, true);
                }
            } 
        }
    }

    // Helper Baru untuk Gambar Lingkaran Area
    drawAreaIndicator(ctx, x, y, radiusPx, colorName) {
        ctx.save();
        ctx.fillStyle = colorName; 
        ctx.strokeStyle = "white";
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath(); 
        ctx.arc(x, y, radiusPx, 0, Math.PI * 2); 
        ctx.fill();
        
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.restore();
    }

    drawProjectile(ctx, p) {
        ctx.save(); ctx.translate(p.x, p.y);
        if (p.projType === "rolling_log") { ctx.rotate(p.angle + Math.PI / 2); ctx.fillStyle = "#5d4037"; ctx.fillRect(-15, -30, 30, 60); ctx.fillStyle = "#bdbdbd"; ctx.beginPath(); ctx.moveTo(-15,-20); ctx.lineTo(-20,-25); ctx.lineTo(-15,-10); ctx.fill(); ctx.beginPath(); ctx.moveTo(15,10); ctx.lineTo(20,5); ctx.lineTo(15,20); ctx.fill(); } 
        else if (p.projType === "boomerang") { ctx.rotate(p.rotation || 0); ctx.fillStyle = "#b0bec5"; ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle = "#e91e63"; ctx.beginPath(); ctx.arc(0,-10,6,0,Math.PI,true); ctx.fill(); ctx.beginPath(); ctx.arc(0,10,6,0,Math.PI,false); ctx.fill(); } 
        else if (p.projType === "rolling") { ctx.rotate(p.rotation || 0); ctx.fillStyle = "#3949ab"; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill(); } 
        else { 
            if (p.isSlow) ctx.fillStyle = "#29b6f6"; 
            else if (p.owner && p.owner.tags && p.owner.tags.includes('healer')) ctx.fillStyle = "#00e676";
            else ctx.fillStyle = "#fff"; 
            ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill(); 
        }
        ctx.restore();
    }


    // DALAM FILE RENDERER.JS

    drawPendingSpells(ctx, game) {
        game.pendingSpells.forEach(spell => {
            const progress = 1 - spell.timer / spell.maxTimer;
            const remainingPct = spell.timer / spell.maxTimer; // 1.0 -> 0.0
            const remainingSeconds = (spell.timer / 60).toFixed(1); 
            
            const isPlayer = spell.team === 0;
            // Base color netral, kita akan pakai warna spesifik spell nanti
            const baseWhite = "255, 255, 255"; 

            ctx.save();
            ctx.translate(spell.x, spell.y);

            // ===========================================
            // 1. UNIQUE GROUND INDICATORS (SEMUA SPELL)
            // ===========================================
            
            // --- THE LOG (Jalur Persegi Panjang) ---
            if (spell.key === "the_log") {
                const range = (CARDS["the_log"].stats.range || 10.5) * CONFIG.gridSize;
                const width = 60;
                ctx.fillStyle = `rgba(${baseWhite}, 0.15)`;
                ctx.fillRect(-width/2, -range, width, range);
                ctx.strokeStyle = `rgba(${baseWhite}, 0.5)`;
                ctx.lineWidth = 2;
                ctx.strokeRect(-width/2, -range, width, range);
                // Panah arah
                const arrowOffset = (Date.now() / 15 % 20) * 2;
                ctx.fillStyle = `rgba(${baseWhite}, 0.3)`;
                for(let y = -range + 20; y < 0; y += 40) {
                    ctx.beginPath(); ctx.moveTo(0, y - arrowOffset); ctx.lineTo(-10, y+10-arrowOffset); ctx.lineTo(10, y+10-arrowOffset); ctx.fill();
                }
            } 
            // --- ROCKET & METEOR (Target Crosshair Berbahaya) ---
            else if (spell.key === "rocket" || spell.key === "meteor") {
                const blink = Math.abs(Math.sin(Date.now() / 100)); 
                ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + blink * 0.2})`;
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI*2); ctx.fill();
                
                ctx.strokeStyle = `rgba(255, 0, 0, 0.8)`; ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, -spell.radius); ctx.lineTo(0, spell.radius);
                ctx.moveTo(-spell.radius, 0); ctx.lineTo(spell.radius, 0);
                ctx.stroke();
                // Border luar statis
                ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI*2); ctx.stroke();
            }
            // --- FREEZE (Snowflake Pattern) ---
            else if (spell.key === "freeze") {
                ctx.fillStyle = `rgba(135, 206, 250, 0.2)`;
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = "rgba(135, 206, 250, 0.6)"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI*2); ctx.stroke();
                
                ctx.save(); ctx.rotate(Date.now() / 3000);
                this.drawSnowflake(ctx, spell.radius * 0.7);
                ctx.restore();
            }
            // --- ZAP (Border Listrik Tajam) ---
            else if (spell.key === "zap") {
                ctx.fillStyle = `rgba(255, 235, 59, 0.15)`;
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI*2); ctx.fill();
                
                ctx.strokeStyle = "#ffeb3b"; ctx.lineWidth = 2;
                ctx.beginPath();
                const spikes = 20;
                for(let i=0; i<=spikes; i++) {
                    const angle = (i / spikes) * Math.PI * 2;
                    const r = spell.radius + (i%2===0 ? -2 : 4); // Zigzag
                    ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
                }
                ctx.closePath(); ctx.stroke();
            }
            // --- ARROWS (Bullseye Target) ---
            else if (spell.key === "arrows") {
                ctx.fillStyle = `rgba(255, 50, 50, 0.1)`;
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI*2); ctx.fill();
                
                ctx.strokeStyle = `rgba(255, 100, 100, 0.5)`; ctx.lineWidth = 2;
                ctx.setLineDash([8, 5]);
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(0, 0, spell.radius * 0.6, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(0, 0, spell.radius * 0.2, 0, Math.PI*2); ctx.stroke();
                ctx.setLineDash([]);
            }
            // --- EARTHQUAKE (Border Bergerigi Coklat) ---
            else if (spell.key === "earthquake") {
                ctx.fillStyle = `rgba(121, 85, 72, 0.2)`;
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI*2); ctx.fill();
                
                ctx.strokeStyle = "#795548"; ctx.lineWidth = 3;
                ctx.beginPath();
                const spikes = 16;
                for(let i=0; i<=spikes; i++) {
                    const angle = (i / spikes) * Math.PI * 2;
                    // Gerigi lebih kasar dan acak sedikit
                    const r = spell.radius + (i%2===0 ? 0 : 5 + Math.random()*2); 
                    ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
                }
                ctx.closePath(); ctx.stroke();
            }
             // --- RAGE (Ungu) ---
            else if (spell.key === "rage") {
                ctx.fillStyle = `rgba(170, 0, 255, 0.15)`;
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = `rgba(170, 0, 255, 0.5)`; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI*2); ctx.stroke();
            }
            // --- VOID (Gelap) ---
            else if (spell.key === "void") {
                ctx.fillStyle = `rgba(30, 0, 60, 0.3)`;
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = `rgba(100, 50, 150, 0.8)`; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI*2); ctx.stroke();
            }
            // --- DEFAULT (Fireball, Goblin Barrel, dll) ---
            else {
                // Warna standar tergantung tim
                const color = isPlayer ? "255, 255, 255" : "255, 50, 50";
                ctx.fillStyle = `rgba(${color}, 0.15)`;
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = `rgba(${color}, 0.5)`; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, Math.PI * 2); ctx.stroke();
            }

            // ===========================================
            // 2. INDIKATOR WAKTU (LINGKARAN LUAR)
            // ===========================================
            // Hanya jika ada delay (maxTimer > beberapa frame)
            if (spell.maxTimer > 10) { 
                ctx.save();
                // Warna indikator loading (putih/kuning cerah agar kontras)
                ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
                if (spell.key === 'rocket' || spell.key === 'meteor') ctx.strokeStyle = "rgba(255, 50, 50, 0.9)";
                
                ctx.lineWidth = 4;
                ctx.lineCap = "round";
                ctx.beginPath();
                // Gambar arc dari atas (-PI/2) sesuai persentase sisa
                ctx.arc(0, 0, spell.radius, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * remainingPct), false);
                ctx.stroke();

                // Teks Timer
                ctx.fillStyle = "#fff"; ctx.shadowColor = "#000"; ctx.shadowBlur = 4;
                ctx.font = "bold 14px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillText(remainingSeconds, 0, 0);
                ctx.restore();
            }

            // ===========================================
            // 3. VISUAL PROYEKTIL TERBANG (Opsional Pemanis)
            // ===========================================
            if (["fireball", "rocket", "goblin_barrel", "meteor"].includes(spell.key)) { 
                const h = (1 - progress) * 500; // Ketinggian
                ctx.translate(0, -h);

                if (spell.key === "rocket") {
                    // Gambar Roket Sederhana
                    ctx.fillStyle = "#5d4037"; ctx.fillRect(-8, -25, 16, 35);
                    ctx.fillStyle = "#d32f2f"; ctx.beginPath(); ctx.moveTo(-8,-25); ctx.lineTo(8,-25); ctx.lineTo(0,-40); ctx.fill();
                    ctx.fillStyle = "orange"; ctx.beginPath(); ctx.arc(0, 10, 6, 0, Math.PI*2); ctx.fill();
                } else if (spell.key === "goblin_barrel") {
                    // Gambar Barel Berputar
                    ctx.rotate(progress * 15);
                    ctx.fillStyle = "#5d4037"; ctx.fillRect(-10, -12, 20, 24);
                    ctx.strokeStyle="#222"; ctx.lineWidth=2; ctx.strokeRect(-10,-12,20,24);
                } else {
                    // Bola Api / Meteor
                    ctx.fillStyle = spell.key === "meteor" ? "#d84315" : "#ff5722";
                    ctx.shadowColor = "orange"; ctx.shadowBlur = 15;
                    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill();
                }
                ctx.translate(0, h);
            }

            ctx.restore();
        });
    }

    // Helper Snowflake (Pastikan ini ada di dalam class Renderer)
    drawSnowflake(ctx, r) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            ctx.moveTo(0, 0); ctx.lineTo(r, 0);
            ctx.moveTo(r*0.6, 0); ctx.lineTo(r*0.8, r*0.2);
            ctx.moveTo(r*0.6, 0); ctx.lineTo(r*0.8, -r*0.2);
            ctx.rotate(Math.PI / 3);
        }
        ctx.stroke();
    }
    drawSpellArea(ctx, s) {
        ctx.save(); 
        const t = Date.now() / 1000; // Waktu untuk animasi
        const alpha = Math.min(0.5, s.duration / 30); // Fade out saat durasi mau habis
        
        ctx.translate(s.x, s.y);

        // 1. RAGE (Ungu, Pulsing Ring)
        if (s.type === "rage") {
            // Background Pudar
            ctx.fillStyle = `rgba(170, 0, 255, ${0.15})`;
            ctx.beginPath(); ctx.arc(0, 0, s.radius, 0, Math.PI * 2); ctx.fill();
            
            // Cincin Berdenyut
            const pulse = 0.5 + Math.sin(t * 8) * 0.5; // 0 sampai 1
            ctx.strokeStyle = `rgba(170, 0, 255, ${0.6 * (1-pulse)})`;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, s.radius * pulse, 0, Math.PI * 2); ctx.stroke();
        } 
        // 2. VOID (Hitam/Ungu Gelap, Menyedot ke dalam)
        else if (s.type === "void") {
            ctx.fillStyle = `rgba(20, 0, 50, ${alpha})`;
            ctx.beginPath(); ctx.arc(0, 0, s.radius, 0, Math.PI * 2); ctx.fill();
            
            // Garis menyedot (Implosion)
            const pulse = (t * 2) % 1; // 0 ke 1 terus menerus
            ctx.strokeStyle = "rgba(180, 100, 255, 0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, s.radius * (1 - pulse), 0, Math.PI * 2); ctx.stroke();
        }
        // 3. EARTHQUAKE (Coklat, Bergetar)
        else if (s.type === "earthquake") {
            const shakeX = (Math.random() - 0.5) * 4;
            const shakeY = (Math.random() - 0.5) * 4;
            ctx.translate(shakeX, shakeY);
            
            ctx.fillStyle = `rgba(121, 85, 72, ${alpha})`;
            ctx.beginPath(); ctx.arc(0, 0, s.radius, 0, Math.PI * 2); ctx.fill();
            
            // Retakan (Random Lines)
            ctx.strokeStyle = "rgba(62, 39, 35, 0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath(); 
            ctx.moveTo(-s.radius*0.5, 0); ctx.lineTo(s.radius*0.5, 0); 
            ctx.moveTo(0, -s.radius*0.5); ctx.lineTo(0, s.radius*0.5);
            ctx.stroke();
        }
        // 4. FREEZE (Cyan, Statis)
        else if (s.type === "freeze_visual") {
            ctx.fillStyle = `rgba(135, 206, 250, ${alpha})`;
            ctx.beginPath(); ctx.arc(0, 0, s.radius, 0, Math.PI * 2); ctx.fill();
            
            // Kristal Es (Simple Hexagon/Lines)
            ctx.strokeStyle = "white"; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.moveTo(-s.radius, 0); ctx.lineTo(s.radius, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -s.radius); ctx.lineTo(0, s.radius); ctx.stroke();
        }
        // 5. HEAL (Hijau, Plus Particles)
        else if (s.type === "heal") {
            ctx.fillStyle = `rgba(0, 230, 118, ${alpha})`;
            ctx.beginPath(); ctx.arc(0, 0, s.radius, 0, Math.PI * 2); ctx.fill();
            
            // Partikel Plus Naik
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.font = "12px Arial"; ctx.textAlign = "center";
            const offset = (t * 50) % s.radius; 
            ctx.fillText("+", s.radius/2, -offset + s.radius/2);
            ctx.fillText("+", -s.radius/2, -offset);
        }
        // DEFAULT (Putih Transparan)
        else {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath(); ctx.arc(0, 0, s.radius, 0, Math.PI * 2); ctx.fill();
        }

        // OUTLINE TIM (Biru/Merah)
        const strokeStyle = s.team === 0 ? "rgba(100, 200, 255, 0.8)" : "rgba(255, 100, 100, 0.8)";
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, s.radius, 0, Math.PI * 2); ctx.stroke();

        ctx.restore();
    }

    drawEffect(ctx, e) {
        ctx.save();
        ctx.translate(e.x, e.y);
        
        // 1. EFEK LEDAKAN (Fireball, Bomb) - Warna Orange/Merah
        if (e.color === 'orange' || e.color === '#ff5722') {
            const lifeInv = 1 - e.life;
            // Inti Ledakan (Mengecil)
            ctx.fillStyle = e.color;
            ctx.globalAlpha = e.life;
            ctx.beginPath(); ctx.arc(0, 0, e.radius * e.life, 0, Math.PI*2); ctx.fill();
            
            // Gelombang Kejut (Melebar)
            ctx.strokeStyle = "#ffd600"; // Kuning
            ctx.lineWidth = 15 * e.life;
            ctx.beginPath(); ctx.arc(0, 0, e.radius * lifeInv, 0, Math.PI*2); ctx.stroke();
        }
        // 2. EFEK HEAL/SPAWN (Hijau/Putih)
        else if (e.color === '#00e676' || e.color === 'white' || e.color === '#fff') {
            ctx.fillStyle = e.color;
            ctx.globalAlpha = e.life * 0.4;
            ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI*2); ctx.fill();
            
            // Cincin Naik
            ctx.strokeStyle = e.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = e.life;
            ctx.beginPath(); ctx.arc(0, 0, e.radius * (1 - e.life), 0, Math.PI*2); ctx.stroke();
        }
        // 3. EFEK ZAP/PETIR (Kuning)
        else if (e.color === 'yellow' || e.color === '#ffeb3b') {
            ctx.fillStyle = "rgba(255, 235, 59, 0.5)";
            ctx.beginPath(); ctx.arc(0, 0, e.radius * e.life, 0, Math.PI*2); ctx.fill();
        }
        // 4. EFEK DEFAULT (Lingkaran Pudar)
        else {
            ctx.globalAlpha = e.life * 0.6;
            ctx.fillStyle = e.color;
            ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
        }
        
        ctx.restore();
    }

    drawLightning(ctx, l) { ctx.save(); ctx.globalAlpha = l.life; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.shadowBlur = 15; ctx.shadowColor = "#00e5ff"; ctx.beginPath(); ctx.moveTo(l.x1, l.y1); l.points.forEach((p) => ctx.lineTo(p.x, p.y)); ctx.lineTo(l.x2, l.y2); ctx.stroke(); ctx.restore(); }
    }