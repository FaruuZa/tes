const CONFIG = {
  baseElixirRate: 0.6,
  maxElixir: 10,
  botThinkRate: 1500,
  logicWidth: 440,
  logicHeight: 700,
  gridSize: 20,
};

const TOWER_DATA = {
  king: {
    name: "King Tower", hp: 4000, dmg: 110, range: 10, hitSpeed: 1.0, radius: 30, color: "#ffeb3b",
    targetType: 'ground-air',
    projectile: { type: 'normal', speed: 7 }
  },
  princess: {
    name: "Princess", hp: 2500, dmg: 90, range: 8.6, hitSpeed: 0.8, radius: 25, color: "#ff9800",
    targetType: 'ground-air',
    projectile: { type: 'normal', speed: 9 }
  },
  // CONTOH CUSTOM TOWER: TESLA TOWER (Jika ingin dipakai sebagai Tower utama)
  tesla_tower: {
    name: "Tesla Tower", hp: 3000, dmg: 190, range: 6.0, hitSpeed: 1.1, radius: 25, color: "#0288d1",
    targetType: 'ground-air',
    projectile: { type: 'instant', visual: 'lightning' } // INSTANT ATTACK
  }
};

const CARDS = {
  // =================================================================
  // TANKS & WIN CONDITIONS
  // =================================================================
  giant: {
    name: "Giant", cost: 5, icon: "🗿", type: "unit",
    // HP Tank range 3000-4500 [cite: 5]
    stats: { hp: 3500, dmg: 211, hitSpeed: 1.5, speed: 0.7, range: 0, targetType: 'ground-only' },
    tags: ["ground", "win_condition", "tank", "building-hunter", "heavy", "melee", "single"],
    visuals: { scale: 1.5, skin: "#f0ceab", head: "bald", body: "cloth", weapon: "fist_giant", color: "#8d6e63" },
    desc: "Tanker lambat yang hanya mengincar bangunan.",
  },
  royal_giant: {
    name: "Royal Giant", cost: 6, icon: "🧔", type: "unit",
    stats: { hp: 2544, dmg: 254, hitSpeed: 1.7, speed: 0.6, range: 5.5, targetType: 'ground-only', projectile: { type: 'normal', speed: 8 } },
    tags: ["ground", "win_condition", "tank", "building-hunter", "heavy", "ranged"],
    visuals: { scale: 1.4, skin: "#f0ceab", head: "helmet_open", body: "armor_heavy", weapon: "cannon_hand", accessory: "cape_tattered", color: "#5d4037" },
    desc: "Raksasa dengan meriam jarak jauh.",
  },
  golem: {
    name: "Golem", cost: 8, icon: "🪨", type: "unit",
    stats: { hp: 4256, dmg: 259, hitSpeed: 2.5, speed: 0.4, range: 0, targetType: 'ground-only', deployTime: 3 },
    tags: ["ground", "win_condition", "tank", "building-hunter", "heavy", "melee", "single"],
    effects: { onDeath: [{ type: 'damage', amount: 259, radius: 2.5 }, { type: 'spawn', unit: 'golemite', count: 2 }] },
    visuals: { scale: 1.6, skin: "#8d6e63", head: "rock", body: "rock", weapon: "fist_rock", color: "#5d4037" },
    desc: "Sangat tebal. Meledak menjadi Golemites saat mati.",
  },
  hog_rider: {
    name: "Hog Rider", cost: 4, icon: "🐗", type: "unit",
    stats: { hp: 1408, dmg: 264, hitSpeed: 1.6, speed: 1.8, range: 0, targetType: 'ground-only' },
    tags: ["ground", "win_condition", "building-hunter", "fast", "river-jumper", "melee", "single"],
    visuals: { scale: 1.1, skin: "#8d6e63", head: "mohawk", body: "pig", weapon: "hammer", color: "#795548" },
    desc: "Melompati sungai untuk menghancurkan tower.",
  },
  balloon: {
    name: "Balloon", cost: 5, icon: "🎈", type: "unit",
    stats: { hp: 1396, dmg: 800, hitSpeed: 3.0, speed: 0.9, range: 0, targetType: 'ground-only', firstHitDelay: 0.5 },
    tags: ["air", "win_condition", "building-hunter", "heavy", "melee", "single"],
    effects: { onDeath: [{ type: 'damage', amount: 272, radius: 3 }] },
    visuals: { scale: 1.3, skin: "#8d6e63", head: "balloon", body: "basket", weapon: "bomb_drop", color: "#d32f2f" },
    desc: "Pengebom udara yang mematikan.",
  },
  wall_breakers: {
    name: "Wall Breakers", cost: 2, icon: "🧨", type: "unit",
    stats: { hp: 275, dmg: 325, hitSpeed: 0.1, speed: 1.7, range: 0, count: 2, targetType: 'ground-only' },
    tags: ["ground", "win_condition", "building-hunter", "kamikaze", "fast", "area", "melee", "single"],
    visuals: { scale: 0.8, skin: "#ffffff", head: "bandana", body: "ribs", weapon: "bomb_hug", accessory: "backpack_survival", color: "#616161" },
    desc: "Pelari bunuh diri yang mengincar bangunan.",
  },

  // =================================================================
  // FIGHTERS & MINI-TANKS
  // =================================================================
  knight: {
    name: "Knight", cost: 3, icon: "⚔️", type: "unit",
    // Mini Tank HP: 1400-2200 [cite: 5]
    stats: { hp: 1450, dmg: 165, hitSpeed: 1.2, speed: 1.0, range: 0, targetType: 'ground-only', sightRange: 5.5 },
    tags: ["ground", "mini_tank", "melee", "single"],
    visuals: { scale: 1.0, skin: "#f0ceab", head: "helmet", body: "armor_plate", weapon: "sword", accessory: "cape_royal", color: "#1976d2" },
    desc: "Prajurit tangguh dan murah.",
  },
  valkyrie: {
    name: "Valkyrie", cost: 4, icon: "🪓", type: "unit",
    // UPDATE: meleeType 'circular' applied because of 360 splash [cite: 53]
    // Balancing: AoE melee damage slightly penalized (-25%) compared to Knight 
    stats: { hp: 1650, dmg: 220, hitSpeed: 1.5, speed: 1.0, range: 0, targetType: 'ground-only', splashRadius: 2.5, meleeType: 'circular' },
    tags: ["ground", "mini_tank", "melee", "aoe"],
    visuals: { scale: 1.0, skin: "#f0ceab", head: "hair_orange", body: "cloth", weapon: "axe_double", accessory: "cape_tattered", color: "#ff7043" },
    desc: "Berputar membasmi pasukan darat.",
  },
  mini_pekka: {
    name: "Mini P.E.K.K.A", cost: 4, icon: "🥞", type: "unit",
    stats: { hp: 1129, dmg: 598, hitSpeed: 1.8, speed: 1.6, range: 0, targetType: 'ground-only' },
    tags: ["ground", "dps", "tank_killer", "fast", "melee", "single"],
    visuals: { scale: 1.0, skin: "#607d8b", head: "robot_horn", body: "armor_plate", weapon: "sword", color: "#90caf9" },
    desc: "Kecil tapi damage-nya sangat sakit.",
  },
  prince: {
    name: "Prince", cost: 5, icon: "🏇", type: "unit",
    stats: { hp: 1615, dmg: 325, hitSpeed: 1.4, speed: 1.3, range: 0, targetType: 'ground-only' },
    tags: ["ground", "mini_tank", "dps", "river-jumper", "melee", "single"],
    abilities: { charge: { speedMult: 2.0, dmg: 650, windup: 90 } },
    visuals: { scale: 1.1, skin: "#f0ceab", head: "helmet", body: "armor_heavy", weapon: "lance", color: "#5e35b1" },
    desc: "Double damage saat berlari kencang.",
  },
  dark_prince: {
    name: "Dark Prince", cost: 4, icon: "🔨", type: "unit",
    // UPDATE: Melee 'cleave' confirmed. Frontal AoE[cite: 54].
    stats: { hp: 1030, shield: 199, dmg: 206, hitSpeed: 1.3, speed: 1.3, range: 0, targetType: 'ground-only', splashRadius: 2.0, meleeType: 'cleave' },
    tags: ["ground", "mini_tank", "aoe", "shielded", "river-jumper", "melee"],
    abilities: { charge: { speedMult: 2.0, dmg: 412, windup: 90 } },
    visuals: { scale: 1.1, skin: "#f0ceab", head: "helmet_bucket", body: "armor_heavy", weapon: "mace", color: "#311b92" },
    desc: "Membawa perisai dan gada area.",
  },
  mega_knight: {
    name: "Mega Knight", cost: 7, icon: "🦍", type: "unit",
    // UPDATE: Melee 'cleave' added.
    // NOTE: This is an "All-Rounder" (Tank + AoE + Jump). 
    // Demerit: Cost is high (7) and Damage per hit is moderate compared to PEKKA[cite: 5].
    stats: { hp: 3300, dmg: 222, hitSpeed: 1.7, speed: 1.0, range: 0, targetType: 'ground-only', splashRadius: 2.0, deployTime: 2.5, meleeType: 'cleave' },
    tags: ["ground", "tank", "aoe", "heavy", "melee"],
    effects: { onSpawn: [{ type: 'damage', amount: 444, radius: 3.0 }] },
    abilities: { jumpAttack: { minRange: 3.5, maxRange: 5.0, dmg: 444, speed: 1.5, radius: 2.5 } },
    visuals: { scale: 1.2, skin: "#37474f", head: "helmet_full", body: "armor_heavy", weapon: "mace_hands", accessory: "cape_tattered", color: "#212121" },
    desc: "Mendarat dengan kekuatan 1000 kumis!",
  },
  pekka: {
    name: "P.E.K.K.A", cost: 7, icon: "🤖", type: "unit",
    stats: { hp: 3400, dmg: 678, hitSpeed: 1.8, speed: 0.6, range: 0, targetType: 'ground-only' },
    tags: ["ground", "tank", "dps", "tank_killer", "heavy", "melee", "single"],
    visuals: { scale: 1.4, skin: "#37474f", head: "robot_horn", body: "armor_heavy", weapon: "dual_swords", color: "#5c6bc0" },
    desc: "Robot berat. Butterfly?",
  },
  elite_barbarians: {
    name: "Elite Barbs", cost: 6, icon: "😡", type: "unit",
    stats: { hp: 1100, dmg: 300, hitSpeed: 1.4, speed: 1.8, range: 0, count: 2, targetType: 'ground-only' },
    tags: ["ground", "dps", "fast", "tank_killer", "melee", "single"],
    visuals: { scale: 1.1, skin: "#f0ceab", head: "helmet_viking", body: "shirt_plaid", weapon: "sword", color: "#ffb74d" },
    desc: "Dua barbarian sangat cepat.",
  },
  lumberjack: {
    name: "Lumberjack", cost: 4, icon: "🪵", type: "unit",
    stats: { hp: 1060, dmg: 200, hitSpeed: 0.8, speed: 1.8, range: 0, targetType: 'ground-only' },
    tags: ["ground", "dps", "fast", "support", "melee", "single"],
    effects: { onDeath: [{ type: 'spell', spell: "rage", radius: 5.0, duration: 3, amount: 0.4 }] },
    visuals: { scale: 1.0, skin: "#f0ceab", head: "hat_winter", body: "shirt_plaid", weapon: "axe_bottle", accessory: "backpack_survival", color: "#d32f2f" },
    desc: "Mati meninggalkan Rage.",
  },

  // =================================================================
  // RANGED & AIR SUPPORT
  // =================================================================
  archer: {
    name: "Archers", cost: 3, icon: "🏹", type: "unit",
    stats: { hp: 270, dmg: 93, hitSpeed: 1.0, speed: 1.1, range: 5.0, count: 2, targetType: 'ground-air', projectile: { type: 'normal', speed: 10 } },
    tags: ["ground", "ranged", "air_defense", "support"],
    visuals: { scale: 0.9, skin: "#f0ceab", head: "hood", body: "cloth", weapon: "bow", accessory: "cape_tattered", color: "#ec407a" },
    desc: "Dua pemanah dasar.",
  },
  musketeer: {
    name: "Musketeer", cost: 4, icon: "🎯", type: "unit",
    stats: { hp: 600, dmg: 181, hitSpeed: 1.1, speed: 1.0, range: 6.0, targetType: 'ground-air', projectile: { type: 'normal', speed: 9 } },
    tags: ["ground", "ranged", "dps", "air_defense"],
    visuals: { scale: 1.0, skin: "#f0ceab", head: "helmet", body: "cloth", weapon: "musket", color: "#7b1fa2" },
    desc: "Penembak jitu yang andal.",
  },
  wizard: {
    name: "Wizard", cost: 5, icon: "🧙‍♂️", type: "unit",
    // Ranged AoE: Damage turun 
    stats: { hp: 600, dmg: 234, hitSpeed: 1.4, speed: 1.0, range: 5.5, targetType: 'ground-air', splashRadius: 1.5, projectile: { type: 'magic_fire', speed: 8 } },
    tags: ["ground", "ranged", "aoe", "air_defense"],
    visuals: { scale: 1.0, skin: "#f0ceab", head: "hair_spiky", body: "robe", weapon: "magic_fire", accessory: "cape_royal", color: "#ff5722" },
    desc: "Penyihir api area.",
  },
  ice_wizard: {
    name: "Ice Wiz", cost: 3, icon: "❄️", type: "unit",
    stats: { hp: 590, dmg: 75, hitSpeed: 1.7, speed: 1.0, range: 5.5, targetType: 'ground-air', splashRadius: 2.0, projectile: { type: 'magic_ice', speed: 7 } },
    tags: ["ground", "ranged", "aoe", "air_defense", "control", "slow-effect"],
    effects: { onHit: [{ type: 'slow', amount: 0.35, duration: 2.5 }], onSpawn: [{ type: 'slow', amount: 0.35, duration: 2.5, radius: 4 }] },
    visuals: { scale: 1.0, skin: "#e1f5fe", head: "hood_ice", body: "robe", weapon: "magic_ice", accessory: "cape_tattered", color: "#29b6f6" },
    desc: "Memperlambat musuh.",
  },
  electro_wizard: {
    name: "Electro Wiz", cost: 4, icon: "⚡️", type: "unit",
    stats: { hp: 590, dmg: 192, hitSpeed: 1.8, speed: 1.4, range: 5.0, targetType: 'ground-air', multiTarget: 2, projectile: { type: 'instant', visual: 'lightning' } },
    tags: ["ground", "ranged", "air_defense", "control", "stun-effect"],
    effects: { onHit: [{ type: 'stun', duration: 0.5, visual: 'zap' }], onSpawn: [{ type: 'damage', amount: 159, radius: 2.5 }, { type: 'stun', duration: 0.5 }] },
    visuals: { scale: 1.0, skin: "#fff9c4", head: "hair_spiky", body: "robe", weapon: "magic_zap", color: "#304ffe" },
    desc: "Mendarat dengan Zap, menyerang 2 target.",
  },
  witch: {
    name: "Witch", cost: 5, icon: "🧙‍♀️", type: "unit",
    stats: { hp: 696, dmg: 111, hitSpeed: 0.7, speed: 1.0, range: 5.0, targetType: 'ground-air', splashRadius: 1.5, projectile: { type: 'magic_fire', speed: 8 } },
    tags: ["ground", "ranged", "aoe", "air_defense", "spawner"],
    effects: { spawner: { unit: 'skeleton', count: 3, interval: 7 } },
    visuals: { scale: 1.0, skin: "#f0ceab", head: "hood", body: "robe", weapon: "staff", accessory: "cape_tattered", color: "#ab47bc" },
    desc: "Memanggil Skeleton dan menembak laser.",
  },
  executioner: {
    name: "Executioner", cost: 5, icon: "🪓", type: "unit",
    stats: { hp: 1010, dmg: 280, hitSpeed: 2.4, speed: 0.9, range: 4.5, targetType: 'ground-air', projectile: { type: 'boomerang', speed: 6, maxRange: 6.5 } },
    tags: ["ground", "ranged", "aoe", "air_defense"],
    visuals: { scale: 1.2, skin: "#f0ceab", head: "mask_hood", body: "armor_heavy", weapon: "axe_throw", color: "#5e35b1" },
    desc: "Kapak boomerang yang menembus musuh.",
  },
  princess: {
    name: "Princess", cost: 3, icon: "👸", type: "unit",
    // Glass Cannon HP: 300-600[cite: 5]. Princess extrim (HP 216), Range extreme.
    stats: { hp: 216, dmg: 140, hitSpeed: 3.0, speed: 1.0, range: 9.0, sightRange: 12, targetType: 'ground-air', splashRadius: 2.5, projectile: { type: 'bow_fire', speed: 9 } },
    tags: ["ground", "ranged", "aoe", "air_defense", "siege", "glass_cannon"],
    visuals: { scale: 0.9, skin: "#f0ceab", head: "tiara", body: "robe", weapon: "bow_fire", accessory: "cape_royal", color: "#e65100" },
    desc: "Menembak dari jarak yang sangat jauh.",
  },
  flying_machine: {
    name: "Fly Machine", cost: 4, icon: "🚁", type: "unit",
    stats: { hp: 510, dmg: 142, hitSpeed: 1.1, speed: 1.2, range: 6.0, targetType: 'ground-air', projectile: { type: 'normal', speed: 10 } },
    tags: ["air", "ranged", "dps", "air_defense"],
    visuals: { scale: 1.2, skin: "#8d6e63", head: "machine", body: "wood_mech", weapon: "cannon", hasPropeller: true, color: "#795548" },
    desc: "Unit udara dengan jangkauan jauh.",
  },
  baby_dragon: {
    name: "Baby Dragon", cost: 4, icon: "🐲", type: "unit",
    // Tank Air. HP lebih rendah dari Tank darat.
    stats: { hp: 1000, dmg: 133, hitSpeed: 1.5, speed: 1.1, range: 3.5, targetType: 'ground-air', splashRadius: 1.5, projectile: { type: 'spit_fire', speed: 9 } },
    tags: ["air", "ranged", "aoe", "tank", "air_defense"],
    visuals: { scale: 1.2, skin: "#4caf50", head: "helmet_viking", body: "dragon", weapon: "none", accessory: "wings_dragon", color: "#4caf50" },
    desc: "Unit udara area yang cukup tebal.",
  },
  inferno_dragon: {
    name: "Inferno Drag", cost: 4, icon: "👺", type: "unit",
    stats: { hp: 1070, dmg: 40, hitSpeed: 0.4, speed: 1.0, range: 3.5, targetType: 'ground-air', projectile: { type: 'instant', visual: 'beam' } },
    tags: ["air", "ranged", "tank_killer", "ramp-damage"],
    visuals: { scale: 1.1, skin: "#e53935", head: "helmet_tech", body: "dragon", weapon: "beam_emitter", accessory: "wings_mech", color: "#e53935" },
    desc: "Melelehkan tank dengan damage bertingkat.",
  },
  minions: {
    name: "Minions", cost: 3, icon: "🦇", type: "unit",
    stats: { hp: 205, dmg: 88, hitSpeed: 1.0, speed: 1.5, range: 2.0, count: 3, targetType: 'ground-air', projectile: { type: 'spit', speed: 8 } },
    tags: ["air", "swarm", "dps", "air_defense"],
    visuals: { scale: 0.9, skin: "#5c6bc0", head: "demon", body: "demon", weapon: "none", accessory: "wings_demon", color: "#5c6bc0" },
    desc: "Tiga penyerang udara cepat.",
  },
  minion_horde: {
    name: "Minion Horde", cost: 5, icon: "👿", type: "unit",
    stats: { hp: 205, dmg: 88, hitSpeed: 1.0, speed: 1.5, range: 2.0, count: 6, targetType: 'ground-air', projectile: { type: 'spit', speed: 8 } },
    tags: ["air", "swarm", "dps", "air_defense", "glass_cannon"],
    visuals: { scale: 0.9, skin: "#5c6bc0", head: "demon", body: "demon", weapon: "none", accessory: "wings_demon", color: "#5c6bc0" },
    desc: "Enam Minion. DPS tinggi tapi rentan arrow.",
  },
  bats: {
    name: "Bats", cost: 2, icon: "🧛", type: "unit",
    stats: { hp: 69, dmg: 64, hitSpeed: 1.1, speed: 1.7, range: 0, count: 5, targetType: 'ground-air' },
    tags: ["air", "swarm", "fast", "cycle", "melee", "single"],
    visuals: { scale: 0.6, skin: "#4a148c", head: "bat", body: "demon", weapon: "bite", accessory: "wings_demon", color: "#4a148c" },
    desc: "Pasukan udara murah dan cepat.",
  },

  // =================================================================
  // SWARM & CYCLE
  // =================================================================
  skeletons: {
    name: "Skeletons", cost: 1, icon: "🦴", type: "unit",
    stats: { hp: 69, dmg: 64, hitSpeed: 1.0, speed: 1.4, range: 0, count: 3, targetType: 'ground-only' },
    tags: ["ground", "swarm", "cycle", "distraction", "melee", "single"],
    visuals: { scale: 0.7, skin: "#ffffff", head: "skull", body: "ribs", weapon: "dagger", color: "#eeeeee" },
    desc: "Tiga kerangka untuk distraksi.",
  },
  skeleton_army: {
    name: "Skarmy", cost: 3, icon: "☠️", type: "unit",
    stats: { hp: 69, dmg: 64, hitSpeed: 1.0, speed: 1.4, range: 0, count: 15, targetType: 'ground-only' },
    tags: ["ground", "swarm", "dps", "tank_killer", "melee", "single"],
    visuals: { scale: 0.7, skin: "#ffffff", head: "skull", body: "ribs", weapon: "dagger", color: "#eeeeee" },
    desc: "Lautan kerangka. Hati-hati area damage.",
  },
  goblins: {
    name: "Goblins", cost: 2, icon: "👺", type: "unit",
    stats: { hp: 184, dmg: 103, hitSpeed: 1.1, speed: 1.6, range: 0, count: 3, targetType: 'ground-only' },
    tags: ["ground", "swarm", "dps", "fast", "melee", "single"],
    visuals: { scale: 0.8, skin: "#76ff03", head: "mohawk", body: "cloth", weapon: "dagger", color: "#43a047" },
    desc: "Tiga goblin cepat.",
  },
  spear_goblins: {
    name: "Spear Gobs", cost: 2, icon: "🎋", type: "unit",
    stats: { hp: 119, dmg: 74, hitSpeed: 1.3, speed: 1.6, range: 5.0, count: 3, targetType: 'ground-air', projectile: { type: 'spear', speed: 9 } },
    tags: ["ground", "swarm", "ranged", "air_defense", "cycle"],
    visuals: { scale: 0.8, skin: "#76ff03", head: "bandana", body: "cloth", weapon: "spear", color: "#2e7d32" },
    desc: "Murah dan bisa serang udara.",
  },
  ice_spirit: {
    name: "Ice Spirit", cost: 1, icon: "🧊", type: "unit",
    // Kamikaze splash always circular style, but technically specific logic.
    stats: { hp: 190, dmg: 95, hitSpeed: 0.1, speed: 1.5, range: 0, targetType: 'ground-air', splashRadius: 2.5, meleeType: 'circular' },
    tags: ["ground", "cycle", "kamikaze", "control", "stun-effect"],
    effects: { onHit: [{ type: 'stun', duration: 1.5, visual: 'freeze' }] },
    visuals: { scale: 0.6, skin: "#b3e5fc", head: "spirit", body: "spirit", weapon: "none", color: "#b3e5fc" },
    desc: "Bunuh diri untuk membekukan area.",
  },
  bomber: {
    name: "Bomber", cost: 2, icon: "💣", type: "unit",
    stats: { hp: 300, dmg: 220, hitSpeed: 1.8, speed: 1.2, range: 4.5, targetType: 'ground-only', splashRadius: 2.0, projectile: { type: 'normal', speed: 6 } },
    tags: ["ground", "ranged", "aoe", "glass_cannon"],
    visuals: { scale: 0.8, skin: "#ffffff", head: "goggles", body: "ribs", weapon: "bomb_carry", color: "#e0e0e0" },
    desc: "Solusi murah untuk pasukan darat.",
  },
  guards: {
    name: "Guards", cost: 3, icon: "🛡️", type: "unit",
    stats: { hp: 67, shield: 199, dmg: 100, hitSpeed: 1.1, speed: 1.1, range: 1.5, count: 3, targetType: 'ground-only' }, // Range 1.5 = Long Melee
    tags: ["ground", "swarm", "shielded", "defense", "melee", "single"],
    visuals: { scale: 0.8, skin: "#ffffff", head: "skull_helm", body: "ribs_armor", weapon: "spear", color: "#d4af37" },
    desc: "Kerangka elit dengan perisai.",
  },

  // =================================================================
  // BUILDINGS & SPAWNERS
  // =================================================================
  cannon: {
    name: "Cannon", cost: 3, icon: "🔫", type: "building",
    stats: { hp: 742, dmg: 128, range: 5.0, hitSpeed: 0.9, lifetime: 30, radius: 20, projectile: { type: 'normal', speed: 10 } },
    tags: ["building", "defense", "ground-only"], color: "#555",
    visuals: { scale: 1.0, body: "building_base_stone", head: "turret_cannon", color: "#555" }
  },
  tesla: {
    name: "Tesla", cost: 4, icon: "⚡", type: "building",
    stats: { hp: 954, dmg: 190, range: 5.0, hitSpeed: 1.1, lifetime: 35, radius: 20, projectile: { type: 'instant', visual: 'lightning' } },
    tags: ["building", "defense", "air-target", "hide-when-idle"], 
    visuals: { scale: 1.0, body: "tower_tesla", head: "none", color: "#0288d1" }
  },
  inferno_tower: {
    name: "Inferno", cost: 5, icon: "🔥", type: "building",
    stats: { hp: 1452, dmg: 35, range: 6.0, hitSpeed: 0.4, lifetime: 30, radius: 22, projectile: { type: 'instant', visual: 'beam' } },
    tags: ["building", "defense", "air-target", "tank_killer", "ramp-damage"], 
    visuals: { scale: 1.0, body: "tower_inferno", head: "tower_inferno", color: "#d32f2f" }
  },
  xbow: {
    name: "X-Bow", cost: 6, icon: "🏹", type: "building",
    stats: { hp: 1330, dmg: 26, range: 11.5, hitSpeed: 0.25, lifetime: 40, radius: 25, deployTime: 3.5, projectile: { type: 'normal', speed: 12 } },
    tags: ["building", "win_condition", "siege", "ground-only"], 
    visuals: { scale: 1.2, body: "building_base_wood", head: "turret_xbow", color: "#8e24aa" }
  },
  tombstone: {
    name: "Tombstone", cost: 3, icon: "🪦", type: "building",
    stats: { hp: 422, lifetime: 30, radius: 20 },
    tags: ["building", "spawner", "distraction"],
    effects: { spawner: { unit: 'skeleton', count: 1, interval: 3.1 }, onDeath: [{ type: 'spawn', unit: 'skeleton', count: 4 }] },
    visuals: { scale: 1.0, body: "building_tombstone", head: "none", color: "#9e9e9e" }
  },
  sparky: { 
    name: "Sparky", cost: 6, icon: "🔌", type: "unit",
    // Sparky is ranged (4.5) so no meleeType needed.
    stats: { hp: 1200, dmg: 1100, hitSpeed: 4.0, speed: 0.8, range: 4.5, targetType: 'ground-only', splashRadius: 3.0, projectile: { type: 'magic_zap', speed: 12 } },
    tags: ["ground", "ranged", "aoe", "heavy", "tank_killer"],
    visuals: { scale: 1.3, skin: "#fbc02d", head: "coil", body: "machine_tank", weapon: "coil_gun", color: "#fbc02d" },
    desc: "Trash can on wheels.",
  },

  // =================================================================
  // CUSTOM & SPECIAL UNITS (REBALANCED)
  // =================================================================
  healer: {
    name: "Battle Healer", cost: 4, icon: "🧚", type: "unit",
    // Mini Tank + Support. No AoE attack, single melee.
    stats: { hp: 1500, dmg: 123, hitSpeed: 1.5, speed: 1.0, range: 0, targetType: 'ground-only' },
    tags: ["ground", "mini_tank", "support", "healer", "melee", "single"],
    effects: { onHit: [{ type: 'heal', amount: 60 }], aura: [{ type: 'heal', amount: 50, radius: 4, target: 'ally' }] },
    visuals: { scale: 1.0, skin: "#f8bbd0", head: "hair_long", body: "armor_plate", weapon: "sword_light", accessory: "wings_angel", color: "#f8bbd0" },
    desc: "Menyembuhkan diri sendiri dan teman.",
  },
  holy_priest: {
    name: "Holy Priest", cost: 4, icon: "🙏", type: "unit",
    stats: { hp: 800, dmg: 40, hitSpeed: 0.2, speed: 1.0, range: 4.5, targetType: 'allies-only', projectile: { type: 'instant', visual: 'beam' } },
    tags: ["ground", "support", "healer", "ranged"],
    targetPreferences: ['heavy', 'hero', 'tank'],
    visuals: { scale: 1.0, skin: "#fff9c4", head: "hood", body: "robe", weapon: "staff", accessory: "cape_royal", color: "#fff" },
    desc: "Menyalurkan heal beam terus menerus.",
  },
  storm_caller: {
    name: "Storm Caller", cost: 5, icon: "🌩️", type: "unit",
    // Stun is powerful (Control), AoE. Cost 5 matches.
    stats: { hp: 900, dmg: 185, hitSpeed: 1.8, speed: 1.1, range: 4.0, targetType: 'ground-air', splashRadius: 2.0, projectile: { type: 'instant', visual: 'lightning' } },
    tags: ["air", "ranged", "aoe", "control", "stun-effect"],
    effects: { onHit: [{ type: 'stun', duration: 0.5, visual: 'zap' }] },
    visuals: { scale: 1.1, skin: "#b3e5fc", head: "hair_spiky", body: "robe", weapon: "magic_zap", accessory: "wings_angel", color: "#0288d1" },
    desc: "Malaikat badai.",
  },
  flame_knight: {
    name: "Flame Knight", cost: 5, icon: "🔥", type: "unit",
    // UPDATE: Melee 'cleave' added.
    // Cost 5 because Mini Tank + AoE + Aura Damage (Almost all-rounder).
    stats: { hp: 1200, dmg: 180, hitSpeed: 1.4, speed: 1.1, range: 0, targetType: 'ground-only', splashRadius: 1.5, meleeType: 'cleave' },
    tags: ["ground", "mini_tank", "aoe", "melee"],
    effects: { aura: [{ type: 'damage', amount: 50, radius: 2.5, target: 'enemy' }] },
    visuals: { scale: 1.0, skin: "#f0ceab", head: "helmet_viking", body: "armor_heavy", weapon: "sword_light", accessory: "cape_tattered", color: "#ff5722" },
    desc: "Membakar musuh di sekitarnya.",
  },
  shadow_assassin: {
    name: "Shadow Assn", cost: 4, icon: "🗡️", type: "unit",
    stats: { hp: 750, dmg: 420, hitSpeed: 2.0, speed: 1.9, range: 0, targetType: 'ground-only', deployTime: 0.5 },
    tags: ["ground", "dps", "fast", "glass_cannon", "melee", "single"],
    effects: { onSpawn: [{ type: 'damage', amount: 210, radius: 1.5 }] },
    visuals: { scale: 0.9, skin: "#424242", head: "hood_ninja", body: "cloth", weapon: "dual_dagger", accessory: "cape_tattered", color: "#212121" },
    desc: "Sangat cepat dan mematikan.",
  },
  plague_doctor: {
    name: "Plague Doc", cost: 4, icon: "🦠", type: "unit",
    stats: { hp: 680, dmg: 95, hitSpeed: 2, speed: 1.0, range: 4.5, targetType: 'ground-air', splashRadius: 2.0, projectile: { type: 'normal', speed: 7 } },
    tags: ["ground", "ranged", "aoe", "support", "control"],
    effects: { onHit: [{ type: 'damage', amount: 100, duration: 4, visual: 'poison' }] },
    visuals: { scale: 1.0, skin: "#4caf50", head: "mask", body: "robe_green", weapon: "staff", accessory: "backpack_survival", color: "#388e3c" },
    desc: "Serangan racun (Damage over Time).",
  },
  frost_giant: {
    name: "Frost Giant", cost: 6, icon: "🧊", type: "unit",
    // UPDATE: Melee 'cleave' added.
    // Tank + AoE + Control. Cost 6 is fair. Damage reduced slightly to fit Tank role (-25% logic).
    stats: { hp: 3800, dmg: 160, hitSpeed: 1.8, speed: 0.6, range: 0, targetType: 'ground-only', splashRadius: 2.0, meleeType: 'cleave' },
    tags: ["ground", "tank", "aoe", "heavy", "control", "slow-effect", "melee"],
    effects: { onHit: [{ type: 'slow', amount: 0.4, duration: 2.0 }], onDeath: [{ type: 'slow', amount: 0.5, duration: 3.0, radius: 4.0 }] },
    visuals: { scale: 1.6, skin: "#b3e5fc", head: "hat_winter", body: "body_ice_golem", weapon: "fist_ice", color: "#0288d1" },
    desc: "Raksasa es.",
  },
  phoenix: {
    name: "Phoenix", cost: 5, icon: "🔥", type: "unit",
    stats: { hp: 1100, dmg: 165, hitSpeed: 1.6, speed: 1.3, range: 3.0, targetType: 'ground-air', splashRadius: 1.8, projectile: { type: 'spit_fire', speed: 8 } },
    tags: ["air", "ranged", "aoe", "mini_tank"],
    effects: { onDeath: [{ type: 'damage', amount: 220, radius: 2.5 }, { type: 'spawn', unit: 'phoenix_egg', count: 1 }] },
    visuals: { scale: 1.2, skin: "#ff5722", head: "dragon", body: "dragon", weapon: "none", accessory: "wings_demon", color: "#ff6f00" },
    desc: "Bangkit dari telur saat mati.",
  },
  titan: {
    name: "Titan", cost: 9, icon: "🗿", type: "unit",
    // UPDATE: Melee 'cleave' added.
    // EXTREME UNIT: Tank + WinCon + AoE. Cost 9 is the demerit.
    // Balancing: HP capped at 5000 (was 5500) to be closer to Guide limit (4500) but still Boss.
    stats: { hp: 5000, dmg: 350, hitSpeed: 2.0, speed: 0.4, range: 0, targetType: 'ground-only', splashRadius: 3.0, deployTime: 4, meleeType: 'cleave' },
    tags: ["ground", "win_condition", "tank", "heavy", "aoe", "melee"],
    effects: { onSpawn: [{ type: 'damage', amount: 500, radius: 4.0 }], onDeath: [{ type: 'damage', amount: 600, radius: 4.5 }, { type: 'stun', duration: 2.0, radius: 4.5 }] },
    visuals: { scale: 1.8, skin: "#5d4037", head: "ancient_helm", body: "ancient_armor", weapon: "fist_giant", accessory: "cape_tattered", color: "#3e2723" },
    desc: "Boss Unit. Lambat tapi pasti.",
  },
  drummer: {
    name: "War Drummer", cost: 3, icon: "🥁", type: "unit",
    stats: { hp: 700, dmg: 0, hitSpeed: 0, speed: 1.0, range: 0, targetType: 'allies-only' },
    tags: ["ground", "support"],
    effects: { aura: [{ type: 'rage', amount: 0.4, radius: 5.0, target: 'ally' }] },
    targetPreferences: ['win_condition', 'tank', 'heavy', 'mini_tank'],
    visuals: { scale: 0.9, skin: "#f0ceab", head: "bandana", body: "cloth", weapon: "none", accessory: "backpack_survival", color: "#ff9800" },
    desc: "Memberikan efek Rage ke sekitar.",
  },
  hunter: {
    name: "Hunter", cost: 4, icon: "🤠", type: "unit",
    stats: { hp: 800, dmg: 70, hitSpeed: 2.0, speed: 1.1, range: 4.5, targetType: 'ground-air', projectile: { type: 'normal', speed: 11, count: 5, spread: 1.5 } },
    tags: ["ground", "ranged", "dps", "tank_killer"],
    visuals: { scale: 1.1, skin: "#5d4037", head: "hood", body: "fur_white", weapon: "musket", accessory: "backpack_survival", color: "#795548" },
    desc: "Shotgun: Sakit jarak dekat, lemah jarak jauh.",
  },
  twin_gunner: {
    name: "Twin Gunner", cost: 4, icon: "🔫", type: "unit",
    stats: { hp: 600, dmg: 90, hitSpeed: 1.2, speed: 1.3, range: 5.5, targetType: 'ground-air', projectile: { type: 'normal', speed: 10, count: 2, spread: 1.2 } },
    tags: ["ground", "ranged", "dps"],
    visuals: { scale: 0.9, skin: "#ffcc80", head: "hair_spiky", body: "cloth", weapon: "dual_dagger", accessory: "jetpack", color: "#673ab7" },
    desc: "Dual wield shooter.",
  },

  // buildings 
  cannon: {
    name: "Cannon", cost: 3, icon: "🔫", type: "building",
    stats: { hp: 742, dmg: 128, range: 5.0, hitSpeed: 0.9, lifetime: 30, radius: 20, projectile: { type: 'normal', speed: 10 } },
    tags: ["building", "defense", "ground-only"], color: "#555",
    visuals: { scale: 1.0, body: "building_base_stone", head: "turret_cannon", color: "#555" }
  },
  tesla: {
    name: "Tesla", cost: 4, icon: "⚡", type: "building",
    stats: { hp: 954, dmg: 190, range: 5.0, hitSpeed: 1.1, lifetime: 35, radius: 20, projectile: { type: 'instant', visual: 'lightning' } },
    tags: ["building", "defense", "air-target", "hide-when-idle"], 
    visuals: { scale: 1.0, body: "tower_tesla", head: "none", color: "#0288d1" }
  },
  inferno_tower: {
    name: "Inferno", cost: 5, icon: "🔥", type: "building",
    stats: { hp: 1452, dmg: 35, range: 6.0, hitSpeed: 0.4, lifetime: 30, radius: 22, projectile: { type: 'instant', visual: 'beam' } },
    tags: ["building", "defense", "air-target", "tank_killer", "ramp-damage"], 
    visuals: { scale: 1.0, body: "tower_inferno", head: "tower_inferno", color: "#d32f2f" }
  },
  xbow: {
    name: "X-Bow", cost: 6, icon: "🏹", type: "building",
    stats: { hp: 1330, dmg: 26, range: 11.5, hitSpeed: 0.25, lifetime: 40, radius: 25, deployTime: 3.5, projectile: { type: 'normal', speed: 12 } },
    tags: ["building", "win_condition", "siege", "ground-only"], 
    visuals: { scale: 1.2, body: "building_base_wood", head: "turret_xbow", color: "#8e24aa" }
  },
  tombstone: {
    name: "Tombstone", cost: 3, icon: "🪦", type: "building",
    stats: { hp: 422, lifetime: 30, radius: 20 },
    tags: ["building", "spawner", "distraction"],
    effects: { spawner: { unit: 'skeleton', count: 1, interval: 3.1 }, onDeath: [{ type: 'spawn', unit: 'skeleton', count: 4 }] },
    visuals: { scale: 1.0, body: "building_tombstone", head: "none", color: "#9e9e9e" }
  },

  // =================================================================
  // SPELLS
  // =================================================================
  fireball: { name: "Fireball", cost: 4, icon: "🔥", type: "spell", tags: ["spell", "spell_dmg_medium"], stats: { dmg: 572, radius: 2.5, spawnDelay: 1.0 } },
  arrows: { name: "Arrows", cost: 3, icon: "🏹", type: "spell", tags: ["spell", "spell_dmg_light", "aoe"], stats: { dmg: 243, radius: 4.0, spawnDelay: 0.8 } },
  zap: { name: "Zap", cost: 2, icon: "⚡", type: "spell", tags: ["spell", "spell_dmg_light", "stun"], stats: { dmg: 159, radius: 2.5, stunDuration: 0.5, spawnDelay: 0.5 } },
  rage: { name: "Rage", cost: 2, icon: "😡", type: "spell", tags: ["spell", "spell_support"], stats: { radius: 5.0, rageDuration: 6, rageBoost: 0.35, spawnDelay: 0.5 } },
  the_log: { name: "The Log", cost: 2, icon: "🪵", type: "spell", tags: ["spell", "spell_dmg_light", "log"], stats: { dmg: 240, radius: 2.0, range: 10, projectile: "rolling_log", projSpeed: 4, spawnDelay: 0.1 } },
  goblin_barrel: { name: "Gob Barrel", cost: 3, icon: "🛢️", type: "spell", tags: ["spell", "win_condition"], stats: { count: 3, spawnUnit: "goblins", spawnDelay: 1.5 } },
  void: { name: "Void", cost: 3, icon: "🌌", type: "spell", tags: ["spell", "spell_dmg_medium"], stats: { dmg: 384, radius: 3.0, spawnDelay: 1.0 } },
  meteor: { name: "Meteor", cost: 5, icon: "☄️", type: "spell", tags: ["spell", "spell_dmg_heavy"], stats: { dmg: 846, radius: 3.5, spawnDelay: 2.5 } },
  rocket: { name: "Rocket", cost: 6, icon: "🚀", type: "spell", tags: ["spell", "spell_dmg_heavy"], stats: { dmg: 1232, radius: 2.0, spawnDelay: 2.0 } },
  earthquake: { name: "Earthquake", cost: 3, icon: "🪨", type: "spell", tags: ["spell", "spell_dmg_light", "slow"], stats: { dmg: 200, radius: 3.5, spawnDelay: 1.0, duration: 3 } },
  freeze: { name: "Freeze", cost: 4, icon: "🧊", type: "spell", tags: ["spell", "spell_support", "control"], stats: { dmg: 0, radius: 3.0, spawnDelay: 0.5, duration: 4.0 } },

  // =================================================================
  // TOKENS (HIDDEN)
  // =================================================================
  skeleton: {
    name: "Skeleton", cost: 1, icon: "💀", type: "unit",
    stats: { hp: 67, dmg: 67, hitSpeed: 1.0, speed: 1.4, range: 0, targetType: 'ground-only' },
    tags: ["ground"], hiddenInDeck: true,
    visuals: { scale: 0.7, skin: "#fff", head: "skull", body: "ribs", weapon: "dagger" }
  },
  bat_unit: {
    name: "Bat", cost: 1, icon: "🦇", type: "unit",
    stats: { hp: 67, dmg: 67, hitSpeed: 1.1, speed: 1.7, range: 0, targetType: 'ground-air' },
    tags: ["air"], hiddenInDeck: true,
    visuals: { scale: 0.6, skin: "#4a148c", head: "bat", body: "demon", weapon: "bite", accessory: "wings_demon", color: "#4a148c" }
  },
  golemite: {
    name: "Golemite", cost: 1, icon: "🪨", type: "unit",
    stats: { hp: 800, dmg: 53, hitSpeed: 2.5, speed: 0.6, range: 0, targetType: 'ground-only' },
    tags: ["ground"], hiddenInDeck: true,
    effects: { onDeath: [{ type: 'damage', amount: 100, radius: 2.0 }] },
    visuals: { scale: 0.8, skin: "#8d6e63", head: "rock", body: "rock", weapon: "fist_rock" }
  },
  phoenix_egg: {
    name: "Phoenix Egg", cost: 1, icon: "🥚", type: "building",
    stats: { hp: 300, lifetime: 4, radius: 15, hitSpeed: 0, range: 0 },
    tags: ["building"], hiddenInDeck: true,
    effects: { onDeath: [{ type: 'spawn', unit: 'phoenix_reborn', count: 1 }, { type: 'damage', amount: 150, radius: 2.0 }] },
    visuals: { scale: 0.8, skin: "#ff6f00", head: "none", body: "rock", weapon: "none", color: "#ffab00" }
  },
  phoenix_reborn: {
    name: "Phoenix", cost: 5, icon: "🔥", type: "unit",
    stats: { hp: 900, dmg: 165, hitSpeed: 1.6, speed: 1.3, range: 3.0, targetType: 'ground-air', splashRadius: 1.8, projectile: { type: 'spit_fire', speed: 8 } },
    tags: ["air"], hiddenInDeck: true,
    effects: { aura:[{type:'rage', amount:0.2, target:'self'}, {type:'damage', amount:100, target:'self', duration:999.0}] },
    visuals: { scale: 1, skin: "#ff5722", head: "dragon", body: "dragon", weapon: "none", accessory: "wings_demon", color: "#ff6f00" }
  }
};