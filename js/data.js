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
  // COMMONS
  // =================================================================
  knight: {
    name: "Knight", cost: 3, icon: "⚔️", type: "unit",
    stats: { 
      hp: 1400, dmg: 165, hitSpeed: 1.2, speed: 1.0, range: 0, 
      targetType: 'ground-only', sightRange: 5.5 
    },
    tags: ["ground", "single", "heavy"],
    visuals: { scale: 1.0, skin: "#f0ceab", head: "helmet", body: "armor_plate", weapon: "sword", color: "#4fc3f7" },
    desc: "Prajurit tangguh jarak dekat.",
  },

  archer: {
    name: "Archers", cost: 3, icon: "🏹", type: "unit",
    stats: { 
      hp: 270, dmg: 93, hitSpeed: 1.0, speed: 1.1, range: 5.0, count: 2,
      targetType: 'ground-air',
      projectile: { type: 'normal', speed: 10 }
    },
    tags: ["ground", "single", "air-target"],
    visuals: { scale: 0.9, skin: "#f0ceab", head: "hood", body: "cloth", weapon: "bow", color: "#ec407a" },
    desc: "Dua pemanah jarak jauh.",
  },

  goblins: {
    name: "Goblins", cost: 2, icon: "👺", type: "unit",
    stats: { 
      hp: 184, dmg: 103, hitSpeed: 1.1, speed: 1.6, range: 0, count: 3,
      targetType: 'ground-only'
    },
    tags: ["ground", "single", "fast"],
    visuals: { scale: 0.8, skin: "#76ff03", head: "mohawk", body: "cloth", weapon: "dagger", color: "#43a047" },
    desc: "Tiga goblin cepat dengan pisau.",
  },

  spear_goblins: {
    name: "Spear Gobs", cost: 2, icon: "🎋", type: "unit",
    stats: { 
      hp: 119, dmg: 74, hitSpeed: 1.3, speed: 1.6, range: 5.0, count: 3,
      targetType: 'ground-air',
      projectile: { type: 'spear', speed: 9 }
    },
    tags: ["ground", "single", "air-target", "fast"],
    visuals: { scale: 0.8, skin: "#76ff03", head: "bandana", body: "cloth", weapon: "spear", color: "#2e7d32" },
    desc: "Melempar tombak ke udara dan darat.",
  },

  skeletons: {
    name: "Skeletons", cost: 1, icon: "🦴", type: "unit",
    stats: { 
      hp: 69, dmg: 64, hitSpeed: 1.0, speed: 1.4, range: 0, count: 3,
      targetType: 'ground-only'
    },
    tags: ["ground", "single"],
    visuals: { scale: 0.7, skin: "#ffffff", head: "skull", body: "ribs", weapon: "dagger", color: "#eeeeee" },
    desc: "Pasukan tulang termurah.",
  },

  skeleton_army: {
    name: "Skarmy", cost: 3, icon: "☠️", type: "unit",
    stats: { 
      hp: 69, dmg: 64, hitSpeed: 1.0, speed: 1.4, range: 0, count: 15,
      targetType: 'ground-only'
    },
    tags: ["ground", "single", "swarm"],
    visuals: { scale: 0.7, skin: "#ffffff", head: "skull", body: "ribs", weapon: "dagger", color: "#eeeeee" },
    desc: "Pasukan besar Larry.",
  },

  bomber: {
    name: "Bomber", cost: 2, icon: "💣", type: "unit",
    stats: { 
      hp: 300, dmg: 220, hitSpeed: 1.8, speed: 1.2, range: 4.5,
      targetType: 'ground-only', splashRadius: 2.0,
      projectile: { type: 'normal', speed: 6 } // Visual bomb throw
    },
    tags: ["ground", "area"],
    visuals: { scale: 0.8, skin: "#ffffff", head: "goggles", body: "ribs", weapon: "bomb_carry", color: "#e0e0e0" },
    desc: "Melempar bom dengan area damage.",
  },

  minions: {
    name: "Minions", cost: 3, icon: "🦇", type: "unit",
    stats: { 
      hp: 205, dmg: 88, hitSpeed: 1.0, speed: 1.5, range: 2.0, count: 3,
      targetType: 'ground-air',
      projectile: { type: 'spit', speed: 8 } 
    },
    tags: ["air", "single", "air-target"],
    visuals: { scale: 0.9, skin: "#5c6bc0", head: "demon", body: "demon", weapon: "none", hasWings: true, color: "#5c6bc0" },
    desc: "Penyerang udara cepat.",
  },

  minion_horde: {
    name: "Minion Horde", cost: 5, icon: "👿", type: "unit",
    stats: { 
      hp: 205, dmg: 88, hitSpeed: 1.0, speed: 1.5, range: 2.0, count: 6,
      targetType: 'ground-air',
      projectile: { type: 'spit', speed: 8 } 
    },
    tags: ["air", "single", "air-target", "swarm"],
    visuals: { scale: 0.9, skin: "#5c6bc0", head: "demon", body: "demon", weapon: "none", hasWings: true, color: "#5c6bc0" },
    desc: "Enam Minion sekaligus!",
  },

  bats: {
    name: "Bats", cost: 2, icon: "🧛", type: "unit",
    stats: { 
      hp: 69, dmg: 64, hitSpeed: 1.1, speed: 1.7, range: 0, count: 5,
      targetType: 'ground-air' // Melee but hits air
    },
    tags: ["air", "single", "fast", "air-target"],
    visuals: { scale: 0.6, skin: "#4a148c", head: "bat", body: "cloth", weapon: "bite", hasWings: true, color: "#4a148c" },
    desc: "Pasukan udara jarak dekat.",
  },

  royal_giant: {
    name: "Royal Giant", cost: 6, icon: "🧔", type: "unit",
    stats: { 
      hp: 2544, dmg: 254, hitSpeed: 1.7, speed: 0.6, range: 5.5,
      targetType: 'ground-only',
      projectile: { type: 'normal', speed: 8 }
    },
    tags: ["ground", "single", "building-hunter", "heavy"],
    visuals: { scale: 1.4, skin: "#f0ceab", head: "helmet_open", body: "armor_heavy", weapon: "cannon_hand", color: "#8d6e63" },
    desc: "Raksasa dengan meriam besar. Hanya incar bangunan.",
  },

  elite_barbarians: {
    name: "Elite Barbs", cost: 6, icon: "😡", type: "unit",
    stats: { 
      hp: 1100, dmg: 300, hitSpeed: 1.4, speed: 1.8, range: 0, count: 2,
      targetType: 'ground-only'
    },
    tags: ["ground", "single", "fast"],
    visuals: { scale: 1.1, skin: "#f0ceab", head: "helmet_viking", body: "cloth", weapon: "sword", color: "#ffb74d" },
    desc: "Dua Barbarian super cepat dan sakit.",
  },

  ice_spirit: {
    name: "Ice Spirit", cost: 1, icon: "🧊", type: "unit",
    stats: { 
      hp: 190, dmg: 95, hitSpeed: 0.1, speed: 1.5, range: 0,
      targetType: 'ground-air', splashRadius: 2.5
    },
    tags: ["ground", "area", "air-target", "kamikaze"],
    effects: {
      onHit: [
        { type: 'stun', duration: 1.5, visual: 'freeze' }
      ]
    },
    visuals: { scale: 0.6, skin: "#b3e5fc", head: "spirit", body: "spirit", weapon: "none", color: "#b3e5fc" },
    desc: "Membekukan musuh 1.5 detik.",
  },

  // =================================================================
  // RARES
  // =================================================================
  giant: {
    name: "Giant", cost: 5, icon: "🗿", type: "unit",
    stats: { 
      hp: 3275, dmg: 211, hitSpeed: 1.5, speed: 0.7, range: 0,
      targetType: 'ground-only'
    },
    tags: ["ground", "building-hunter", "heavy"],
    visuals: { scale: 1.5, skin: "#f0ceab", head: "bald", body: "cloth", weapon: "fist", color: "#8d6e63" },
    desc: "Tanker murah meriah. Incar bangunan.",
  },

  musketeer: {
    name: "Musketeer", cost: 4, icon: "🎯", type: "unit",
    stats: { 
      hp: 600, dmg: 181, hitSpeed: 1.1, speed: 1.0, range: 6.0,
      targetType: 'ground-air',
      projectile: { type: 'normal', speed: 9 }
    },
    tags: ["ground", "single", "air-target"],
    visuals: { scale: 1.0, skin: "#f0ceab", head: "helmet", body: "cloth", weapon: "musket", color: "#7b1fa2" },
    desc: "Jangkauan jauh, damage sakit.",
  },

  hog_rider: {
    name: "Hog Rider", cost: 4, icon: "🐗", type: "unit",
    stats: { 
      hp: 1408, dmg: 264, hitSpeed: 1.6, speed: 1.8, range: 0,
      targetType: 'ground-only'
    },
    tags: ["ground", "building-hunter", "fast", "river-jumper"],
    visuals: { scale: 1.1, skin: "#8d6e63", head: "mohawk", body: "cloth", weapon: "hammer", isMounted: true, color: "#795548" },
    desc: "Melompati sungai untuk menghancurkan tower.",
  },

  mini_pekka: {
    name: "Mini P.E.K.K.A", cost: 4, icon: "🥞", type: "unit",
    stats: { 
      hp: 1129, dmg: 598, hitSpeed: 1.8, speed: 1.6, range: 0,
      targetType: 'ground-only'
    },
    tags: ["ground", "single", "fast", "heavy"],
    visuals: { scale: 1.0, skin: "#607d8b", head: "robot_horn", body: "armor_plate", weapon: "sword", color: "#607d8b" },
    desc: "Kecil tapi damage-nya mematikan.",
  },

  prince: {
    name: "Prince", cost: 5, icon: "🏇", type: "unit",
    stats: { 
      hp: 1615, dmg: 325, hitSpeed: 1.4, speed: 1.3, range: 0,
      targetType: 'ground-only'
    },
    tags: ["ground", "single", "river-jumper"],
    abilities: {
      charge: { speedMult: 2.0, dmg: 650, windup: 90 }
    },
    visuals: { scale: 1.1, skin: "#f0ceab", head: "helmet", body: "armor_heavy", weapon: "lance", isMounted: true, color: "#5e35b1" },
    desc: "Lari kencang = Double Damage.",
  },

  valkyrie: {
    name: "Valkyrie", cost: 4, icon: "🪓", type: "unit",
    stats: { 
      hp: 1650, dmg: 220, hitSpeed: 1.5, speed: 1.0, range: 0,
      targetType: 'ground-only', splashRadius: 2.5
    },
    tags: ["ground", "area"],
    visuals: { scale: 1.0, skin: "#f0ceab", head: "hair_orange", body: "cloth", weapon: "axe_double", color: "#ff7043" },
    desc: "Serangan area 360 derajat.",
  },

  wizard: {
    name: "Wizard", cost: 5, icon: "🧙‍♂️", type: "unit",
    stats: { 
      hp: 600, dmg: 234, hitSpeed: 1.4, speed: 1.0, range: 5.5,
      targetType: 'ground-air', splashRadius: 1.5,
      projectile: { type: 'magic_fire', speed: 8 }
    },
    tags: ["ground", "area", "air-target"],
    visuals: { scale: 1.0, skin: "#f0ceab", head: "hood", body: "robe", weapon: "magic_fire", color: "#ff5722" },
    desc: "Bola api area.",
  },

  flying_machine: {
    name: "Fly Machine", cost: 4, icon: "🚁", type: "unit",
    stats: { 
      hp: 510, dmg: 142, hitSpeed: 1.1, speed: 1.2, range: 6.0,
      targetType: 'ground-air',
      projectile: { type: 'normal', speed: 10 }
    },
    tags: ["air", "single", "air-target"],
    visuals: { scale: 1.2, skin: "#8d6e63", head: "machine", body: "wood_mech", weapon: "cannon", hasPropeller: true, color: "#795548" },
    desc: "Jangkauan jauh dari udara.",
  },

  // =================================================================
  // EPICS
  // =================================================================
  baby_dragon: {
    name: "Baby Dragon", cost: 4, icon: "🐲", type: "unit",
    stats: { 
      hp: 1000, dmg: 133, hitSpeed: 1.5, speed: 1.1, range: 3.5,
      targetType: 'ground-air', splashRadius: 1.5,
      projectile: { type: 'spit_fire', speed: 9 }
    },
    tags: ["air", "area", "air-target", "tank"],
    visuals: { scale: 1.2, skin: "#4caf50", head: "dragon", body: "dragon", weapon: "none", hasWings: true, color: "#4caf50" },
    desc: "Naga bayi yang menyemburkan api area.",
  },

  wall_breakers: {
    name: "Wall Breakers", cost: 2, icon: "🧨", type: "unit",
    stats: { 
      hp: 275, dmg: 325, hitSpeed: 0.1, speed: 1.7, range: 0, count: 2,
      targetType: 'ground-only'
    },
    tags: ["ground", "building-hunter", "kamikaze", "fast", "area"],
    visuals: { scale: 0.8, skin: "#ffffff", head: "bandana", body: "ribs", weapon: "bomb_hug", color: "#616161" },
    desc: "Pelari bunuh diri yang mengincar bangunan.",
  },

  pekka: {
    name: "P.E.K.K.A", cost: 7, icon: "🤖", type: "unit",
    stats: { 
      hp: 3125, dmg: 678, hitSpeed: 1.8, speed: 0.6, range: 0,
      targetType: 'ground-only'
    },
    tags: ["ground", "single", "heavy"],
    visuals: { scale: 1.4, skin: "#37474f", head: "robot_horn", body: "armor_heavy", weapon: "dual_swords", color: "#37474f" },
    desc: "Damage super besar, tapi mudah dialihkan.",
  },

  golem: {
    name: "Golem", cost: 8, icon: "🪨", type: "unit",
    stats: { 
      hp: 4256, dmg: 259, hitSpeed: 2.5, speed: 0.4, range: 0,
      targetType: 'ground-only', deployTime: 3
    },
    tags: ["ground", "building-hunter", "heavy"],
    effects: {
      onDeath: [
        { type: 'damage', amount: 259, radius: 2.5 },
        { type: 'spawn', unit: 'golemite', count: 2 }
      ]
    },
    visuals: { scale: 1.6, skin: "#8d6e63", head: "rock", body: "rock", weapon: "fist_rock", color: "#5d4037" },
    desc: "Sangat tebal. Meledak dan pecah saat mati.",
  },

  witch: {
    name: "Witch", cost: 5, icon: "🧙‍♀️", type: "unit",
    stats: { 
      hp: 696, dmg: 111, hitSpeed: 0.7, speed: 1.0, range: 5.0,
      targetType: 'ground-air', splashRadius: 1.5,
      projectile: { type: 'magic_fire', speed: 8 }
    },
    tags: ["ground", "area", "air-target", "spawner"],
    effects: {
      spawner: { unit: 'skeleton', count: 3, interval: 7 }
    },
    visuals: { scale: 1.0, skin: "#f0ceab", head: "hood", body: "robe", weapon: "staff", color: "#ab47bc" },
    desc: "Memanggil Skeleton secara berkala.",
  },

  balloon: {
    name: "Balloon", cost: 5, icon: "🎈", type: "unit",
    stats: { 
      hp: 1396, dmg: 800, hitSpeed: 3.0, speed: 0.9, range: 0,
      targetType: 'ground-only', // Hits building (ground)
      firstHitDelay: 0.5
    },
    tags: ["air", "building-hunter", "heavy"],
    effects: {
      onDeath: [{ type: 'damage', amount: 272, radius: 3 }]
    },
    visuals: { scale: 1.3, skin: "#8d6e63", head: "balloon", body: "basket", weapon: "bomb_drop", color: "#8d6e63" },
    desc: "Menjatuhkan bom mematikan.",
  },

  dark_prince: {
    name: "Dark Prince", cost: 4, icon: "🔨", type: "unit",
    stats: { 
      hp: 1030, shield: 199, dmg: 206, hitSpeed: 1.3, speed: 1.3, range: 0,
      targetType: 'ground-only', splashRadius: 2.0
    },
    tags: ["ground", "area", "shielded", "river-jumper"],
    abilities: {
      charge: { speedMult: 2.0, dmg: 412, windup: 90 }
    },
    visuals: { scale: 1.1, skin: "#f0ceab", head: "helmet_bucket", body: "armor_heavy", weapon: "mace", isMounted: true, color: "#311b92" },
    desc: "Punya Shield, Area Damage, dan Charge.",
  },

  guards: {
    name: "Guards", cost: 3, icon: "🛡️", type: "unit",
    stats: { 
      hp: 67, shield: 199, dmg: 100, hitSpeed: 1.1, speed: 1.1, range: 1.5, count: 3,
      targetType: 'ground-only'
    },
    tags: ["ground", "single", "shielded"],
    visuals: { scale: 0.8, skin: "#ffffff", head: "skull_helm", body: "ribs_armor", weapon: "spear", color: "#d4af37" },
    desc: "Tiga kerangka elit dengan perisai.",
  },

  executioner: {
    name: "Executioner", cost: 5, icon: "🪓", type: "unit",
    stats: { 
      hp: 1010, dmg: 280, hitSpeed: 2.4, speed: 0.9, range: 4.5,
      targetType: 'ground-air',
      projectile: { type: 'boomerang', speed: 6, maxRange: 6.5 }
    },
    tags: ["ground", "area", "air-target"],
    visuals: { scale: 1.2, skin: "#f0ceab", head: "mask_hood", body: "cloth_heavy", weapon: "axe_throw", color: "#5e35b1" },
    desc: "Kapaknya menembus musuh dan kembali lagi.",
  },

  giant_skeleton: {
    name: "Giant Skelly", cost: 6, icon: "💣", type: "unit",
    stats: { 
      hp: 2700, dmg: 170, hitSpeed: 1.5, speed: 0.8, range: 0,
      targetType: 'ground-only'
    },
    tags: ["ground", "single", "heavy"],
    effects: {
      onDeath: [{ type: 'damage', amount: 950, radius: 3.5 }]
    },
    visuals: { scale: 1.4, skin: "#fff", head: "skull_giant", body: "ribs", weapon: "bomb_carry", color: "#5d4037" },
    desc: "Bom kematiannya menghancurkan segalanya.",
  },

  // =================================================================
  // LEGENDARIES
  // =================================================================
  ice_wizard: {
    name: "Ice Wiz", cost: 3, icon: "❄️", type: "unit",
    stats: { 
      hp: 590, dmg: 75, hitSpeed: 1.7, speed: 1.0, range: 5.5,
      targetType: 'ground-air', splashRadius: 2.0,
      projectile: { type: 'magic_ice', speed: 7 }
    },
    tags: ["ground", "area", "air-target", "slow-effect"],
    effects: {
      onHit: [{ type: 'slow', amount: 0.35, duration: 2.5 }],
      onSpawn: [{ type: 'slow', amount: 0.35, duration: 2.5, radius: 4 }]
    },
    visuals: { scale: 1.0, skin: "#e1f5fe", head: "hood_ice", body: "robe", weapon: "magic_ice", color: "#29b6f6" },
    desc: "Memperlambat musuh dengan es.",
  },

  electro_wizard: {
    name: "Electro Wiz", cost: 4, icon: "⚡️", type: "unit",
    stats: { 
      hp: 590, dmg: 192, hitSpeed: 1.8, speed: 1.4, range: 5.0,
      targetType: 'ground-air',
      multiTarget: 2,
      projectile: { type: 'instant', visual: 'lightning' } 
    },
    tags: ["ground", "single", "air-target", "stun-effect"],
    effects: {
      onHit: [{ type: 'stun', duration: 0.5, visual: 'zap' }],
      onSpawn: [{ type: 'damage', amount: 159, radius: 2.5 }, { type: 'stun', duration: 0.5 }]
    },
    visuals: { scale: 1.0, skin: "#fff9c4", head: "hair_spiky", body: "robe", weapon: "magic_zap", color: "#304ffe" },
    desc: "Menyetrum 2 target sekaligus.",
  },

  princess: {
    name: "Princess", cost: 3, icon: "👸", type: "unit",
    stats: { 
      hp: 216, dmg: 140, hitSpeed: 3.0, speed: 1.0, range: 9.0, sightRange: 12,
      targetType: 'ground-air', splashRadius: 2.5,
      projectile: { type: 'bow_fire', speed: 9 }
    },
    tags: ["ground", "area", "air-target", "siege"],
    visuals: { scale: 0.9, skin: "#f0ceab", head: "tiara", body: "dress", weapon: "bow_fire", color: "#e65100" },
    desc: "Menembak hujan api dari jarak aman.",
  },

  sparky: {
    name: "Sparky", cost: 6, icon: "🔌", type: "unit",
    stats: { 
      hp: 1200, dmg: 1100, hitSpeed: 4.0, speed: 0.8, range: 4.5,
      targetType: 'ground-only', splashRadius: 3.0,
      projectile: { type: 'magic_zap', speed: 12 }
    },
    tags: ["ground", "area", "heavy"],
    visuals: { scale: 1.3, skin: "#fbc02d", head: "coil", body: "machine_tank", weapon: "coil_gun", color: "#fbc02d" },
    desc: "Trash can on wheels. Damage area masif.",
  },

  mega_knight: {
    name: "Mega Knight", cost: 7, icon: "🦍", type: "unit",
    stats: { 
      hp: 3300, dmg: 222, hitSpeed: 1.7, speed: 1.0, range: 0,
      targetType: 'ground-only', splashRadius: 2.0,
      deployTime: 2.5
    },
    tags: ["ground", "area", "heavy"],
    effects: {
      onSpawn: [{ type: 'damage', amount: 444, radius: 3.0 }]
    },
    abilities: {
      jumpAttack: { minRange: 3.5, maxRange: 5.0, dmg: 444, speed: 1.5, radius: 2.5 }
    },
    visuals: { scale: 1.1, skin: "#37474f", head: "helmet_full", body: "armor_heavy", weapon: "mace_hands", color: "#212121" },
    desc: "Mendarat dengan kekuatan 1000 kumis!",
  },

  inferno_dragon: {
    name: "Inferno Drag", cost: 4, icon: "👺", type: "unit",
    stats: { 
      hp: 1070, dmg: 40, hitSpeed: 0.4, speed: 1.0, range: 3.5,
      targetType: 'ground-air',
      // PENTING: Jangan set projectile 'normal'
      projectile: { type: 'instant', visual: 'beam' } 
    },
    tags: ["air", "single", "air-target", "ramp-damage"], // Tag ramp-damage memicu logika beam
    visuals: { scale: 1.1, skin: "#e53935", head: "helmet_tech", body: "dragon", weapon: "beam_emitter", hasWings: true, color: "#e53935" },
    desc: "Melelehkan tank dengan damage bertingkat.",
  },

  lumberjack: {
    name: "Lumberjack", cost: 4, icon: "🪵", type: "unit",
    stats: { 
      hp: 1060, dmg: 200, hitSpeed: 0.8, speed: 1.8, range: 0,
      targetType: 'ground-only'
    },
    tags: ["ground", "single", "fast"],
    effects: {
      onDeath: [{ type: 'spell', spell: "rage", radius: 5.0, duration: 3, amount: 0.4 }]
    },
    visuals: { scale: 1.0, skin: "#f0ceab", head: "hat_winter", body: "shirt_plaid", weapon: "axe_bottle", color: "#d32f2f" },
    desc: "Menebang pohon di siang hari, menumpahkan Rage di malam hari.",
  },

  // =================================================================
  // CUSTOM MYTHICS (UPDATED)
  // =================================================================

  healer: {
    name: "Battle Healer", cost: 4, icon: "🧚", type: "unit",
    stats: { 
      hp: 1500, dmg: 123, hitSpeed: 1.5, speed: 1.0, range: 0,
      targetType: 'ground-only' 
    },
    tags: ["ground", "single", "healer"],
    effects: {
      onHit: [{ type: 'heal', amount: 60 }],
      aura: [{ type: 'heal', amount: 50, radius: 4, target: 'ally' }]
    },
    visuals: { scale: 1.0, skin: "#f8bbd0", head: "hair_long", body: "armor_light", weapon: "sword_light", color: "#f8bbd0" },
    desc: "Menyembuhkan teman saat menyerang.",
  },

  storm_caller: {
    name: "Storm Caller", cost: 5, icon: "🌩️", type: "unit",
    stats: { 
      hp: 900, dmg: 185, hitSpeed: 1.8, speed: 1.1, range: 4.0,
      targetType: 'ground-air', splashRadius: 2.0,
      // TYPE INSTANT = Serangan langsung
      projectile: { type: 'instant', visual: 'lightning' } 
    },
    tags: ["air", "single", "air-target", "stun-effect"],
    effects: {
      onHit: [{ type: 'stun', duration: 0.5, visual: 'zap' }]
    },
    visuals: { scale: 1.1, skin: "#b3e5fc", head: "hair_spiky", body: "robe", weapon: "magic_zap", hasWings: true, color: "#0288d1" },
    desc: "Menyetrum area dari udara.",
  },

  // =================================================================
  // TOKENS (Hidden)
  // =================================================================
  skeleton: {
    name: "Skeleton", cost: 1, icon: "💀", type: "unit",
    stats: { hp: 67, dmg: 67, hitSpeed: 1.0, speed: 1.4, range: 0, targetType: 'ground-only' },
    tags: ["ground", "single"], hiddenInDeck: true,
    visuals: { scale: 0.7, skin: "#fff", head: "skull", body: "ribs", weapon: "dagger" }
  },
  bat_unit: {
    name: "Bat", cost: 1, icon: "🦇", type: "unit",
    stats: { hp: 67, dmg: 67, hitSpeed: 1.1, speed: 1.7, range: 0, targetType: 'ground-air' },
    tags: ["air", "single"], hiddenInDeck: true,
    visuals: { scale: 0.6, skin: "#4a148c", head: "bat", body: "cloth", weapon: "bite", hasWings: true }
  },
  golemite: {
    name: "Golemite", cost: 1, icon: "🪨", type: "unit",
    stats: { hp: 800, dmg: 53, hitSpeed: 2.5, speed: 0.6, range: 0, targetType: 'ground-only' },
    tags: ["ground", "building-hunter"], hiddenInDeck: true,
    effects: {
      onDeath: [{ type: 'damage', amount: 100, radius: 2.0 }]
    },
    visuals: { scale: 0.8, skin: "#8d6e63", head: "rock", body: "rock", weapon: "fist" }
  },

  // =================================================================
  // BUILDINGS
  // =================================================================
  cannon: {
    name: "Cannon", cost: 3, icon: "🔫", type: "building",
    stats: { hp: 742, dmg: 128, range: 5.0, hitSpeed: 0.9, lifetime: 30, radius: 20 },
    tags: ["ground-only"], color: "#555"
  },
  tesla: {
    name: "Tesla", cost: 4, icon: "⚡", type: "building",
    stats: { hp: 954, dmg: 190, range: 5.0, hitSpeed: 1.1, lifetime: 35, radius: 20 },
    tags: ["air-target", "hide-when-idle"], color: "#0288d1",
    projectile: { type: 'instant', visual: 'lightning' }
  },
  inferno_tower: {
    name: "Inferno", cost: 5, icon: "🔥", type: "building",
    stats: { hp: 1452, dmg: 35, range: 6.0, hitSpeed: 0.4, lifetime: 30, radius: 22 },
    tags: ["air-target", "ramp-damage"], color: "#d32f2f"
  },
  xbow: {
    name: "X-Bow", cost: 6, icon: "🏹", type: "building",
    stats: { hp: 1330, dmg: 26, range: 11.5, hitSpeed: 0.25, lifetime: 40, radius: 25, deployTime: 3.5 },
    tags: ["ground-only", "siege"], color: "#8e24aa"
  },
  tombstone: {
    name: "Tombstone", cost: 3, icon: "🪦", type: "building",
    stats: { hp: 422, lifetime: 30, radius: 20 },
    tags: ["spawner"],
    effects: { spawner: { unit: 'skeleton', count: 1, interval: 3.1 }, onDeath: [{ type: 'spawn', unit: 'skeleton', count: 4 }] },
    color: "#9e9e9e"
  },

  // =================================================================
  // SPELLS (RESTORED & MODULAR)
  // =================================================================
  fireball: { name: "Fireball", cost: 4, icon: "🔥", type: "spell", stats: { dmg: 572, radius: 2.5, spawnDelay: 1.0 } },
  arrows: { name: "Arrows", cost: 3, icon: "🏹", type: "spell", stats: { dmg: 243, radius: 4.0, spawnDelay: 0.8 } },
  zap: { name: "Zap", cost: 2, icon: "⚡", type: "spell", stats: { dmg: 159, radius: 2.5, stunDuration: 0.5, spawnDelay: 0.5 } },
  rage: { name: "Rage", cost: 2, icon: "😡", type: "spell", stats: { radius: 5.0, rageDuration: 6, rageBoost: 0.35, spawnDelay: 0.5 } },
  the_log: { name: "The Log", cost: 2, icon: "🪵", type: "spell", stats: { dmg: 240, radius: 2.0, range: 10, projectile: "rolling_log", projSpeed: 4, spawnDelay: 0.1 }, tags: ["log"] },
  goblin_barrel: { name: "Gob Barrel", cost: 3, icon: "🛢️", type: "spell", stats: { count: 3, spawnUnit: "goblins", spawnDelay: 1.5 } },
  void: { name: "Void", cost: 3, icon: "🌌", type: "spell", stats: { dmg: 384, radius: 3.0, spawnDelay: 1.0 } },
  meteor: { name: "Meteor", cost: 5, icon: "☄️", type: "spell", stats: { dmg: 846, radius: 3.5, spawnDelay: 2.5 } },
  
  // RESTORED SPELLS
  rocket: { name: "Rocket", cost: 6, icon: "🚀", type: "spell", stats: { dmg: 1232, radius: 2.0, spawnDelay: 2.0 } },
  earthquake: { name: "Earthquake", cost: 3, icon: "🪨", type: "spell", stats: { dmg: 200, radius: 3.5, spawnDelay: 1.0, duration: 3 } }, // Logic EQ ada di renderer
  freeze: { name: "Freeze", cost: 4, icon: "🧊", type: "spell", stats: { dmg: 0, radius: 3.0, spawnDelay: 0.5, duration: 4.0 } }, // Logic freeze ada di game.js

  // dari claude
  // =================================================================
