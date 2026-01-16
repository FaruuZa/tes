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
            ctx.beginPath(); ctx.ellipse(0, 0, r*0.6, r*0.5, 0, 0, Math.PI*2); ctx.fill();
        },

        // === VISUAL TOWER (TETAP KOKOH TAPI LEBIH DETAIL) ===
        'tower_king': (ctx, r, color) => {
            // Base Benteng (Sedikit miring biar gak kotak banget)
            ctx.fillStyle = '#90a4ae'; 
            ctx.beginPath(); 
            ctx.moveTo(-r*1.4, -r*1.2); ctx.lineTo(r*1.4, -r*1.2); // Atas lebar
            ctx.lineTo(r*1.5, r*1.2); ctx.lineTo(-r*1.5, r*1.2);   // Bawah lebih lebar
            ctx.fill();
            ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 2; ctx.stroke();
            
            // Platform Warna Tim
            ctx.fillStyle = color; ctx.fillRect(-r*1.1, -r*1.1, r*2.2, r*2.2); 
            
            // 4 Sudut Pilar (Bulat)
            ctx.fillStyle = '#607d8b'; 
            [[ -1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(p => {
                ctx.beginPath(); ctx.arc(p[0]*r, p[1]*r, r*0.4, 0, Math.PI*2); ctx.fill();
            });
        },
        
        'tower_princess': (ctx, r, color) => {
            // Base Bulat Bertingkat
            ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.arc(0, 0, r*1.4, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, r*1.0, 0, Math.PI*2); ctx.fill();
            // Pagar Kayu/Batu
            ctx.strokeStyle = '#fff'; ctx.setLineDash([4,4]); 
            ctx.beginPath(); ctx.arc(0, 0, r*1.0, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
        },

        'tower_tesla': (ctx, r, color) => {
            // Base Segienam (Hexagon) bukan kotak
            ctx.fillStyle = '#455a64'; 
            ctx.beginPath();
            for(let i=0; i<6; i++) {
                const angle = i * Math.PI/3;
                ctx.lineTo(Math.cos(angle)*r*1.5, Math.sin(angle)*r*1.5);
            }
            ctx.fill();
            
            // Mesin Tengah
            ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
            // Coil
            ctx.strokeStyle = '#0288d1'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, r*0.6, 0, Math.PI*2); ctx.stroke();
        },

        // === VISUAL UNIT (ARMOR & CLOTHING LEBIH BERBENTUK) ===
        
        'armor_heavy': (ctx, r, color) => { // PEKKA, MK (Bentuk V-Shape / Cuirass)
            const grad = ctx.createLinearGradient(-r, -r, r, r);
            grad.addColorStop(0, '#263238'); grad.addColorStop(0.5, color); grad.addColorStop(1, '#111');
            ctx.fillStyle = grad;
            
            ctx.beginPath();
            ctx.moveTo(-r*0.9, -r*0.4); // Bahu Kiri
            ctx.lineTo(r*0.9, -r*0.4);  // Bahu Kanan
            ctx.lineTo(r*0.6, r*0.8);   // Pinggang Kanan
            ctx.lineTo(0, r*1.0);       // Bawah Tengah (Lancip)
            ctx.lineTo(-r*0.6, r*0.8);  // Pinggang Kiri
            ctx.fill();
            
            // Pelindung Bahu Bulat
            ctx.fillStyle = "#37474f";
            ctx.beginPath(); ctx.arc(-r*0.9, -r*0.4, r*0.35, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(r*0.9, -r*0.4, r*0.35, 0, Math.PI*2); ctx.fill();
        },

        'armor_plate': (ctx, r, color) => { // Mini PEKKA (Lebih ramping)
            ctx.fillStyle = "#546e7a"; 
            ctx.beginPath();
            ctx.moveTo(-r*0.7, -r*0.3); ctx.lineTo(r*0.7, -r*0.3);
            ctx.lineTo(r*0.5, r*0.7); ctx.lineTo(-r*0.5, r*0.7);
            ctx.fill();
            // Inti Energi (Segitiga terbalik)
            ctx.fillStyle = color; 
            ctx.beginPath(); ctx.moveTo(-r*0.3, -r*0.1); ctx.lineTo(r*0.3, -r*0.1); ctx.lineTo(0, r*0.4); ctx.fill();
        },

        'armor_samurai': (ctx, r, color) => { // Samurai (Plat berlapis/Lamellar)
            ctx.fillStyle = "#b71c1c"; 
            // 3 Lapis Armor Melengkung
            for(let i=0; i<3; i++) {
                const y = -r*0.3 + (i * r*0.4);
                const w = r * (0.8 - i*0.1); // Makin ke bawah makin kecil
                ctx.beginPath();
                ctx.ellipse(0, y, w, r*0.25, 0, Math.PI, 0); // Setengah oval
                ctx.fill();
            }
        },

        'ancient_armor': (ctx, r, color) => { // Titan (Batu/Logam Kuno Masif)
            ctx.fillStyle = "#3e2723"; 
            ctx.beginPath();
            ctx.moveTo(-r*1.0, -r*0.5); ctx.lineTo(r*1.0, -r*0.5); // Bahu lebar
            ctx.lineTo(r*0.8, r*1.0); ctx.lineTo(-r*0.8, r*1.0);   // Badan tebal
            ctx.fill();
            // Inti Energi Kuno
            ctx.fillStyle = "#d7ccc8"; ctx.shadowColor=color; ctx.shadowBlur=10;
            ctx.beginPath(); ctx.arc(0, 0, r*0.3, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
        },

        'robe': (ctx, r, color) => { // Wizard (Jubah A-Line Flowy)
            ctx.fillStyle = color; 
            ctx.beginPath(); 
            ctx.moveTo(0, -r*0.6); // Leher
            ctx.quadraticCurveTo(r*1.2, r*0.8, r*1.0, r*1.2); // Sisi Kanan Melengkung
            ctx.lineTo(-r*1.0, r*1.2); // Bawah
            ctx.quadraticCurveTo(-r*1.2, r*0.8, 0, -r*0.6); // Sisi Kiri
            ctx.fill();
        },
        'robe_dark': (ctx, r, color) => { 
            ctx.fillStyle = "#311b92"; 
            ctx.beginPath(); ctx.moveTo(0, -r*0.6); ctx.lineTo(r*0.9, r*1.2); ctx.lineTo(-r*0.9, r*1.2); ctx.fill();
        },
        'robe_green': (ctx, r, color) => { 
            ctx.fillStyle = "#2e7d32"; 
            ctx.beginPath(); ctx.moveTo(0, -r*0.6); ctx.lineTo(r*0.9, r*1.2); ctx.lineTo(-r*0.9, r*1.2); ctx.fill();
        },

        'cloth': (ctx, r, color) => { // Baju Dasar (Archer, Knight)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(-r*0.6, -r*0.4, r*1.2, r*1.1, 5); // Kotak dengan sudut bulat (modern canvas API)
            ctx.fill();
            // Sabuk
            ctx.fillStyle = "#5d4037"; ctx.fillRect(-r*0.6, r*0.2, r*1.2, r*0.2);
        },
        'cloth_heavy': (ctx, r, color) => { // Executioner (Otot + Kain)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-r*0.8, -r*0.4); ctx.lineTo(r*0.8, -r*0.4); // Bahu lebar
            ctx.lineTo(r*0.5, r*0.8); ctx.lineTo(-r*0.5, r*0.8);   // Pinggang
            ctx.fill();
            // Tali silang dada
            ctx.strokeStyle = "#3e2723"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-r*0.7, -r*0.4); ctx.lineTo(r*0.5, r*0.8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(r*0.7, -r*0.4); ctx.lineTo(-r*0.5, r*0.8); ctx.stroke();
        },

        'ribs': (ctx, r, color) => { // Skeleton (Tulang Rusuk)
            ctx.strokeStyle = '#eee'; ctx.lineWidth = 2; ctx.lineCap = "round";
            // Tulang belakang
            ctx.beginPath(); ctx.moveTo(0, -r*0.4); ctx.lineTo(0, r*0.4); ctx.stroke();
            // Rusuk
            ctx.beginPath(); ctx.moveTo(-r*0.5, -r*0.2); ctx.lineTo(r*0.5, -r*0.2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-r*0.4, 0); ctx.lineTo(r*0.4, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-r*0.3, r*0.2); ctx.lineTo(r*0.3, r*0.2); ctx.stroke();
        },
        'ribs_armor': (ctx, r, color) => { // Guards (Armor Pelat Dada Sederhana)
            ctx.fillStyle = '#444'; 
            ctx.beginPath();
            ctx.moveTo(-r*0.6, -r*0.3); ctx.lineTo(r*0.6, -r*0.3);
            ctx.lineTo(r*0.4, r*0.5); ctx.lineTo(0, r*0.7); ctx.lineTo(-r*0.4, r*0.5);
            ctx.fill();
            // Detail Tulang
            ctx.strokeStyle = '#eee'; ctx.lineWidth = 2; 
            ctx.beginPath(); ctx.moveTo(0, -r*0.1); ctx.lineTo(0, r*0.3); ctx.stroke();
        },

        'spirit': (ctx, r, color) => { // Spirits (Bulat tapi ada ekor/asap)
            ctx.fillStyle = color; 
            ctx.beginPath(); ctx.arc(0, -r*0.1, r*0.7, 0, Math.PI*2); ctx.fill();
            // Kaki kecil
            ctx.beginPath(); ctx.arc(-r*0.4, r*0.5, r*0.2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(r*0.4, r*0.5, r*0.2, 0, Math.PI*2); ctx.fill();
        },

        'rock': (ctx, r, color) => { // Golem (Bongkahan Batu Asimetris)
            ctx.fillStyle = '#8d6e63'; 
            ctx.beginPath(); 
            ctx.moveTo(-r*0.9, -r*0.5); 
            ctx.lineTo(r*0.8, -r*0.6); 
            ctx.lineTo(r*1.0, r*0.4); 
            ctx.lineTo(0, r*0.9); 
            ctx.lineTo(-r*0.8, r*0.5); 
            ctx.fill();
            // Retakan
            ctx.strokeStyle = "#5d4037"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, -r*0.2); ctx.lineTo(-r*0.4, r*0.3); ctx.stroke();
        },
        
        'pig': (ctx, r, color) => { // Hog Rider (Lonjong)
            ctx.fillStyle = "#f48fb1"; 
            ctx.beginPath(); ctx.ellipse(0, 0, r*0.7, r*0.9, 0, 0, Math.PI*2); ctx.fill();
            // Kaki
            ctx.beginPath(); ctx.arc(-r*0.5, -r*0.6, r*0.2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(r*0.5, -r*0.6, r*0.2, 0, Math.PI*2); ctx.fill();
        },

        'machine_tank': (ctx, r, color) => { // Sparky (Wedge Shape / Tank)
            ctx.fillStyle = "#5d4037"; // Kayu dasar
            ctx.beginPath();
            ctx.moveTo(-r*1.0, -r*1.0); ctx.lineTo(r*1.0, -r*1.0); // Belakang lebar
            ctx.lineTo(r*0.6, r*1.0); ctx.lineTo(-r*0.6, r*1.0);   // Depan agak sempit
            ctx.fill();
            // Plat Emas Atas
            ctx.fillStyle = "#fbc02d"; 
            ctx.beginPath(); ctx.roundRect(-r*0.7, -r*0.7, r*1.4, r*1.4, 3); ctx.fill();
        },

        'basket': (ctx, r, color) => { // Balloon (Keranjang Anyaman Tirus)
            ctx.fillStyle = "#795548"; 
            ctx.beginPath();
            ctx.moveTo(-r*0.7, -r*0.7); ctx.lineTo(r*0.7, -r*0.7); // Atas lebar
            ctx.lineTo(r*0.5, r*0.5); ctx.lineTo(-r*0.5, r*0.5);   // Bawah sempit
            ctx.fill();
            // Garis anyaman
            ctx.strokeStyle = "#5d4037"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-r*0.6, -r*0.3); ctx.lineTo(r*0.6, -r*0.3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-r*0.55, 0); ctx.lineTo(r*0.55, 0); ctx.stroke();
        },

        'shirt_plaid': (ctx, r, color) => { // Lumberjack (Baju Kotak Berotot)
            ctx.fillStyle = "#d32f2f"; // Merah
            ctx.beginPath();
            // Bentuk badan agak V
            ctx.moveTo(-r*0.8, -r*0.3); ctx.lineTo(r*0.8, -r*0.3);
            ctx.lineTo(r*0.6, r*0.8); ctx.lineTo(-r*0.6, r*0.8);
            ctx.fill();
            // Motif Kotak-kotak (Garis vertikal & horizontal)
            ctx.strokeStyle = "#b71c1c"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, -r*0.3); ctx.lineTo(0, r*0.8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-r*0.7, 0); ctx.lineTo(r*0.7, 0); ctx.stroke();
        },

        'wood_box': (ctx, r, color) => { // Kotak Kayu (tapi rounded dikit)
            ctx.fillStyle = '#8d6e63'; 
            ctx.beginPath(); ctx.roundRect(-r*0.7, -r*0.7, r*1.4, r*1.4, 4); ctx.fill();
            // Paku
            ctx.fillStyle = "#5d4037";
            ctx.beginPath(); ctx.arc(-r*0.5, -r*0.5, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(r*0.5, r*0.5, 2, 0, Math.PI*2); ctx.fill();
        },
        'wood_mech': (ctx, r, color) => { // Flying Machine (Tong Kayu)
            ctx.fillStyle = '#8d6e63'; 
            ctx.beginPath(); ctx.ellipse(0, 0, r*0.7, r*0.8, 0, 0, Math.PI*2); ctx.fill();
            // Sabuk besi
            ctx.strokeStyle = "#5d4037"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, r*0.7, 0, Math.PI*2); ctx.stroke();
        },

        // --- NEW BODY TYPES (YANG BARU DITAMBAHKAN SEBELUMNYA) ---
        'body_spider': (ctx, r, color) => {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(0, 0, r*0.8, 0, Math.PI*2); ctx.fill(); 
            ctx.fillStyle = "#212121"; 
            ctx.beginPath(); ctx.arc(0, -r*0.6, r*0.5, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = "round";
            // Kaki Melengkung
            ctx.beginPath(); ctx.moveTo(-r*0.4, -r*0.2); ctx.quadraticCurveTo(-r*1.5, -r*0.5, -r*1.2, r*0.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(r*0.4, -r*0.2); ctx.quadraticCurveTo(r*1.5, -r*0.5, r*1.2, r*0.5); ctx.stroke();
        },
        'body_snake': (ctx, r, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(0, r*0.4, r*0.9, r*0.5, 0, 0, Math.PI*2); // Badan melingkar
            ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, r*0.2); ctx.quadraticCurveTo(0, -r*0.5, 0, -r*0.8); ctx.strokeStyle=color; ctx.lineWidth=r*0.6; ctx.stroke(); // Leher
        },
        'body_ice_golem': (ctx, r, color) => {
            ctx.fillStyle = color;
            ctx.beginPath(); // Kristal Asimetris
            ctx.moveTo(0, -r*1.1); ctx.lineTo(r*0.9, -r*0.3); ctx.lineTo(r*0.6, r*0.9);
            ctx.lineTo(-r*0.6, r*0.9); ctx.lineTo(-r*0.9, -r*0.3); 
            ctx.fill();
            ctx.strokeStyle = "white"; ctx.lineWidth = 1; ctx.stroke();
        },
        'body_fire_elemental': (ctx, r, color) => {
            const drawFlame = (offsetY, scale, opacity) => {
                 ctx.fillStyle = color; ctx.globalAlpha = opacity;
                 ctx.beginPath();
                 ctx.moveTo(0, -r*1.5 * scale + offsetY);
                 ctx.quadraticCurveTo(r*scale, -r*0.5*scale+offsetY, 0, r*scale+offsetY);
                 ctx.quadraticCurveTo(-r*scale, -r*0.5*scale+offsetY, 0, -r*1.5*scale+offsetY);
                 ctx.fill();
            };
            drawFlame(r*0.2, 1.0, 0.6);
            drawFlame(0, 0.7, 1.0);
            ctx.globalAlpha = 1.0;
        },
        'dragon': (ctx, r, color) => { 
            ctx.fillStyle = color; 
            ctx.beginPath(); 
            ctx.ellipse(0, 0, r*0.6, r*0.9, 0, 0, Math.PI*2); // Badan lonjong
            ctx.fill(); 
        },
        'demon': (ctx, r, color) => { 
            ctx.fillStyle = color; 
            ctx.beginPath(); ctx.arc(0, 0, r*0.6, 0, Math.PI*2); // Badan bulat kecil
            ctx.fill();
        },
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
        'turret_princess': (ctx, r, color) => {
            // Wajah Putri
            ctx.fillStyle = '#f0ceab'; // Skin
            ctx.beginPath(); ctx.arc(0, -r*0.2, r*0.4, 0, Math.PI*2); ctx.fill();
            // Rambut
            ctx.fillStyle = '#e65100'; // Orange Hair
            ctx.beginPath(); ctx.arc(0, -r*0.2, r*0.5, Math.PI, 0); ctx.fill();
            // Mahkota Kecil
            ctx.fillStyle = '#ffd700';
            ctx.beginPath(); ctx.moveTo(-r*0.2, -r*0.6); ctx.lineTo(0, -r*0.9); ctx.lineTo(r*0.2, -r*0.6); ctx.fill();
            // Busur di tangan (Simbolis)
            ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(r*0.4, 0, r*0.3, -Math.PI/2, Math.PI/2); ctx.stroke();
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

        // DALAM VISUALS.heads

        // === FANTASY HATS & HELMS ===
        'hat_wizard': (ctx, r, color) => {
            // Topi kerucut penyihir (warna unit)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, -r*2.0); // Ujung topi lancip ke atas
            ctx.lineTo(r*0.7, -r*0.2); // Brim kanan
            ctx.lineTo(-r*0.7, -r*0.2); // Brim kiri
            ctx.fill();
            // Pita di dasar topi (warna kontras/gelap)
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.fillRect(-r*0.7, -r*0.4, r*1.4, r*0.2);
        },

        'crown_king': (ctx, r, color) => {
             // Mahkota emas dengan permata (warna unit)
            ctx.fillStyle = "#ffd700"; // Emas
            ctx.beginPath();
            ctx.moveTo(-r*0.6, -r*0.2); ctx.lineTo(-r*0.6, -r*0.8); // Kiri
            ctx.lineTo(-r*0.3, -r*0.4); ctx.lineTo(0, -r*1.0);      // Tengah
            ctx.lineTo(r*0.3, -r*0.4); ctx.lineTo(r*0.6, -r*0.8);   // Kanan
            ctx.lineTo(r*0.6, -r*0.2);
            ctx.fill();
            // Permata di tengah
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(0, -r*0.4, r*0.15, 0, Math.PI*2); ctx.fill();
        },

        'helm_dragon': (ctx, r, color) => {
            // Helm berbentuk kepala naga
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.6, 0, Math.PI*2); ctx.fill(); // Base head
            // Moncong
            ctx.fillRect(-r*0.3, -r*0.3, r*0.6, r*0.5);
            // Tanduk (warna tulang)
            ctx.fillStyle = "#d7ccc8";
            ctx.beginPath(); ctx.moveTo(-r*0.4, -r*0.8); ctx.lineTo(-r*0.8, -r*1.5); ctx.lineTo(-r*0.2, -r*1.0); ctx.fill();
            ctx.beginPath(); ctx.moveTo(r*0.4, -r*0.8); ctx.lineTo(r*0.8, -r*1.5); ctx.lineTo(r*0.2, -r*1.0); ctx.fill();
        },

        // === SCI-FI / MODERN ===
        'helm_astronaut': (ctx, r, color) => {
            // Helm bulat besar dengan kaca visor
            ctx.fillStyle = "#eceff1"; // Putih helm
            ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.7, 0, Math.PI*2); ctx.fill();
            // Visor kaca (emas reflektif)
            ctx.fillStyle = "#ffc107";
            ctx.beginPath(); ctx.ellipse(0, -r*0.3, r*0.5, r*0.3, 0, 0, Math.PI*2); ctx.fill();
            // Kilau di kaca
            ctx.fillStyle = "white";
            ctx.beginPath(); ctx.ellipse(-r*0.2, -r*0.4, r*0.1, r*0.05, 0, 0, Math.PI*2); ctx.fill();
        },

        'cyborg_eye': (ctx, r, color) => {
            // Kepala botak normal, tapi satu mata robot
            ctx.fillStyle = '#f0ceab'; // Kulit
            ctx.beginPath(); ctx.arc(0, -r*0.3, r*0.5, 0, Math.PI*2); ctx.fill();
            // Implant logam di sekitar mata kanan
            ctx.fillStyle = "#90a4ae";
            ctx.beginPath(); ctx.arc(r*0.2, -r*0.3, r*0.2, 0, Math.PI*2); ctx.fill();
            // Mata laser merah (atau warna unit)
            ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 5;
            ctx.beginPath(); ctx.arc(r*0.2, -r*0.3, r*0.1, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        },

        // === MONSTER / CREATURE ===
        'head_pumpkin': (ctx, r, color) => {
            // Kepala labu Halloween
            ctx.fillStyle = "#e65100"; // Oranye gelap
            ctx.beginPath(); ctx.arc(0, -r*0.4, r*0.65, 0, Math.PI*2); ctx.fill();
            // Garis-garis labu
            ctx.strokeStyle = "#bf360c"; ctx.lineWidth=1;
            ctx.beginPath(); ctx.arc(0, -r*0.4, r*0.65, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(0, -r*0.4, r*0.3, r*0.65, 0, 0, Math.PI*2); ctx.stroke();
            // Wajah seram (menyala warna unit)
            ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 5;
            // Mata segitiga
            ctx.beginPath(); ctx.moveTo(-r*0.3, -r*0.5); ctx.lineTo(-r*0.1, -r*0.5); ctx.lineTo(-r*0.2, -r*0.3); ctx.fill();
            ctx.beginPath(); ctx.moveTo(r*0.3, -r*0.5); ctx.lineTo(r*0.1, -r*0.5); ctx.lineTo(r*0.2, -r*0.3); ctx.fill();
            // Mulut zigzag
            ctx.beginPath(); ctx.moveTo(-r*0.3, -r*0.1); ctx.lineTo(-r*0.1, -r*0.2); ctx.lineTo(0, -r*0.1);
            ctx.lineTo(r*0.1, -r*0.2); ctx.lineTo(r*0.3, -r*0.1); ctx.lineTo(0, 0.1); ctx.fill();
            ctx.shadowBlur = 0;
             // Tangkai hijau
            ctx.fillStyle = "#33691e"; ctx.fillRect(-r*0.1, -r*1.1, r*0.2, r*0.4);
        },

        'head_cyclops': (ctx, r, color) => {
            // Kepala monster dengan satu mata besar
            ctx.fillStyle = color; // Warna kulit monster
            ctx.beginPath(); ctx.arc(0, -r*0.4, r*0.7, 0, Math.PI*2); ctx.fill();
            // Mata besar di tengah
            ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.arc(0, -r*0.5, r*0.3, 0, Math.PI*2); ctx.fill();
            // Pupil hitam
            ctx.fillStyle = "#000";
            ctx.beginPath(); ctx.arc(0, -r*0.5, r*0.15, 0, Math.PI*2); ctx.fill();
            // Gigi bawah
            ctx.fillStyle = "#ffe0b2";
            ctx.beginPath(); ctx.moveTo(-r*0.3, 0); ctx.lineTo(-r*0.1, -r*0.2); ctx.lineTo(r*0.1, 0); ctx.fill();
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

        // DALAM VISUALS.weapons

        // === NEW MELEE ===
        'scythe_reaper': (ctx, r, pos) => {
            // Sabit besar pencabut nyawa
            ctx.translate(pos.x, pos.y - r*0.8);
            // Gagang panjang kayu gelap
            ctx.fillStyle = '#3e2723'; ctx.fillRect(-2, -r*1.5, 4, r*3.0);
            // Bilah sabit besar melengkung (silver/kebiruan)
            ctx.fillStyle = '#cfd8dc';
            ctx.beginPath();
            ctx.moveTo(0, -r*1.5);
            ctx.quadraticCurveTo(r*2.0, -r*1.8, r*2.5, r*0.5); // Sisi luar tajam
            ctx.quadraticCurveTo(r*1.8, -r*0.5, 0, -r*1.0); // Sisi dalam
            ctx.fill();
        },

        'trident_sea': (ctx, r, pos) => {
            // Trisula (Poseidon/Aquaman)
            ctx.translate(pos.x, pos.y - r*0.8);
            // Gagang emas/kuningan
            ctx.fillStyle = '#ffd54f'; ctx.fillRect(-2, -r*1.0, 4, r*2.5);
            // Kepala trisula
            ctx.beginPath();
            // Gigi tengah
            ctx.moveTo(-2, -r*1.0); ctx.lineTo(0, -r*2.0); ctx.lineTo(2, -r*1.0);
            // Gigi kiri melengkung
            ctx.moveTo(-2, -r*1.0); ctx.quadraticCurveTo(-r*0.8, -r*1.5, -r*0.8, -r*1.8); ctx.lineTo(-r*0.5, -r*1.0);
             // Gigi kanan melengkung
            ctx.moveTo(2, -r*1.0); ctx.quadraticCurveTo(r*0.8, -r*1.5, r*0.8, -r*1.8); ctx.lineTo(r*0.5, -r*1.0);
            ctx.fill();
        },

        // === SHIELDS (PERISAI) ===
        'shield_tower': (ctx, r, pos) => {
            // Perisai menara besar persegi panjang
            ctx.translate(pos.x + r*0.5, pos.y); // Dipegang di samping depan
            ctx.fillStyle = '#546e7a'; // Bingkai logam
            ctx.fillRect(-r*0.8, -r*1.5, r*1.6, r*3.0);
            // Bagian tengah (warna unit)
            ctx.fillStyle = VISUALS.getColor(ctx, r, 1); // Hack: ambil warna dari fillStyle sebelumnya yang diset oleh renderer
            ctx.fillRect(-r*0.6, -r*1.3, r*1.2, r*2.6);
            // Paku/rivets
            ctx.fillStyle = '#cfd8dc';
            ctx.beginPath(); ctx.arc(-r*0.6, -r*1.3, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(r*0.6, -r*1.3, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(-r*0.6, r*1.3, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(r*0.6, r*1.3, 3, 0, Math.PI*2); ctx.fill();
        },

        'shield_round_viking': (ctx, r, pos) => {
            // Perisai bulat kayu viking
            ctx.translate(pos.x + r*0.5, pos.y - r*0.3);
            // Kayu dasar
            ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.arc(0, 0, r*1.0, 0, Math.PI*2); ctx.fill();
            // Bingkai logam dan boss tengah
            ctx.strokeStyle = '#78909c'; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = '#78909c'; ctx.beginPath(); ctx.arc(0, 0, r*0.3, 0, Math.PI*2); ctx.fill();
            // Pola cat (warna unit)
            ctx.fillStyle = VISUALS.getColor(ctx, r, 1); ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0, r*0.95, 0, Math.PI/2); ctx.lineTo(0,0); ctx.fill();
            ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0, r*0.95, Math.PI, Math.PI*1.5); ctx.lineTo(0,0); ctx.fill();
            ctx.globalAlpha = 1.0;
        },


        // === NEW RANGED & MAGIC ===
        'crossbow_hand': (ctx, r, pos) => {
            // Crossbow kecil satu tangan
            ctx.translate(pos.x, pos.y - r*0.3);
            // Badan kayu
            ctx.fillStyle = '#5d4037'; ctx.fillRect(-2, -r*0.8, 4, r*1.2);
            // Busur logam melintang
            ctx.strokeStyle = '#78909c'; ctx.lineWidth=3;
            ctx.beginPath(); ctx.moveTo(-r*0.8, -r*0.6); ctx.quadraticCurveTo(0, -r*0.8, r*0.8, -r*0.6); ctx.stroke();
            // Tali
            ctx.strokeStyle = '#fff'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(-r*0.8, -r*0.6); ctx.lineTo(0, -r*0.2); ctx.lineTo(r*0.8, -r*0.6); ctx.stroke();
        },

        'book_spell': (ctx, r, pos) => {
            // Buku mantra terbuka melayang
            ctx.translate(pos.x, pos.y - r*0.5);
            // Sampul kulit (warna unit)
            ctx.fillStyle = VISUALS.getColor(ctx, r, 1);
            ctx.fillRect(-r*0.8, -r*0.6, r*1.6, r*1.2);
            // Halaman kertas terbuka
            ctx.fillStyle = "#fff3e0";
            ctx.fillRect(-r*0.7, -r*0.5, r*0.65, r*1.0); // Hiri
            ctx.fillRect(0.05, -r*0.5, r*0.65, r*1.0);  // Kanan
            // Garis tulisan/rune magis
            ctx.fillStyle = "#3e2723";
            for(let i=0; i<3; i++) {
                ctx.fillRect(-r*0.6, -r*0.3 + i*r*0.3, r*0.4, 2);
                ctx.fillRect(r*0.2, -r*0.3 + i*r*0.3, r*0.4, 2);
            }
            // Efek cahaya magis (warna unit)
            ctx.shadowColor = VISUALS.getColor(ctx, r, 1); ctx.shadowBlur = 10;
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.beginPath(); ctx.arc(0, 0, r*0.2, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        },
    },

    accessories: {
        'none': (ctx, r, color) => {},

        // === WINGS (SAYAP) ===
        'wings_angel': (ctx, r, color) => {
            // Sayap berbulu, warna dasar mengikuti unit, ujungnya putih
            ctx.fillStyle = color;
            const drawWing = (side) => {
                ctx.beginPath();
                ctx.moveTo(0, -r*0.5);
                // Layer bulu atas
                ctx.quadraticCurveTo(side*r*1.5, -r*1.5, side*r*2.0, -r*0.5);
                ctx.quadraticCurveTo(side*r*1.5, 0, 0, r*0.2);
                ctx.fill();
                // Highlight bulu putih di ujung
                ctx.fillStyle = "rgba(255,255,255,0.7)";
                ctx.beginPath();
                ctx.moveTo(side*r*1.2, -r*0.8);
                ctx.quadraticCurveTo(side*r*2.0, -r*0.5, side*r*1.8, r*0.1);
                ctx.fill();
                ctx.fillStyle = color; // Reset warna untuk sisi satunya
            };
            drawWing(1); // Kanan
            drawWing(-1); // Kiri
        },

        'wings_demon': (ctx, r, color) => {
            // Sayap kelelawar dengan tulang
            const boneColor = "#212121";
            const membraneColor = color; // Warna selaput mengikuti unit

            const drawWing = (side) => {
                 // Selaput
                ctx.fillStyle = membraneColor;
                ctx.beginPath();
                ctx.moveTo(0, -r*0.2);
                ctx.lineTo(side*r*1.8, -r*1.2); // Ujung atas
                ctx.quadraticCurveTo(side*r*1.2, 0, side*r*1.5, r*0.8); // Ujung bawah
                ctx.quadraticCurveTo(side*r*0.5, r*0.2, 0, r*0.5); // Kembali ke punggung
                ctx.fill();

                 // Tulang
                ctx.strokeStyle = boneColor; ctx.lineWidth = 3; ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(0, -r*0.2); ctx.lineTo(side*r*1.8, -r*1.2); // Tulang utama
                ctx.moveTo(side*r*0.9, -r*0.7); ctx.lineTo(side*r*1.2, 0); // Jari 1
                ctx.moveTo(side*r*0.9, -r*0.7); ctx.lineTo(side*r*0.8, r*0.3); // Jari 2
                ctx.stroke();
            };
            drawWing(1); drawWing(-1);
        },

        'wings_dragon': (ctx, r, color) => {
             // Mirip demon tapi lebih tebal dan bersisik (warna lebih gelap untuk shading)
            ctx.fillStyle = color;
            const drawWing = (side) => {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(side*r*1.5, -r*1.8, side*r*2.2, -r*0.5); // Atas
                ctx.lineTo(side*r*1.8, r*0.5); // Samping
                ctx.lineTo(side*r*1.0, r*0.2); // Lipatan
                ctx.lineTo(side*r*0.5, r*0.8); // Bawah
                ctx.lineTo(0, r*0.2);
                ctx.fill();
                // Detail sisik/lipatan (warna lebih gelap)
                ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(side*r*0.2, -r*0.2); ctx.lineTo(side*r*1.8, r*0.5);
                ctx.moveTo(side*r*0.4, r*0.1); ctx.lineTo(side*r*1.0, r*0.2);
                ctx.stroke();
            };
             drawWing(1); drawWing(-1);
        },

        'wings_mech': (ctx, r, color) => {
            // Sayap robot kaku dengan thruster
            ctx.fillStyle = "#607d8b"; // Base metal
            const drawWing = (side) => {
                // Panel utama
                ctx.fillRect(side*r*0.2, -r*1.2, side*r*1.4, r*0.6);
                // Panel sekunder (warna unit)
                ctx.fillStyle = color;
                ctx.fillRect(side*r*0.4, -r*1.0, side*r*1.0, r*0.3);
                ctx.fillStyle = "#607d8b"; // Reset
                // Thruster di bawah
                ctx.fillRect(side*r*0.8, -r*0.6, side*r*0.4, r*0.8);
                // Api thruster (kecil)
                ctx.fillStyle = "#03a9f4";
                ctx.beginPath(); ctx.arc(side*r*1.0, r*0.2, r*0.15, 0, Math.PI*2); ctx.fill();
            };
            drawWing(1); drawWing(-1);
        },

        'wings_fairy': (ctx, r, color) => {
            // Sayap transparan seperti serangga/kupu-kupu
            // Menggunakan warna unit tapi dibuat transparan
            ctx.fillStyle = color; ctx.globalAlpha = 0.4;
            const drawWing = (side) => {
                ctx.beginPath();
                // Sayap atas besar
                ctx.ellipse(side*r*0.8, -r*0.8, r*0.9, r*0.5, side*Math.PI/4, 0, Math.PI*2);
                ctx.fill();
                // Sayap bawah kecil
                ctx.beginPath();
                ctx.ellipse(side*r*0.6, r*0.2, r*0.6, r*0.3, side*-Math.PI/6, 0, Math.PI*2);
                ctx.fill();
            };
            drawWing(1); drawWing(-1);
            ctx.globalAlpha = 1.0; // Reset opacity
        },


        // === CAPES (JUBAH) ===
        'cape_royal': (ctx, r, color) => {
            // Jubah panjang mengalir (warna unit) dengan trim emas
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-r*0.6, -r*0.5); // Bahu kiri
            ctx.quadraticCurveTo(0, -r*0.7, r*0.6, -r*0.5); // Bahu kanan
            ctx.lineTo(r*0.8, r*1.2); // Bawah kanan
            ctx.quadraticCurveTo(0, r*1.5, -r*0.8, r*1.2); // Bawah kiri (melengkung)
            ctx.fill();
            // Trim emas
            ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 2; ctx.stroke();
        },

        'cape_tattered': (ctx, r, color) => {
            // Jubah robek-robek (warna unit tapi lebih gelap)
            ctx.fillStyle = color; // Gunakan warna dasar
            ctx.beginPath();
            ctx.moveTo(-r*0.7, -r*0.5);
            ctx.lineTo(r*0.7, -r*0.5);
            // Ujung bawah compang-camping
            ctx.lineTo(r*0.8, r*0.8); ctx.lineTo(r*0.4, r*1.2); ctx.lineTo(r*0.1, r*0.7);
            ctx.lineTo(-r*0.2, r*1.3); ctx.lineTo(-r*0.5, r*0.9); ctx.lineTo(-r*0.9, r*1.1);
            ctx.fill();
            // Shading gelap
            ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fill();
        },

        // === OTHERS ===
        'jetpack': (ctx, r, color) => {
            // Jetpack sci-fi
            ctx.fillStyle = "#78909c"; // Base metal
            ctx.fillRect(-r*0.8, -r*0.8, r*0.6, r*1.2); // Tangki kiri
            ctx.fillRect(r*0.2, -r*0.8, r*0.6, r*1.2);  // Tangki kanan
            ctx.fillStyle = color; // Warna aksen unit
            ctx.fillRect(-r*0.2, -r*0.6, r*0.4, r*0.8); // Center console
            // Thruster nozzles
            ctx.fillStyle = "#37474f";
            ctx.fillRect(-r*0.7, r*0.4, r*0.4, r*0.3);
            ctx.fillRect(r*0.3, r*0.4, r*0.4, r*0.3);
        },

        'backpack_survival': (ctx, r, color) => {
            // Tas petualang besar (warna kecoklatan + warna unit)
            ctx.fillStyle = "#5d4037"; // Warna tas dasar
            ctx.roundRect(-r*0.9, -r*0.9, r*1.8, r*1.6, 5); ctx.fill();
            // Kantong tambahan (warna unit)
            ctx.fillStyle = color;
            ctx.roundRect(-r*0.7, -r*0.2, r*1.4, r*0.7, 3); ctx.fill();
            // Bedroll di atas
            ctx.fillStyle = "#8d6e63";
            ctx.roundRect(-r*0.8, -r*1.2, r*1.6, r*0.3, 3); ctx.fill();
        }
    },

};