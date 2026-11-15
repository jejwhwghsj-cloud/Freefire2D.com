import { LootItem, LootType, TileMap } from '../types/game';

export interface MapData {
  tileMap: TileMap;
  lootItems: LootItem[];
  worldSize: number;
  namedLocations: { name: string; x: number; y: number }[];
}

export function generateBattleRoyaleMap(seed: number = 42): MapData {
  const tileSize = 32;
  const tilesCount = 100;
  const worldSize = tileSize * tilesCount; // 3200 x 3200 pixels

  // Simple pseudo-random helper
  let currentSeed = seed;
  const rnd = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  const rndRange = (min: number, max: number) => min + rnd() * (max - min);

  // Initialize terrain grid: 0: Grass, 1: Sand, 2: Water, 3: Dirt, 4: Asphalt
  const grid: number[][] = [];
  for (let y = 0; y < tilesCount; y++) {
    const row: number[] = [];
    for (let x = 0; x < tilesCount; x++) {
      // Distance from center for island coastline
      const dx = x - tilesCount / 2;
      const dy = y - tilesCount / 2;
      const distFromCenter = Math.hypot(dx, dy);

      // Water outer border
      if (distFromCenter > 46) {
        row.push(2); // Water
      } else if (distFromCenter > 42) {
        row.push(1); // Sand coast
      } else {
        // Natural landscape noise
        const n = Math.sin(x * 0.12) * Math.cos(y * 0.12) + Math.sin(x * 0.04 + 1.2) * Math.cos(y * 0.05);
        if (n > 0.45) {
          row.push(3); // Dirt path / clearing
        } else {
          row.push(0); // Lush grass
        }
      }
    }
    grid.push(row);
  }

  // Asphalt roads connecting main quadrants
  const mid = Math.floor(tilesCount / 2);
  for (let i = 12; i < tilesCount - 12; i++) {
    for (let w = -1; w <= 1; w++) {
      if (grid[mid + w] && grid[mid + w][i] !== 2) grid[mid + w][i] = 4;
      if (grid[i] && grid[i][mid + w] !== 2) grid[i][mid + w] = 4;
    }
  }

  const walls: { x: number; y: number; w: number; h: number; type: 'building' | 'rock' | 'crate' }[] = [];
  const bushes: { x: number; y: number; radius: number }[] = [];
  const structures: TileMap['structures'] = [];
  const lootItems: LootItem[] = [];

  const namedLocations = [
    { name: 'Peak Compound', x: 1600, y: 1600 },
    { name: 'Clock Tower', x: 800, y: 1000 },
    { name: 'Factory Complex', x: 2400, y: 900 },
    { name: 'Bimasakti Strip', x: 1600, y: 800 },
    { name: 'Hangar District', x: 900, y: 2200 },
    { name: 'Cape Town Ruins', x: 2300, y: 2300 },
    { name: 'Riverside Camp', x: 600, y: 1600 },
    { name: 'Mars Electric', x: 2600, y: 1600 },
  ];

  let lootIdCounter = 0;
  const addLoot = (x: number, y: number, type: LootType, count = 1) => {
    let rarity: LootItem['rarity'] = 'common';
    let name = type.replace('_', ' ').toUpperCase();

    if (type === 'rifle' || type === 'scar' || type === 'groza' || type === 'armor_vest') rarity = 'rare';
    if (type === 'sniper' || type === 'm1887' || type === 'medkit' || type === 'ammo_sniper') rarity = 'epic';
    if (type === 'minigun' || type === 'm82b') rarity = 'legendary';
    if (type === 'smg' || type === 'vector' || type === 'shotgun' || type === 'bandage' || type === 'ammo_heavy') rarity = 'uncommon';
    if (type === 'ammo_light' || type === 'ammo_shotgun') rarity = 'common';

    if (type === 'rifle') name = 'AK-47 Warlord';
    if (type === 'scar') name = 'SCAR-L Assassin';
    if (type === 'groza') name = 'Groza Thunderstorm';
    if (type === 'vector') name = 'Dual Vector Shredder';
    if (type === 'm1887') name = 'M1887 Double-Barrel';
    if (type === 'm82b') name = 'M82B Anti-Material';
    if (type === 'smg') name = 'MP40 Venom';
    if (type === 'shotgun') name = 'SPAS-12';
    if (type === 'sniper') name = 'AWM Sniper';
    if (type === 'pistol') name = 'G18 Pistol';
    if (type === 'katana') name = 'Dragon Katana';
    if (type === 'medkit') name = 'Tactical Medkit';
    if (type === 'bandage') name = 'Sterile Bandages';
    if (type === 'armor_vest') name = 'Level 2 Armor Vest';
    if (type === 'armor_plate') name = 'Ceramic Armor Plate';
    if (type === 'grenade') name = 'Frag Grenade';
    if (type === 'ammo_light') name = 'Light Ammo Box (+45)';
    if (type === 'ammo_heavy') name = 'Heavy Ammo Box (+30)';
    if (type === 'ammo_shotgun') name = 'Shotgun Shells (+12)';
    if (type === 'ammo_sniper') name = 'Sniper Rounds (+10)';

    lootItems.push({
      id: `loot_${lootIdCounter++}`,
      type,
      name,
      x,
      y,
      count,
      rarity,
    });
  };

  // Helper to build hollow house with doors and interior loot
  const buildHouse = (cx: number, cy: number, w: number, h: number, name: string) => {
    const wallThick = 14;
    const doorSize = 42;

    const houseWalls = [
      // Top wall with door opening
      { x: cx, y: cy, w: (w - doorSize) / 2, h: wallThick },
      { x: cx + (w + doorSize) / 2, y: cy, w: (w - doorSize) / 2, h: wallThick },
      // Bottom wall
      { x: cx, y: cy + h - wallThick, w: w, h: wallThick },
      // Left wall
      { x: cx, y: cy + wallThick, w: wallThick, h: h - wallThick * 2 },
      // Right wall
      { x: cx + w - wallThick, y: cy + wallThick, w: wallThick, h: h - wallThick * 2 },
    ];

    houseWalls.forEach((wBox) => {
      walls.push({ ...wBox, type: 'building' });
    });

    structures.push({
      name,
      x: cx,
      y: cy,
      w,
      h,
      walls: houseWalls,
      doors: [{ x: cx + (w - doorSize) / 2, y: cy, w: doorSize, h: wallThick }],
      floorType: 'concrete',
    });

    const roomCenterX = cx + w / 2;
    const roomCenterY = cy + h / 2;
    const lootPool: LootType[] = [
      'rifle', 'scar', 'groza', 'm1887', 'vector', 'smg', 'shotgun', 'sniper', 'm82b', 'pistol',
      'medkit', 'bandage', 'armor_vest', 'armor_plate', 'grenade', 'katana',
      'ammo_light', 'ammo_heavy', 'ammo_shotgun', 'ammo_sniper'
    ];
    
    // 2-3 pieces of loot per house
    const lootCount = 2 + Math.floor(rnd() * 2);
    for (let l = 0; l < lootCount; l++) {
      const lx = roomCenterX + rndRange(-w * 0.28, w * 0.28);
      const ly = roomCenterY + rndRange(-h * 0.28, h * 0.28);
      const chosen = lootPool[Math.floor(rnd() * lootPool.length)];
      addLoot(lx, ly, chosen);
    }
  };

  // Generate buildings at named locations
  namedLocations.forEach((loc) => {
    // 2-4 buildings clustered around each location
    const clusterSize = 3 + Math.floor(rnd() * 2);
    for (let b = 0; b < clusterSize; b++) {
      const bw = 160 + Math.floor(rnd() * 80);
      const bh = 140 + Math.floor(rnd() * 60);
      const angle = (b / clusterSize) * Math.PI * 2 + rndRange(-0.3, 0.3);
      const dist = rndRange(80, 220);
      const bx = Math.max(300, Math.min(worldSize - 500, loc.x + Math.cos(angle) * dist - bw / 2));
      const by = Math.max(300, Math.min(worldSize - 500, loc.y + Math.sin(angle) * dist - bh / 2));

      buildHouse(bx, by, bw, bh, `${loc.name} Room ${b + 1}`);
    }

    // High tier loot in center of named location
    addLoot(loc.x + rndRange(-30, 30), loc.y + rndRange(-30, 30), 'rifle');
    addLoot(loc.x + rndRange(-30, 30), loc.y + rndRange(-30, 30), 'medkit');
    addLoot(loc.x + rndRange(-30, 30), loc.y + rndRange(-30, 30), 'armor_vest');
  });

  // Scatter independent houses across the map
  for (let h = 0; h < 24; h++) {
    const hx = rndRange(450, worldSize - 600);
    const hy = rndRange(450, worldSize - 600);
    const distCenter = Math.hypot(hx - worldSize / 2, hy - worldSize / 2);
    if (distCenter < worldSize * 0.42) {
      buildHouse(hx, hy, 160 + rndRange(0, 40), 140 + rndRange(0, 40), `Outpost ${h + 1}`);
    }
  }

  // Scatter boulders/rocks for tactical cover
  for (let r = 0; r < 70; r++) {
    const rx = rndRange(350, worldSize - 350);
    const ry = rndRange(350, worldSize - 350);
    const size = rndRange(26, 42);
    walls.push({
      x: rx - size / 2,
      y: ry - size / 2,
      w: size,
      h: size,
      type: 'rock',
    });
  }

  // Scatter wooden supply crates
  for (let c = 0; c < 60; c++) {
    const cx = rndRange(300, worldSize - 300);
    const cy = rndRange(300, worldSize - 300);
    walls.push({
      x: cx - 14,
      y: cy - 14,
      w: 28,
      h: 28,
      type: 'crate',
    });

    // 60% chance loot next to crate
    if (rnd() < 0.6) {
      const types: LootType[] = [
        'pistol', 'smg', 'vector', 'rifle', 'scar', 'groza', 'shotgun', 'm1887',
        'bandage', 'armor_plate', 'ammo_light', 'ammo_heavy', 'ammo_shotgun', 'ammo_sniper'
      ];
      addLoot(cx + 25, cy, types[Math.floor(rnd() * types.length)]);
    }
  }

  // Scatter bushes for stealth camouflage
  for (let bu = 0; bu < 120; bu++) {
    const bx = rndRange(300, worldSize - 300);
    const by = rndRange(300, worldSize - 300);
    bushes.push({
      x: bx,
      y: by,
      radius: rndRange(28, 48),
    });
  }

  // Extra loose loot in the wild (randomized weapons across the island)
  const wildLootPool: LootType[] = [
    'pistol', 'smg', 'vector', 'rifle', 'scar', 'groza', 'shotgun', 'm1887', 'sniper', 'm82b',
    'bandage', 'armor_plate', 'armor_vest', 'medkit', 'grenade', 'katana',
    'ammo_light', 'ammo_heavy', 'ammo_shotgun', 'ammo_sniper'
  ];
  for (let w = 0; w < 75; w++) {
    const lx = rndRange(400, worldSize - 400);
    const ly = rndRange(400, worldSize - 400);
    addLoot(lx, ly, wildLootPool[Math.floor(rnd() * wildLootPool.length)]);
  }

  const tileMap: TileMap = {
    width: tilesCount,
    height: tilesCount,
    tileSize,
    grid,
    walls,
    bushes,
    structures,
  };

  return {
    tileMap,
    lootItems,
    worldSize,
    namedLocations,
  };
}