// NEW EPIC UNITS
// =================================================================
crystal_archer: {
  name: "Crystal Archer", cost: 4, icon: "💎", type: "unit",
  stats: { 
    hp: 550, dmg: 145, hitSpeed: 1.3, speed: 1.0, range: 7.0,
    targetType: 'ground-air',
    projectile: { type: 'normal', speed: 12 }
  },
  tags: ["ground", "single", "air-target"],
  effects: {
    onHit: [{ type: 'slow', amount: 0.2, duration: 1.5 }]
  },
  visuals: { scale: 0.95, skin: "#e1f5fe", head: "hood", body: "robe", weapon: "bow", color: "#00bcd4" },
  desc: "Panah kristal yang memperlambat target.",
},

flame_knight: {
  name: "Flame Knight", cost: 5, icon: "🔥", type: "unit",
  stats: { 
    hp: 1200, dmg: 180, hitSpeed: 1.4, speed: 1.1, range: 0,
    targetType: 'ground-only', splashRadius: 1.5
  },
  tags: ["ground", "area"],
  effects: {
    aura: [{ type: 'damage', amount: 50, radius: 2.5, target: 'enemy' }]
  },
  visuals: { scale: 1.0, skin: "#f0ceab", head: "helmet", body: "armor_heavy", weapon: "sword", color: "#ff5722" },
  desc: "Pedang berapi membakar sekitar.",
},

