/**
 * RENDERER.JS - Centralized Visualization System
 */
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
        const r = (entity.radius || 10) * scale;
        const teamColor = entity.team === 0 ? "#42a5f5" : "#ef5350";
        
        ctx.save();
        if (isGhost) ctx.globalAlpha = 0.6;
        if (!isGhost) this.drawStatusOutline(ctx, entity, r);
        
        const shadowY = entity.isAir ? entity.y + r * 1.5 : entity.y + r * 0.2;
        ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.ellipse(entity.x, shadowY, r, r*0.6, 0, 0, Math.PI*2); ctx.fill();

        let jumpOffset = 0;
        if (entity.isJumping && entity.jumpPhase === 1 && typeof Utils !== 'undefined') {
             const totalDist = Utils.getDist({x:entity.jumpStartX, y:entity.jumpStartY}, {x:entity.jumpTargetX, y:entity.jumpTargetY});
             const currentDist = Utils.getDist(entity, {x:entity.jumpStartX, y:entity.jumpStartY});
             if(totalDist > 0) jumpOffset = -Math.sin((currentDist/totalDist) * Math.PI) * 150;
        }
        
        const drawY = entity.y + jumpOffset - (entity.isAir ? 15 : 0);
        ctx.translate(entity.x, drawY);
        ctx.rotate(entity.angle + Math.PI/2); 

        this.drawBody(ctx, v, r, teamColor);
        this.drawHead(ctx, v, r, teamColor);
        
        let anim = entity.isAttacking ? Math.sin(entity.attackTimer * 0.8) * 8 : 0;
        this.drawWeapon(ctx, v, r, anim);

        ctx.restore();

        // FIX VISUAL LASER INFERNO DRAGON
        if (!isGhost && entity.key === 'inferno_dragon' && entity.target && !entity.target.dead && entity.stunned <= 0) {
             const dist = Utils.getDist(entity, entity.target);
             if (dist <= entity.range + entity.target.radius + 10) {
                 ctx.save();
                 ctx.translate(0, jumpOffset);
                 ctx.strokeStyle = "#ff9100";
                 ctx.lineWidth = Math.min(8, 2 + (entity.rampStage || 0) * 0.2); 
                 ctx.beginPath(); ctx.moveTo(entity.x, entity.y - 15); ctx.lineTo(entity.target.x, entity.target.y); ctx.stroke();
                 ctx.restore();
             }
        }

        if (!isGhost) {
            const oldY = entity.y;
            entity.y = drawY; 
            this.drawHpAndName(ctx, entity);
            entity.y = oldY;
        }
    }

    drawTower(ctx, t) {
        ctx.save();
        const stoneColor = t.team === 0 ? "#90a4ae" : "#5d4037";
        const teamColor = t.team === 0 ? "#42a5f5" : "#ef5350";
        const darkerColor = t.team === 0 ? "#1565c0" : "#c62828";

        // Range
        ctx.save(); ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2); ctx.stroke(); ctx.restore();

        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(t.x, t.y+5, 30, 20, 0, 0, Math.PI*2); ctx.fill();

        if(t.type==='king') {
            const grad = ctx.createLinearGradient(t.x, t.y-25, t.x, t.y+25); grad.addColorStop(0, stoneColor); grad.addColorStop(1, '#333'); ctx.fillStyle = grad;
            ctx.beginPath(); ctx.moveTo(t.x-25, t.y-20); ctx.lineTo(t.x+25, t.y-20); ctx.lineTo(t.x+25, t.y+25); ctx.lineTo(t.x-25, t.y+25); ctx.fill();
            ctx.fillStyle = '#222'; ctx.fillRect(t.x-10, t.y+5, 20, 20);
            if(!t.active) { ctx.strokeStyle='#555'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(t.x, t.y+5); ctx.lineTo(t.x, t.y+25); ctx.stroke(); }
        } else {
            ctx.fillStyle = stoneColor; ctx.beginPath(); ctx.arc(t.x, t.y, 22, 0, Math.PI*2); ctx.fill();
        }

        ctx.save(); ctx.translate(t.x, t.y - (t.type==='king'?20:25)); ctx.rotate(t.angle);
        if(t.type==='king' && t.active) { ctx.fillStyle = "#ffd54f"; ctx.fillRect(0, -14, 32, 28); ctx.fillStyle = darkerColor; ctx.beginPath(); ctx.arc(0,0, 18, 0, Math.PI*2); ctx.fill(); } 
        else { ctx.fillStyle = darkerColor; ctx.fillRect(0, -8, 25, 16); ctx.fillStyle = teamColor; ctx.beginPath(); ctx.arc(0,0, 12, 0, Math.PI*2); ctx.fill(); }
        ctx.restore();

        if(t.type==='king' && !t.active) { ctx.fillStyle = '#fff'; ctx.font = "bold 20px Arial"; ctx.textAlign="center"; ctx.fillText("Zzz", t.x, t.y-35); }
        
        this.drawStatusOutline(ctx, t, t.radius + 5);

        // FIX VISUAL LASER INFERNO TOWER
        if (t.type === "inferno_tower" && t.active && t.target && !t.target.dead && t.stunned <= 0) {
            const dist = Utils.getDist(t, t.target);
            if (dist <= t.range + t.target.radius) {
                ctx.save();
                ctx.strokeStyle = "red"; 
                // Gunakan 2 sebagai base width jika attackTimer logic tidak pas
                ctx.lineWidth = Math.min(8, 2 + (120 - t.attackTimer) / 10); 
                ctx.beginPath(); ctx.moveTo(t.x, t.y - 20); ctx.lineTo(t.target.x, t.target.y); ctx.stroke();
                ctx.restore();
            }
        }

        const isEnemy = t.team === 1;
        const barY = isEnemy ? t.y + 45 : t.y - 65; 
        this.drawHpBarOnly(ctx, t, barY);
        ctx.restore();
    }

    drawBuilding(ctx, b, isGhost) {
        ctx.save();
        if(isGhost) ctx.globalAlpha = 0.6;
        const color = CARDS[b.key] ? (CARDS[b.key].color || '#888') : '#888';
        const teamColor = b.team === 0 ? "#42a5f5" : "#ef5350";
        
        ctx.translate(b.x, b.y);
        
        if (b.isHidden && !isGhost) { ctx.fillStyle = '#5d4037'; ctx.fillRect(-18, -18, 36, 36); } 
        else {
            ctx.fillStyle = '#757575'; ctx.fillRect(-20, -20, 40, 40); 
            ctx.fillStyle = color; ctx.fillRect(-15, -15, 30, 30); 
            ctx.fillStyle = teamColor;
            if(b.key && (b.key.includes('hut') || b.key==='furnace')) { ctx.beginPath(); ctx.moveTo(-20,-15); ctx.lineTo(0,-35); ctx.lineTo(20,-15); ctx.fill(); } 
            else if (b.key && (b.key === 'cannon' || b.key === 'xbow' || b.key === 'mortar')) { ctx.save(); ctx.rotate(b.angle); ctx.fillStyle = '#333'; ctx.fillRect(0, -10, 30, 20); ctx.restore(); }
        }
        ctx.restore();
        
        if (!isGhost) {
            this.drawStatusOutline(ctx, b, 25);
            // Visual Inferno Tower Building
            if (b.key === 'inferno_tower' && b.target && !b.target.dead && b.rampStage > 0) {
                 if (Utils.getDist({x:0,y:0}, {x:b.target.x - b.x, y:b.target.y - b.y}) <= b.range) {
                     ctx.save();
                     ctx.strokeStyle = b.rampStage > 20 ? "red" : "orange";
                     ctx.lineWidth = Math.min(8, 2 + b.rampStage * 0.2);
                     ctx.beginPath(); ctx.moveTo(b.x, b.y - 30); ctx.lineTo(b.target.x, b.target.y); ctx.stroke();
                     ctx.restore();
                 }
            }

            const lifePct = b.lifetime / b.maxLifetime;
            ctx.fillStyle = "#b388ff"; ctx.fillRect(b.x - 15, b.y + 18, 30 * lifePct, 3);
            this.drawHpAndName(ctx, b);
        }
    }

    drawStatusOutline(ctx, entity, r) {
        if (entity.isHidden) return;
        ctx.shadowBlur = 0; ctx.lineWidth = 3;
        let color = null;
        if (entity.stunned > 0) { color = entity.freezeActive ? "#00e5ff" : "yellow"; ctx.shadowBlur = 10; ctx.shadowColor = color; } 
        else if (entity.rageBoosted > 0) { color = "red"; ctx.shadowBlur = 10; ctx.shadowColor = "red"; } 
        else if (entity.slowed > 0) { color = "#00bcd4"; ctx.shadowBlur = 5; ctx.shadowColor = "#00bcd4"; }
        if (color) { ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(entity.x, entity.y, r, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
    }

    drawBody(ctx, v, r, teamColor) {
        const body = v.body || 'default';
        const grad = ctx.createLinearGradient(-r/2, 0, r/2, 0);
        grad.addColorStop(0, '#333'); grad.addColorStop(0.5, teamColor); grad.addColorStop(1, '#333');
        ctx.fillStyle = grad;
        if (body === 'ribs' || body === 'ribs_armor') { ctx.strokeStyle = '#eee'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r/2,0); ctx.lineTo(r/2,0); ctx.moveTo(-r/2,r/3); ctx.lineTo(r/2,r/3); ctx.stroke(); return; }
        else if (body === 'armor_heavy') ctx.fillRect(-r*0.8, -r*0.2, r*1.6, r*1.2);
        else if (body.includes('robe')) { ctx.fillStyle = body === 'robe_green' ? '#2e7d32' : (body==='robe_dark'?'#311b92':teamColor); ctx.beginPath(); ctx.moveTo(0, -r*0.5); ctx.lineTo(r, r); ctx.lineTo(-r, r); ctx.fill(); } 
        else if (body === 'spirit') { ctx.fillStyle = v.skin || teamColor; ctx.beginPath(); ctx.arc(0,0, r*0.8, 0, Math.PI*2); ctx.fill(); }
        else if (body.includes('rock')) { ctx.fillStyle = v.skin || '#8d6e63'; ctx.beginPath(); ctx.moveTo(-r*0.7,-r*0.2); ctx.lineTo(r*0.7,-r*0.2); ctx.lineTo(r*0.5,r*0.8); ctx.lineTo(-r*0.5,r*0.8); ctx.fill(); }
        else if (body === 'dragon') { ctx.fillStyle = v.skin || teamColor; ctx.beginPath(); ctx.ellipse(0, 0, r*0.6, r*0.9, 0, 0, Math.PI*2); ctx.fill(); }
        else if (body === 'wood_box' || body === 'wood_mech') { ctx.fillStyle = '#8d6e63'; ctx.fillRect(-r*0.7, -r*0.7, r*1.4, r*1.4); }
        else { ctx.beginPath(); ctx.moveTo(-r*0.6, 0); ctx.lineTo(r*0.6, 0); ctx.lineTo(r*0.4, r*0.5); ctx.lineTo(-r*0.4, r*0.5); ctx.fill(); }
        if (v.hasWings) { ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.beginPath(); ctx.ellipse(-r*0.8, -r*0.2, r*0.4, r*0.8, -0.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(r*0.8, -r*0.2, r*0.4, r*0.8, 0.5, 0, Math.PI*2); ctx.fill(); }
        if (v.hasPropeller) { ctx.save(); ctx.rotate((Date.now()/50)); ctx.fillStyle="#5d4037"; ctx.fillRect(-r*1.5,-2,r*3,4); ctx.fillRect(-2,-r*1.5,4,r*3); ctx.restore(); }
    }

    drawHead(ctx, v, r, teamColor) {
        ctx.fillStyle = v.skin || '#ffe0b2';
        const head = v.head || 'default';
        if (head.includes('skull')) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.6, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-r*0.2, -r*0.3, r*0.15, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(r*0.2, -r*0.3, r*0.15, 0, Math.PI*2); ctx.fill(); if(head === 'skull_helm') { ctx.fillStyle='#d4af37'; ctx.beginPath(); ctx.arc(0, -r*0.5, r*0.4, Math.PI, 0); ctx.fill(); } return; }
        if(head !== 'machine' && head !== 'horse_wood') { ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); }
        if (head.includes('hood')) { ctx.fillStyle = (head==='hood_ice')?'#b3e5fc':(head==='hood_ninja'?'#000':(head==='hood_dark'?'#311b92':teamColor)); ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.55, Math.PI, 0); ctx.fill(); } 
        else if (head.includes('helmet')) { ctx.fillStyle = '#546e7a'; if(head.includes('samurai')) ctx.fillStyle='#b71c1c'; if(head.includes('viking')) ctx.fillStyle='#f57f17'; ctx.beginPath(); ctx.arc(0, -r*0.35, r*0.55, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; ctx.fillRect(-r*0.3, -r*0.4, r*0.6, r*0.1); }
        else if (head === 'mohawk') { ctx.fillStyle = '#333'; ctx.fillRect(-2, -r*0.9, 4, r*0.6); }
        else if (head === 'robot_horn') { ctx.fillStyle = '#455a64'; ctx.beginPath(); ctx.moveTo(-r*0.5, -r*0.3); ctx.lineTo(-r, -r); ctx.lineTo(-r*0.2, -r*0.5); ctx.fill(); ctx.beginPath(); ctx.moveTo(r*0.5, -r*0.3); ctx.lineTo(r, -r); ctx.lineTo(r*0.2, -r*0.5); ctx.fill(); }
        else if (head === 'coil') { ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.arc(0, -r*0.2, r*0.4, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 2; ctx.stroke(); }
        else if (head === 'horse_wood') { ctx.fillStyle = '#8d6e63'; ctx.fillRect(-r*0.4, -r*1.2, r*0.8, r*0.8); }
    }

    drawWeapon(ctx, v, r, animOffset) {
        if (!v.weapon || v.weapon === 'none') return;
        const weapon = v.weapon; const yPos = -r*0.5 - animOffset; ctx.fillStyle = '#cfd8dc'; 
        if (weapon.includes('sword') || weapon === 'katana') { const wLen = weapon === 'sword_giant' ? r*1.8 : r*1.2; ctx.fillRect(-2, yPos - r, 4, wLen); ctx.fillStyle = '#5d4037'; ctx.fillRect(-6, yPos, 12, 4); if(weapon === 'dual_swords') { ctx.fillStyle='#cfd8dc'; ctx.fillRect(-r*0.8, yPos-r, 4, wLen); ctx.fillRect(r*0.8, yPos-r, 4, wLen); } } 
        else if (weapon.includes('bow')) { ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -r*0.6, r*0.6, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-r*0.6, -r*0.6); ctx.lineTo(r*0.6, -r*0.6); ctx.stroke(); }
        else if (['spear','lance','staff','staff_axe','staff_wood'].includes(weapon)) { ctx.fillStyle = '#5d4037'; ctx.fillRect(2, yPos-r*1.5, 4, r*2); if(weapon.includes('staff')) { ctx.fillStyle = v.color || 'orange'; ctx.beginPath(); ctx.arc(4, yPos-r*1.5, r*0.3, 0, Math.PI*2); ctx.fill(); } }
        else if (weapon.includes('fist')) { ctx.fillStyle = v.skin || '#e0ceb0'; ctx.beginPath(); ctx.arc(r*0.6, yPos, r*0.3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(-r*0.6, yPos, r*0.3, 0, Math.PI*2); ctx.fill(); }
        else if (weapon === 'hammer' || weapon === 'mace') { ctx.fillStyle = '#5d4037'; ctx.fillRect(-2, yPos - r, 4, r); ctx.fillStyle = '#333'; ctx.fillRect(-r*0.6, yPos - r - 5, r*1.2, r*0.5); }
        else if (weapon.includes('axe')) { ctx.fillStyle = '#5d4037'; ctx.fillRect(-2, -r, 4, r); ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.arc(0, -r, r*0.8, 0, Math.PI*2); ctx.fill(); }
        else if (weapon === 'cannon_hand' || weapon === 'rifle_long') { ctx.fillStyle = '#333'; ctx.fillRect(-r*0.4, yPos - r, r*0.8, r*1.2); }
        else if (weapon === 'mace_hands') { ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(-r*0.7, yPos, r*0.4, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(r*0.7, yPos, r*0.4, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.moveTo(-r*0.7, yPos-r*0.5); ctx.lineTo(-r*0.5, yPos); ctx.lineTo(-r*0.9, yPos); ctx.fill(); ctx.beginPath(); ctx.moveTo(r*0.7, yPos-r*0.5); ctx.lineTo(r*0.5, yPos); ctx.lineTo(r*0.9, yPos); ctx.fill(); }
    }

    drawPendingSpells(ctx, game) {
        game.pendingSpells.forEach(spell => {
            const progress = 1 - spell.timer / spell.maxTimer;
            const isPlayer = spell.team === 0;
            const outlineColor = isPlayer ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 50, 50, 0.8)";
            const fillColor = isPlayer ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 0, 0, 0.2)";

            if (spell.key === "the_log") {
                ctx.fillStyle = fillColor; ctx.strokeStyle = outlineColor; ctx.lineWidth = 2;
                const range = (CARDS["the_log"].stats.range || 10.5) * CONFIG.gridSize; ctx.fillRect(spell.x - 30, spell.y - range, 60, range); ctx.strokeRect(spell.x - 30, spell.y - range, 60, range);
            } else {
                ctx.strokeStyle = outlineColor; ctx.fillStyle = fillColor; ctx.lineWidth = 2; ctx.globalAlpha = 0.5 + progress * 0.5;
                ctx.beginPath(); ctx.setLineDash([5, 5]); ctx.arc(spell.x, spell.y, spell.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                
                if (["fireball", "rocket", "arrows", "goblin_barrel", "meteor"].includes(spell.key)) {
                    const h = (1-progress) * 300;
                    ctx.fillStyle = spell.key === "goblin_barrel" ? "#2e7d32" : (spell.key==="rocket"?"#5d4037":"#ff5722");
                    ctx.save(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(spell.x, spell.y - h, 10, 0, Math.PI*2); ctx.fill(); ctx.restore();
                }
            }
        });
    }

    drawPlacementGhost(ctx, game) {
        if (game.selectedCardIdx === -1) return;
        const k = game.playerHand[game.selectedCardIdx];
        const d = CARDS[k];
        if (!d) return;
        const gx = Math.round(game.mouseX / CONFIG.gridSize) * CONFIG.gridSize;
        const gy = Math.round(game.mouseY / CONFIG.gridSize) * CONFIG.gridSize;
        let isValid = true;
        if (gx < 20 || gx >= CONFIG.logicWidth - 20) isValid = false;
        if (d.type !== "spell") { if (gy > 335 && gy < 365) isValid = false; if (gy < 330) isValid = false; if (!game.checkPlacement(gx, gy, d.type)) isValid = false; } 
        else { if (d.tags && d.tags.includes("log") && gy < 320) isValid = false; }
        
        if (!isValid) { ctx.globalAlpha = 0.5; ctx.fillStyle = "red"; ctx.beginPath(); ctx.arc(gx, gy, 20, 0, Math.PI*2); ctx.fill(); }
        
        if (d.spawnEffect) { ctx.save(); ctx.fillStyle = "rgba(255, 215, 0, 0.3)"; ctx.strokeStyle = "rgba(255, 215, 0, 0.8)"; ctx.lineWidth = 2; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.arc(gx, gy, d.spawnEffect.radius * CONFIG.gridSize, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
        
        if (d.type === "spell") { const r = (d.stats.radius || 2.5) * CONFIG.gridSize; ctx.fillStyle = isValid ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 0, 0, 0.4)"; ctx.beginPath(); ctx.arc(game.mouseX, game.mouseY, r, 0, Math.PI*2); ctx.fill(); } 
        else { const count = d.stats.count || 1; for (let i = 0; i < count; i++) { let ox = 0, oy = 0; if (count > 1) { if (count > 4) { const angle = ((Math.PI * 2) / count) * i; ox = Math.cos(angle) * 30; oy = Math.sin(angle) * 30; } else { ox = (i - (count - 1) / 2) * 20; } } let dummy; if (d.type === "building") dummy = new Building(gx, gy, 0, k); else dummy = new Unit(gx + ox, gy + oy, 0, k); this.drawEntity(ctx, dummy, true); } }
    }

    drawProjectile(ctx, p) {
        ctx.save(); ctx.translate(p.x, p.y);
        if (p.projType === "rolling_log") { ctx.rotate(p.angle + Math.PI / 2); ctx.fillStyle = "#5d4037"; ctx.fillRect(-15, -30, 30, 60); ctx.fillStyle = "#bdbdbd"; ctx.beginPath(); ctx.moveTo(-15,-20); ctx.lineTo(-20,-25); ctx.lineTo(-15,-10); ctx.fill(); ctx.beginPath(); ctx.moveTo(15,10); ctx.lineTo(20,5); ctx.lineTo(15,20); ctx.fill(); } 
        else if (p.projType === "boomerang") { ctx.rotate(p.rotation || 0); ctx.fillStyle = "#b0bec5"; ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle = "#e91e63"; ctx.beginPath(); ctx.arc(0,-10,6,0,Math.PI,true); ctx.fill(); ctx.beginPath(); ctx.arc(0,10,6,0,Math.PI,false); ctx.fill(); } 
        else if (p.projType === "rolling") { ctx.rotate(p.rotation || 0); ctx.fillStyle = "#3949ab"; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill(); } 
        else { 
            // COLOR CHANGE FOR SPECIAL EFFECTS
            if (p.isSlow) ctx.fillStyle = "#29b6f6"; // Light Blue (Ice)
            else if (p.owner && p.owner.tags && p.owner.tags.includes('healer')) ctx.fillStyle = "#00e676"; // Green (Heal)
            else ctx.fillStyle = "#fff"; // Default White

            ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill(); 
        }
        ctx.restore();
    }

    drawSpellArea(ctx, s) {
        ctx.save(); 
        const alpha = Math.min(0.4, s.duration / 30);
        let fillStyle;
        
        // WARNA AREA (Isi)
        if (s.type === "freeze_visual") fillStyle = `rgba(135, 206, 250, ${alpha})`;
        else if (s.type === "rage") fillStyle = `rgba(170, 0, 255, ${alpha})`;
        else if (s.type === "earthquake") { fillStyle = `rgba(121, 85, 72, ${alpha})`; ctx.translate((Math.random()-0.5)*3, (Math.random()-0.5)*3); }
        else if (s.type === "void") fillStyle = `rgba(220, 220, 255, ${alpha})`;
        else fillStyle = `rgba(255, 255, 255, ${alpha})`;

        // WARNA OUTLINE (Tim)
        const strokeStyle = s.team === 0 ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 50, 50, 0.9)";

        ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); 
        ctx.fillStyle = fillStyle; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = strokeStyle; ctx.stroke();
        ctx.restore();
    }

    drawLightning(ctx, l) { ctx.save(); ctx.globalAlpha = l.life; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.shadowBlur = 15; ctx.shadowColor = "#00e5ff"; ctx.beginPath(); ctx.moveTo(l.x1, l.y1); l.points.forEach((p) => ctx.lineTo(p.x, p.y)); ctx.lineTo(l.x2, l.y2); ctx.stroke(); ctx.restore(); }
    drawEffect(ctx, e) { ctx.save(); ctx.globalAlpha = e.life * 0.6; ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }

    drawHpAndName(ctx, entity) {
        if (entity.isHidden) return;
        const barY = entity.y - entity.radius - 15;
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
        if (entity.shield > 0) { ctx.fillStyle = "#b0bec5"; ctx.fillRect(entity.x - 15, yPos - 5, 30 * (entity.shield / entity.maxShield), 3); }
    }
}