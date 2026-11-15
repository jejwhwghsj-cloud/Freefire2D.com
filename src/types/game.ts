export type GameState = 'LOBBY' | 'PLAYING' | 'GAMEOVER' | 'VICTORY' | 'SPECTATING';

export type WeaponType = 
  | 'fists' 
  | 'pistol' 
  | 'smg' 
  | 'rifle' 
  | 'shotgun' 
  | 'sniper' 
  | 'minigun' 
  | 'katana'
  | 'scar'
  | 'm1887'
  | 'm82b'
  | 'groza'
  | 'vector';

export interface WeaponDef {
  id: WeaponType;
  name: string;
  category: 'primary' | 'secondary' | 'melee' | 'special';
  damage: number;
  fireRate: number; // seconds between shots
  bulletSpeed: number;
  spread: number; // radians
  range: number;
  pellets: number;
  magSize: number;
  reloadTime: number; // seconds
  auto: boolean;
  color: string;
  bulletColor: string;
  bulletRadius: number;
  recoil: number;
  soundType: 'pistol' | 'smg' | 'rifle' | 'shotgun' | 'sniper' | 'heavy' | 'melee';
  description: string;
}

export type LootType = 
  | WeaponType 
  | 'medkit' 
  | 'bandage' 
  | 'armor_vest' 
  | 'armor_plate' 
  | 'ammo_light' 
  | 'ammo_heavy' 
  | 'ammo_shotgun' 
  | 'ammo_sniper' 
  | 'grenade';

export interface LootItem {
  id: string;
  type: LootType;
  name: string;
  x: float;
  y: float;
  count: number;
  weaponKey?: WeaponType;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

type float = number;

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  rangeLeft: number;
  maxRange: number;
  radius: number;
  color: string;
  ownerId: string;
  isPlayer: boolean;
  weaponType: WeaponType;
}

export interface Grenade {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  timer: number;
  radius: number;
  ownerId: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  isCrit: boolean;
}

export interface KillEvent {
  id: string;
  killerName: string;
  victimName: string;
  weapon: string;
  isKillerPlayer: boolean;
  isVictimPlayer: boolean;
  timestamp: number;
}

export interface CharacterSkin {
  id: string;
  name: string;
  bodyColor: string;
  vestColor: string;
  accentColor: string;
  hairColor: string;
  description: string;
}

export type BotPersonality = 'rusher' | 'sniper' | 'tactical' | 'camper' | 'looter';

export interface FighterEntity {
  id: string;
  name: string;
  isPlayer: boolean;
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  radius: number;
  speed: number;
  maxSpeed: number;
  
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  alive: boolean;
  
  // Inventory
  weapons: {
    primary?: { type: WeaponType; ammoInMag: number };
    secondary?: { type: WeaponType; ammoInMag: number };
    melee: { type: WeaponType; ammoInMag: number };
  };
  activeSlot: 'primary' | 'secondary' | 'melee';
  ammoPool: Record<string, number>;
  medkits: number;
  bandages: number;
  armorPlates: number;
  grenades: number;

  // Combat status
  lastShotTime: number;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  reloadEndTime: number;
  isHealing: boolean;
  healProgress: number;
  healEndTime: number;
  healType: 'medkit' | 'bandage' | 'armor_plate' | null;

  // Stats
  kills: number;
  damageDealt: number;
  shotsFired: number;
  shotsHit: number;
  
  // Visuals
  hitFlash: number;
  skin: CharacterSkin;
  inBush: boolean;
  isMoving: boolean;

  // AI specifics
  botPersonality?: BotPersonality;
  botState?: 'roam' | 'loot' | 'engage' | 'flee' | 'heal' | 'ambush';
  botTargetId?: string | null;
  botTargetPos?: { x: number; y: number } | null;
  botRetargetTimer?: number;
  botRoamTimer?: number;
  botStuckTimer?: number;
}

export interface Airdrop {
  id: string;
  x: number;
  y: number;
  landed: boolean;
  fallProgress: number; // 0 to 1
  smokeTimer: number;
  items: LootItem[];
}

export interface ZonePhase {
  waitDuration: number;
  shrinkDuration: number;
  targetRadius: number;
  dps: number;
}

export interface ZoneState {
  currentCenter: { x: number; y: number };
  targetCenter: { x: number; y: number };
  currentRadius: number;
  targetRadius: number;
  phase: number;
  phaseState: 'WAITING' | 'SHRINKING' | 'FINAL';
  timer: number;
  dps: number;
}

export interface TileMap {
  width: number;
  height: number;
  tileSize: number;
  grid: number[][]; // 0: grass, 1: sand, 2: water, 3: dirt, 4: asphalt
  walls: { x: number; y: number; w: number; h: number; type: 'building' | 'rock' | 'crate' }[];
  bushes: { x: number; y: number; radius: number }[];
  structures: {
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    walls: { x: number; y: number; w: number; h: number }[];
    doors: { x: number; y: number; w: number; h: number }[];
    floorType: string;
  }[];
}

export interface GameSettings {
  botCount: number;
  difficulty: 'recruit' | 'veteran' | 'apex';
  soundEnabled: boolean;
  musicEnabled: boolean;
  showMinimapRadar: boolean;
  touchControls: boolean;
}

export interface MatchStats {
  rank: number;
  totalPlayers: number;
  kills: number;
  damageDealt: number;
  timeSurvivedSeconds: number;
  accuracy: number;
  isWinner: boolean;
}