shadow_assassin: {
  name: "Shadow Assn", cost: 4, icon: "🗡️", type: "unit",
  stats: { 
    hp: 750, dmg: 420, hitSpeed: 2.0, speed: 1.9, range: 0,
    targetType: 'ground-only', deployTime: 0.5
  },
  tags: ["ground", "single", "fast"],
  effects: {
    onSpawn: [{ type: 'damage', amount: 210, radius: 1.5 }]
  },
  visuals: { scale: 0.9, skin: "#424242", head: "hood_dark", body: "cloth", weapon: "dual_swords", color: "#212121" },
  desc: "Muncul dari bayangan dengan serangan mematikan.",
},

frost_giant: {
  name: "Frost Giant", cost: 6, icon: "🧊", type: "unit",
  stats: { 
    hp: 3800, dmg: 190, hitSpeed: 1.8, speed: 0.6, range: 0,
    targetType: 'ground-only', splashRadius: 2.0
  },
  tags: ["ground", "building-hunter", "heavy", "area", "slow-effect"],
  effects: {
    onHit: [{ type: 'slow', amount: 0.4, duration: 2.0 }],
    onDeath: [{ type: 'slow', amount: 0.5, duration: 3.0, radius: 4.0 }]
  },
  visuals: { scale: 1.6, skin: "#b3e5fc", head: "bald", body: "armor_heavy", weapon: "fist", color: "#0288d1" },
  desc: "Raksasa es yang membekukan segalanya.",
},

