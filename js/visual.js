/**
 * RENDERER.JS - Modular Visual System
 */

// ==========================================
// 1. VISUAL LIBRARY (UPDATED & EXPANDED)
// ==========================================
const VISUALS = {
    // --- BODIES (BADAN) ---
    bodies: {
        'default': (ctx, r, color) => {
            const grad = ctx.createLinearGradient(-r/2, 0, r/2, 0);
            grad.addColorStop(0, '#333'); grad.addColorStop(0.5, color); grad.addColorStop(1, '#333');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.moveTo(-r*0.6, 0); ctx.lineTo(r*0.6, 0); ctx.lineTo(r*0.4, r*0.5); ctx.lineTo(-r*0.4, r*0.5); ctx.fill();
        },
        // --- VISUAL TOWER BARU ---
        'tower_king': (ctx, r, color) => {
            // Base Kotak Batu
            ctx.fillStyle = '#90a4ae'; ctx.fillRect(-r*1.3, -r*1.3, r*2.6, r*2.6);
            ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 2; ctx.strokeRect(-r*1.3, -r*1.3, r*2.6, r*2.6);
            // Platform
            ctx.fillStyle = color; ctx.fillRect(-r, -r, r*2, r*2);
            // Sudut Benteng
            ctx.fillStyle = '#546e7a'; 
            ctx.fillRect(-r*1.3, -r*1.3, r*0.6, r*0.6); ctx.fillRect(r*0.7, -r*1.3, r*0.6, r*0.6);
            ctx.fillRect(-r*1.3, r*0.7, r*0.6, r*0.6); ctx.fillRect(r*0.7, r*0.7, r*0.6, r*0.6);
        },
        'tower_princess': (ctx, r, color) => {
            // Base Bulat Batu
            ctx.fillStyle = '#90a4ae'; ctx.beginPath(); ctx.arc(0, 0, r*1.2, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 2; ctx.stroke();
            // Turret
            ctx.fillStyle = '#cfd8dc'; ctx.fillRect(-r*0.8, -r*0.8, r*1.6, r*1.6);
            // Top Color
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, r*0.7, 0, Math.PI*2); ctx.fill();
        },
        'tower_tesla': (ctx, r, color) => {
            // Base Mekanik
            ctx.fillStyle = '#37474f'; ctx.fillRect(-r, -r, r*2, r*2);
            ctx.fillStyle = '#0288d1'; ctx.fillRect(-r*0.5, -r*1.5, r, r*1.5); // Tiang
            // Kumparan Listrik
            ctx.strokeStyle = '#81d4fa'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-r*0.5, -r*1.2); ctx.lineTo(r*0.5, -r*1.2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-r*0.5, -r*0.8); ctx.lineTo(r*0.5, -r*0.8); ctx.stroke();
            // Bola Atas
            ctx.fillStyle = '#e1f5fe'; ctx.beginPath(); ctx.arc(0, -r*1.5, r*0.4, 0, Math.PI*2); ctx.fill();
        },
        // --- VISUAL UNIT BARU ---
        'armor_heavy': (ctx, r, color) => { // PEKKA, MK
            const grad = ctx.createLinearGradient(-r, 0, r, 0);
            grad.addColorStop(0, '#111'); grad.addColorStop(0.5, color); grad.addColorStop(1, '#111');
            ctx.fillStyle = grad; ctx.fillRect(-r*0.8, -r*0.2, r*1.6, r*1.2);
        },
        'armor_plate': (ctx, r, color) => { // Mini PEKKA
            ctx.fillStyle = "#546e7a"; ctx.fillRect(-r*0.7, -r*0.2, r*1.4, r);
            ctx.fillStyle = color; ctx.fillRect(-r*0.3, -r*0.1, r*0.6, r*0.6);
        },
        'armor_samurai': (ctx, r, color) => { // Samurai
            ctx.fillStyle = "#b71c1c"; 
            for(let i=0; i<3; i++) ctx.fillRect(-r*0.7, -r*0.2 + (i*r*0.4), r*1.4, r*0.3);
        },
        'ancient_armor': (ctx, r, color) => { // Titan
            ctx.fillStyle = "#3e2723"; ctx.fillRect(-r*0.9, -r*0.3, r*1.8, r*1.5);
            ctx.fillStyle = "#d7ccc8"; ctx.beginPath(); ctx.arc(0, 0, r*0.4, 0, Math.PI*2); ctx.fill();
        },
        'robe': (ctx, r, color) => { // Wizard
            ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -r*0.5); ctx.lineTo(r, r); ctx.lineTo(-r, r); ctx.fill();
        },
        'robe_dark': (ctx, r, color) => { ctx.fillStyle = "#311b92"; ctx.beginPath(); ctx.moveTo(0, -r*0.5); ctx.lineTo(r, r); ctx.lineTo(-r, r); ctx.fill(); },
        'robe_green': (ctx, r, color) => { ctx.fillStyle = "#2e7d32"; ctx.beginPath(); ctx.moveTo(0, -r*0.5); ctx.lineTo(r, r); ctx.lineTo(-r, r); ctx.fill(); },
        'ribs': (ctx, r, color) => { // Skeleton
            ctx.strokeStyle = '#eee'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-r/2,0); ctx.lineTo(r/2,0); ctx.moveTo(-r/2,r/3); ctx.lineTo(r/2,r/3); ctx.stroke();
        },
        'ribs_armor': (ctx, r, color) => { // Guards
            ctx.fillStyle = '#444'; ctx.fillRect(-r*0.6, -r*0.2, r*1.2, r*0.6);
            ctx.strokeStyle = '#eee'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r/2,r/2); ctx.lineTo(r/2,r/2); ctx.stroke();
        },
        'spirit': (ctx, r, color) => { // Spirits
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0,0, r*0.8, 0, Math.PI*2); ctx.fill();
        },
        'rock': (ctx, r, color) => { // Golem
            ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.moveTo(-r*0.8,-r*0.3); ctx.lineTo(r*0.8,-r*0.3); ctx.lineTo(r*0.6,r*0.9); ctx.lineTo(-r*0.6,r*0.9); ctx.fill();
        },
        'rock_body': (ctx, r, color) => { // Lava Hound
            ctx.fillStyle = '#bf360c'; ctx.beginPath(); ctx.ellipse(0,0, r*0.7, r, 0, 0, Math.PI*2); ctx.fill();
        },
        'dragon': (ctx, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, 0, r*0.6, r*0.9, 0, 0, Math.PI*2); ctx.fill(); },
        'snake': (ctx, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r, 0, 0, r); ctx.quadraticCurveTo(-r, 0, 0, -r); ctx.fill(); },
        'pig': (ctx, r, color) => { ctx.fillStyle = "#f48fb1"; ctx.fillRect(-r*0.6, -r*0.8, r*1.2, r*1.6); },
        'machine_tank': (ctx, r, color) => { // Sparky
            ctx.fillStyle = "#5d4037"; ctx.fillRect(-r, -r, r*2, r*2);
            ctx.fillStyle = "#fbc02d"; ctx.fillRect(-r*0.8, -r*0.8, r*1.6, r*1.6);
        },
        'basket': (ctx, r, color) => { // Balloon
            ctx.fillStyle = "#795548"; ctx.fillRect(-r*0.6, -r*0.6, r*1.2, r*1.2);
            ctx.strokeStyle = "#5d4037"; ctx.lineWidth=2; ctx.strokeRect(-r*0.6, -r*0.6, r*1.2, r*1.2);
        },
        'demon': (ctx, r, color) => { // Minion
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, r*0.6, 0, Math.PI*2); ctx.fill();
        },
        'fur_white': (ctx, r, color) => { // Yeti
            ctx.fillStyle = "#e0f7fa"; ctx.beginPath(); ctx.arc(0, 0, r*0.9, 0, Math.PI*2); ctx.fill();
        },
        'shirt_plaid': (ctx, r, color) => { // Lumberjack
            ctx.fillStyle = "#d32f2f"; ctx.fillRect(-r*0.6, -r*0.3, r*1.2, r*1.2);
            ctx.strokeStyle = "#b71c1c"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0, -r*0.3); ctx.lineTo(0, r*0.9); ctx.stroke();
        },
        'wood_box': (ctx, r, color) => { ctx.fillStyle = '#8d6e63'; ctx.fillRect(-r*0.7, -r*0.7, r*1.4, r*1.4); },
        'wood_mech': (ctx, r, color) => { ctx.fillStyle = '#8d6e63'; ctx.fillRect(-r*0.6, -r*0.6, r*1.2, r*1.2); },
        // --- VISUAL BANGUNAN (BUILDINGS) ---
        'tower_inferno': (ctx, r, color) => {
            // Tangki Lava Bawah
            ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.arc(0, 0, r*1.2, 0, Math.PI*2); ctx.fill();
            
            // Jeruji Besi
            ctx.strokeStyle = '#424242'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(-r, r); ctx.lineTo(0, -r*0.5); ctx.lineTo(r, r); ctx.stroke();
            
            // Inti Magma
            const pulse = 1 + Math.sin(Date.now()/200) * 0.1;
            ctx.fillStyle = '#ff5722'; ctx.beginPath(); ctx.arc(0, 0, r*0.6 * pulse, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(0, 0, r*0.3, 0, Math.PI*2); ctx.fill();
        },

        'tower_tesla': (ctx, r, color) => {
            // Base Mekanik (Saat Aktif)
            ctx.fillStyle = '#455a64'; ctx.fillRect(-r, -r, r*2, r*2);
            ctx.fillStyle = '#263238'; ctx.fillRect(-r*0.7, -r*0.7, r*1.4, r*1.4);
            
            // Generator Listrik (Tiang)
            ctx.fillStyle = '#b3e5fc'; ctx.fillRect(-r*0.3, -r*1.5, r*0.6, r*1.5);
            
            // Cincin Listrik
            ctx.strokeStyle = '#0288d1'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-r*0.6, -r*1.2); ctx.lineTo(r*0.6, -r*1.2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-r*0.5, -r*0.8); ctx.lineTo(r*0.5, -r*0.8); ctx.stroke();
            
            // Bola Elektro Atas
            ctx.fillStyle = '#e1f5fe'; ctx.shadowColor = 'cyan'; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(0, -r*1.6, r*0.4, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        },

        'tower_tesla_closed': (ctx, r, color) => {
            // Visual Tesla Bersembunyi (Pintu Trapdoor Tertutup)
            ctx.fillStyle = '#546e7a'; ctx.fillRect(-r, -r, r*2, r*2); // Frame luar
            
            // Pintu Kayu/Besi
            ctx.fillStyle = '#37474f'; ctx.fillRect(-r*0.85, -r*0.85, r*1.7, r*1.7);
            
            // Garis Pintu
            ctx.strokeStyle = '#263238'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-r*0.85, -r*0.85); ctx.lineTo(r*0.85, r*0.85); ctx.stroke(); // Silang
            ctx.beginPath(); ctx.moveTo(r*0.85, -r*0.85); ctx.lineTo(-r*0.85, r*0.85); ctx.stroke();
            
            // Engsel
            ctx.fillStyle = '#cfd8dc'; 
            ctx.fillRect(-r*0.9, -r*0.2, r*0.2, r*0.4);
            ctx.fillRect(r*0.7, -r*0.2, r*0.2, r*0.4);
        },

        // --- GENERIC BUILDINGS ---
        'building_base_stone': (ctx, r, color) => { // Cannon/Mortar Base
            ctx.fillStyle = '#607d8b'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.arc(0, 0, r*0.7, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#263238'; ctx.lineWidth = 2; ctx.stroke();
        },

        'building_base_wood': (ctx, r, color) => { // X-Bow Base
            ctx.fillStyle = '#8d6e63'; ctx.fillRect(-r, -r, r*2, r*2);
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-r*0.8, -r*0.8, r*1.6, r*1.6);
            // Paku Sudut
            ctx.fillStyle = '#bdbdbd'; 
            [[ -0.8,-0.8], [0.8,-0.8], [-0.8,0.8], [0.8,0.8]].forEach(p => {
                ctx.beginPath(); ctx.arc(p[0]*r, p[1]*r, 3, 0, Math.PI*2); ctx.fill();
            });
        },

        'building_tombstone': (ctx, r, color) => {
            // Batu Nisan
            ctx.fillStyle = '#bdbdbd'; 
            ctx.beginPath(); ctx.moveTo(-r*0.6, r*0.6); ctx.lineTo(-r*0.6, -r*0.4); 
            ctx.quadraticCurveTo(0, -r, r*0.6, -r*0.4); ctx.lineTo(r*0.6, r*0.6); ctx.fill();
            // Retakan
            ctx.strokeStyle = '#616161'; ctx.lineWidth=2;
            ctx.beginPath(); ctx.moveTo(0, -r*0.2); ctx.lineTo(-r*0.2, 0); ctx.lineTo(r*0.1, r*0.3); ctx.stroke();
            // Tanah
            ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.ellipse(0, r*0.6, r*0.8, r*0.3, 0, 0, Math.PI*2); ctx.fill();
        },

        'building_furnace': (ctx, r, color) => {
            // Tungku Besi Hitam
            ctx.fillStyle = '#212121'; ctx.fillRect(-r*0.9, -r*0.9, r*1.8, r*1.8);
            // Isi Magma
            ctx.fillStyle = '#ff5722'; ctx.beginPath(); ctx.arc(0, 0, r*0.6, 0, Math.PI*2); ctx.fill();
            // Kisi-kisi
            ctx.strokeStyle = '#424242'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-r*0.6, -r*0.6); ctx.lineTo(r*0.6, r*0.6); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(r*0.6, -r*0.6); ctx.lineTo(-r*0.6, r*0.6); ctx.stroke();
        },

        'building_hut': (ctx, r, color) => {
            // Pondok Kayu
            ctx.fillStyle = '#fbc02d'; ctx.fillRect(-r*0.8, -r*0.8, r*1.6, r*1.6); // Dinding
            ctx.fillStyle = '#795548'; // Atap Segitiga
            ctx.beginPath(); ctx.moveTo(-r*1.1, -r*0.5); ctx.lineTo(0, -r*1.6); ctx.lineTo(r*1.1, -r*0.5); ctx.fill();
            // Pintu Gelap
            ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.arc(0, r*0.2, r*0.4, Math.PI, 0); ctx.fill();
        }
    },

    // --- HEADS (KEPALA) ---
    heads: {
        'default': (ctx, r, color) => { ctx.fillStyle = '#ffe0b2'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); },
        'helmet': (ctx, r, color) => { ctx.fillStyle = '#546e7a'; ctx.beginPath(); ctx.arc(0, -r*0.35, r*0.55, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; ctx.fillRect(-r*0.3, -r*0.4, r*0.6, r*0.1); },
        'helmet_samurai': (ctx, r, color) => { ctx.fillStyle = '#b71c1c'; ctx.beginPath(); ctx.arc(0, -r*0.35, r*0.6, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-r*0.4, -r*0.4); ctx.lineTo(r*0.4, -r*0.4); ctx.fill(); },
        'helmet_viking': (ctx, r, color) => { ctx.fillStyle = '#fbc02d'; ctx.beginPath(); ctx.arc(0, -r*0.4, r*0.6, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(-r*0.5, -r); ctx.lineTo(0, -r*0.5); ctx.lineTo(r*0.5, -r); ctx.fill(); },
        'helmet_full': (ctx, r, color) => { ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.6, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#00e5ff'; ctx.fillRect(-r*0.3, -r*0.4, r*0.6, r*0.15); },
        'helmet_miner': (ctx, r, color) => { ctx.fillStyle = '#424242'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.55, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#ffeb3b'; ctx.fillRect(-5, -r*0.9, 10, 6); },
        'helmet_open': (ctx, r, color) => { ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.6, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#ffe0b2'; ctx.beginPath(); ctx.arc(0, -r*0.2, r*0.4, 0, Math.PI*2); ctx.fill(); },
        'helmet_bucket': (ctx, r, color) => { ctx.fillStyle = '#546e7a'; ctx.fillRect(-r*0.5, -r*0.9, r, r*0.8); },
        'helmet_tech': (ctx, r, color) => { ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='red'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.2, 0, Math.PI*2); ctx.fill(); },
        
        'hood': (ctx, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.55, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#ffe0b2'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.4, 0, Math.PI*2); ctx.fill(); },
        'hood_ice': (ctx, r, color) => { ctx.fillStyle = '#b3e5fc'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.55, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#e1f5fe'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.4, 0, Math.PI*2); ctx.fill(); },
        'hood_ninja': (ctx, r, color) => { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.55, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#ffe0b2'; ctx.fillRect(-r*0.3, -r*0.4, r*0.6, r*0.2); },
        'hood_dark': (ctx, r, color) => { ctx.fillStyle = '#311b92'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.55, Math.PI, 0); ctx.fill(); },
        
        'skull': (ctx, r, color) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-r*0.2, -r*0.3, r*0.15, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(r*0.2, -r*0.3, r*0.15, 0, Math.PI*2); ctx.fill(); },
        'skull_giant': (ctx, r, color) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -r*0.4, r*0.7, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#000'; ctx.fillRect(-r*0.3, -r*0.5, r*0.2, r*0.2); ctx.fillRect(r*0.1, -r*0.5, r*0.2, r*0.2); },
        'skull_helm': (ctx, r, color) => { ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(0, -r*0.5, r*0.4, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI, false); ctx.fill(); },
        
        'mohawk': (ctx, r, color) => { ctx.fillStyle = '#333'; ctx.fillRect(-2, -r*0.9, 4, r*0.6); ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); },
        'robot_horn': (ctx, r, color) => { ctx.fillStyle = '#455a64'; ctx.beginPath(); ctx.moveTo(-r*0.5, -r*0.3); ctx.lineTo(-r, -r); ctx.lineTo(-r*0.2, -r*0.5); ctx.fill(); ctx.beginPath(); ctx.moveTo(r*0.5, -r*0.3); ctx.lineTo(r, -r); ctx.lineTo(r*0.2, -r*0.5); ctx.fill(); ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); },
        'coil': (ctx, r, color) => { ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.arc(0, -r*0.2, r*0.4, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 2; ctx.stroke(); },
        'horse_wood': (ctx, r, color) => { ctx.fillStyle = '#8d6e63'; ctx.fillRect(-r*0.4, -r*1.2, r*0.8, r*0.8); },
        'demon': (ctx, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.2, 0, Math.PI*2); ctx.fill(); },
        'bat': (ctx, r, color) => { ctx.fillStyle = "#311b92"; ctx.beginPath(); ctx.arc(0, -r*0.2, r*0.4, 0, Math.PI*2); ctx.fill(); ctx.fillStyle="#fff"; ctx.fillRect(-2, -r*0.3, 4, 2); },
        'bald': (ctx, r, color) => { ctx.fillStyle = '#f0ceab'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); },
        'hair_orange': (ctx, r, color) => { ctx.fillStyle = '#e65100'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.6, 0, Math.PI*2); ctx.fill(); },
        'hair_spiky': (ctx, r, color) => { ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-r*0.5, 0); ctx.lineTo(r*0.5, 0); ctx.fill(); ctx.fillStyle = '#ffe0b2'; ctx.beginPath(); ctx.arc(0, -r*0.2, r*0.4, 0, Math.PI*2); ctx.fill(); },
        'hair_long': (ctx, r, color) => { ctx.fillStyle = '#fff9c4'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.6, 0, Math.PI*2); ctx.fill(); },
        'tiara': (ctx, r, color) => { ctx.fillStyle = '#ffd700'; ctx.fillRect(-r*0.4, -r*0.9, r*0.8, r*0.2); ctx.fillStyle = '#ffe0b2'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); },
        'mask': (ctx, r, color) => { ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.2, 0, Math.PI*2); ctx.fill(); },
        'mask_hood': (ctx, r, color) => { ctx.fillStyle = '#1a237e'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.55, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; ctx.fillRect(-r*0.3, -r*0.4, r*0.6, r*0.3); },
        'goblin_blue': (ctx, r, color) => { ctx.fillStyle = '#3949ab'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#1a237e'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-5, -5); ctx.lineTo(5, -5); ctx.fill(); },
        'antlers': (ctx, r, color) => { ctx.strokeStyle = '#5d4037'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-5, -10); ctx.lineTo(-15, -20); ctx.moveTo(5, -10); ctx.lineTo(15, -20); ctx.stroke(); ctx.fillStyle='#ffe0b2'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); },
        'rock': (ctx, r, color) => { ctx.fillStyle = '#8d6e63'; ctx.fillRect(-r*0.4, -r*0.8, r*0.8, r*0.6); },
        'rock_head': (ctx, r, color) => { ctx.fillStyle = '#bf360c'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); },
        'ancient_helm': (ctx, r, color) => { ctx.fillStyle = '#5d4037'; ctx.fillRect(-r*0.5, -r*0.9, r, r*0.6); ctx.fillStyle='#ffab00'; ctx.fillRect(-r*0.2, -r*0.8, r*0.4, r*0.4); },
        'lizard': (ctx, r, color) => { ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-r*0.4, 0); ctx.lineTo(r*0.4, 0); ctx.fill(); },
        'fur_white': (ctx, r, color) => { ctx.fillStyle = '#e0f7fa'; ctx.beginPath(); ctx.arc(0, -r*0.4, r*0.6, 0, Math.PI*2); ctx.fill(); },
        'machine': (ctx, r, color) => { ctx.fillStyle = '#8d6e63'; ctx.fillRect(-r*0.5, -r*0.5, r, r); },
        'balloon': (ctx, r, color) => { ctx.fillStyle = '#e57373'; ctx.beginPath(); ctx.arc(0, -r*1.5, r*1.2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle="#fff"; ctx.font="10px Arial"; ctx.fillText("💀", -5, -r*1.5); },
        'hat_winter': (ctx, r, color) => { ctx.fillStyle = '#5c6bc0'; ctx.beginPath(); ctx.arc(0, -r*0.5, r*0.5, Math.PI, 0); ctx.fill(); ctx.fillStyle='#ffe0b2'; ctx.beginPath(); ctx.arc(0, -r*0.2, r*0.45, 0, Math.PI*2); ctx.fill(); },
        'bandana': (ctx, r, color) => { ctx.fillStyle = '#f44336'; ctx.fillRect(-r*0.5, -r*0.8, r, r*0.3); ctx.fillStyle='#76ff03'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); },
        'pig': (ctx, r, color) => { ctx.fillStyle = '#f48fb1'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#f06292'; ctx.beginPath(); ctx.ellipse(0, -r*0.3, r*0.2, r*0.15, 0, 0, Math.PI*2); ctx.fill(); },
        'ghillie': (ctx, r, color) => { ctx.fillStyle = '#33691e'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.55, 0, Math.PI*2); ctx.fill(); },
        'king_crown': (ctx, r, color) => { 
            ctx.fillStyle = '#ffe0b2'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill(); // Head
            ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.moveTo(-r*0.5, -r*0.5); ctx.lineTo(-r*0.2, -r*1.0); ctx.lineTo(0, -r*0.5); ctx.lineTo(r*0.2, -r*1.0); ctx.lineTo(r*0.5, -r*0.5); ctx.fill(); // Crown
        },
        'turret_cannon': (ctx, r, color) => {
            // Meriam Hitam
            ctx.fillStyle = '#212121'; ctx.fillRect(-r*0.3, -r*0.4, r*0.6, r*1.2); // Barrel body
            ctx.fillStyle = '#424242'; ctx.beginPath(); ctx.arc(0, r*0.6, r*0.35, 0, Math.PI*2); ctx.fill(); // Base pivot
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, -r*0.4, r*0.2, 0, Math.PI*2); ctx.fill(); // Lobang
        },
        'turret_xbow': (ctx, r, color) => {
            // Crossbow ungu/kayu
            ctx.fillStyle = '#8d6e63'; ctx.fillRect(-r*0.2, -r*0.8, r*0.4, r*1.6); // Body panjang
            // Busur
            ctx.strokeStyle = '#ab47bc'; ctx.lineWidth=3; 
            ctx.beginPath(); ctx.moveTo(-r, 0); ctx.quadraticCurveTo(0, -r*0.5, r, 0); ctx.stroke();
            // Tali
            ctx.strokeStyle = '#fff'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(0, r*0.5); ctx.lineTo(r, 0); ctx.stroke();
        },
        'turret_mortar': (ctx, r, color) => {
            // Mortar Besar
            ctx.fillStyle = '#78909c'; ctx.beginPath(); ctx.arc(0, 0, r*0.7, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.arc(0, 0, r*0.4, 0, Math.PI*2); ctx.fill(); // Lobang besar
        },
        'tower_inferno': (ctx, r, color) => {
            // Cincin Penahan Lensa
            ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, r*0.7, 0, Math.PI*2); ctx.stroke();
            
            // Lensa Magma Gelap
            ctx.fillStyle = '#bf360c'; ctx.beginPath(); ctx.arc(0, 0, r*0.6, 0, Math.PI*2); ctx.fill();
            
            // Inti Panas (Berdenyut)
            const pulse = 1 + Math.sin(Date.now() / 150) * 0.15;
            ctx.fillStyle = '#ffeb3b'; ctx.shadowColor = '#ff5722'; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(0, 0, r*0.3 * pulse, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;

            // Fokus Arah (Segitiga kecil di depan)
            ctx.fillStyle = '#5d4037'; 
            ctx.beginPath(); ctx.moveTo(-r*0.3, -r*0.7); ctx.lineTo(0, -r*1.3); ctx.lineTo(r*0.3, -r*0.7); ctx.fill();
        },
        'helmet_laser': (ctx, r, color) => {
            // Helm Cyberpunk
            ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.6, 0, Math.PI*2); ctx.fill();
            // Visor Laser
            ctx.fillStyle = '#ff4081'; ctx.shadowColor = '#ff4081'; ctx.shadowBlur = 10;
            ctx.fillRect(-r*0.4, -r*0.4, r*0.8, r*0.2);
            ctx.shadowBlur = 0;
        },
    },

    // --- WEAPONS (SENJATA) ---
    // ctx: context, r: radius, pos: {x, y} relative
    weapons: {
        'none': (ctx, r, pos) => {}, // Unarmed
        'fist': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y);
            ctx.fillStyle = '#e0ceb0'; ctx.beginPath(); ctx.arc(0, 0, r*0.3, 0, Math.PI*2); ctx.fill();
        },
        'fist_rock': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y);
            ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.arc(0, 0, r*0.4, 0, Math.PI*2); ctx.fill();
        },
        'fist_ice': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y);
            ctx.fillStyle = '#4fc3f7'; ctx.beginPath(); ctx.arc(0, 0, r*0.4, 0, Math.PI*2); ctx.fill();
        },
        'fist_giant': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y);
            ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.arc(0, 0, r*0.5, 0, Math.PI*2); ctx.fill();
        },
        
        // BOMBS & EXPLOSIVES
        'bomb_carry': (ctx, r, pos) => { // Giant Skeleton
            ctx.translate(pos.x, pos.y);
            ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(0, 0, r*0.7, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(r*0.2, -r*0.2, r*0.1, 0, Math.PI*2); ctx.fill(); // Spark
        },
        'bomb_drop': (ctx, r, pos) => { // Balloon
            ctx.translate(0, r*0.5); // Di bawah
            ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.arc(0, 0, r*0.5, 0, Math.PI*2); ctx.fill();
        },
        'bomb_hug': (ctx, r, pos) => { // Wall Breakers
            ctx.translate(0, -r*0.2); // Di peluk
            ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(0, 0, r*0.6, 0, Math.PI*2); ctx.fill();
        },
        'rock_hold': (ctx, r, pos) => { // Bowler
            ctx.translate(0, -r);
            ctx.fillStyle = '#5c6bc0'; ctx.beginPath(); ctx.arc(0, 0, r*0.8, 0, Math.PI*2); ctx.fill();
        },

        // SHOOTERS
        'musket': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.2);
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-2, -r*1.5, 4, r*2);
            ctx.fillStyle = '#333'; ctx.fillRect(-3, -r*1.5, 6, r*0.5);
        },
        'rifle_long': (ctx, r, pos) => { // Sniper
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#3e2723'; ctx.fillRect(-2, -r*2, 4, r*2.5);
            ctx.fillStyle = '#1b5e20'; ctx.fillRect(-3, -r*1.5, 6, r*0.8); // Camo wrap
        },
        'blowdart': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#d7ccc8'; ctx.fillRect(-2, -r, 4, r*1.2);
        },
        'cannon_hand': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#333'; ctx.fillRect(-r*0.4, -r, r*0.8, r*1.2);
        },
        'cannon': (ctx, r, pos) => {
            ctx.translate(0, -r*0.5);
            ctx.fillStyle = '#212121'; ctx.fillRect(-r*0.3, -r*0.8, r*0.6, r);
        },
        'coil_gun': (ctx, r, pos) => { // Sparky
            ctx.translate(0, -r);
            ctx.fillStyle = '#ffca28'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-r*0.5, 0); ctx.lineTo(r*0.5, 0); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -r*0.8, 3, 0, Math.PI*2); ctx.fill();
        },
        'beam_emitter': (ctx, r, pos) => { // Inferno
            ctx.translate(0, -r*0.8);
            ctx.fillStyle = '#333'; ctx.fillRect(-r*0.2, -r*0.4, r*0.4, r*0.6);
            ctx.fillStyle = '#ff5722'; ctx.beginPath(); ctx.arc(0, -r*0.4, 4, 0, Math.PI*2); ctx.fill();
        },

        // MAGIC & ELEMENTAL
        'magic_fire': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#ff5722'; ctx.shadowBlur=10; ctx.shadowColor='orange'; ctx.beginPath(); ctx.arc(0, -r*0.5, r*0.4, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
        },
        'magic_ice': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#29b6f6'; ctx.shadowBlur=10; ctx.shadowColor='cyan'; ctx.beginPath(); ctx.arc(0, -r*0.5, r*0.4, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
        },
        'magic_zap': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#ffeb3b'; ctx.shadowBlur=10; ctx.shadowColor='yellow'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-5, -r*0.5); ctx.lineTo(5, -r*0.5); ctx.fill(); ctx.shadowBlur=0;
        },
        'spit': (ctx, r, pos) => { /* Visualized via projectile usually */ },
        'spit_fire': (ctx, r, pos) => {
            ctx.translate(0, -r*0.8); ctx.fillStyle="#ff5722"; ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill();
        },
        'bite': (ctx, r, pos) => { /* Melee animation handles this */ },
        'bite_venom': (ctx, r, pos) => { ctx.translate(0, -r*0.8); ctx.fillStyle="#00e676"; ctx.fillRect(-2,0,4,6); },

        // MELEE WEAPONS (Lanjutan)
        'shovel': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#8d6e63'; ctx.fillRect(-2, -r, 4, r*1.2);
            ctx.fillStyle = '#bdbdbd'; ctx.beginPath(); ctx.moveTo(-5, -r); ctx.lineTo(5, -r); ctx.lineTo(0, -r*1.4); ctx.fill();
        },
        'sword': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#cfd8dc'; ctx.fillRect(-2, -r, 4, r*1.2); 
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-6, 0, 12, 4); 
        },
        'sword_giant': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#cfd8dc'; ctx.fillRect(-4, -r*1.5, 8, r*1.8); 
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-10, 0, 20, 6);
        },
        'sword_light': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#fff'; ctx.shadowBlur=5; ctx.shadowColor='#f06292'; ctx.fillRect(-2, -r, 4, r*1.2); ctx.shadowBlur=0;
        },
        'katana': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(5, -r, 0, -r*1.4); ctx.lineTo(-2, -r*1.4); ctx.quadraticCurveTo(3, -r, -2, 0); ctx.fill();
            ctx.fillStyle = '#000'; ctx.fillRect(-4, 0, 8, 4);
        },
        'bow': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r*0.6, Math.PI, 0); ctx.stroke();
            ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-r*0.6, 0); ctx.lineTo(r*0.6, 0); ctx.stroke();
        },
        'bow_fire': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.strokeStyle = '#d84315'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r*0.7, Math.PI, 0); ctx.stroke();
            ctx.fillStyle = '#ff5722'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI*2); ctx.fill();
        },
        'spear': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.8);
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-1, -r*0.5, 2, r*2); 
            ctx.fillStyle = '#90a4ae'; ctx.beginPath(); ctx.moveTo(0, -r*1.2); ctx.lineTo(3, -r*0.5); ctx.lineTo(-3, -r*0.5); ctx.fill(); 
        },
        'lance': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r);
            ctx.fillStyle = '#ffb74d'; ctx.beginPath(); ctx.moveTo(0, -r*1.5); ctx.lineTo(4, 0); ctx.lineTo(-4, 0); ctx.fill();
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-2, 0, 4, r);
        },
        'axe': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-2, -r, 4, r);
            ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.arc(0, -r, r*0.6, 0, Math.PI*2); ctx.fill();
        },
        'axe_double': (ctx, r, pos) => { 
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-2, -r*1.2, 4, r*1.5);
            ctx.fillStyle = '#cfd8dc'; 
            ctx.beginPath(); ctx.moveTo(0,-r*1.2); ctx.lineTo(r,-r); ctx.lineTo(0,-r*0.8); ctx.fill();
            ctx.beginPath(); ctx.moveTo(0,-r*1.2); ctx.lineTo(-r,-r); ctx.lineTo(0,-r*0.8); ctx.fill();
        },
        'axe_throw': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.arc(0, -r, r*0.7, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(0, -r, r*0.3, 0, Math.PI*2); ctx.fill();
        },
        'axe_bottle': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#7e57c2'; ctx.fillRect(-3, -r, 6, r); // Botol ungu
        },
        'hammer': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-2, -r, 4, r);
            ctx.fillStyle = '#333'; ctx.fillRect(-r*0.6, -r-5, r*1.2, r*0.5);
        },
        'mace': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-2, -r, 4, r);
            ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(0, -r, r*0.4, 0, Math.PI*2); ctx.fill();
        },
        'mace_hands': (ctx, r, pos) => { // Mega Knight
            ctx.translate(pos.x, pos.y);
            ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(0, 0, r*0.6, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#bdbdbd'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5, -r*0.6); ctx.lineTo(5, -r*0.6); ctx.fill(); // Spikes
        },
        'staff': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.8);
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-1, -r, 2, r*2);
            ctx.fillStyle = 'orange'; ctx.beginPath(); ctx.arc(0, -r, r*0.3, 0, Math.PI*2); ctx.fill();
        },
        'staff_wood': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.8);
            ctx.fillStyle = '#8d6e63'; ctx.fillRect(-2, -r, 4, r*2);
            ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.arc(0, -r, r*0.4, 0, Math.PI*2); ctx.fill();
        },
        'staff_axe': (ctx, r, pos) => { // Night Witch
            ctx.translate(pos.x, pos.y - r*0.8);
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-1, -r, 2, r*2);
            ctx.fillStyle = '#ab47bc'; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-5, -r-5); ctx.lineTo(5, -r-5); ctx.fill();
        },
        'dual_dagger': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y);
            ctx.fillStyle = '#bdbdbd'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(2, -r*0.5); ctx.lineTo(-2, -r*0.5); ctx.fill();
        },
        'dual_swords': (ctx, r, pos) => {
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#cfd8dc'; ctx.fillRect(-2, -r, 4, r*1.2); 
        },
        'laser_beam': (ctx, r, pos) => {
            // Senjata Laser Bahu/Tangan
            ctx.translate(pos.x, pos.y - r*0.5);
            ctx.fillStyle = '#37474f'; ctx.fillRect(-2, -r, 4, r*1.2); // Gagang
            ctx.fillStyle = '#ff4081'; ctx.beginPath(); ctx.arc(0, -r, 4, 0, Math.PI*2); ctx.fill(); // Emitter
        },
    },

};