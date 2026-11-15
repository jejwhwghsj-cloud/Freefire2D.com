import {
  Airdrop,
  Bullet,
  CharacterSkin,
  FighterEntity,
  FloatingText,
  GameState,
  Grenade,
  KillEvent,
  LootItem,
  LootType,
  MatchStats,
  Particle,
  WeaponType,
  ZonePhase,
  ZoneState,
} from '../types/game';
import { BOT_NAMES, CHARACTER_SKINS, WEAPON_DEFS } from './weapons';
import { generateBattleRoyaleMap, MapData } from './mapGenerator';
import { sounds } from '../audio/soundEngine';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public mapData: MapData;
  public state: GameState = 'LOBBY';

  // Entities
  public player!: FighterEntity;
  public fighters: FighterEntity[] = [];
  public bullets: Bullet[] = [];
  public grenades: Grenade[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public airdrops: Airdrop[] = [];
  public killfeed: KillEvent[] = [];

  // Safe Zone
  public zone!: ZoneState;
  private zonePhases: ZonePhase[] = [
    { waitDuration: 25, shrinkDuration: 35, targetRadius: 1100, dps: 1.5 },
    { waitDuration: 20, shrinkDuration: 30, targetRadius: 700, dps: 3.0 },
    { waitDuration: 18, shrinkDuration: 25, targetRadius: 380, dps: 6.0 },
    { waitDuration: 15, shrinkDuration: 20, targetRadius: 180, dps: 10.0 },
    { waitDuration: 10, shrinkDuration: 18, targetRadius: 40, dps: 18.0 },
  ];

  // Camera & Viewport
  public camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
  public screenShake = 0;
  public spectateIndex = 0;

  // Input states
  public keys: Record<string, boolean> = {};
  public mouse = { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false, rightDown: false };
  public touchMove = { x: 0, y: 0, active: false };
  public touchAim = { x: 0, y: 0, active: false, shooting: false };

  // Loop & Timing
  private lastTime = 0;
  public animFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  public matchStartTime = 0;
  public totalMatchPlayers = 51;
  public matchDifficulty: 'recruit' | 'veteran' | 'apex' = 'veteran';
  public lastStarterWeapon: WeaponType | 'random' = 'random';
  public matchStats: MatchStats | null = null;

  // Loot interaction prompt
  public nearbyLoot: LootItem | null = null;

  // Audio cue throttling
  private lastHurtSoundTime = 0;
  private lastFootstepTime = 0;

  // Callbacks for UI updates
  public onUpdateUI?: () => void;
  public onStateChange?: (state: GameState) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.mapData = generateBattleRoyaleMap(Date.now());
    this.initZone();
    this.bindEvents();
    this.handleResize();
  }

  private initZone() {
    const center = this.mapData.worldSize / 2;
    this.zone = {
      currentCenter: { x: center, y: center },
      targetCenter: { x: center, y: center },
      currentRadius: 1600,
      targetRadius: 1600,
      phase: 0,
      phaseState: 'WAITING',
      timer: this.zonePhases[0].waitDuration,
      dps: this.zonePhases[0].dps,
    };
  }

  public startMatch(config: {
    botCount: number;
    playerSkin: CharacterSkin;
    difficulty: 'recruit' | 'veteran' | 'apex';
    starterWeapon?: WeaponType | 'random';
  }) {
    this.totalMatchPlayers = config.botCount + 1;
    this.matchDifficulty = config.difficulty;
    const starterChoice = config.starterWeapon ?? this.lastStarterWeapon ?? 'random';
    this.lastStarterWeapon = starterChoice;

    this.keys = {};
    this.mouse.isDown = false;
    this.mouse.rightDown = false;
    this.touchMove = { x: 0, y: 0, active: false };
    this.touchAim = { x: 0, y: 0, active: false, shooting: false };
    this.nearbyLoot = null;
    this.screenShake = 0;
    this.spectateIndex = 0;
    this.handleResize();

    this.mapData = generateBattleRoyaleMap(Math.floor(Math.random() * 99999));
    this.initZone();
    this.bullets = [];
    this.grenades = [];
    this.particles = [];
    this.floatingTexts = [];
    this.airdrops = [];
    this.killfeed = [];
    this.matchStats = null;
    this.matchStartTime = performance.now();

    // Spawn player in safe ground
    const playerPos = this.getSafeSpawnPosition();
    const allWeaponOptions: WeaponType[] = [
      'scar', 'groza', 'vector', 'm1887', 'm82b', 'rifle', 'smg', 'shotgun', 'sniper', 'minigun', 'pistol', 'katana'
    ];
    let initialWeapon: WeaponType = 'fists';
    if (starterChoice === 'random') {
      initialWeapon = allWeaponOptions[Math.floor(Math.random() * allWeaponOptions.length)];
    } else {
      initialWeapon = starterChoice;
    }

    this.player = this.createFighter({
      id: 'player_user',
      name: 'Player (You)',
      isPlayer: true,
      x: playerPos.x,
      y: playerPos.y,
      skin: config.playerSkin,
      starterWeapon: initialWeapon,
    });

    // ── RANDOMIZED GROUND WEAPONS NEAR PLAYER SPAWN ──
    // Pick 3 unique randomized guns from full arsenal every match
    const shuffledWeapons = [...allWeaponOptions].sort(() => Math.random() - 0.5);
    const drop1 = shuffledWeapons[0];
    const drop2 = shuffledWeapons[1];
    const drop3 = shuffledWeapons[2];

    this.mapData.lootItems.push(
      {
        id: `start_drop1_${Date.now()}`,
        type: drop1,
        name: WEAPON_DEFS[drop1].name,
        x: playerPos.x + 36,
        y: playerPos.y,
        count: 1,
        rarity: WEAPON_DEFS[drop1].category === 'special' ? 'legendary' : 'rare',
      },
      {
        id: `start_drop2_${Date.now()}`,
        type: drop2,
        name: WEAPON_DEFS[drop2].name,
        x: playerPos.x - 36,
        y: playerPos.y,
        count: 1,
        rarity: WEAPON_DEFS[drop2].category === 'special' ? 'legendary' : 'epic',
      },
      {
        id: `start_drop3_${Date.now()}`,
        type: drop3,
        name: WEAPON_DEFS[drop3].name,
        x: playerPos.x,
        y: playerPos.y - 36,
        count: 1,
        rarity: 'rare',
      },
      {
        id: `start_med_${Date.now()}`,
        type: 'medkit',
        name: 'Tactical Medkit',
        x: playerPos.x,
        y: playerPos.y + 36,
        count: 3,
        rarity: 'epic',
      },
      {
        id: `start_armor_${Date.now()}`,
        type: 'armor_vest',
        name: 'Level 2 Armor Vest',
        x: playerPos.x + 24,
        y: playerPos.y + 24,
        count: 1,
        rarity: 'rare',
      },
      {
        id: `start_ammo_h_${Date.now()}`,
        type: 'ammo_heavy',
        name: 'Heavy Ammo Box',
        x: playerPos.x - 24,
        y: playerPos.y - 24,
        count: 1,
        rarity: 'uncommon',
      }
    );

    // ── SPAWN 50 BOTS WITH FULLY RANDOMIZED WEAPONS & PERSONALITIES ──
    this.fighters = [this.player];
    const shuffledNames = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    const botWeaponsList: WeaponType[] = [
      'vector', 'groza', 'scar', 'm1887', 'rifle', 'smg', 'shotgun', 'sniper', 'm82b', 'pistol', 'katana'
    ];

    for (let i = 0; i < config.botCount; i++) {
      const pos = this.getSafeSpawnPosition();
      const botSkin = CHARACTER_SKINS[i % CHARACTER_SKINS.length];
      const botName = shuffledNames[i % shuffledNames.length] || `Soldier_${i + 1}`;
      const personalities: ('rusher' | 'sniper' | 'tactical' | 'camper' | 'looter')[] = [
        'rusher', 'sniper', 'tactical', 'camper', 'looter'
      ];
      const botPersonality = personalities[i % personalities.length];

      // Fully randomized bot weapons across all gun types
      const botStarter = botWeaponsList[Math.floor(Math.random() * botWeaponsList.length)];

      const bot = this.createFighter({
        id: `bot_${i}`,
        name: botName,
        isPlayer: false,
        x: pos.x,
        y: pos.y,
        skin: botSkin,
        starterWeapon: botStarter,
        botPersonality,
      });

      this.fighters.push(bot);
    }

    this.state = 'PLAYING';
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    sounds.startMusic('combat');
    this.onStateChange?.(this.state);

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  private createFighter(params: {
    id: string;
    name: string;
    isPlayer: boolean;
    x: number;
    y: number;
    skin: CharacterSkin;
    starterWeapon?: WeaponType;
    botPersonality?: 'rusher' | 'sniper' | 'tactical' | 'camper' | 'looter';
  }): FighterEntity {
    const starterType = params.starterWeapon || 'fists';
    const starterDef = WEAPON_DEFS[starterType];

    const weapons: FighterEntity['weapons'] = {
      melee: { type: 'fists', ammoInMag: 999 },
    };

    let activeSlot: 'primary' | 'secondary' | 'melee' = 'melee';

    if (starterDef.category === 'primary') {
      weapons.primary = { type: starterType, ammoInMag: starterDef.magSize };
      activeSlot = 'primary';
    } else if (starterDef.category === 'secondary') {
      weapons.secondary = { type: starterType, ammoInMag: starterDef.magSize };
      activeSlot = 'secondary';
    } else if (starterType === 'katana') {
      weapons.melee = { type: 'katana', ammoInMag: 999 };
      activeSlot = 'melee';
    }

    return {
      id: params.id,
      name: params.name,
      isPlayer: params.isPlayer,
      x: params.x,
      y: params.y,
      angle: 0,
      targetAngle: 0,
      radius: 14,
      speed: 160,
      maxSpeed: 160,
      hp: 100,
      maxHp: 100,
      armor: 0,
      maxArmor: 100,
      alive: true,
      weapons,
      activeSlot,
      ammoPool: params.isPlayer
        ? {
            pistol: 9999,
            smg: 9999,
            vector: 9999,
            rifle: 9999,
            scar: 9999,
            groza: 9999,
            shotgun: 9999,
            m1887: 9999,
            sniper: 9999,
            m82b: 9999,
            minigun: 9999,
          }
        : {
            pistol: 45,
            smg: 90,
            vector: 120,
            rifle: 90,
            scar: 90,
            groza: 90,
            shotgun: 24,
            m1887: 20,
            sniper: 15,
            m82b: 15,
            minigun: 120,
          },
      medkits: 1,
      bandages: 3,
      armorPlates: 1,
      grenades: 1,
      lastShotTime: 0,
      isReloading: false,
      reloadProgress: 0,
      reloadEndTime: 0,
      isHealing: false,
      healProgress: 0,
      healEndTime: 0,
      healType: null,
      kills: 0,
      damageDealt: 0,
      shotsFired: 0,
      shotsHit: 0,
      hitFlash: 0,
      skin: params.skin,
      inBush: false,
      isMoving: false,
      botPersonality: params.botPersonality || 'tactical',
      botState: 'roam',
      botTargetId: null,
      botTargetPos: null,
      botRetargetTimer: 0,
      botRoamTimer: 0,
      botStuckTimer: 0,
    };
  }

  private getSafeSpawnPosition(): { x: number; y: number } {
    const worldSize = this.mapData.worldSize;
    for (let attempts = 0; attempts < 300; attempts++) {
      const rx = 400 + Math.random() * (worldSize - 800);
      const ry = 400 + Math.random() * (worldSize - 800);
      if (!this.isPositionSolid(rx, ry, 18)) {
        return { x: rx, y: ry };
      }
    }
    return { x: 1600, y: 1600 };
  }

  public isPositionSolid(x: number, y: number, radius = 12): boolean {
    // World boundary check
    if (x - radius < 100 || x + radius > this.mapData.worldSize - 100 ||
        y - radius < 100 || y + radius > this.mapData.worldSize - 100) {
      return true;
    }

    // Water tile check
    const tx = Math.floor(x / this.mapData.tileMap.tileSize);
    const ty = Math.floor(y / this.mapData.tileMap.tileSize);
    if (this.mapData.tileMap.grid[ty] && this.mapData.tileMap.grid[ty][tx] === 2) {
      return true;
    }

    // Walls / Structures / Rocks check
    for (const w of this.mapData.tileMap.walls) {
      if (
        x + radius > w.x &&
        x - radius < w.x + w.w &&
        y + radius > w.y &&
        y - radius < w.y + w.h
      ) {
        return true;
      }
    }
    return false;
  }

  private onWindowKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (
      this.state === 'PLAYING' &&
      (key === ' ' || key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright')
    ) {
      e.preventDefault();
    }
    this.keys[key] = true;
    this.handleKeyDown(key);
  };

  private onWindowKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  private onWindowMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.mouse.isDown = false;
    if (e.button === 2) this.mouse.rightDown = false;
  };

  // --- Input Handlers ---
  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.canvas.parentElement);
    }
    window.addEventListener('keydown', this.onWindowKeyDown);
    window.addEventListener('keyup', this.onWindowKeyUp);
    window.addEventListener('mouseup', this.onWindowMouseUp);

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.updateMouseWorld();
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state !== 'PLAYING' || !this.player) return;
      if (e.button === 0) {
        this.mouse.isDown = true;
        this.tryFireActiveWeapon(this.player);
      } else if (e.button === 2) {
        e.preventDefault();
        this.mouse.rightDown = true;
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('wheel', (e) => {
      if (this.state !== 'PLAYING' || !this.player) return;
      if (e.deltaY > 0) this.cycleWeapon(1);
      else if (e.deltaY < 0) this.cycleWeapon(-1);
    });
  }

  public handleResize = () => {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const width = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
    const height = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight;
    this.canvas.width = width;
    this.canvas.height = height;
  };

  private updateMouseWorld() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    this.mouse.worldX = (this.mouse.x - cx) / this.camera.zoom + this.camera.x;
    this.mouse.worldY = (this.mouse.y - cy) / this.camera.zoom + this.camera.y;
  }

  private handleKeyDown(key: string) {
    if (this.state !== 'PLAYING') return;

    if (key === '1') this.switchSlot('primary');
    if (key === '2') this.switchSlot('secondary');
    if (key === '3') this.switchSlot('melee');
    if (key === 'r') this.startReload(this.player);
    if (key === 'e' || key === 'f') this.pickupNearestLoot(this.player);
    if (key === 'g' || key === '4') this.throwGrenade(this.player);
    if (key === '7') this.startHealing(this.player, 'medkit');
    if (key === '8') this.startHealing(this.player, 'bandage');
    if (key === '9') this.startHealing(this.player, 'armor_plate');
  }

  public switchSlot(slot: 'primary' | 'secondary' | 'melee') {
    if (this.player.weapons[slot]) {
      this.player.activeSlot = slot;
      this.player.isReloading = false;
      sounds.playPickup();
    }
  }

  public cycleWeapon(dir: number) {
    const slots: ('primary' | 'secondary' | 'melee')[] = ['primary', 'secondary', 'melee'];
    const currentIdx = slots.indexOf(this.player.activeSlot);
    for (let i = 1; i <= 3; i++) {
      const nextIdx = (currentIdx + dir * i + 3) % 3;
      const targetSlot = slots[nextIdx];
      if (this.player.weapons[targetSlot]) {
        this.switchSlot(targetSlot);
        break;
      }
    }
  }

  // --- Combat & Actions ---
  public getEquippedWeapon(fighter: FighterEntity) {
    const slot = fighter.weapons[fighter.activeSlot];
    if (!slot) return WEAPON_DEFS['fists'];
    return WEAPON_DEFS[slot.type] || WEAPON_DEFS['fists'];
  }

  private getSpatialAudio(x: number, y: number, maxDist = 1000): { volume: number; pan: number } | null {
    const refX = this.player?.alive ? this.player.x : this.camera.x;
    const refY = this.player?.alive ? this.player.y : this.camera.y;
    const dx = x - refX;
    const dy = y - refY;
    const dist = Math.hypot(dx, dy);
    if (dist > maxDist) return null;
    const falloff = Math.pow(Math.max(0, 1 - dist / maxDist), 1.3);
    return {
      volume: dist < 120 ? 1.0 : Math.max(0.06, Math.min(0.88, falloff)),
      pan: Math.max(-0.9, Math.min(0.9, dx / 650)),
    };
  }

  public tryFireActiveWeapon(fighter: FighterEntity) {
    if (!fighter.alive || fighter.isReloading || fighter.isHealing) return;

    const slot = fighter.weapons[fighter.activeSlot];
    const weaponDef = this.getEquippedWeapon(fighter);
    const now = performance.now() / 1000;

    if (now - fighter.lastShotTime < weaponDef.fireRate) return;

    // Melee attack logic
    if (weaponDef.category === 'melee') {
      fighter.lastShotTime = now;
      if (fighter.isPlayer) {
        sounds.playGunshot('melee');
      } else {
        const spatial = this.getSpatialAudio(fighter.x, fighter.y, 700);
        if (spatial) sounds.playGunshot('melee', spatial);
      }
      this.executeMeleeSwing(fighter, weaponDef);
      return;
    }

    // Ammo check & Unlimited Ammo
    if (fighter.isPlayer) {
      // Unlimited ammo for player: mag stays replenished and ammo pool remains infinite
      if (slot) {
        slot.ammoInMag = weaponDef.magSize;
      }
    } else {
      // Bot ammo check
      if (!slot || slot.ammoInMag <= 0) {
        this.startReload(fighter);
        return;
      }
      slot.ammoInMag--;
    }

    fighter.lastShotTime = now;
    fighter.shotsFired++;

    if (fighter.isPlayer) {
      sounds.playGunshot(weaponDef.soundType);
      this.screenShake = Math.max(this.screenShake, weaponDef.recoil * 1.5);
    } else {
      // Spatialize and attenuate distant bot gunfire relative to listener
      const spatial = this.getSpatialAudio(fighter.x, fighter.y, 1050);
      if (spatial) {
        sounds.playGunshot(weaponDef.soundType, spatial);
      }
    }

    // Muzzle flash particle
    const muzzleDist = fighter.radius + 14;
    const mx = fighter.x + Math.cos(fighter.angle) * muzzleDist;
    const my = fighter.y + Math.sin(fighter.angle) * muzzleDist;
    this.createMuzzleParticles(mx, my, fighter.angle, weaponDef.bulletColor);

    // Fire bullets
    for (let p = 0; p < weaponDef.pellets; p++) {
      const spreadAngle = (Math.random() - 0.5) * weaponDef.spread * 2;
      const finalAngle = fighter.angle + spreadAngle;
      const vx = Math.cos(finalAngle) * weaponDef.bulletSpeed;
      const vy = Math.sin(finalAngle) * weaponDef.bulletSpeed;

      this.bullets.push({
        id: `bullet_${Math.random()}`,
        x: mx,
        y: my,
        vx,
        vy,
        damage: weaponDef.damage,
        rangeLeft: weaponDef.range,
        maxRange: weaponDef.range,
        radius: weaponDef.bulletRadius,
        color: weaponDef.bulletColor,
        ownerId: fighter.id,
        isPlayer: fighter.isPlayer,
        weaponType: weaponDef.id,
      });
    }

    // If out of ammo in mag, auto reload for bots (player has unlimited ammo)
    if (!fighter.isPlayer && slot && slot.ammoInMag === 0) {
      this.startReload(fighter);
    }
  }

  private executeMeleeSwing(fighter: FighterEntity, def: typeof WEAPON_DEFS['fists']) {
    // Arc in front of attacker
    const range = def.range;
    for (const target of this.fighters) {
      if (target.id === fighter.id || !target.alive) continue;
      const dx = target.x - fighter.x;
      const dy = target.y - fighter.y;
      const dist = Math.hypot(dx, dy);

      if (dist < range + target.radius) {
        const angleToTarget = Math.atan2(dy, dx);
        let diff = angleToTarget - fighter.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        if (Math.abs(diff) < Math.PI * 0.4) {
          this.applyDamage(target, def.damage, fighter, def.name);
          this.createHitSparks(target.x, target.y, '#ef4444');
        }
      }
    }
  }

  public startReload(fighter: FighterEntity) {
    if (!fighter.alive || fighter.isReloading || fighter.isHealing) return;
    const slot = fighter.weapons[fighter.activeSlot];
    if (!slot) return;
    const weaponDef = WEAPON_DEFS[slot.type];
    if (weaponDef.category === 'melee') return;

    if (slot.ammoInMag >= weaponDef.magSize) return;

    // Check ammo pool
    const pool = fighter.ammoPool[weaponDef.id] || 0;
    if (pool <= 0) return;

    fighter.isReloading = true;
    fighter.reloadProgress = 0;
    const now = performance.now() / 1000;
    fighter.reloadEndTime = now + weaponDef.reloadTime;

    if (fighter.isPlayer) {
      sounds.playReload();
    }
  }

  public startHealing(fighter: FighterEntity, type: 'medkit' | 'bandage' | 'armor_plate') {
    if (!fighter.alive || fighter.isHealing || fighter.isReloading) return;

    if (type === 'medkit') {
      if (fighter.medkits <= 0 || fighter.hp >= fighter.maxHp) return;
      fighter.isHealing = true;
      fighter.healType = 'medkit';
      fighter.healEndTime = performance.now() / 1000 + 3.0; // 3 seconds
    } else if (type === 'bandage') {
      if (fighter.bandages <= 0 || fighter.hp >= 75) return;
      fighter.isHealing = true;
      fighter.healType = 'bandage';
      fighter.healEndTime = performance.now() / 1000 + 1.8;
    } else if (type === 'armor_plate') {
      if (fighter.armorPlates <= 0 || fighter.armor >= fighter.maxArmor) return;
      fighter.isHealing = true;
      fighter.healType = 'armor_plate';
      fighter.healEndTime = performance.now() / 1000 + 2.0;
    }
  }

  public throwGrenade(fighter: FighterEntity) {
    if (!fighter.alive || fighter.grenades <= 0) return;
    fighter.grenades--;
    const throwSpeed = 460;
    const vx = Math.cos(fighter.angle) * throwSpeed;
    const vy = Math.sin(fighter.angle) * throwSpeed;

    this.grenades.push({
      id: `grenade_${Math.random()}`,
      x: fighter.x,
      y: fighter.y,
      vx,
      vy,
      timer: 2.2, // 2.2 seconds fuse
      radius: 6,
      ownerId: fighter.id,
    });
    if (fighter.isPlayer) {
      sounds.playGunshot('melee');
    } else {
      const spatial = this.getSpatialAudio(fighter.x, fighter.y, 750);
      if (spatial) sounds.playGunshot('melee', spatial);
    }
  }

  public pickupNearestLoot(fighter: FighterEntity) {
    if (!fighter.alive) return;
    const pickupDist = 48;
    let nearestIndex = -1;
    let minDist = pickupDist;

    for (let i = 0; i < this.mapData.lootItems.length; i++) {
      const item = this.mapData.lootItems[i];
      const dist = Math.hypot(item.x - fighter.x, item.y - fighter.y);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }

    if (nearestIndex === -1) return;

    const item = this.mapData.lootItems[nearestIndex];
    let collected = false;

    // Loot equip / add to pool
    if (item.type === 'medkit') {
      fighter.medkits += item.count;
      collected = true;
    } else if (item.type === 'bandage') {
      fighter.bandages += item.count * 3;
      collected = true;
    } else if (item.type === 'armor_plate') {
      fighter.armorPlates += item.count * 2;
      collected = true;
    } else if (item.type === 'armor_vest') {
      fighter.armor = Math.min(fighter.maxArmor, fighter.armor + 75);
      collected = true;
    } else if (item.type === 'grenade') {
      fighter.grenades += item.count;
      collected = true;
    } else if (item.type.startsWith('ammo_')) {
      // Specific ammo type added to weapons
      let ammoAmount = 30;
      if (item.type === 'ammo_light') {
        ammoAmount = 45;
        fighter.ammoPool['pistol'] = (fighter.ammoPool['pistol'] || 0) + 45;
        fighter.ammoPool['smg'] = (fighter.ammoPool['smg'] || 0) + 45;
        fighter.ammoPool['vector'] = (fighter.ammoPool['vector'] || 0) + 60;
      } else if (item.type === 'ammo_heavy') {
        ammoAmount = 30;
        fighter.ammoPool['rifle'] = (fighter.ammoPool['rifle'] || 0) + 30;
        fighter.ammoPool['scar'] = (fighter.ammoPool['scar'] || 0) + 30;
        fighter.ammoPool['groza'] = (fighter.ammoPool['groza'] || 0) + 35;
        fighter.ammoPool['minigun'] = (fighter.ammoPool['minigun'] || 0) + 40;
      } else if (item.type === 'ammo_shotgun') {
        ammoAmount = 12;
        fighter.ammoPool['shotgun'] = (fighter.ammoPool['shotgun'] || 0) + 12;
        fighter.ammoPool['m1887'] = (fighter.ammoPool['m1887'] || 0) + 12;
      } else if (item.type === 'ammo_sniper') {
        ammoAmount = 10;
        fighter.ammoPool['sniper'] = (fighter.ammoPool['sniper'] || 0) + 10;
        fighter.ammoPool['m82b'] = (fighter.ammoPool['m82b'] || 0) + 10;
      } else {
        Object.keys(fighter.ammoPool).forEach((w) => {
          fighter.ammoPool[w] += 25;
        });
      }

      this.floatingTexts.push({
        id: `float_ammo_${Math.random()}`,
        x: fighter.x,
        y: fighter.y - 18,
        text: `+${ammoAmount} AMMO`,
        color: '#facc15',
        life: 0.9,
        maxLife: 0.9,
        isCrit: false,
      });
      collected = true;
    } else {
      // It's a weapon!
      const weaponDef = WEAPON_DEFS[item.type as WeaponType];
      if (weaponDef) {
        if (weaponDef.category === 'melee') {
          fighter.weapons.melee = { type: item.type as WeaponType, ammoInMag: 999 };
          fighter.activeSlot = 'melee';
        } else if (weaponDef.category === 'secondary') {
          fighter.weapons.secondary = { type: item.type as WeaponType, ammoInMag: weaponDef.magSize };
          fighter.activeSlot = 'secondary';
        } else {
          // Primary or special weapon
          // If already has primary, replace it and drop old one
          if (fighter.weapons.primary) {
            const oldType = fighter.weapons.primary.type;
            this.mapData.lootItems.push({
              id: `dropped_${Math.random()}`,
              type: oldType,
              name: WEAPON_DEFS[oldType].name,
              x: fighter.x + (Math.random() - 0.5) * 30,
              y: fighter.y + (Math.random() - 0.5) * 30,
              count: 1,
              rarity: 'rare',
            });
          }
          fighter.weapons.primary = { type: item.type as WeaponType, ammoInMag: weaponDef.magSize };
          fighter.activeSlot = 'primary';
        }
        collected = true;
      }
    }

    if (collected) {
      if (fighter.isPlayer) sounds.playPickup();
      this.mapData.lootItems.splice(nearestIndex, 1);
    }
  }

  public applyDamage(target: FighterEntity, amount: number, attacker?: FighterEntity, weaponName = 'Gunfire') {
    if (!target.alive) return;

    // Check headshot / crit chance
    const isCrit = Math.random() < 0.2;
    const rawDamage = isCrit ? amount * 1.3 : amount;

    // Armor absorbs 50% damage
    let absorbed = 0;
    if (target.armor > 0) {
      absorbed = Math.min(target.armor, rawDamage * 0.5);
      target.armor -= absorbed;
    }
    const finalHpDmg = rawDamage - absorbed;
    target.hp -= finalHpDmg;
    target.hitFlash = 0.15;

    const displayedDmg = Math.round(rawDamage);

    if (attacker) {
      attacker.damageDealt += displayedDmg;
      if (attacker.isPlayer) {
        sounds.playHit(isCrit ? 'headshot' : target.armor > 0 ? 'armor' : 'body');
      }
    }

    if (target.isPlayer) {
      const nowMs = performance.now();
      if (nowMs - this.lastHurtSoundTime > 140) {
        this.lastHurtSoundTime = nowMs;
        sounds.playPlayerHurt();
      }
    }

    // Floating damage numbers
    this.floatingTexts.push({
      id: `float_${Math.random()}`,
      x: target.x + (Math.random() - 0.5) * 16,
      y: target.y - 12,
      text: `${displayedDmg}${isCrit ? ' CRIT!' : ''}`,
      color: isCrit ? '#f43f5e' : target.armor > 0 ? '#38bdf8' : '#f8fafc',
      life: 0.8,
      maxLife: 0.8,
      isCrit,
    });

    // Check if target eliminated
    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
      this.onEntityKilled(target, attacker, weaponName);
    }
  }

  private onEntityKilled(victim: FighterEntity, killer?: FighterEntity, weaponName = 'Storm') {
    if (killer) {
      killer.kills++;
    }

    // Killfeed event
    const killEvt: KillEvent = {
      id: `kill_${Math.random()}`,
      killerName: killer ? killer.name : 'The Storm',
      victimName: victim.name,
      weapon: weaponName,
      isKillerPlayer: killer ? killer.isPlayer : false,
      isVictimPlayer: victim.isPlayer,
      timestamp: performance.now(),
    };
    this.killfeed.unshift(killEvt);
    if (this.killfeed.length > 5) this.killfeed.pop();

    // Elimination confirmation sound for player kills
    if (killer?.isPlayer && !victim.isPlayer) {
      sounds.playKill();
    }

    // Drop victim's loot crate with their items
    this.spawnDeathLootCrate(victim);

    // If player died -> game over or spectator
    if (victim.isPlayer) {
      sounds.stopMusic();
      sounds.playDefeat();
      this.calculateMatchStats(false);
      this.state = 'GAMEOVER';
      this.onStateChange?.(this.state);
    } else {
      // Check if player is the only survivor!
      const aliveFighters = this.fighters.filter((f) => f.alive);
      if (aliveFighters.length === 1 && aliveFighters[0].isPlayer) {
        sounds.stopMusic();
        sounds.playVictory();
        this.calculateMatchStats(true);
        this.state = 'VICTORY';
        this.onStateChange?.(this.state);
      }
    }
  }

  private spawnDeathLootCrate(victim: FighterEntity) {
    const lootList: LootType[] = ['medkit', 'armor_plate', 'ammo_heavy', 'bandage'];
    if (victim.weapons.primary) lootList.push(victim.weapons.primary.type);
    if (victim.weapons.secondary) lootList.push(victim.weapons.secondary.type);

    lootList.forEach((type) => {
      this.mapData.lootItems.push({
        id: `loot_death_${Math.random()}`,
        type,
        name: WEAPON_DEFS[type as WeaponType]?.name || type.toUpperCase(),
        x: victim.x + (Math.random() - 0.5) * 36,
        y: victim.y + (Math.random() - 0.5) * 36,
        count: 1,
        rarity: 'rare',
      });
    });
  }

  private calculateMatchStats(isWinner: boolean) {
    const elapsedSecs = Math.floor((performance.now() - this.matchStartTime) / 1000);
    const aliveCount = this.fighters.filter((f) => f.alive).length;
    const rank = isWinner ? 1 : aliveCount + 1;
    const accuracy = this.player.shotsFired > 0
      ? Math.round((this.player.shotsHit / this.player.shotsFired) * 100)
      : 0;

    this.matchStats = {
      rank,
      totalPlayers: this.totalMatchPlayers,
      kills: this.player.kills,
      damageDealt: this.player.damageDealt,
      timeSurvivedSeconds: elapsedSecs,
      accuracy,
      isWinner,
    };
  }

  // --- Main Game Loop ---
  private loop = (currentTime: number) => {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING' || this.state === 'SPECTATING') {
      this.update(dt);
      this.onUpdateUI?.();
    }
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    // 1. Zone Update
    this.updateZone(dt);

    // 2. Player Input Update
    if (this.player.alive) {
      this.updatePlayerMovement(dt);
      this.updatePlayerAim();
      this.checkPlayerAutoFire();
      this.updateNearbyLoot();
    }

    // 3. Bot AI Updates
    this.updateBots(dt);

    // 4. Update Entities (Reloads, Heals, Bush status)
    this.fighters.forEach((f) => {
      if (!f.alive) return;
      this.updateFighterTimers(f, dt);
      this.checkBushStealth(f);
    });

    // 5. Update Projectiles
    this.updateBullets(dt);
    this.updateGrenades(dt);
    this.updateAirdrops(dt);

    // 6. Update Particles & Floats
    this.updateParticles(dt);

    // 7. Camera lerp
    this.updateCamera(dt);
  }

  private updateZone(dt: number) {
    const z = this.zone;
    z.timer -= dt;

    if (z.phaseState === 'WAITING') {
      if (z.timer <= 0) {
        // Start shrinking!
        z.phaseState = 'SHRINKING';
        const phaseConfig = this.zonePhases[Math.min(z.phase, this.zonePhases.length - 1)];
        z.timer = phaseConfig.shrinkDuration;
        sounds.playStormAlarm();

        // Calculate next random center inside current safe zone
        const maxShift = (z.currentRadius - phaseConfig.targetRadius) * 0.7;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * maxShift;
        z.targetCenter = {
          x: Math.max(phaseConfig.targetRadius + 100, Math.min(this.mapData.worldSize - phaseConfig.targetRadius - 100, z.currentCenter.x + Math.cos(angle) * dist)),
          y: Math.max(phaseConfig.targetRadius + 100, Math.min(this.mapData.worldSize - phaseConfig.targetRadius - 100, z.currentCenter.y + Math.sin(angle) * dist)),
        };
        z.targetRadius = phaseConfig.targetRadius;
        z.dps = phaseConfig.dps;
      }
    } else if (z.phaseState === 'SHRINKING') {
      const phaseConfig = this.zonePhases[Math.min(z.phase, this.zonePhases.length - 1)];
      const shrinkSpeed = (z.currentRadius - z.targetRadius) / Math.max(0.1, z.timer);
      z.currentRadius = Math.max(z.targetRadius, z.currentRadius - shrinkSpeed * dt);

      // Lerp center towards target center
      z.currentCenter.x += (z.targetCenter.x - z.currentCenter.x) * (dt / Math.max(0.1, z.timer));
      z.currentCenter.y += (z.targetCenter.y - z.currentCenter.y) * (dt / Math.max(0.1, z.timer));

      if (z.timer <= 0 || z.currentRadius <= z.targetRadius) {
        z.phase++;
        if (z.phase < this.zonePhases.length) {
          z.phaseState = 'WAITING';
          z.timer = this.zonePhases[z.phase].waitDuration;
          z.currentRadius = z.targetRadius;
          // Spawn Airdrop at start of new phase!
          this.spawnAirdrop();
        } else {
          z.phaseState = 'FINAL';
          z.timer = 999;
        }
      }
    }

    // Apply Zone Storm Damage to entities outside currentRadius
    for (const f of this.fighters) {
      if (!f.alive) continue;
      const distFromCenter = Math.hypot(f.x - z.currentCenter.x, f.y - z.currentCenter.y);
      if (distFromCenter > z.currentRadius) {
        f.hp -= z.dps * dt;
        f.hitFlash = 0.08;
        if (f.hp <= 0) {
          f.hp = 0;
          f.alive = false;
          this.onEntityKilled(f, undefined, 'The Storm');
        }
      }
    }
  }

  private spawnAirdrop() {
    const z = this.zone;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (z.currentRadius * 0.6);
    const dropX = z.currentCenter.x + Math.cos(angle) * dist;
    const dropY = z.currentCenter.y + Math.sin(angle) * dist;
    sounds.playAirdrop();

    this.airdrops.push({
      id: `airdrop_${Math.random()}`,
      x: dropX,
      y: dropY,
      landed: false,
      fallProgress: 0,
      smokeTimer: 30, // 30s of red smoke flare
      items: [
        {
          id: `drop_wep_${Math.random()}`,
          type: Math.random() > 0.5 ? 'minigun' : 'sniper',
          name: 'Legendary Crate Weapon',
          x: dropX,
          y: dropY,
          count: 1,
          rarity: 'legendary',
        },
        {
          id: `drop_armor_${Math.random()}`,
          type: 'armor_vest',
          name: 'Level 3 Heavy Armor',
          x: dropX + 20,
          y: dropY,
          count: 1,
          rarity: 'legendary',
        },
        {
          id: `drop_med_${Math.random()}`,
          type: 'medkit',
          name: 'Full Restore Medkit',
          x: dropX - 20,
          y: dropY,
          count: 2,
          rarity: 'epic',
        },
      ],
    });
  }

  private updatePlayerMovement(dt: number) {
    let mx = 0;
    let my = 0;

    // Keyboard (WASD / Arrows)
    if (this.keys['w'] || this.keys['arrowup']) my -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) my += 1;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;

    // Mobile touch joystick
    if (this.touchMove.active) {
      mx = this.touchMove.x;
      my = this.touchMove.y;
    }

    const len = Math.hypot(mx, my);
    if (len > 0.05) {
      const normX = (mx / len) * (this.touchMove.active ? Math.min(1, len) : 1);
      const normY = (my / len) * (this.touchMove.active ? Math.min(1, len) : 1);
      const speed = this.player.speed;

      this.moveEntityWithSlide(this.player, normX * speed * dt, normY * speed * dt);
      this.player.isMoving = true;

      const nowMs = performance.now();
      if (nowMs - this.lastFootstepTime > 285) {
        this.lastFootstepTime = nowMs;
        sounds.playFootstep();
      }
    } else {
      this.player.isMoving = false;
    }
  }

  private updatePlayerAim() {
    if (this.touchAim.active) {
      this.player.angle = Math.atan2(this.touchAim.y, this.touchAim.x);
    } else {
      this.updateMouseWorld();
      this.player.angle = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);
    }
  }

  private checkPlayerAutoFire() {
    const wantsToShoot = this.mouse.isDown || this.touchAim.shooting;
    if (wantsToShoot) {
      this.tryFireActiveWeapon(this.player);
    }
  }

  private moveEntityWithSlide(entity: FighterEntity, dx: number, dy: number) {
    const nextX = entity.x + dx;
    const nextY = entity.y + dy;

    // Try full move
    if (!this.isPositionSolid(nextX, nextY, entity.radius)) {
      entity.x = nextX;
      entity.y = nextY;
      return;
    }

    // Try horizontal slide
    if (!this.isPositionSolid(nextX, entity.y, entity.radius)) {
      entity.x = nextX;
      return;
    }

    // Try vertical slide
    if (!this.isPositionSolid(entity.x, nextY, entity.radius)) {
      entity.y = nextY;
    }
  }

  private updateBots(dt: number) {
    const now = performance.now() / 1000;
    const z = this.zone;

    for (const bot of this.fighters) {
      if (bot.isPlayer || !bot.alive) continue;

      bot.botRetargetTimer = (bot.botRetargetTimer || 0) - dt;
      bot.botRoamTimer = (bot.botRoamTimer || 0) - dt;

      // Distance to storm center & storm check
      const distFromZone = Math.hypot(bot.x - z.currentCenter.x, bot.y - z.currentCenter.y);
      const outsideStorm = distFromZone > z.currentRadius - 50;

      // 1. Retarget / AI State evaluation
      if (bot.botRetargetTimer <= 0) {
        bot.botRetargetTimer = 0.5 + Math.random() * 0.8;

        // Outside storm? Urgent flee to zone center
        if (outsideStorm) {
          bot.botState = 'flee';
          bot.botTargetPos = {
            x: z.currentCenter.x + (Math.random() - 0.5) * 100,
            y: z.currentCenter.y + (Math.random() - 0.5) * 100,
          };
        } else if (bot.hp < 40 && (bot.medkits > 0 || bot.bandages > 0)) {
          // Low HP, prioritize heal
          bot.botState = 'heal';
        } else {
          // Scan for nearby visible enemy
          let nearestEnemy: FighterEntity | null = null;
          let nearestDist = 550; // Sight range

          for (const other of this.fighters) {
            if (other.id === bot.id || !other.alive) continue;
            // Bush stealth check
            if (other.inBush) continue;

            const d = Math.hypot(other.x - bot.x, other.y - bot.y);
            if (d < nearestDist) {
              nearestDist = d;
              nearestEnemy = other;
            }
          }

          if (nearestEnemy) {
            bot.botState = 'engage';
            bot.botTargetId = nearestEnemy.id;
          } else {
            // Check for nearby loot if weapon is bare fists or wants better gear
            if (bot.activeSlot === 'melee' && this.mapData.lootItems.length > 0) {
              let nearestLoot: LootItem | null = null;
              let lootDist = 400;
              for (const l of this.mapData.lootItems) {
                const ld = Math.hypot(l.x - bot.x, l.y - bot.y);
                if (ld < lootDist) {
                  lootDist = ld;
                  nearestLoot = l;
                }
              }
              if (nearestLoot) {
                bot.botState = 'loot';
                bot.botTargetPos = { x: nearestLoot.x, y: nearestLoot.y };
              } else {
                bot.botState = 'roam';
              }
            } else {
              bot.botState = 'roam';
            }
          }
        }
      }

      // 2. Execute Bot Behavior according to state
      if (bot.botState === 'engage') {
        const target = this.fighters.find((f) => f.id === bot.botTargetId && f.alive);
        if (target) {
          const dx = target.x - bot.x;
          const dy = target.y - bot.y;
          const dist = Math.hypot(dx, dy);

          // Aim at enemy with slight difficulty-based jitter
          const baseAngle = Math.atan2(dy, dx);
          const jitter = this.matchDifficulty === 'apex' ? 0.04 : this.matchDifficulty === 'veteran' ? 0.08 : 0.16;
          bot.angle = baseAngle + (Math.random() - 0.5) * jitter;

          // Strafe & distance maintenance
          let moveDx = 0;
          let moveDy = 0;
          if (dist > 300) {
            moveDx = Math.cos(baseAngle);
            moveDy = Math.sin(baseAngle);
          } else if (dist < 140) {
            moveDx = -Math.cos(baseAngle);
            moveDy = -Math.sin(baseAngle);
          } else {
            // Circle strafe
            const strafeAngle = baseAngle + Math.PI / 2;
            moveDx = Math.cos(strafeAngle);
            moveDy = Math.sin(strafeAngle);
          }

          this.moveEntityWithSlide(bot, moveDx * bot.speed * dt * 0.8, moveDy * bot.speed * dt * 0.8);
          this.tryFireActiveWeapon(bot);
        } else {
          bot.botState = 'roam';
        }
      } else if (bot.botState === 'flee' && bot.botTargetPos) {
        const dx = bot.botTargetPos.x - bot.x;
        const dy = bot.botTargetPos.y - bot.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 20) {
          const angle = Math.atan2(dy, dx);
          bot.angle = angle;
          this.moveEntityWithSlide(bot, Math.cos(angle) * bot.speed * dt * 1.1, Math.sin(angle) * bot.speed * dt * 1.1);
        }
      } else if (bot.botState === 'loot' && bot.botTargetPos) {
        const dx = bot.botTargetPos.x - bot.x;
        const dy = bot.botTargetPos.y - bot.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 25) {
          const angle = Math.atan2(dy, dx);
          bot.angle = angle;
          this.moveEntityWithSlide(bot, Math.cos(angle) * bot.speed * dt, Math.sin(angle) * bot.speed * dt);
        } else {
          this.pickupNearestLoot(bot);
          bot.botState = 'roam';
        }
      } else if (bot.botState === 'heal') {
        if (!bot.isHealing) {
          if (bot.medkits > 0 && bot.hp < bot.maxHp) {
            this.startHealing(bot, 'medkit');
          } else if (bot.bandages > 0 && bot.hp < 75) {
            this.startHealing(bot, 'bandage');
          } else {
            bot.botState = 'roam';
          }
        }
      } else {
        // Roam
        if (bot.botRoamTimer <= 0 || !bot.botTargetPos) {
          bot.botRoamTimer = 3.0 + Math.random() * 4.0;
          const roamAngle = Math.random() * Math.PI * 2;
          const roamDist = 150 + Math.random() * 250;
          bot.botTargetPos = {
            x: Math.max(200, Math.min(this.mapData.worldSize - 200, bot.x + Math.cos(roamAngle) * roamDist)),
            y: Math.max(200, Math.min(this.mapData.worldSize - 200, bot.y + Math.sin(roamAngle) * roamDist)),
          };
        }

        const dx = bot.botTargetPos.x - bot.x;
        const dy = bot.botTargetPos.y - bot.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 30) {
          const angle = Math.atan2(dy, dx);
          bot.angle = angle;
          this.moveEntityWithSlide(bot, Math.cos(angle) * bot.speed * dt * 0.7, Math.sin(angle) * bot.speed * dt * 0.7);
        }
      }
    }
  }

  private updateFighterTimers(f: FighterEntity, dt: number) {
    const now = performance.now() / 1000;

    // Reload completion
    if (f.isReloading) {
      const slot = f.weapons[f.activeSlot];
      if (slot) {
        const weaponDef = WEAPON_DEFS[slot.type];
        const timeLeft = f.reloadEndTime - now;
        f.reloadProgress = 1 - Math.max(0, timeLeft) / weaponDef.reloadTime;

        if (timeLeft <= 0) {
          f.isReloading = false;
          f.reloadProgress = 0;
          const needed = weaponDef.magSize - slot.ammoInMag;
          const pool = f.ammoPool[weaponDef.id] || 0;
          const taken = Math.min(needed, pool);
          slot.ammoInMag += taken;
          f.ammoPool[weaponDef.id] -= taken;
        }
      } else {
        f.isReloading = false;
      }
    }

    // Heal completion
    if (f.isHealing) {
      const timeLeft = f.healEndTime - now;
      if (timeLeft <= 0) {
        f.isHealing = false;
        if (f.healType === 'medkit') {
          f.hp = Math.min(f.maxHp, f.hp + 60);
          f.medkits--;
        } else if (f.healType === 'bandage') {
          f.hp = Math.min(75, f.hp + 25);
          f.bandages--;
        } else if (f.healType === 'armor_plate') {
          f.armor = Math.min(f.maxArmor, f.armor + 45);
          f.armorPlates--;
        }
        if (f.isPlayer) sounds.playHeal();
        f.healType = null;
      }
    }

    // Hit flash fade
    if (f.hitFlash > 0) {
      f.hitFlash = Math.max(0, f.hitFlash - dt);
    }
  }

  private checkBushStealth(f: FighterEntity) {
    let inside = false;
    for (const b of this.mapData.tileMap.bushes) {
      const dist = Math.hypot(f.x - b.x, f.y - b.y);
      if (dist < b.radius) {
        inside = true;
        break;
      }
    }
    f.inBush = inside;
  }

  private updateNearbyLoot() {
    const pickupDist = 55;
    let nearest: LootItem | null = null;
    let minDist = pickupDist;

    for (const item of this.mapData.lootItems) {
      const dist = Math.hypot(item.x - this.player.x, item.y - this.player.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = item;
      }
    }
    this.nearbyLoot = nearest;
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const stepX = b.vx * dt;
      const stepY = b.vy * dt;
      const stepDist = Math.hypot(stepX, stepY);

      b.x += stepX;
      b.y += stepY;
      b.rangeLeft -= stepDist;

      // Range expired?
      if (b.rangeLeft <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check wall collision
      if (this.isPositionSolid(b.x, b.y, b.radius)) {
        this.createHitSparks(b.x, b.y, '#94a3b8');
        if (b.isPlayer) sounds.playHit('wall');
        this.bullets.splice(i, 1);
        continue;
      }

      // Check entity collision
      let hit = false;
      for (const target of this.fighters) {
        if (target.id === b.ownerId || !target.alive) continue;
        const dist = Math.hypot(b.x - target.x, b.y - target.y);
        if (dist < target.radius + b.radius) {
          hit = true;
          const attacker = this.fighters.find((f) => f.id === b.ownerId);
          if (attacker && attacker.isPlayer) attacker.shotsHit++;
          this.applyDamage(target, b.damage, attacker, WEAPON_DEFS[b.weaponType]?.name || 'Bullet');
          this.createHitSparks(b.x, b.y, target.armor > 0 ? '#38bdf8' : '#ef4444');
          break;
        }
      }

      if (hit) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private updateGrenades(dt: number) {
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.timer -= dt;

      // Friction slowdown
      g.vx *= 0.95;
      g.vy *= 0.95;

      const nextX = g.x + g.vx * dt;
      const nextY = g.y + g.vy * dt;

      if (!this.isPositionSolid(nextX, nextY, g.radius)) {
        g.x = nextX;
        g.y = nextY;
      } else {
        // Bounce off solid
        g.vx = -g.vx * 0.4;
        g.vy = -g.vy * 0.4;
      }

      // Detonate!
      if (g.timer <= 0) {
        this.explodeGrenade(g.x, g.y, g.ownerId);
        this.grenades.splice(i, 1);
      }
    }
  }

  private explodeGrenade(gx: number, gy: number, ownerId: string) {
    const spatial = this.getSpatialAudio(gx, gy, 1400);
    if (spatial) {
      sounds.playExplosion(spatial);
    }
    this.screenShake = Math.max(this.screenShake, 18);

    // Explosion blast particles
    for (let p = 0; p < 45; p++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 320;
      this.particles.push({
        x: gx,
        y: gy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.7 + Math.random() * 0.5,
        maxLife: 1.2,
        size: 4 + Math.random() * 7,
        color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
        alpha: 1,
      });
    }

    // Damage entities in AoE
    const blastRadius = 150;
    const attacker = this.fighters.find((f) => f.id === ownerId);

    for (const f of this.fighters) {
      if (!f.alive) continue;
      const dist = Math.hypot(f.x - gx, f.y - gy);
      if (dist < blastRadius) {
        const falloff = 1 - dist / blastRadius;
        const dmg = Math.round(110 * falloff);
        this.applyDamage(f, dmg, attacker, 'Frag Grenade');
      }
    }
  }

  private updateAirdrops(dt: number) {
    for (const drop of this.airdrops) {
      if (!drop.landed) {
        drop.fallProgress += dt * 0.25; // 4 seconds drop
        if (drop.fallProgress >= 1) {
          drop.landed = true;
          // Spawn items around drop
          drop.items.forEach((item) => {
            this.mapData.lootItems.push(item);
          });
        }
      } else {
        drop.smokeTimer -= dt;
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= 35 * dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Fade screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }
  }

  private updateCamera(dt: number) {
    let focusEntity = this.player;
    if (!this.player.alive) {
      // Spectate alive bots
      const aliveBots = this.fighters.filter((f) => f.alive);
      if (aliveBots.length > 0) {
        this.spectateIndex = this.spectateIndex % aliveBots.length;
        focusEntity = aliveBots[this.spectateIndex];
      }
    }

    // Sniper weapon zoom out slightly
    const equipped = this.getEquippedWeapon(focusEntity);
    this.camera.targetZoom = (equipped.id === 'sniper' || equipped.id === 'm82b') ? 0.85 : 1.0;
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * dt * 4;

    // Smooth camera lerp
    this.camera.x += (focusEntity.x - this.camera.x) * dt * 8;
    this.camera.y += (focusEntity.y - this.camera.y) * dt * 8;
  }

  private createMuzzleParticles(x: number, y: number, angle: number, color: string) {
    for (let i = 0; i < 4; i++) {
      const spread = angle + (Math.random() - 0.5) * 0.5;
      const speed = 80 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(spread) * speed,
        vy: Math.sin(spread) * speed,
        life: 0.12,
        maxLife: 0.12,
        size: 3.5,
        color,
        alpha: 1,
      });
    }
  }

  private createHitSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25,
        maxLife: 0.25,
        size: 2.5,
        color,
        alpha: 1,
      });
    }
  }

  // --- Rendering Pipeline ---
  public render() {
    const { ctx, canvas } = this;
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // Apply Screen Shake
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Apply Camera Transform
    ctx.translate(cw / 2, ch / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw Terrain & Ground
    this.renderTerrain();

    // 2. Draw Floor Overlays of Structures
    this.renderBuildingFloors();

    // 3. Draw Loot Items & Crates
    this.renderLootItems();

    // 4. Draw Airdrops
    this.renderAirdrops();

    // 5. Draw Fighters (Bots & Player)
    this.renderFighters();

    // 6. Draw Bullets & Grenades
    this.renderProjectiles();

    // 7. Draw Bushes & Foliage (render over players so hiding works!)
    this.renderBushes();

    // 8. Draw Walls & Solid Obstacles
    this.renderWalls();

    // 9. Draw Safe Zone Border & Storm Field
    this.renderSafeZone();

    // 10. Draw Particles & Damage Numbers
    this.renderEffects();

    ctx.restore();
  }

  private renderTerrain() {
    const { ctx } = this;
    const ts = this.mapData.tileMap.tileSize;
    const grid = this.mapData.tileMap.grid;

    // Viewport cull box
    const minX = Math.floor((this.camera.x - this.canvas.width / (2 * this.camera.zoom)) / ts) - 1;
    const maxX = Math.ceil((this.camera.x + this.canvas.width / (2 * this.camera.zoom)) / ts) + 1;
    const minY = Math.floor((this.camera.y - this.canvas.height / (2 * this.camera.zoom)) / ts) - 1;
    const maxY = Math.ceil((this.camera.y + this.canvas.height / (2 * this.camera.zoom)) / ts) + 1;

    const startX = Math.max(0, minX);
    const endX = Math.min(this.mapData.tileMap.width, maxX);
    const startY = Math.max(0, minY);
    const endY = Math.min(this.mapData.tileMap.height, maxY);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const type = grid[y][x];
        const px = x * ts;
        const py = y * ts;

        if (type === 2) {
          // Water
          ctx.fillStyle = '#1e3a5f';
        } else if (type === 1) {
          // Sand shore
          ctx.fillStyle = '#d4b483';
        } else if (type === 4) {
          // Asphalt road
          ctx.fillStyle = '#334155';
        } else if (type === 3) {
          // Dirt path
          ctx.fillStyle = '#5c4827';
        } else {
          // Grass with subtle checkerboard texture
          ctx.fillStyle = (x + y) % 2 === 0 ? '#2d5a27' : '#33632c';
        }
        ctx.fillRect(px, py, ts, ts);

        // Road lane striping
        if (type === 4 && (x % 3 === 0 || y % 3 === 0)) {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(px + ts / 2 - 2, py + ts / 2 - 2, 4, 4);
        }
      }
    }
  }

  private renderBuildingFloors() {
    const { ctx } = this;
    for (const struct of this.mapData.tileMap.structures) {
      // Concrete interior floor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(struct.x, struct.y, struct.w, struct.h);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(struct.x + 2, struct.y + 2, struct.w - 4, struct.h - 4);
    }
  }

  private renderLootItems() {
    const { ctx } = this;
    for (const item of this.mapData.lootItems) {
      // Glow circle based on rarity
      ctx.save();
      ctx.translate(item.x, item.y);

      let glowColor = '#94a3b8';
      if (item.rarity === 'uncommon') glowColor = '#22c55e';
      if (item.rarity === 'rare') glowColor = '#3b82f6';
      if (item.rarity === 'epic') glowColor = '#a855f7';
      if (item.rarity === 'legendary') glowColor = '#eab308';

      // Subtle pulse
      const pulse = 1 + Math.sin(performance.now() * 0.005) * 0.15;
      ctx.fillStyle = `${glowColor}25`;
      ctx.beginPath();
      ctx.arc(0, 0, 15 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.stroke();

      // Weapon / Item icon representation
      if (item.type === 'medkit' || item.type === 'bandage') {
        // Red cross
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-6, -2, 12, 4);
        ctx.fillRect(-2, -6, 4, 12);
      } else if (item.type === 'armor_vest' || item.type === 'armor_plate') {
        // Cyan shield
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(6, -2);
        ctx.lineTo(4, 6);
        ctx.lineTo(0, 8);
        ctx.lineTo(-4, 6);
        ctx.lineTo(-6, -2);
        ctx.closePath();
        ctx.fill();
      } else if (item.type === 'grenade') {
        // Dark green orb
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type.startsWith('ammo_')) {
        // Military Ammo Box (Steel olive-drab crate with gold brass bullets)
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(-6, -4, 12, 8);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1;
        ctx.strokeRect(-6, -4, 12, 8);
        // Brass cartridges
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-3, -2.5, 2, 5);
        ctx.fillRect(1, -2.5, 2, 5);
      } else {
        // Weapon silhouette
        const wDef = WEAPON_DEFS[item.type as WeaponType];
        ctx.fillStyle = wDef ? wDef.color : '#f8fafc';
        ctx.fillRect(-7, -2.5, 14, 5);
      }

      ctx.restore();
    }
  }

  private renderAirdrops() {
    const { ctx } = this;
    for (const drop of this.airdrops) {
      ctx.save();
      ctx.translate(drop.x, drop.y);

      if (!drop.landed) {
        // Parachute falling animation
        const parachuteY = -40 * (1 - drop.fallProgress);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, parachuteY - 20, 22, Math.PI, 0);
        ctx.closePath();
        ctx.fill();

        // Parachute ropes
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-20, parachuteY - 20);
        ctx.lineTo(0, parachuteY);
        ctx.moveTo(20, parachuteY - 20);
        ctx.lineTo(0, parachuteY);
        ctx.stroke();
      } else {
        // Red flare smoke
        if (drop.smokeTimer > 0) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          const smokeR = 18 + Math.sin(performance.now() * 0.006) * 5;
          ctx.beginPath();
          ctx.arc(0, 0, smokeR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Wooden military airdrop crate with red ribbon
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-16, -16, 32, 32);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, -16, 8, 32);
      ctx.fillRect(-16, -4, 32, 8);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(-16, -16, 32, 32);

      ctx.restore();
    }
  }

  private renderFighters() {
    const { ctx } = this;
    for (const f of this.fighters) {
      if (!f.alive) continue;

      ctx.save();
      ctx.translate(f.x, f.y);

      // Bush camouflage transparency
      if (f.inBush) {
        ctx.globalAlpha = 0.45;
      }

      // Hit flash white filter
      if (f.hitFlash > 0) {
        ctx.filter = 'brightness(3)';
      }

      // Directional rotation
      ctx.rotate(f.angle);

      // 1. Hands & Weapon barrel
      const weaponDef = this.getEquippedWeapon(f);
      ctx.fillStyle = weaponDef.color;

      // Draw weapon protruding forward
      if (weaponDef.category === 'melee') {
        if (weaponDef.id === 'katana') {
          // Red curved blade
          ctx.fillStyle = '#e11d48';
          ctx.fillRect(8, -2, 22, 4);
        } else {
          // Fists
          ctx.fillStyle = f.skin.bodyColor;
          ctx.beginPath();
          ctx.arc(14, -7, 4, 0, Math.PI * 2);
          ctx.arc(14, 7, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Gun barrel
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(8, -2.5, weaponDef.id === 'sniper' ? 24 : 16, 5);

        // Hands gripping
        ctx.fillStyle = f.skin.bodyColor;
        ctx.beginPath();
        ctx.arc(10, -6, 3.5, 0, Math.PI * 2);
        ctx.arc(12, 5, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Character Body & Vest
      ctx.fillStyle = f.skin.bodyColor;
      ctx.beginPath();
      ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
      ctx.fill();

      // Armor vest plate on torso
      ctx.fillStyle = f.armor > 0 ? '#0284c7' : f.skin.vestColor;
      ctx.beginPath();
      ctx.arc(0, 0, f.radius - 3, 0, Math.PI * 2);
      ctx.fill();

      // Head / Helmet
      ctx.fillStyle = f.skin.hairColor;
      ctx.beginPath();
      ctx.arc(0, 0, f.radius - 6, 0, Math.PI * 2);
      ctx.fill();

      // Eyeline / goggles
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(2, -4, 4, 2);
      ctx.fillRect(2, 2, 4, 2);

      ctx.restore();

      // Health bar & Name rendered above entity (not rotated)
      this.renderFighterOverlays(f);
    }
  }

  private renderFighterOverlays(f: FighterEntity) {
    const { ctx } = this;
    const oy = f.y - f.radius - 14;

    // Show health bar if damaged or for player
    if (f.hp < f.maxHp || f.armor > 0 || f.isPlayer) {
      const barW = 32;
      const barH = 4;
      const bx = f.x - barW / 2;

      // Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(bx - 1, oy - 1, barW + 2, barH + 2);

      // Armor bar (cyan, if any)
      if (f.armor > 0) {
        const armorRatio = Math.min(1, f.armor / f.maxArmor);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(bx, oy - 4, barW * armorRatio, 2.5);
      }

      // HP bar
      const hpRatio = Math.max(0, f.hp / f.maxHp);
      ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillRect(bx, oy, barW * hpRatio, barH);
    }

    // Bot name tag (small, unobtrusive)
    if (!f.isPlayer) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.name, f.x, oy - (f.armor > 0 ? 8 : 4));
    }

    // Reload circle animation over head
    if (f.isReloading) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(f.x, oy - 12, 6, -Math.PI / 2, -Math.PI / 2 + f.reloadProgress * Math.PI * 2);
      ctx.stroke();
    }
  }

  private renderProjectiles() {
    const { ctx } = this;

    // Bullets
    for (const b of this.bullets) {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Bullet tracer tail
      const tailLen = 14;
      const angle = Math.atan2(b.vy, b.vx);
      ctx.strokeStyle = `${b.color}88`;
      ctx.lineWidth = b.radius * 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - Math.cos(angle) * tailLen, b.y - Math.sin(angle) * tailLen);
      ctx.stroke();

      ctx.restore();
    }

    // Grenades
    for (const g of this.grenades) {
      ctx.save();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderBushes() {
    const { ctx } = this;
    for (const b of this.mapData.tileMap.bushes) {
      ctx.fillStyle = '#1b4317';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Bush leaves detail
      ctx.fillStyle = '#245a1f';
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.25, b.y - b.radius * 0.25, b.radius * 0.65, 0, Math.PI * 2);
      ctx.arc(b.x + b.radius * 0.3, b.y + b.radius * 0.2, b.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderWalls() {
    const { ctx } = this;
    for (const w of this.mapData.tileMap.walls) {
      if (w.type === 'rock') {
        // Boulder
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(w.x + w.w / 2, w.y + w.h / 2, w.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(w.x + w.w / 2 + 2, w.y + w.h / 2 + 2, w.w / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (w.type === 'crate') {
        // Wooden crate
        ctx.fillStyle = '#78350f';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      } else {
        // Concrete building wall
        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(w.x + 3, w.y + 3, w.w, w.h);

        // Wall base
        ctx.fillStyle = '#475569';
        ctx.fillRect(w.x, w.y, w.w, w.h);

        // Wall highlight
        ctx.fillStyle = '#64748b';
        ctx.fillRect(w.x + 1, w.y + 1, Math.max(0, w.w - 2), Math.min(4, w.h - 2));
      }
    }
  }

  private renderSafeZone() {
    const { ctx } = this;
    const z = this.zone;

    // 1. Next Zone (Dotted white circle)
    if (z.phaseState === 'WAITING' || z.phaseState === 'SHRINKING') {
      const nextConfig = this.zonePhases[Math.min(z.phase, this.zonePhases.length - 1)];
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(z.targetCenter.x, z.targetCenter.y, nextConfig.targetRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Current Safe Zone (Solid electric blue circle with storm border)
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(z.currentCenter.x, z.currentCenter.y, z.currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Blue storm overlay covering everything outside the safe zone!
    // Using inverted canvas path (large enclosing rect minus inner circle)
    const worldSize = this.mapData.worldSize;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.18)';
    ctx.beginPath();
    ctx.rect(-100, -100, worldSize + 200, worldSize + 200);
    ctx.arc(z.currentCenter.x, z.currentCenter.y, z.currentRadius, 0, Math.PI * 2, true);
    ctx.fill();

    ctx.restore();
  }

  private renderEffects() {
    const { ctx } = this;

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Floating damage texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.font = `${ft.isCrit ? 'bold 15px' : '13px'} Barlow Condensed, sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  public destroy() {
    sounds.stopMusic();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.onWindowKeyDown);
    window.removeEventListener('keyup', this.onWindowKeyUp);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
  }
}