plague_doctor: {
  name: "Plague Doc", cost: 4, icon: "🦠", type: "unit",
  stats: { 
    hp: 680, dmg: 95, hitSpeed: 1.5, speed: 1.0, range: 4.5,
    targetType: 'ground-air', splashRadius: 2.0,
    projectile: { type: 'normal', speed: 7 }
  },
  tags: ["ground", "area", "air-target"],
  effects: {
    onHit: [{ type: 'damage', amount: 30, duration: 4, visual: 'poison' }] // DOT effect
  },
  visuals: { scale: 1.0, skin: "#4caf50", head: "hood_dark", body: "robe_dark", weapon: "staff", color: "#388e3c" },
  desc: "Meracuni musuh dengan gas beracun.",
},

thunder_golem: {
  name: "Thunder Golem", cost: 7, icon: "⚡", type: "unit",
  stats: { 
    hp: 3600, dmg: 220, hitSpeed: 2.2, speed: 0.5, range: 0,
    targetType: 'ground-only', deployTime: 3
  },
  tags: ["ground", "building-hunter", "heavy", "stun-effect"],
  effects: {
    onHit: [{ type: 'stun', duration: 0.8, visual: 'zap' }],
    onDeath: [
      { type: 'damage', amount: 300, radius: 3.0 },
      { type: 'stun', duration: 1.5, radius: 3.0 }
    ]
  },
  visuals: { scale: 1.6, skin: "#fbc02d", head: "rock", body: "rock", weapon: "fist_rock", color: "#f57f17" },
  desc: "Golem petir yang menyetrum semua musuh.",
},

