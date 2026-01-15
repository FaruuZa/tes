const CONFIG = {
    baseElixirRate: 0.6,
    maxElixir: 10,
    botThinkRate: 1500,
    logicWidth: 440,
    logicHeight: 700,
    gridSize: 20
};

const TOWER_DATA = {
    'king': { name: 'King Tower', hp: 4000, dmg: 110, range: 12, hitSpeed: 1.0, radius: 30, color: '#ffeb3b' },
    'princess': { name: 'Princess', hp: 2500, dmg: 90, range: 8, hitSpeed: 0.8, radius: 25, color: '#ff9800' }
};

const CARDS = {
    // --- COMMONS ---
    'knight': { 
        name: 'Knight', cost: 3, icon: '⚔️', type: 'unit', 
        stats: { hp: 1400, dmg: 160, speed: 1.0, range: 0, sightRange: 6, hitSpeed: 1.2, count: 1 }, 
        tags: ['ground','single'], 
        visuals: { scale: 1.0, skin: '#f0ceab', head: 'helmet', body: 'armor', weapon: 'sword', color: '#4fc3f7' },
        desc: "Prajurit tangguh dengan kumis menawan." 
    },
    'archer': { 
        name: 'Archers', cost: 3, icon: '🏹', type: 'unit', 
        stats: { hp: 250, dmg: 90, speed: 1.1, range: 5.0, sightRange: 6.5, hitSpeed: 1.0, count: 2 }, 
        tags: ['ground','single','air-target'], 
        visuals: { scale: 0.9, skin: '#f0ceab', head: 'hood', body: 'cloth', weapon: 'bow', color: '#ec407a' },
        desc: "Dua pemanah jarak jauh." 
    },
    'goblins': { 
        name: 'Goblins', cost: 2, icon: '👺', type: 'unit', 
        stats: { hp: 170, dmg: 100, speed: 1.6, range: 0, sightRange: 5, hitSpeed: 1.1, count: 3 }, 
        tags: ['ground','single'], 
        visuals: { scale: 0.8, skin: '#76ff03', head: 'mohawk', body: 'cloth', weapon: 'dagger', color: '#43a047' },
        desc: "Tiga goblin cepat dengan pisau tajam." 
    },
    'spear_goblins': { 
        name: 'Spear Gobs', cost: 2, icon: '🎋', type: 'unit', 
        stats: { hp: 110, dmg: 70, speed: 1.6, range: 5.0, sightRange: 6.5, hitSpeed: 1.3, count: 3 }, 
        tags: ['ground','single','air-target'], 
        visuals: { scale: 0.8, skin: '#76ff03', head: 'bandana', body: 'cloth', weapon: 'spear', color: '#2e7d32' },
        desc: "Melempar tombak dari kejauhan." 
    },
    'minions': { 
        name: 'Minions', cost: 3, icon: '🦇', type: 'unit', 
        stats: { hp: 190, dmg: 85, speed: 1.5, range: 2.0, sightRange: 5, hitSpeed: 1.0, count: 3 }, 
        tags: ['air','single', 'air-target'], 
        visuals: { scale: 0.9, skin: '#5c6bc0', head: 'demon', body: 'demon', weapon: 'spit', hasWings: true, color: '#5c6bc0' },
        desc: "Tiga penyerang udara yang cepat." 
    },
    'skeletons': { 
        name: 'Skeletons', cost: 1, icon: '🦴', type: 'unit', 
        stats: { hp: 60, dmg: 60, speed: 1.4, range: 0, sightRange: 5, hitSpeed: 1.0, count: 3 }, 
        tags: ['ground','single'], 
        visuals: { scale: 0.7, skin: '#ffffff', head: 'skull', body: 'ribs', weapon: 'dagger', color: '#eeeeee' },
        desc: "Sangat murah. Pengalih perhatian." 
    },
    'bats': { 
        name: 'Bats', cost: 2, icon: '🧛', type: 'unit', 
        stats: { hp: 60, dmg: 60, speed: 1.7, range: 0, sightRange: 5, hitSpeed: 1.1, count: 5 }, 
        tags: ['air','single', 'fast', 'air-target'], 
        visuals: { scale: 0.6, skin: '#4a148c', head: 'bat', body: 'cloth', weapon: 'bite', hasWings: true, color: '#4a148c' },
        desc: "Lima makhluk malam penghisap darah." 
    },
    'royal_giant': { 
        name: 'Royal Giant', cost: 6, icon: '🧔', type: 'unit', 
        stats: { hp: 2500, dmg: 250, speed: 0.6, range: 6.5, sightRange: 8, hitSpeed: 1.7, count: 1 }, 
        tags: ['ground','single','building-hunter','heavy'], 
        visuals: { scale: 1.4, skin: '#f0ceab', head: 'helmet_open', body: 'armor_heavy', weapon: 'cannon_hand', color: '#8d6e63' },
        desc: "Raksasa dengan meriam besar." 
    },
    'elite_barbarians': { 
        name: 'Elite Barbs', cost: 6, icon: '😡', type: 'unit', 
        stats: { hp: 1000, dmg: 300, speed: 1.7, range: 0, sightRange: 6, hitSpeed: 1.4, count: 2 }, 
        tags: ['ground','single','fast'], 
        visuals: { scale: 1.1, skin: '#f0ceab', head: 'helmet_viking', body: 'cloth', weapon: 'sword', color: '#ffb74d' },
        desc: "Dua Barbarian yang sangat cepat." 
    },
    'ice_spirit': { 
        name: 'Ice Spirit', cost: 1, icon: '🧊', type: 'unit', 
        stats: { hp: 190, dmg: 90, speed: 1.5, range: 1.5, sightRange: 5, hitSpeed: 0.1, count: 1, kamikaze: true, splashRadius: 2.5, stunDuration: 1.5 }, 
        tags: ['ground','area','air-target'], 
        visuals: { scale: 0.6, skin: '#b3e5fc', head: 'spirit', body: 'spirit', weapon: 'none', color: '#b3e5fc' },
        desc: "Melompat dan membekukan musuh." 
    },

    // --- RARES ---
    'giant': { 
        name: 'Giant', cost: 5, icon: '🗿', type: 'unit', 
        stats: { hp: 3300, dmg: 210, speed: 0.7, range: 0, sightRange: 6, hitSpeed: 1.5, count: 1 }, 
        tags: ['ground','building-hunter','heavy'], 
        visuals: { scale: 1.5, skin: '#f0ceab', head: 'bald', body: 'cloth', weapon: 'fist', color: '#8d6e63' },
        desc: "Lambat tapi tebal. Hanya mengincar bangunan." 
    },
    'musketeer': { 
        name: 'Musketeer', cost: 4, icon: '🎯', type: 'unit', 
        stats: { hp: 600, dmg: 180, speed: 1.0, range: 6.0, sightRange: 7.5, hitSpeed: 1.1, count: 1 }, 
        tags: ['ground','single','air-target'], 
        visuals: { scale: 1.0, skin: '#f0ceab', head: 'helmet', body: 'cloth', weapon: 'musket', color: '#7b1fa2' },
        desc: "Penembak jitu dengan damage tinggi." 
    },
    'mini_pekka': { 
        name: 'Mini PEKKA', cost: 4, icon: '⚙️', type: 'unit', 
        stats: { hp: 1100, dmg: 600, speed: 1.4, range: 0, sightRange: 5, hitSpeed: 1.6, count: 1 }, 
        tags: ['ground','single','fast'], 
        visuals: { scale: 0.9, skin: '#90a4ae', head: 'robot_horn', body: 'armor_plate', weapon: 'sword', color: '#78909c' },
        desc: "Kecil tapi sakit! Penghancur tank." 
    },
    'hog_rider': { 
        name: 'Hog Rider', cost: 4, icon: '🐗', type: 'unit', 
        stats: { hp: 1400, dmg: 260, speed: 1.8, range: 0, sightRange: 6, hitSpeed: 1.6, count: 1 }, 
        tags: ['ground','building-hunter','fast'], 
        canJumpRiver: true,
        visuals: { scale: 1.1, skin: '#8d6e63', head: 'mohawk', body: 'cloth', weapon: 'hammer', isMounted: true, color: '#795548' },
        desc: "HOG RIDERRR! Melompati sungai." 
    },
    'prince': { 
        name: 'Prince', cost: 5, icon: '🏇', type: 'unit', 
        stats: { hp: 1500, dmg: 320, speed: 1.4, range: 0, sightRange: 5, hitSpeed: 1.4, count: 1, chargeDmg: 640 }, 
        tags: ['ground','single','charge'], 
        canJumpRiver: true,
        visuals: { scale: 1.1, skin: '#f0ceab', head: 'helmet', body: 'armor_heavy', weapon: 'lance', isMounted: true, color: '#5e35b1' },
        desc: "Memberikan damage ganda saat berlari kencang." 
    },
    'valkyrie': { 
        name: 'Valkyrie', cost: 4, icon: '🪓', type: 'unit', 
        stats: { hp: 1650, dmg: 230, speed: 1.0, range: 0, sightRange: 5, hitSpeed: 1.5, count: 1, splashRadius: 2.5 }, 
        tags: ['ground','area'], 
        visuals: { scale: 1.0, skin: '#f0ceab', head: 'hair_orange', body: 'cloth', weapon: 'axe_double', color: '#ff7043' },
        desc: "Berputar dengan kapaknya." 
    },
    'wizard': { 
        name: 'Wizard', cost: 5, icon: '🧙‍♂️', type: 'unit', 
        stats: { hp: 600, dmg: 230, speed: 1.0, range: 5.5, sightRange: 7, hitSpeed: 1.4, count: 1, splashRadius: 2.0 }, 
        tags: ['ground','area','air-target'], 
        visuals: { scale: 1.0, skin: '#f0ceab', head: 'hood', body: 'robe', weapon: 'magic_fire', color: '#ff5722' },
        desc: "Menguasai api." 
    },
    'dart_goblin': { 
        name: 'Dart Goblin', cost: 3, icon: '🎭', type: 'unit', 
        stats: { hp: 216, dmg: 100, speed: 1.6, range: 6.5, sightRange: 8, hitSpeed: 0.7, count: 1 }, 
        tags: ['ground','single','air-target','fast'], 
        visuals: { scale: 0.8, skin: '#388e3c', head: 'mask', body: 'cloth', weapon: 'blowdart', color: '#388e3c' },
        desc: "Berlari dan menembak cepat." 
    },
    'royal_hogs': { 
        name: 'Royal Hogs', cost: 5, icon: '🐷', type: 'unit', 
        stats: { hp: 700, dmg: 70, speed: 1.6, range: 0, sightRange: 6, hitSpeed: 1.2, count: 4 }, 
        tags: ['ground','building-hunter','fast'], 
        canJumpRiver: true,
        visuals: { scale: 0.9, skin: '#f0ceab', head: 'pig', body: 'pig', weapon: 'none', color: '#8d6e63' },
        desc: "4 Babi kerajaan yang lapar bangunan." 
    },
    'flying_machine': { 
        name: 'Fly Machine', cost: 4, icon: '🚁', type: 'unit', 
        stats: { hp: 510, dmg: 140, speed: 1.2, range: 6.0, sightRange: 8, hitSpeed: 1.1, count: 1 }, 
        tags: ['air','single','air-target'], 
        visuals: { scale: 1.2, skin: '#8d6e63', head: 'machine', body: 'wood_mech', weapon: 'cannon', hasPropeller: true, color: '#795548' },
        desc: "Cannon terbang." 
    },

    // --- EPICS ---
    'pekka': { 
        name: 'P.E.K.K.A', cost: 7, icon: '🤖', type: 'unit', 
        stats: { hp: 3600, dmg: 750, speed: 0.6, range: 0, sightRange: 5, hitSpeed: 1.8, count: 1, deployTime: 2 }, 
        tags: ['ground','single','heavy'], 
        visuals: { scale: 1.4, skin: '#37474f', head: 'robot_horn', body: 'armor_heavy', weapon: 'dual_swords', color: '#37474f' },
        desc: "Robot berat dengan armor tebal." 
    },
    'golem': { 
        name: 'Golem', cost: 8, icon: '🪨', type: 'unit', 
        stats: { hp: 4200, dmg: 260, speed: 0.4, range: 0, sightRange: 6, hitSpeed: 2.5, count: 1, deployTime: 3 }, 
        tags: ['ground','building-hunter','heavy'], 
        deathEffect: { type: 'split', unit: 'golemite', count: 2, dmg: 200, radius: 80 },
        visuals: { scale: 1.6, skin: '#8d6e63', head: 'rock', body: 'rock', weapon: 'fist_rock', color: '#5d4037' },
        desc: "Raksasa batu. Mati menjadi Golemite." 
    },
    'witch': { 
        name: 'Witch', cost: 5, icon: '🧙‍♀️', type: 'unit', 
        stats: { hp: 700, dmg: 110, speed: 1.0, range: 5.0, sightRange: 7, hitSpeed: 0.7, count: 1, spawnInterval: 5, spawnUnitKey: 'skeleton', spawnCount: 3 }, 
        tags: ['ground','area','air-target','spawner'], 
        visuals: { scale: 1.0, skin: '#f0ceab', head: 'hood', body: 'robe', weapon: 'staff', color: '#ab47bc' },
        desc: "Memanggil Skeleton terus menerus." 
    },
    'balloon': { 
        name: 'Balloon', cost: 5, icon: '🎈', type: 'unit', 
        stats: { hp: 1400, dmg: 800, speed: 0.9, range: 0, sightRange: 6, hitSpeed: 3.0, count: 1 }, 
        tags: ['air','building-hunter'], 
        visuals: { scale: 1.3, skin: '#8d6e63', head: 'balloon', body: 'basket', weapon: 'bomb_drop', color: '#8d6e63' },
        desc: "Membawa bom besar untuk bangunan." 
    },
    'skarmy': { 
        name: 'Skarmy', cost: 3, icon: '💀', type: 'unit', 
        stats: { hp: 60, dmg: 60, speed: 1.4, range: 0, sightRange: 5, hitSpeed: 1.0, count: 14 }, 
        tags: ['ground','single'], 
        visuals: { scale: 0.6, skin: '#ffffff', head: 'skull', body: 'ribs', weapon: 'dagger', color: '#eeeeee' },
        desc: "Pasukan Skeleton dalam jumlah besar." 
    },
    'baby_dragon': { 
        name: 'Baby Drag', cost: 4, icon: '🐲', type: 'unit', 
        stats: { hp: 1000, dmg: 140, speed: 1.3, range: 3.5, sightRange: 6, hitSpeed: 1.5, count: 1, splashRadius: 2.0 }, 
        tags: ['air','area','air-target'], 
        visuals: { scale: 1.1, skin: '#66bb6a', head: 'dragon', body: 'dragon', weapon: 'spit_fire', hasWings: true, color: '#66bb6a' },
        desc: "Naga kecil yang lucu." 
    },
    'dark_prince': { 
        name: 'Dark Prince', cost: 4, icon: '🔨', type: 'unit', 
        stats: { hp: 1000, shield: 300, dmg: 200, speed: 1.3, range: 0, sightRange: 5, hitSpeed: 1.3, count: 1, splashRadius: 2.0, chargeDmg: 400 }, 
        tags: ['ground','area','shielded','charge'], 
        canJumpRiver: true,
        visuals: { scale: 1.1, skin: '#f0ceab', head: 'helmet_bucket', body: 'armor_heavy', weapon: 'mace', isMounted: true, color: '#311b92' },
        desc: "Pangeran dengan gada area dan shield." 
    },
    'guards': { 
        name: 'Guards', cost: 3, icon: '🛡️', type: 'unit', 
        stats: { hp: 100, shield: 200, dmg: 90, speed: 1.1, range: 1.5, sightRange: 5, hitSpeed: 1.1, count: 3 }, 
        tags: ['ground','single','shielded'], 
        visuals: { scale: 0.8, skin: '#ffffff', head: 'skull_helm', body: 'ribs_armor', weapon: 'spear', color: '#d4af37' },
        desc: "Tiga prajurit tulang dengan perisai." 
    },
    'executioner': { 
        name: 'Executioner', cost: 5, icon: '🪓', type: 'unit', 
        stats: { hp: 1100, dmg: 280, speed: 0.9, range: 4.5, sightRange: 6, hitSpeed: 2.4, count: 1, projectile: 'boomerang', projSpeed: 6, maxRange: 5.5 }, 
        tags: ['ground','area','air-target'], 
        visuals: { scale: 1.2, skin: '#f0ceab', head: 'mask_hood', body: 'cloth_heavy', weapon: 'axe_throw', color: '#5e35b1' },
        desc: "Melempar kapak yang kembali lagi." 
    },
    'bowler': { 
        name: 'Bowler', cost: 5, icon: '🟣', type: 'unit', 
        stats: { hp: 1600, dmg: 240, speed: 0.8, range: 5.0, sightRange: 7, hitSpeed: 2.5, count: 1, projectile: 'rolling', projSpeed: 5, maxRange: 6.0 }, 
        tags: ['ground','area'], 
        visuals: { scale: 1.4, skin: '#3949ab', head: 'goblin_blue', body: 'cloth', weapon: 'rock_hold', color: '#3949ab' },
        desc: "Menggelindingkan batu besar." 
    },
    'giant_skeleton': { 
        name: 'Giant Skelly', cost: 6, icon: '💣', type: 'unit', 
        stats: { hp: 2500, dmg: 150, speed: 0.8, range: 0, sightRange: 5, hitSpeed: 1.5, count: 1 }, 
        tags: ['ground','single','heavy'], 
        deathEffect: { type: 'explode', dmg: 1000, radius: 100 },
        visuals: { scale: 1.4, skin: '#fff', head: 'skull_giant', body: 'ribs', weapon: 'bomb_carry', color: '#5d4037' },
        desc: "Membawa bom raksasa. Mati meledak." 
    },
    'wall_breakers': { 
        name: 'Wall Brkrs', cost: 2, icon: '💣', type: 'unit', 
        stats: { hp: 275, dmg: 400, speed: 1.8, range: 0, sightRange: 8, hitSpeed: 0.1, count: 2, kamikaze: true, splashRadius: 2.5 }, 
        tags: ['ground','building-hunter','fast','area'], 
        visuals: { scale: 0.8, skin: '#fff', head: 'skull_cap', body: 'ribs', weapon: 'bomb_hug', color: '#3e2723' },
        desc: "Dua skeleton berani mati." 
    },

    // --- LEGENDARIES ---
    'ice_wizard': { 
        name: 'Ice Wiz', cost: 3, icon: '❄️', type: 'unit', 
        stats: { hp: 600, dmg: 75, speed: 1.0, range: 5.5, sightRange: 7, hitSpeed: 1.7, count: 1, splashRadius: 2.0, slowAmount: 0.35, slowDuration: 2 }, 
        tags: ['ground','area','air-target','slow-effect'], 
        spawnEffect: { type: 'slow', radius: 5.0, amount: 0.35, duration: 2 },
        visuals: { scale: 1.0, skin: '#e1f5fe', head: 'hood_ice', body: 'robe', weapon: 'magic_ice', color: '#29b6f6' },
        desc: "Penyihir es." 
    },
    'electro_wizard': { 
        name: 'Electro Wiz', cost: 4, icon: '⚡️', type: 'unit', 
        stats: { hp: 600, dmg: 200, speed: 1.4, range: 5.0, sightRange: 7, hitSpeed: 1.8, count: 1, stunDuration: 0.5 }, 
        tags: ['ground','single','air-target','stun-effect'], 
        spawnEffect: { type: 'zap', dmg: 160, radius: 2.5, stun: 0.5 },
        multiTarget: 2,
        visuals: { scale: 1.0, skin: '#fff9c4', head: 'hair_spiky', body: 'robe', weapon: 'magic_zap', color: '#304ffe' },
        desc: "Penyihir listrik." 
    },
    'princess': { 
        name: 'Princess', cost: 3, icon: '👸', type: 'unit', 
        stats: { hp: 220, dmg: 140, speed: 1.0, range: 10.0, sightRange: 12, hitSpeed: 3.0, count: 1, splashRadius: 3.0 }, 
        tags: ['ground','area','air-target','siege'], 
        visuals: { scale: 0.9, skin: '#f0ceab', head: 'tiara', body: 'dress', weapon: 'bow_fire', color: '#e65100' },
        desc: "Jarak tembak sangat jauh." 
    },
    'miner': { 
        name: 'Miner', cost: 3, icon: '⛏️', type: 'unit', 
        stats: { hp: 1100, dmg: 160, speed: 1.2, range: 0, sightRange: 5, hitSpeed: 1.2, count: 1, deployTime: 0.5 }, 
        tags: ['ground','single'], 
        visuals: { scale: 1.0, skin: '#f0ceab', head: 'helmet_miner', body: 'cloth_dirty', weapon: 'shovel', color: '#795548' },
        desc: "Bisa ditempatkan di mana saja." 
    },
    'sparky': { 
        name: 'Sparky', cost: 6, icon: '🔌', type: 'unit', 
        stats: { hp: 1200, dmg: 1100, speed: 0.8, range: 4.5, sightRange: 6, hitSpeed: 4.0, count: 1, splashRadius: 3.0, loadTime: 4 }, 
        tags: ['ground','area','heavy'], 
        visuals: { scale: 1.3, skin: '#fbc02d', head: 'coil', body: 'machine_tank', weapon: 'coil_gun', color: '#fbc02d' },
        desc: "Mesin penghancur." 
    },
    'lava_hound': { 
        name: 'Lava Hound', cost: 7, icon: '🌋', type: 'unit', 
        stats: { hp: 3200, dmg: 50, speed: 0.7, range: 2.0, sightRange: 8, hitSpeed: 2.0, count: 1 }, 
        tags: ['air','building-hunter','heavy'], 
        visuals: { scale: 1.5, skin: '#bf360c', head: 'rock_head', body: 'rock_body', weapon: 'none', hasWings: true, color: '#bf360c' },
        desc: "Tank udara." 
    },
    'inferno_dragon': { 
        name: 'Inferno Drag', cost: 4, icon: '👺', type: 'unit', 
        stats: { hp: 1100, dmg: 30, range: 4.0, sightRange: 6, hitSpeed: 0.1, count: 1 }, 
        tags: ['air','single','air-target','ramp-damage'], 
        visuals: { scale: 1.1, skin: '#e53935', head: 'helmet_tech', body: 'dragon', weapon: 'beam_emitter', hasWings: true, color: '#e53935' },
        desc: "Damage meningkat seiring waktu." 
    },
    'mega_knight': { 
        name: 'Mega Knight', cost: 7, icon: '🦍', type: 'unit', 
        stats: { hp: 3300, dmg: 240, speed: 1.0, range: 0, sightRange: 8, hitSpeed: 1.7, count: 1, deployTime: 1, splashRadius: 3.0 }, 
        tags: ['ground','area','heavy'], 
        spawnEffect: { type: 'damage', dmg: 400, radius: 4.0 },
        jumpAttack: { minRange: 3.0, maxRange: 5.0, dmg: 480, speed: 2 },
        visuals: { scale: 1.5, skin: '#37474f', head: 'helmet_full', body: 'armor_heavy', weapon: 'mace_hands', color: '#212121' },
        desc: "Melompat dan menghancurkan." 
    },
    'night_witch': { 
        name: 'Night Witch', cost: 4, icon: '🦇', type: 'unit', 
        stats: { hp: 800, dmg: 250, speed: 1.1, range: 0, sightRange: 5, hitSpeed: 1.5, count: 1, spawnInterval: 6, spawnUnitKey: 'bat_unit', spawnCount: 2 }, 
        tags: ['ground','single','spawner'], 
        visuals: { scale: 1.0, skin: '#f0ceab', head: 'hood_dark', body: 'robe_dark', weapon: 'staff_axe', color: '#311b92' },
        desc: "Memanggil kelelawar." 
    },
    'lumberjack': { 
        name: 'Lumberjack', cost: 4, icon: '🪵', type: 'unit', 
        stats: { hp: 1000, dmg: 200, speed: 1.8, range: 0, sightRange: 5, hitSpeed: 0.7, count: 1 }, 
        tags: ['ground','single','fast'], 
        deathEffect: { type: 'spell', spell: 'rage', radius: 6.0, duration: 6, amount: 0.4 },
        visuals: { scale: 1.0, skin: '#f0ceab', head: 'hat_winter', body: 'shirt_plaid', weapon: 'axe_bottle', color: '#d32f2f' },
        desc: "Mati menumpahkan Rage." 
    },

    // --- MYTHIC / CUSTOM ---
    'trojan_horse' :{
        name: 'Trojan Horse', cost: 5, icon: '🐴', type: 'unit',
        stats: { hp: 3600, dmg: 20, speed: 0.5, range: 0, sightRange: 8, hitSpeed: 2, count: 1, spawnCount: 1, spawnInterval: 4, spawnUnitKey: 'spear_goblins'},
        tags: ['ground', 'heavy', 'spawner', 'building-hunter'], 
        deathEffect: { type: 'split', unit: 'goblins', count: 6, dmg: 0, radius: 80 },
        visuals: { scale: 1.6, skin: '#8d6e63', head: 'horse_wood', body: 'wood_box', weapon: 'none', color: '#6d4c41' },
        desc: "Kuda kayu raksasa berisi kejutan." 
    },
    'samurai': { 
        name: 'Ronin', cost: 4, icon: '🏯', type: 'unit', 
        stats: { hp: 900, shield: 400, dmg: 350, speed: 1.3, range: 0, sightRange: 5, hitSpeed: 1.1, count: 1 }, 
        tags: ['ground','single','shielded','fast'], 
        visuals: { scale: 1.0, skin: '#ffebee', head: 'helmet_samurai', body: 'armor_samurai', weapon: 'katana', color: '#ef5350' },
        desc: "Prajurit pedang." 
    },
    'ninja': { 
        name: 'Ninja', cost: 3, icon: '🥷', type: 'unit', 
        stats: { hp: 400, dmg: 180, speed: 1.8, range: 0, sightRange: 5, hitSpeed: 0.8, count: 1 }, 
        tags: ['ground','single','fast'], 
        visuals: { scale: 0.9, skin: '#212121', head: 'hood_ninja', body: 'cloth_tight', weapon: 'dual_dagger', color: '#212121' },
        desc: "Assassin cepat." 
    },
    'healer': { 
        name: 'Battle Healer', cost: 4, icon: '🧚', type: 'unit', 
        stats: { hp: 1500, dmg: 110, speed: 1.0, range: 0, sightRange: 5, hitSpeed: 1.3, count: 1 }, 
        tags: ['ground','single','healer'], 
        visuals: { scale: 1.0, skin: '#f8bbd0', head: 'hair_long', body: 'armor_light', weapon: 'sword_light', hasWings: false, color: '#f8bbd0' },
        desc: "Penyembuh." 
    },
    'druid': { 
        name: 'Druid', cost: 5, icon: '🦌', type: 'unit', 
        stats: { hp: 1200, dmg: 90, speed: 0.9, range: 5.0, sightRange: 7, hitSpeed: 1.5, count: 1, spawnInterval: 7, spawnUnitKey: 'healer_spirit', spawnCount: 1 }, 
        tags: ['ground','single','spawner'], 
        visuals: { scale: 1.1, skin: '#f0ceab', head: 'antlers', body: 'robe_green', weapon: 'staff_wood', color: '#66bb6a' },
        desc: "Penjaga hutan. Memanggil roh." 
    },
    'sniper': { 
        name: 'Sniper', cost: 4, icon: '🔭', type: 'unit', 
        stats: { hp: 450, dmg: 600, speed: 0.8, range: 10.5, sightRange: 12, hitSpeed: 3.5, count: 1, deployTime: 2, loadTime: 2 }, 
        tags: ['ground','single','air-target'], 
        visuals: { scale: 1.0, skin: '#f0ceab', head: 'ghillie', body: 'ghillie', weapon: 'rifle_long', color: '#558b2f' },
        desc: "Jangkauan ekstrim, reload lama." 
    },
    'yeti': { 
        name: 'Yeti', cost: 5, icon: '❄️', type: 'unit', 
        stats: { hp: 2000, dmg: 150, speed: 0.7, range: 0, sightRange: 5, hitSpeed: 1.6, count: 1, splashRadius: 2.5, slowAmount: 0.3, slowDuration: 1.5 }, 
        tags: ['ground','area','heavy','slow-effect'], 
        visuals: { scale: 1.4, skin: '#e0f7fa', head: 'fur_white', body: 'fur_white', weapon: 'fist_ice', color: '#e0f7fa' },
        desc: "Monster salju besar." 
    },
    'basilisk': { 
        name: 'Basilisk', cost: 6, icon: '🐍', type: 'unit', 
        stats: { hp: 1800, dmg: 200, speed: 0.9, range: 4.0, sightRange: 6, hitSpeed: 2.0, count: 1, stunDuration: 1.0 }, 
        tags: ['ground','single','stun-effect'], 
        visuals: { scale: 1.3, skin: '#00695c', head: 'lizard', body: 'snake', weapon: 'bite_venom', color: '#00695c' },
        desc: "Tatapan matanya melumpuhkan." 
    },
    'titan': { 
        name: 'Titan', cost: 9, icon: '🗿', type: 'unit', 
        stats: { hp: 6000, dmg: 400, speed: 0.3, range: 0, sightRange: 5, hitSpeed: 3.0, count: 1 }, 
        tags: ['ground','single','heavy','building-hunter'], 
        visuals: { scale: 2.0, skin: '#3e2723', head: 'ancient_helm', body: 'ancient_armor', weapon: 'fist_giant', color: '#3e2723' },
        desc: "Unit terkuat dan termahal." 
    },

    // --- BUILDINGS ---
    'cannon': { name: 'Cannon', cost: 3, icon: '🔫', type: 'building', stats: { hp: 800, dmg: 130, range: 5.5, hitSpeed: 0.8, lifetime: 30, radius: 20 }, tags: ['ground-only'], color: '#555' },
    'tesla': { name: 'Tesla', cost: 4, icon: '⚡', type: 'building', stats: { hp: 1000, dmg: 140, range: 5.5, hitSpeed: 1.1, lifetime: 35, radius: 20 }, tags: ['air-target', 'hide-when-idle'], color: '#0288d1' },
    'inferno_tower': { name: 'Inferno', cost: 5, icon: '🔥', type: 'building', stats: { hp: 1500, dmg: 30, range: 6.0, hitSpeed: 0.1, lifetime: 30, radius: 22 }, tags: ['air-target', 'ramp-damage'], color: '#d32f2f' },
    'bomb_tower': { name: 'Bomb Tower', cost: 4, icon: '💣', type: 'building', stats: { hp: 1300, dmg: 200, range: 6.0, hitSpeed: 1.6, lifetime: 35, radius: 25, splashRadius: 2.5 }, tags: ['ground-only', 'area'], color: '#fdd835' },
    'mortar': { name: 'Mortar', cost: 4, icon: '🚀', type: 'building', stats: { hp: 1300, dmg: 250, range: 11.5, hitSpeed: 5.0, lifetime: 30, radius: 25, splashRadius: 3.0, deployTime: 3 }, tags: ['ground-only', 'siege', 'area'], color: '#795548' },
    'xbow': { name: 'X-Bow', cost: 6, icon: '🏹', type: 'building', stats: { hp: 1400, dmg: 30, range: 11.5, hitSpeed: 0.3, lifetime: 40, radius: 25, deployTime: 3.5 }, tags: ['ground-only', 'siege'], color: '#8e24aa' },
    'tombstone': { name: 'Tombstone', cost: 3, icon: '🪦', type: 'building', stats: { hp: 400, dmg: 0, range: 0, hitSpeed: 0, lifetime: 30, radius: 20, spawnInterval: 3.5, spawnUnitKey: 'skeleton', spawnCount: 1 }, tags: ['spawner'], color: '#9e9e9e' },
    'goblin_hut': { name: 'Goblin Hut', cost: 5, icon: '⛺', type: 'building', stats: { hp: 1200, dmg: 0, range: 0, hitSpeed: 0, lifetime: 50, radius: 25, spawnInterval: 4, spawnUnitKey: 'spear_goblins', spawnCount: 1 }, tags: ['spawner'], color: '#8d6e63' },
    'furnace': { name: 'Furnace', cost: 4, icon: '🔥', type: 'building', stats: { hp: 1000, dmg: 0, range: 0, hitSpeed: 0, lifetime: 40, radius: 25, spawnInterval: 6, spawnUnitKey: 'fire_spirit', spawnCount: 1 }, tags: ['spawner'], color: '#5d4037' },

    // --- SPELLS ---
    'fireball': { name: 'Fireball', cost: 4, icon: '🔥', type: 'spell', stats: { dmg: 572, radius: 2.5, spawnDelay: 1.0 } },
    'arrows': { name: 'Arrows', cost: 3, icon: '🏹', type: 'spell', stats: { dmg: 300, radius: 4.0, spawnDelay: 0.8 } },
    'zap': { name: 'Zap', cost: 2, icon: '⚡', type: 'spell', stats: { dmg: 200, radius: 2.5, stunDuration: 0.5, spawnDelay: 0.5 } },
    'rage': { name: 'Rage', cost: 2, icon: '😡', type: 'spell', stats: { dmg: 100, radius: 5.0, rageDuration: 6, rageBoost: 0.4, spawnDelay: 0.5 } },
    'freeze': { name: 'Freeze', cost: 4, icon: '❄️', type: 'spell', stats: { dmg: 100, radius: 4.0, stunDuration: 4, spawnDelay: 0.5 } },
    'rocket': { name: 'Rocket', cost: 6, icon: '🚀', type: 'spell', stats: { dmg: 1200, radius: 2.0, spawnDelay: 2.0 } },
    'the_log': { name: 'The Log', cost: 2, icon: '🪵', type: 'spell', stats: { dmg: 240, radius: 2.0, range: 10.5, projectile: 'rolling_log', projSpeed: 3, spawnDelay: 0.1 }, tags: ['log'] },
    'goblin_barrel': { name: 'Gob Barrel', cost: 3, icon: '🛢️', type: 'spell', stats: { count: 3, spawnUnit: 'goblins', spawnDelay: 1.5, spawnRadius: 50 } },
    'lightning': { name: 'Lightning', cost: 6, icon: '🌩️', type: 'spell', stats: { dmg: 850, radius: 3.5, stunDuration: 0.5, spawnDelay: 1.0 } },
    'earthquake': { name: 'Earthquake', cost: 3, icon: '🌋', type: 'spell', stats: { dmg: 200, radius: 4.0, spawnDelay: 0.5 } },
    'void': { name: 'Void', cost: 3, icon: '🌌', type: 'spell', stats: { dmg: 400, radius: 3.0, spawnDelay: 1.0 } },
    'meteor': { name: 'Meteor', cost: 5, icon: '☄️', type: 'spell', stats: { dmg: 900, radius: 3.5, spawnDelay: 2.5 } },

    // --- TOKENS ---
    'skeleton': { name: 'Skeleton', cost: 1, icon: '💀', type: 'unit', stats: { hp: 60, dmg: 50, speed: 1.4, range: 0, sightRange: 5, hitSpeed: 1.0, count: 1 }, tags: ['ground','single'], hiddenInDeck: true, visuals: { scale: 0.7, skin: '#fff', head: 'skull', body: 'ribs', weapon: 'dagger' } },
    'golemite': { name: 'Golemite', cost: 1, icon: '🪨', type: 'unit', stats: { hp: 800, dmg: 50, speed: 0.6, range: 0, sightRange: 6, hitSpeed: 2.5, count: 1 }, tags: ['ground','building-hunter'], color: '#8d6e63', hiddenInDeck: true, deathEffect: { type: 'explode', dmg: 100, radius: 2.0 }, visuals: { scale: 0.8, skin: '#8d6e63', head: 'rock', body: 'rock', weapon: 'fist' } },
    'bat_unit': { name: 'Bat', cost: 1, icon: '🦇', type: 'unit', stats: { hp: 70, dmg: 70, speed: 1.7, range: 0, sightRange: 6, hitSpeed: 1.1, count: 1 }, tags: ['air','single'], color: '#4a148c', hiddenInDeck: true, visuals: { scale: 0.6, skin: '#4a148c', head: 'bat', body: 'cloth', weapon: 'bite', hasWings: true } },
    'fire_spirit': { name: 'Spirit', cost: 1, icon: '🔥', type: 'unit', stats: { hp: 90, dmg: 180, speed: 1.8, range: 2.0, sightRange: 5, kamikaze: true, splashRadius: 2.5 }, tags: ['ground','area','air-target'], color: '#ff3d00', hiddenInDeck: true, visuals: { scale: 0.6, skin: '#ff5722', head: 'spirit', body: 'spirit', weapon: 'none' } },
    'healer_spirit': { name: 'Heal Spirit', cost: 1, icon: '🧪', type: 'unit', stats: { hp: 200, dmg: 0, speed: 1.8, range: 2.5, sightRange: 6, kamikaze: true, splashRadius: 3.0 }, tags: ['ground','area','healer'], color: '#76ff03', hiddenInDeck: true, visuals: { scale: 0.6, skin: '#76ff03', head: 'spirit', body: 'spirit', weapon: 'none' } },
};