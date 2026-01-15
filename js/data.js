const CONFIG = {
    baseElixirRate: 0.6,
    maxElixir: 10,
    botThinkRate: 1500,
    logicWidth: 400,
    logicHeight: 700,
    gridSize: 20
};

const TOWER_DATA = {
    'king': { name: 'King Tower', hp: 4000, dmg: 110, range: 7, hitSpeed: 1.0, radius: 30, color: '#ffeb3b' },
    'princess': { name: 'Princess', hp: 2500, dmg: 90, range: 7.5, hitSpeed: 0.8, radius: 25, color: '#ff9800' }
};

const CARDS = {
    // ============================================================
    // COMMONS (Murah, Sederhana, Serbaguna)
    // ============================================================
    'knight': { 
        name: 'Knight', cost: 3, icon: '⚔️', type: 'unit', 
        stats: { hp: 1400, dmg: 160, speed: 1.0, range: 0, sightRange: 160, hitSpeed: 1.2, count: 1 }, 
        tags: ['ground','single'], color: '#4fc3f7',
        desc: "Prajurit tangguh dengan kumis menawan. Tank mini yang solid." 
    },
    'archer': { 
        name: 'Archers', cost: 3, icon: '🏹', type: 'unit', 
        stats: { hp: 250, dmg: 90, speed: 1.1, range: 160, sightRange: 220, hitSpeed: 1.0, count: 2 }, 
        tags: ['ground','single','air-target'], color: '#ec407a',
        desc: "Dua pemanah jarak jauh. Efektif melawan unit udara dan darat." 
    },
    'goblins': { 
        name: 'Goblins', cost: 2, icon: '👺', type: 'unit', 
        stats: { hp: 170, dmg: 100, speed: 1.6, range: 0, sightRange: 160, hitSpeed: 1.1, count: 3 }, 
        tags: ['ground','single'], color: '#43a047',
        desc: "Tiga goblin cepat dengan pisau tajam. Jangan remehkan mereka." 
    },
    'spear_goblins': { 
        name: 'Spear Gobs', cost: 2, icon: '🎋', type: 'unit', 
        stats: { hp: 110, dmg: 70, speed: 1.6, range: 160, sightRange: 220, hitSpeed: 1.3, count: 3 }, 
        tags: ['ground','single','air-target'], color: '#2e7d32',
        desc: "Melempar tombak dari kejauhan. Bagus untuk memancing lawan." 
    },
    'minions': { 
        name: 'Minions', cost: 3, icon: '🦇', type: 'unit', 
        stats: { hp: 190, dmg: 85, speed: 1.5, range: 80, sightRange: 200, hitSpeed: 1.0, count: 3 }, 
        tags: ['air','single', 'air-target'], color: '#5c6bc0',
        desc: "Tiga penyerang udara yang cepat. Kelemahan utama: Panah." 
    },
    'skeletons': { 
        name: 'Skeletons', cost: 1, icon: '🦴', type: 'unit', 
        stats: { hp: 60, dmg: 60, speed: 1.4, range: 0, sightRange: 160, hitSpeed: 1.0, count: 3 }, 
        tags: ['ground','single'], color: '#eeeeee',
        desc: "Sangat murah. Bagus untuk mengalihkan perhatian musuh besar." 
    },
    'bats': { 
        name: 'Bats', cost: 2, icon: '🧛', type: 'unit', 
        stats: { hp: 60, dmg: 60, speed: 1.7, range: 0, sightRange: 180, hitSpeed: 1.1, count: 5 }, 
        tags: ['air','single', 'fast', 'air-target'], color: '#4a148c',
        desc: "Lima makhluk malam penghisap darah. Cepat dan mematikan dalam grup." 
    },
    'royal_giant': { 
        name: 'Royal Giant', cost: 6, icon: '🧔', type: 'unit', 
        stats: { hp: 2500, dmg: 250, speed: 0.6, range: 200, sightRange: 250, hitSpeed: 1.7, count: 1 }, 
        tags: ['ground','single','building-hunter','heavy'], color: '#8d6e63',
        desc: "Raksasa dengan meriam besar. Menembak bangunan dari jarak jauh." 
    },
    'elite_barbarians': { 
        name: 'Elite Barbs', cost: 6, icon: '😡', type: 'unit', 
        stats: { hp: 1000, dmg: 300, speed: 1.7, range: 0, sightRange: 200, hitSpeed: 1.4, count: 2 }, 
        tags: ['ground','single','fast'], color: '#ffb74d',
        desc: "Dua Barbarian yang sangat cepat dan sangat marah. Damage tinggi." 
    },
    'ice_spirit': { 
        name: 'Ice Spirit', cost: 1, icon: '🧊', type: 'unit', 
        stats: { hp: 190, dmg: 90, speed: 1.5, kamikaze: true, splashRadius: 60, stunDuration: 1.5 }, 
        tags: ['ground','area','air-target'], color: '#b3e5fc', 
        desc: "Melompat ke musuh dan membekukan mereka selama 1.5 detik." 
    },

    // ============================================================
    // RARES (Unit Spesialis)
    // ============================================================
    'giant': { 
        name: 'Giant', cost: 5, icon: '🗿', type: 'unit', 
        stats: { hp: 3300, dmg: 210, speed: 0.7, range: 0, sightRange: 300, hitSpeed: 1.5, count: 1 }, 
        tags: ['ground','building-hunter','heavy'], color: '#8d6e63',
        desc: "Lambat tapi tebal. Hanya mengincar bangunan. Pelindung yang baik." 
    },
    'musketeer': { 
        name: 'Musketeer', cost: 4, icon: '🎯', type: 'unit', 
        stats: { hp: 600, dmg: 180, speed: 1.0, range: 200, sightRange: 250, hitSpeed: 1.1, count: 1 }, 
        tags: ['ground','single','air-target'], color: '#7b1fa2',
        desc: "Penembak jitu dengan damage tinggi. Jaga jarak aman!" 
    },
    'mini_pekka': { 
        name: 'Mini PEKKA', cost: 4, icon: '⚙️', type: 'unit', 
        stats: { hp: 1100, dmg: 600, speed: 1.4, range: 0, sightRange: 160, hitSpeed: 1.6, count: 1 }, 
        tags: ['ground','single','fast'], color: '#78909c',
        desc: "Kecil tapi sakit! Penghancur tank dan tower jika dibiarkan." 
    },
    'hog_rider': { 
        name: 'Hog Rider', cost: 4, icon: '🐗', type: 'unit', 
        stats: { hp: 1400, dmg: 260, speed: 1.8, range: 0, sightRange: 300, hitSpeed: 1.6, count: 1 }, 
        tags: ['ground','building-hunter','fast'], color: '#795548',
        canJumpRiver: true,
        desc: "HOG RIDERRR! Melompati sungai untuk menghancurkan bangunan." 
    },
    'prince': { 
        name: 'Prince', cost: 5, icon: '🏇', type: 'unit', 
        stats: { hp: 1500, dmg: 320, speed: 1.4, range: 0, sightRange: 160, hitSpeed: 1.4, count: 1, chargeDmg: 640 }, 
        tags: ['ground','single','charge'], color: '#5e35b1',
        canJumpRiver: true,
        desc: "Memberikan damage ganda saat berlari kencang (Charge)." 
    },
    'valkyrie': { 
        name: 'Valkyrie', cost: 4, icon: '🪓', type: 'unit', 
        stats: { hp: 1650, dmg: 230, speed: 1.0, range: 0, sightRange: 160, hitSpeed: 1.5, count: 1, splashRadius: 65 }, 
        tags: ['ground','area'], color: '#ff7043',
        desc: "Berputar dengan kapaknya, membersihkan kerumunan musuh di sekitarnya." 
    },
    'wizard': { 
        name: 'Wizard', cost: 5, icon: '🧙‍♂️', type: 'unit', 
        stats: { hp: 600, dmg: 230, speed: 1.0, range: 170, sightRange: 220, hitSpeed: 1.4, count: 1, splashRadius: 50 }, 
        tags: ['ground','area','air-target'], color: '#ff5722',
        desc: "Menguasai api. Serangan area yang membakar darat dan udara." 
    },
    'dart_goblin': { 
        name: 'Dart Goblin', cost: 3, icon: '🎭', type: 'unit', 
        stats: { hp: 216, dmg: 100, speed: 1.6, range: 220, sightRange: 250, hitSpeed: 0.7, count: 1 }, 
        tags: ['ground','single','air-target','fast'], color: '#388e3c', 
        desc: "Berlari cepat, menembak cepat, dan jangkauan jauh. Tapi hati-hati Log." 
    },
    'royal_hogs': { 
        name: 'Royal Hogs', cost: 5, icon: '🐷', type: 'unit', 
        stats: { hp: 700, dmg: 70, speed: 1.6, range: 0, sightRange: 250, hitSpeed: 1.2, count: 4 }, 
        tags: ['ground','building-hunter','fast'], color: '#8d6e63', 
        canJumpRiver: true,
        desc: "4 Babi kerajaan yang lapar bangunan. Bisa lompat sungai." 
    },
    'flying_machine': { 
        name: 'Fly Machine', cost: 4, icon: '🚁', type: 'unit', 
        stats: { hp: 510, dmg: 140, speed: 1.2, range: 200, sightRange: 250, hitSpeed: 1.1, count: 1 }, 
        tags: ['air','single','air-target'], color: '#795548', 
        desc: "Cannon terbang. Jangkauan serangan cukup jauh." 
    },

    // ============================================================
    // EPICS (Unit Unik & Kuat)
    // ============================================================
    'pekka': { 
        name: 'P.E.K.K.A', cost: 7, icon: '🤖', type: 'unit', 
        stats: { hp: 3600, dmg: 750, speed: 0.6, range: 0, sightRange: 160, hitSpeed: 1.8, count: 1, deployTime: 2 }, 
        tags: ['ground','single','heavy'], color: '#37474f',
        desc: "Robot berat dengan armor tebal. Lambat tapi mematikan." 
    },
    'golem': { 
        name: 'Golem', cost: 8, icon: '🪨', type: 'unit', 
        stats: { hp: 4200, dmg: 260, speed: 0.4, range: 0, sightRange: 300, hitSpeed: 2.5, count: 1, deployTime: 3 }, 
        tags: ['ground','building-hunter','heavy'], color: '#5d4037',
        deathEffect: { type: 'split', unit: 'golemite', count: 2, dmg: 200, radius: 80 },
        desc: "Raksasa batu. Lambat. Saat mati, ia meledak dan pecah menjadi 2 Golemite." 
    },
    'witch': { 
        name: 'Witch', cost: 5, icon: '🧙‍♀️', type: 'unit', 
        stats: { hp: 700, dmg: 110, speed: 1.0, range: 160, sightRange: 220, hitSpeed: 0.7, count: 1, spawnInterval: 5, spawnUnitKey: 'skeleton', spawnCount: 3 }, 
        tags: ['ground','area','air-target','spawner'], color: '#ab47bc',
        desc: "Memanggil Skeleton terus menerus. Menembakkan sihir area." 
    },
    'balloon': { 
        name: 'Balloon', cost: 5, icon: '🎈', type: 'unit', 
        stats: { hp: 1400, dmg: 800, speed: 0.9, range: 0, sightRange: 300, hitSpeed: 3.0, count: 1 }, 
        tags: ['air','building-hunter'], color: '#8d6e63',
        desc: "Membawa bom besar untuk bangunan. Damage masif jika sampai tujuan." 
    },
    'skarmy': { 
        name: 'Skarmy', cost: 3, icon: '💀', type: 'unit', 
        stats: { hp: 60, dmg: 60, speed: 1.4, range: 0, sightRange: 140, hitSpeed: 1.0, count: 14 }, 
        tags: ['ground','single'], color: '#eeeeee',
        desc: "Pasukan Skeleton dalam jumlah besar. Hati-hati terhadap Log!" 
    },
    'baby_dragon': { 
        name: 'Baby Drag', cost: 4, icon: '🐲', type: 'unit', 
        stats: { hp: 1000, dmg: 140, speed: 1.3, range: 120, sightRange: 200, hitSpeed: 1.5, count: 1, splashRadius: 50 }, 
        tags: ['air','area','air-target'], color: '#66bb6a',
        desc: "Naga kecil yang lucu. Menyemburkan api area." 
    },
    'dark_prince': { 
        name: 'Dark Prince', cost: 4, icon: '🔨', type: 'unit', 
        stats: { hp: 1000, shield: 300, dmg: 200, speed: 1.3, range: 0, sightRange: 160, hitSpeed: 1.3, count: 1, splashRadius: 50, chargeDmg: 400 }, 
        tags: ['ground','area','shielded','charge'], color: '#311b92',
        canJumpRiver: true,
        desc: "Pangeran dengan gada area dan shield pelindung. Bisa melompat sungai." 
    },
    'guards': { 
        name: 'Guards', cost: 3, icon: '🛡️', type: 'unit', 
        stats: { hp: 100, shield: 200, dmg: 90, speed: 1.1, range: 40, sightRange: 150, hitSpeed: 1.1, count: 3 }, 
        tags: ['ground','single','shielded'], color: '#d4af37',
        desc: "Tiga prajurit tulang dengan perisai. Tahan satu pukulan fatal." 
    },
    'executioner': { 
        name: 'Executioner', cost: 5, icon: '🪓', type: 'unit', 
        stats: { hp: 1100, dmg: 280, speed: 0.9, range: 180, sightRange: 200, hitSpeed: 2.4, count: 1, projectile: 'boomerang', projSpeed: 6, maxRange: 200 }, 
        tags: ['ground','area','air-target'], color: '#5e35b1',
        desc: "Melempar kapak yang kembali lagi. Menyerang dua kali (pergi & pulang)." 
    },
    'bowler': { 
        name: 'Bowler', cost: 5, icon: '🟣', type: 'unit', 
        stats: { hp: 1600, dmg: 240, speed: 0.8, range: 170, sightRange: 220, hitSpeed: 2.5, count: 1, projectile: 'rolling', projSpeed: 5, maxRange: 220 }, 
        tags: ['ground','area'], color: '#3949ab',
        desc: "Menggelindingkan batu besar yang melindas musuh darat." 
    },
    'giant_skeleton': { 
        name: 'Giant Skelly', cost: 6, icon: '💣', type: 'unit', 
        stats: { hp: 2500, dmg: 150, speed: 0.8, range: 0, sightRange: 160, hitSpeed: 1.5, count: 1 }, 
        tags: ['ground','single','heavy'], color: '#5d4037', 
        deathEffect: { type: 'explode', dmg: 1000, radius: 100 },
        desc: "Membawa bom raksasa. Damage ledakan saat mati sangat BESAR." 
    },
    'wall_breakers': { 
        name: 'Wall Brkrs', cost: 2, icon: '💣', type: 'unit', 
        stats: { hp: 275, dmg: 400, speed: 1.8, range: 0, sightRange: 250, hitSpeed: 0.1, count: 2, kamikaze: true, splashRadius: 60 }, 
        tags: ['ground','building-hunter','fast','area'], color: '#3e2723', 
        desc: "Dua skeleton berani mati. Meledak saat menyentuh bangunan." 
    },

    // ============================================================
    // LEGENDARIES (Kemampuan Spesial)
    // ============================================================
    'ice_wizard': { 
        name: 'Ice Wiz', cost: 3, icon: '❄️', type: 'unit', 
        stats: { hp: 600, dmg: 75, speed: 1.0, range: 170, sightRange: 220, hitSpeed: 1.7, count: 1, splashRadius: 40, slowAmount: 0.35, slowDuration: 2 }, 
        tags: ['ground','area','air-target','slow-effect'], color: '#29b6f6',
        spawnEffect: { type: 'slow', radius: 100, amount: 0.35, duration: 2 },
        desc: "Memperlambat musuh dengan es. Spawn dengan ledakan dingin." 
    },
    'electro_wizard': { 
        name: 'Electro Wiz', cost: 4, icon: '⚡️', type: 'unit', 
        stats: { hp: 600, dmg: 200, speed: 1.4, range: 160, sightRange: 220, hitSpeed: 1.8, count: 1, stunDuration: 0.5 }, 
        tags: ['ground','single','air-target','stun-effect'], color: '#304ffe',
        spawnEffect: { type: 'zap', dmg: 160, radius: 80, stun: 0.5 },
        multiTarget: 2,
        desc: "Mendarat dengan ZAP! Menyerang 2 musuh sekaligus dengan setruman." 
    },
    'princess': { 
        name: 'Princess', cost: 3, icon: '👸', type: 'unit', 
        stats: { hp: 220, dmg: 140, speed: 1.0, range: 350, sightRange: 400, hitSpeed: 3.0, count: 1, splashRadius: 80 }, 
        tags: ['ground','area','air-target','siege'], color: '#e65100',
        desc: "Jarak tembak luar biasa jauh. Bisa menyerang tower dari jembatan." 
    },
    'miner': { 
        name: 'Miner', cost: 3, icon: '⛏️', type: 'unit', 
        stats: { hp: 1100, dmg: 160, speed: 1.2, range: 0, sightRange: 160, hitSpeed: 1.2, count: 1, deployTime: 0.5 }, 
        tags: ['ground','single'], color: '#795548', 
        desc: "Bisa ditempatkan di mana saja di arena." 
    },
    'sparky': { 
        name: 'Sparky', cost: 6, icon: '🔌', type: 'unit', 
        stats: { hp: 1200, dmg: 1100, speed: 0.8, range: 150, sightRange: 200, hitSpeed: 4.0, count: 1, splashRadius: 80, loadTime: 4 }, 
        tags: ['ground','area','heavy'], color: '#fbc02d',
        desc: "Mesin penghancur. Butuh waktu charge lama, tapi damagenya... BOOM." 
    },
    'lava_hound': { 
        name: 'Lava Hound', cost: 7, icon: '🌋', type: 'unit', 
        stats: { hp: 3200, dmg: 50, speed: 0.7, range: 80, sightRange: 300, hitSpeed: 2.0, count: 1 }, 
        tags: ['air','building-hunter','heavy'], color: '#bf360c',
        desc: "Tank udara. Saat mati, meledak menjadi Lava Pups (belum implementasi)." 
    },
    'inferno_dragon': { 
        name: 'Inferno Drag', cost: 4, icon: '👺', type: 'unit', 
        stats: { hp: 1100, dmg: 30, range: 120, sightRange: 180, hitSpeed: 0.1, count: 1 }, 
        tags: ['air','single','air-target','ramp-damage'], color: '#e53935',
        desc: "Naga dengan helm. Semakin lama menyerang target yang sama, semakin sakit." 
    },
    'mega_knight': { 
        name: 'Mega Knight', cost: 7, icon: '🦍', type: 'unit', 
        stats: { hp: 3300, dmg: 240, speed: 1.0, range: 0, sightRange: 250, hitSpeed: 1.7, count: 1, deployTime: 1, splashRadius: 60 }, 
        tags: ['ground','area','heavy'], color: '#212121',
        spawnEffect: { type: 'damage', dmg: 400, radius: 100 },
        jumpAttack: { minRange: 100, maxRange: 150, dmg: 480, speed: 2 },
        desc: "Mendarat dengan kekuatan 1000 kumis! Melompat ke target jauh." 
    },
    'night_witch': { 
        name: 'Night Witch', cost: 4, icon: '🦇', type: 'unit', 
        stats: { hp: 800, dmg: 250, speed: 1.1, range: 0, sightRange: 160, hitSpeed: 1.5, count: 1, spawnInterval: 6, spawnUnitKey: 'bat_unit', spawnCount: 2 }, 
        tags: ['ground','single','spawner'], color: '#311b92',
        desc: "Memanggil kelelawar untuk membantunya. Serangan jarak dekat." 
    },
    'lumberjack': { 
        name: 'Lumberjack', cost: 4, icon: '🪵', type: 'unit', 
        stats: { hp: 1000, dmg: 200, speed: 1.8, range: 0, sightRange: 160, hitSpeed: 0.7, count: 1 }, 
        tags: ['ground','single','fast'], color: '#d32f2f', 
        // UPDATE: Death Effect memicu Spell Area Rage
        deathEffect: { type: 'spell', spell: 'rage', radius: 140, duration: 6, amount: 0.4 },
        desc: "Menebang pohon di siang hari. Mati menumpahkan Rage." 
    },

    // ============================================================
    // MYTHIC / CUSTOM (Unit Original)
    // ============================================================
    'trojan_horse' :{
        name: 'Trojan Horse', cost: 5, icon: '🐴', type: 'unit',
        stats: { hp: 3600, dmg: 20, speed: 0.5, range: 0, sightRange: 250, hitSpeed: 2, count: 1, spawnCount: 1, spawnInterval: 4, spawnUnitKey: 'spear_goblins'},
        tags: ['ground', 'heavy', 'spawner', 'building-hunter'], color: '#6d4c41',
        deathEffect: { type: 'split', unit: 'goblins', count: 6, dmg: 0, radius: 200 },
        desc: "Kuda kayu raksasa. Lambat, tapi saat hancur... KEJUTAN!" 
    },
    'samurai': { 
        name: 'Ronin', cost: 4, icon: '🏯', type: 'unit', 
        stats: { hp: 900, shield: 400, dmg: 350, speed: 1.3, range: 0, sightRange: 160, hitSpeed: 1.1, count: 1 }, 
        tags: ['ground','single','shielded','fast'], color: '#ef5350',
        desc: "Prajurit pedang dengan pertahanan tinggi dan serangan mematikan." 
    },
    'ninja': { 
        name: 'Ninja', cost: 3, icon: '🥷', type: 'unit', 
        stats: { hp: 400, dmg: 180, speed: 1.8, range: 0, sightRange: 160, hitSpeed: 0.8, count: 1 }, 
        tags: ['ground','single','fast'], color: '#212121', 
        desc: "Sangat cepat. Menyerang dengan kecepatan kilat." 
    },
    'druid': { 
        name: 'Druid', cost: 5, icon: '🦌', type: 'unit', 
        stats: { hp: 1200, dmg: 90, speed: 0.9, range: 150, sightRange: 200, hitSpeed: 1.5, count: 1, spawnInterval: 2, spawnUnitKey: 'healer_spirit', spawnCount: 3 }, 
        tags: ['ground','single','spawner'], color: '#66bb6a', 
        desc: "Penjaga hutan. Memanggil roh penyembuh (WIP) secara berkala." 
    },
    'healer': { 
        name: 'Battle Healer', cost: 4, icon: '🧚', type: 'unit', 
        stats: { hp: 1500, dmg: 110, speed: 1.0, range: 0, sightRange: 200, hitSpeed: 1.3, count: 1 }, 
        tags: ['ground','single','healer'], color: '#f8bbd0', 
        desc: "Prajurit penyembuh. Memulihkan dirinya dan teman di sekitar saat menyerang." 
    },
    'sniper': { 
        name: 'Sniper', cost: 4, icon: '🔭', type: 'unit', 
        stats: { hp: 450, dmg: 600, speed: 0.8, range: 400, sightRange: 450, hitSpeed: 3.5, count: 1, deployTime: 2, loadTime: 2 }, 
        tags: ['ground','single','air-target'], color: '#558b2f', 
        desc: "Jangkauan ekstrim, damage besar, tapi reload sangat lama." 
    },
    'yeti': { 
        name: 'Yeti', cost: 5, icon: '❄️', type: 'unit', 
        stats: { hp: 2000, dmg: 150, speed: 0.7, range: 0, sightRange: 160, hitSpeed: 1.6, count: 1, splashRadius: 60, slowAmount: 0.3, slowDuration: 1.5 }, 
        tags: ['ground','area','heavy','slow-effect'], color: '#e0f7fa',
        desc: "Monster salju besar. Pukulannya membekukan area sekitar." 
    },
    'basilisk': { 
        name: 'Basilisk', cost: 6, icon: '🐍', type: 'unit', 
        stats: { hp: 1800, dmg: 200, speed: 0.9, range: 120, sightRange: 200, hitSpeed: 2.0, count: 1, stunDuration: 1.0 }, 
        tags: ['ground','single','stun-effect'], color: '#00695c',
        desc: "Tatapan matanya melumpuhkan. Serangan membuat musuh stun lama." 
    },
    'titan': { 
        name: 'Titan', cost: 9, icon: '🗿', type: 'unit', 
        stats: { hp: 6000, dmg: 400, speed: 0.3, range: 0, sightRange: 160, hitSpeed: 3.0, count: 1 }, 
        tags: ['ground','single','heavy','building-hunter'], color: '#3e2723',
        desc: "Unit terkuat dan termahal. Sangat lambat, tapi hampir tak bisa mati." 
    },
    'meteor': { 
        name: 'Meteor', cost: 5, icon: '☄️', type: 'spell', 
        stats: { dmg: 900, radius: 70, spawnDelay: 2.5 }, 
        desc: "Batu besar dari angkasa. Damage area masif, tapi butuh waktu lama untuk jatuh." 
    },
    'void': { 
        name: 'Void', cost: 3, icon: '🌌', type: 'spell', 
        stats: { dmg: 400, radius: 60, spawnDelay: 1.0 }, 
        desc: "Menghisap musuh dalam area kecil dengan damage tinggi." 
    },

    // ============================================================
    // BUILDINGS
    // ============================================================
    'cannon': { name: 'Cannon', cost: 3, icon: '🔫', type: 'building', stats: { hp: 800, dmg: 130, range: 180, hitSpeed: 0.8, lifetime: 30, radius: 20 }, tags: ['ground-only'], color: '#555', desc: "Pertahanan darat murah meriah." },
    'tesla': { name: 'Tesla', cost: 4, icon: '⚡', type: 'building', stats: { hp: 1000, dmg: 140, range: 170, hitSpeed: 1.1, lifetime: 35, radius: 20 }, tags: ['air-target', 'hide-when-idle'], color: '#0288d1', desc: "Bersembunyi di tanah saat tidak menyerang." },
    'inferno_tower': { name: 'Inferno', cost: 5, icon: '🔥', type: 'building', stats: { hp: 1500, dmg: 30, range: 190, hitSpeed: 0.1, lifetime: 30, radius: 22 }, tags: ['air-target', 'ramp-damage'], color: '#d32f2f', desc: "Membakar tank dengan damage yang terus meningkat." },
    'bomb_tower': { name: 'Bomb Tower', cost: 4, icon: '💣', type: 'building', stats: { hp: 1300, dmg: 200, range: 180, hitSpeed: 1.6, lifetime: 35, radius: 25, splashRadius: 60 }, tags: ['ground-only', 'area'], color: '#fdd835', desc: "Melempar bom area ke pasukan darat." },
    'mortar': { name: 'Mortar', cost: 4, icon: '🚀', type: 'building', stats: { hp: 1300, dmg: 250, range: 350, hitSpeed: 5.0, lifetime: 30, radius: 25, splashRadius: 70, deployTime: 3 }, tags: ['ground-only', 'siege', 'area'], color: '#795548', desc: "Jarak jauh. Bisa menembak tower musuh dari sisi sendiri." },
    'xbow': { name: 'X-Bow', cost: 6, icon: '🏹', type: 'building', stats: { hp: 1400, dmg: 30, range: 380, hitSpeed: 0.3, lifetime: 40, radius: 25, deployTime: 3.5 }, tags: ['ground-only', 'siege'], color: '#8e24aa', desc: "Menembak sangat cepat. Kunci target ke tower untuk kemenangan." },
    'tombstone': { name: 'Tombstone', cost: 3, icon: '🪦', type: 'building', stats: { hp: 400, dmg: 0, range: 0, hitSpeed: 0, lifetime: 30, radius: 20, spawnInterval: 3.5, spawnUnitKey: 'skeleton', spawnCount: 1 }, tags: ['spawner'], color: '#9e9e9e', desc: "Memunculkan Skeleton. Hancur menjadi 4 Skeleton." },
    'goblin_hut': { name: 'Goblin Hut', cost: 5, icon: '⛺', type: 'building', stats: { hp: 1200, dmg: 0, range: 0, hitSpeed: 0, lifetime: 50, radius: 25, spawnInterval: 4, spawnUnitKey: 'spear_goblins', spawnCount: 1 }, tags: ['spawner'], color: '#8d6e63', desc: "Markas Spear Goblins." },
    'furnace': { name: 'Furnace', cost: 4, icon: '🔥', type: 'building', stats: { hp: 1000, dmg: 0, range: 0, hitSpeed: 0, lifetime: 40, radius: 25, spawnInterval: 6, spawnUnitKey: 'fire_spirit', spawnCount: 1 }, tags: ['spawner'], color: '#5d4037', desc: "Memasak Fire Spirits panas." },

    // ============================================================
    // SPELLS
    // ============================================================
    'fireball': { name: 'Fireball', cost: 4, icon: '🔥', type: 'spell', stats: { dmg: 572, radius: 90, spawnDelay: 1.0 }, desc: "Bola api klasik. Area damage medium." },
    'arrows': { name: 'Arrows', cost: 3, icon: '🏹', type: 'spell', stats: { dmg: 300, radius: 120, spawnDelay: 0.8 }, desc: "Hujan panah. Area luas, bagus lawan Minion/Goblin." },
    'zap': { name: 'Zap', cost: 2, icon: '⚡', type: 'spell', stats: { dmg: 160, radius: 80, stunDuration: 0.5, spawnDelay: 0.5 }, desc: "Stun musuh sesaat. Reset serangan Sparky/Inferno." },
    'rage': { name: 'Rage', cost: 2, icon: '😡', type: 'spell', stats: { dmg: 0, radius: 140, rageDuration: 6, rageBoost: 0.4, spawnDelay: 0.5 }, desc: "Meningkatkan kecepatan gerak dan serangan unit." },
    'freeze': { name: 'Freeze', cost: 4, icon: '❄️', type: 'spell', stats: { dmg: 0, radius: 120, stunDuration: 4, spawnDelay: 0.5 }, desc: "Membekukan unit dan bangunan musuh total." },
    'rocket': { name: 'Rocket', cost: 6, icon: '🚀', type: 'spell', stats: { dmg: 1200, radius: 60, spawnDelay: 2.0 }, desc: "Damage area TERBESAR. Tapi area kecil dan lambat." },
    'the_log': { 
        name: 'The Log', cost: 2, icon: '🪵', type: 'spell', 
        stats: { dmg: 240, radius: 40, range: 350, projectile: 'rolling_log', projSpeed: 3, spawnDelay: 0.1 }, 
        tags: ['log'], desc: "Menggelinding dan melindas semua unit darat." 
    },
    'goblin_barrel': { name: 'Gob Barrel', cost: 3, icon: '🛢️', type: 'spell', stats: { count: 3, spawnUnit: 'goblins', spawnDelay: 1.5, spawnRadius: 50 }, desc: "Melempar 3 Goblin ke mana saja di arena." },
    'lightning': { name: 'Lightning', cost: 6, icon: '🌩️', type: 'spell', stats: { dmg: 850, radius: 110, stunDuration: 0.5, spawnDelay: 1.0 }, desc: "Menyambar 3 target dengan HP tertinggi. Stun." },
    'earthquake': { name: 'Earthquake', cost: 3, icon: '🌋', type: 'spell', stats: { dmg: 200, radius: 120, spawnDelay: 0.5 }, desc: "Gempa bumi. Damage area darat (WIP)." },

    // ============================================================
    // TOKEN UNITS (Tidak bisa dipilih di Deck Builder)
    // ============================================================
    'golemite': { 
        name: 'Golemite', cost: 1, icon: '🪨', type: 'unit', 
        stats: { hp: 800, dmg: 50, speed: 0.6, range: 0, sightRange: 300, hitSpeed: 2.5, count: 1 }, 
        tags: ['ground','building-hunter'], color: '#8d6e63', 
        hiddenInDeck: true, 
        deathEffect: { type: 'explode', dmg: 100, radius: 60 },
        desc: "Pecahan Golem."
    },
    'skeleton': { name: 'Skeleton', cost: 1, icon: '💀', type: 'unit', stats: { hp: 60, dmg: 50, speed: 1.4, range: 0, sightRange: 140, hitSpeed: 1.0, count: 1 }, tags: ['ground','single'], color: '#eeeeee', hiddenInDeck: true, desc: "Tulang belulang." },
    'bat_unit': { name: 'Bat', cost: 1, icon: '🦇', type: 'unit', stats: { hp: 70, dmg: 70, speed: 1.7, range: 0, sightRange: 180, hitSpeed: 1.1, count: 1 }, tags: ['air','single'], color: '#4a148c', hiddenInDeck: true, desc: "Kelelawar." },
    'fire_spirit': { name: 'Spirit', cost: 1, icon: '🔥', type: 'unit', stats: { hp: 90, dmg: 180, speed: 1.8, kamikaze: true, splashRadius: 50 }, tags: ['ground','area','air-target'], color: '#ff3d00', hiddenInDeck: true, desc: "Roh api." },
    'healer_spirit': { 
        name: 'Heal Spirit', cost: 1, icon: '🧪', type: 'unit', 
        stats: { hp: 200, dmg: 0, speed: 1.8, kamikaze: true, splashRadius: 70, sightRange: 300 }, 
        tags: ['ground','area','healer'], color: '#76ff03', hiddenInDeck: true, 
        desc: "Melompat ke teman yang terluka dan menyembuhkan area." 
    },
};