// =================================================================
// NEW LEGENDARY UNITS
// =================================================================
phoenix: {
  name: "Phoenix", cost: 5, icon: "🔥", type: "unit",
  stats: { 
    hp: 1100, dmg: 165, hitSpeed: 1.6, speed: 1.3, range: 3.0,
    targetType: 'ground-air', splashRadius: 1.8,
    projectile: { type: 'spit_fire', speed: 8 }
  },
  tags: ["air", "area", "air-target"],
  effects: {
    onDeath: [
      { type: 'damage', amount: 220, radius: 2.5 },
      { type: 'spawn', unit: 'phoenix_egg', count: 1 }
    ]
  },
  visuals: { scale: 1.2, skin: "#ff5722", head: "dragon", body: "dragon", weapon: "none", hasWings: true, color: "#ff6f00" },
  desc: "Bangkit kembali dari abu.",
},

necromancer: {
  name: "Necromancer", cost: 5, icon: "💀", type: "unit",
  stats: { 
    hp: 750, dmg: 125, hitSpeed: 1.5, speed: 0.9, range: 5.0,
    targetType: 'ground-air',
    projectile: { type: 'magic_fire', speed: 7 }
  },
  tags: ["ground", "single", "air-target", "spawner"],
  effects: {
    spawner: { unit: 'skeleton', count: 4, interval: 6 },
    onDeath: [{ type: 'spawn', unit: 'skeleton', count: 8 }]
  },
  visuals: { scale: 1.1, skin: "#212121", head: "hood_dark", body: "robe_dark", weapon: "staff", color: "#311b92" },
  desc: "Menghidupkan kembali yang mati.",
},

time_mage: {
  name: "Time Mage", cost: 6, icon: "⏰", type: "unit",
  stats: { 
    hp: 850, dmg: 150, hitSpeed: 2.0, speed: 1.0, range: 5.0,
    targetType: 'ground-air', splashRadius: 2.0,
    projectile: { type: 'normal', speed: 8 }
  },
  tags: ["ground", "area", "air-target"],
  effects: {
    onHit: [{ type: 'slow', amount: 0.6, duration: 3.0 }],
    aura: [{ type: 'slow', amount: 0.4, radius: 4.5, target: 'enemy' }]
  },
  visuals: { scale: 1.0, skin: "#e1bee7", head: "hood", body: "robe", weapon: "staff", color: "#9c27b0" },
  desc: "Memperlambat waktu musuh, menyembuhkan teman.",
},

berserker: {
  name: "Berserker", cost: 5, icon: "😈", type: "unit",
  stats: { 
    hp: 1600, dmg: 180, hitSpeed: 1.2, speed: 1.4, range: 0,
    targetType: 'ground-only', splashRadius: 2.0
  },
  tags: ["ground", "area", "fast"],
  effects: {
    aura: [{ type: 'rage', amount: 0.3, target: 'self' }]
  },
  visuals: { scale: 1.1, skin: "#d32f2f", head: "helmet_viking", body: "cloth", weapon: "axe_double", color: "#b71c1c" },
  desc: "Semakin lama bertarung, semakin cepat.",
},

celestial_dragon: {
  name: "Celestial Drag", cost: 6, icon: "🌟", type: "unit",
  stats: { 
    hp: 1400, dmg: 200, hitSpeed: 1.5, speed: 1.2, range: 4.0,
    targetType: 'ground-air', splashRadius: 2.0,
    projectile: { type: 'instant', visual: 'lightning' }
  },
  tags: ["air", "area", "air-target"],
  effects: {
    onSpawn: [{ type: 'heal', amount: 150, radius: 5.0, target: 'ally' }],
    aura: [{ type: 'rage', amount: 0.25, radius: 4.0, target: 'ally' }]
  },
  visuals: { scale: 1.3, skin: "#fff9c4", head: "dragon", body: "dragon", weapon: "none", hasWings: true, color: "#ffd600" },
  desc: "Naga langit yang memberkati sekutu.",
},

blood_knight: {
  name: "Blood Knight", cost: 4, icon: "🩸", type: "unit",
  stats: { 
    hp: 1350, dmg: 210, hitSpeed: 1.3, speed: 1.2, range: 0,
    targetType: 'ground-only'
  },
  tags: ["ground", "single"],
  effects: {
    onHit: [{ type: 'heal', amount: 105, target: 'self' }] // Lifesteal 50%
  },
  visuals: { scale: 1.0, skin: "#f0ceab", head: "helmet", body: "armor_heavy", weapon: "sword", color: "#c62828" },
  desc: "Menyerap nyawa dari setiap serangan.",
},

// =================================================================
// SPECIAL MYTHIC UNITS
// =================================================================
void_dragon: {
  name: "Void Dragon", cost: 8, icon: "🌌", type: "unit",
  stats: { 
    hp: 2200, dmg: 280, hitSpeed: 1.8, speed: 1.0, range: 4.5,
    targetType: 'ground-air', splashRadius: 2.5,
    projectile: { type: 'spit_fire', speed: 8 }
  },
  tags: ["air", "area", "air-target", "heavy"],
  effects: {
    onDeath: [{ type: 'spell', spell: "void", radius: 4.5, duration: 3, amount: 500 }]
  },
  visuals: { scale: 1.4, skin: "#4a148c", head: "dragon", body: "dragon", weapon: "none", hasWings: true, color: "#6a1b9a" },
  desc: "Naga kegelapan yang meninggalkan lubang hitam masif.",
},

titan: {
  name: "Titan", cost: 9, icon: "🗿", type: "unit",
  stats: { 
    hp: 5500, dmg: 350, hitSpeed: 2.0, speed: 0.4, range: 0,
    targetType: 'ground-only', splashRadius: 3.0, deployTime: 4
  },
  tags: ["ground", "building-hunter", "heavy", "area"],
  effects: {
    onSpawn: [{ type: 'damage', amount: 500, radius: 4.0 }],
    onDeath: [
      { type: 'damage', amount: 600, radius: 4.5 },
      { type: 'stun', duration: 2.0, radius: 4.5 }
    ]
  },
  visuals: { scale: 1.8, skin: "#5d4037", head: "rock", body: "rock", weapon: "fist_rock", color: "#3e2723" },
  desc: "Raksasa legendaris yang menghancurkan segalanya.",
},

archmage: {
  name: "Archmage", cost: 6, icon: "🧙", type: "unit",
  stats: { 
    hp: 950, dmg: 220, hitSpeed: 1.6, speed: 0.9, range: 6.0,
    targetType: 'ground-air', splashRadius: 2.5,
    projectile: { type: 'magic_fire', speed: 9 }
  },
  tags: ["ground", "area", "air-target"],
  effects: {
    onSpawn: [{ type: 'spell', spell: "fireball", radius: 3.0, amount: 300 }],
    spawner: { unit: 'ice_spirit', count: 1, interval: 8 }
  },
  visuals: { scale: 1.1, skin: "#f0ceab", head: "hood", body: "robe", weapon: "staff_axe", color: "#5e35b1" },
  desc: "Master sihir dengan 3 elemen.",
},

// =================================================================
// SUPPORT UNITS
// =================================================================
shield_maiden: {
  name: "Shield Maiden", cost: 3, icon: "🛡️", type: "unit",
  stats: { 
    hp: 1100, shield: 300, dmg: 140, hitSpeed: 1.4, speed: 1.0, range: 0,
    targetType: 'ground-only'
  },
  tags: ["ground", "single", "shielded"],
  effects: {
    aura: [{ type: 'heal', amount: 35, radius: 3.5, target: 'ally' }]
  },
  visuals: { scale: 0.95, skin: "#f0ceab", head: "helmet", body: "armor_plate", weapon: "sword", color: "#00acc1" },
  desc: "Gadis perisai yang menyembuhkan sekutu.",
},

drummer: {
  name: "War Drummer", cost: 3, icon: "🥁", type: "unit",
  stats: { 
    hp: 700, dmg: 0, hitSpeed: 0, speed: 1.0, range: 0,
    targetType: 'allies-only'
  },
  tags: ["ground", "single"],
  effects: {
    aura: [{ type: 'rage', amount: 0.4, radius: 5.0, target: 'ally' }]
  },
  visuals: { scale: 0.9, skin: "#f0ceab", head: "bandana", body: "cloth", weapon: "none", color: "#ff9800" },
  desc: "Menabuh drum perang untuk mempercepat pasukan.",
},

phoenix_egg: {
    name: "Phoenix Egg", cost: 1, icon: "🥚", type: "building", // Tipe building agar diam
    stats: { 
      hp: 300, 
      lifetime: 4, // Waktu menetas (4 detik)
      radius: 15,
      hitSpeed: 0, // Tidak menyerang
      range: 0
    },
    tags: ["ground", "building"], 
    hiddenInDeck: true,
    // Saat durasi lifetime habis (menetas), spawn Phoenix baru
    // Note: Kita gunakan onDeath karena lifetime habis = mati bagi building
    effects: {
      onDeath: [{ type: 'spawn', unit: 'phoenix_reborn', count: 1 }] 
    },
    visuals: { scale: 0.8, skin: "#ff6f00", head: "default", body: "rock", weapon: "none", color: "#ffab00" },
    desc: "Akan menetas menjadi Phoenix yang marah jika dihancurkan."
  },

  phoenix_reborn: {
    name: "Phoenix", cost: 5, icon: "🔥", type: "unit",
    stats: { 
      hp: 1100, dmg: 165, hitSpeed: 1.6, speed: 1.3, range: 3.0,
      targetType: 'ground-air', splashRadius: 1.8,
      projectile: { type: 'spit_fire', speed: 8 }
    },
    tags: ["air", "area", "air-target"],
    hiddenInDeck: true, // Token
    effects: {
      aura:[{type:'rage', amount:0.2, target:'self'}, {type:'poison', amount:100, target:'self'}],
    },
    visuals: { scale: 1, skin: "#ff5722", head: "dragon", body: "dragon", weapon: "none", hasWings: true, color: "#ff6f00" }
  },

};