export type RankTier = 
  | 'Bronze' 
  | 'Silver' 
  | 'Gold' 
  | 'Platinum' 
  | 'Diamond' 
  | 'Heroic' 
  | 'Master';

export interface RankInfo {
  tier: RankTier;
  subtier: string; // 'I', 'II', 'III', 'IV', or '' for Heroic/Master
  name: string; // e.g. "Bronze I", "Gold III", "Heroic", "Master"
  minRP: number;
  maxRP: number;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  icon: string;
  stars?: number;
  rewards: string;
}

export const RANK_TIERS: RankInfo[] = [
  // BRONZE (1000 - 1299)
  {
    tier: 'Bronze',
    subtier: 'I',
    name: 'Bronze I',
    minRP: 1000,
    maxRP: 1099,
    badgeColor: '#cd7f32',
    badgeBg: 'rgba(205, 127, 50, 0.15)',
    badgeBorder: '#b45309',
    textColor: '#f59e0b',
    icon: '🛡️',
    rewards: 'Bronze Banner · 500 Gold Coins',
  },
  {
    tier: 'Bronze',
    subtier: 'II',
    name: 'Bronze II',
    minRP: 1100,
    maxRP: 1199,
    badgeColor: '#cd7f32',
    badgeBg: 'rgba(205, 127, 50, 0.18)',
    badgeBorder: '#b45309',
    textColor: '#f59e0b',
    icon: '🛡️',
    rewards: '1x Armor Crate · 750 Coins',
  },
  {
    tier: 'Bronze',
    subtier: 'III',
    name: 'Bronze III',
    minRP: 1200,
    maxRP: 1299,
    badgeColor: '#cd7f32',
    badgeBg: 'rgba(205, 127, 50, 0.22)',
    badgeBorder: '#b45309',
    textColor: '#f59e0b',
    icon: '🛡️',
    rewards: 'Bronze Avatar · 1,000 Coins',
  },

  // SILVER (1300 - 1599)
  {
    tier: 'Silver',
    subtier: 'I',
    name: 'Silver I',
    minRP: 1300,
    maxRP: 1399,
    badgeColor: '#cbd5e1',
    badgeBg: 'rgba(203, 213, 225, 0.15)',
    badgeBorder: '#94a3b8',
    textColor: '#e2e8f0',
    icon: '⚔️',
    rewards: 'Silver Banner · 1,200 Coins',
  },
  {
    tier: 'Silver',
    subtier: 'II',
    name: 'Silver II',
    minRP: 1400,
    maxRP: 1499,
    badgeColor: '#cbd5e1',
    badgeBg: 'rgba(203, 213, 225, 0.18)',
    badgeBorder: '#94a3b8',
    textColor: '#e2e8f0',
    icon: '⚔️',
    rewards: '2x Weapon Vouchers · 1,500 Coins',
  },
  {
    tier: 'Silver',
    subtier: 'III',
    name: 'Silver III',
    minRP: 1500,
    maxRP: 1599,
    badgeColor: '#cbd5e1',
    badgeBg: 'rgba(203, 213, 225, 0.22)',
    badgeBorder: '#94a3b8',
    textColor: '#e2e8f0',
    icon: '⚔️',
    rewards: 'Silver Combat Jacket · 1,800 Coins',
  },

  // GOLD (1600 - 2099)
  {
    tier: 'Gold',
    subtier: 'I',
    name: 'Gold I',
    minRP: 1600,
    maxRP: 1724,
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.18)',
    badgeBorder: '#d97706',
    textColor: '#fde047',
    icon: '🦅',
    rewards: 'Gold Banner · Exclusive AK47 Skin',
  },
  {
    tier: 'Gold',
    subtier: 'II',
    name: 'Gold II',
    minRP: 1725,
    maxRP: 1849,
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.2)',
    badgeBorder: '#d97706',
    textColor: '#fde047',
    icon: '🦅',
    rewards: '50 Diamonds · 2,200 Coins',
  },
  {
    tier: 'Gold',
    subtier: 'III',
    name: 'Gold III',
    minRP: 1850,
    maxRP: 1974,
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.22)',
    badgeBorder: '#d97706',
    textColor: '#fde047',
    icon: '🦅',
    rewards: 'Gold Rank Parachute · 2,500 Coins',
  },
  {
    tier: 'Gold',
    subtier: 'IV',
    name: 'Gold IV',
    minRP: 1975,
    maxRP: 2099,
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.25)',
    badgeBorder: '#d97706',
    textColor: '#fde047',
    icon: '🦅',
    rewards: 'Gold Elite Jacket · 3,000 Coins',
  },

  // PLATINUM (2100 - 2599)
  {
    tier: 'Platinum',
    subtier: 'I',
    name: 'Platinum I',
    minRP: 2100,
    maxRP: 2224,
    badgeColor: '#2dd4bf',
    badgeBg: 'rgba(45, 212, 191, 0.18)',
    badgeBorder: '#0d9488',
    textColor: '#5eead4',
    icon: '💠',
    rewards: 'Platinum Banner · SCAR Assassin Skin',
  },
  {
    tier: 'Platinum',
    subtier: 'II',
    name: 'Platinum II',
    minRP: 2225,
    maxRP: 2349,
    badgeColor: '#2dd4bf',
    badgeBg: 'rgba(45, 212, 191, 0.2)',
    badgeBorder: '#0d9488',
    textColor: '#5eead4',
    icon: '💠',
    rewards: '80 Diamonds · 3,500 Coins',
  },
  {
    tier: 'Platinum',
    subtier: 'III',
    name: 'Platinum III',
    minRP: 2350,
    maxRP: 2474,
    badgeColor: '#2dd4bf',
    badgeBg: 'rgba(45, 212, 191, 0.22)',
    badgeBorder: '#0d9488',
    textColor: '#5eead4',
    icon: '💠',
    rewards: 'Platinum Surfboard · 4,000 Coins',
  },
  {
    tier: 'Platinum',
    subtier: 'IV',
    name: 'Platinum IV',
    minRP: 2475,
    maxRP: 2599,
    badgeColor: '#2dd4bf',
    badgeBg: 'rgba(45, 212, 191, 0.25)',
    badgeBorder: '#0d9488',
    textColor: '#5eead4',
    icon: '💠',
    rewards: 'Elite Platinum Wings Avatar',
  },

  // DIAMOND (2600 - 3199)
  {
    tier: 'Diamond',
    subtier: 'I',
    name: 'Diamond I',
    minRP: 2600,
    maxRP: 2749,
    badgeColor: '#818cf8',
    badgeBg: 'rgba(129, 140, 248, 0.2)',
    badgeBorder: '#4f46e5',
    textColor: '#a5b4fc',
    icon: '💎',
    rewards: 'Diamond Banner · Dual Vector Cyber Skin',
  },
  {
    tier: 'Diamond',
    subtier: 'II',
    name: 'Diamond II',
    minRP: 2750,
    maxRP: 2899,
    badgeColor: '#818cf8',
    badgeBg: 'rgba(129, 140, 248, 0.22)',
    badgeBorder: '#4f46e5',
    textColor: '#a5b4fc',
    icon: '💎',
    rewards: '120 Diamonds · 5,000 Coins',
  },
  {
    tier: 'Diamond',
    subtier: 'III',
    name: 'Diamond III',
    minRP: 2900,
    maxRP: 3049,
    badgeColor: '#818cf8',
    badgeBg: 'rgba(129, 140, 248, 0.25)',
    badgeBorder: '#4f46e5',
    textColor: '#a5b4fc',
    icon: '💎',
    rewards: 'Diamond Crown Emote · 6,000 Coins',
  },
  {
    tier: 'Diamond',
    subtier: 'IV',
    name: 'Diamond IV',
    minRP: 3050,
    maxRP: 3199,
    badgeColor: '#818cf8',
    badgeBg: 'rgba(129, 140, 248, 0.28)',
    badgeBorder: '#4f46e5',
    textColor: '#a5b4fc',
    icon: '💎',
    rewards: 'Diamond Elite Armor Set',
  },

  // HEROIC (3200 - 5999)
  {
    tier: 'Heroic',
    subtier: '★',
    name: 'Heroic',
    minRP: 3200,
    maxRP: 5999,
    badgeColor: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.25)',
    badgeBorder: '#b91c1c',
    textColor: '#f87171',
    icon: '🔥',
    rewards: 'Legendary Heroic Banner & Avatar · Groza Dragon Skin · 250 Diamonds',
  },

  // MASTER (6000+)
  {
    tier: 'Master',
    subtier: '★★★',
    name: 'Master',
    minRP: 6000,
    maxRP: 99999,
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.35)',
    badgeBorder: '#d97706',
    textColor: '#fbbf24',
    icon: '👑',
    rewards: 'Grandmaster Crown · Radiant Aura · Hall of Fame Title · 500 Diamonds',
  },
];

const LOCAL_STORAGE_KEY_RP = 'freefire_player_rank_points';
const LOCAL_STORAGE_KEY_STATS = 'freefire_player_season_stats';

export interface SeasonStats {
  matchesPlayed: number;
  victories: number;
  totalKills: number;
  highestRank: string;
}

export function getPlayerRP(): number {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_RP);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 1000) return parsed;
    }
  } catch (e) {
    console.error('Failed to load RP:', e);
  }
  return 1000; // Default Bronze I
}

export function savePlayerRP(rp: number): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_RP, Math.max(1000, rp).toString());
  } catch (e) {
    console.error('Failed to save RP:', e);
  }
}

export function getSeasonStats(): SeasonStats {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_STATS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
  return {
    matchesPlayed: 0,
    victories: 0,
    totalKills: 0,
    highestRank: 'Bronze I',
  };
}

export function updateSeasonStats(matchResult: { isWinner: boolean; kills: number; rankName: string }): SeasonStats {
  const current = getSeasonStats();
  const updated: SeasonStats = {
    matchesPlayed: current.matchesPlayed + 1,
    victories: current.victories + (matchResult.isWinner ? 1 : 0),
    totalKills: current.totalKills + matchResult.kills,
    highestRank: getHighestRankName(current.highestRank, matchResult.rankName),
  };
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_STATS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save season stats:', e);
  }
  return updated;
}

function getHighestRankName(currentHighest: string, newRank: string): string {
  const currentIdx = RANK_TIERS.findIndex((r) => r.name === currentHighest);
  const newIdx = RANK_TIERS.findIndex((r) => r.name === newRank);
  return newIdx >= currentIdx ? newRank : currentHighest;
}

export function getRankByRP(rp: number): {
  currentRank: RankInfo;
  nextRank: RankInfo | null;
  tierIndex: number;
  progressPercent: number;
  rpInCurrentTier: number;
  tierRange: number;
  isMaxRank: boolean;
} {
  const validRP = Math.max(1000, rp);
  let tierIndex = 0;

  for (let i = 0; i < RANK_TIERS.length; i++) {
    const tier = RANK_TIERS[i];
    if (validRP >= tier.minRP && (validRP <= tier.maxRP || i === RANK_TIERS.length - 1)) {
      tierIndex = i;
      break;
    }
  }

  const currentRank = RANK_TIERS[tierIndex];
  const isMaxRank = tierIndex === RANK_TIERS.length - 1;
  const nextRank = isMaxRank ? null : RANK_TIERS[tierIndex + 1];

  const tierMin = currentRank.minRP;
  const tierMax = currentRank.maxRP === 99999 ? 10000 : currentRank.maxRP;
  const tierRange = Math.max(1, tierMax - tierMin + 1);
  const rpInCurrentTier = validRP - tierMin;
  const progressPercent = isMaxRank
    ? 100
    : Math.min(100, Math.max(0, Math.round((rpInCurrentTier / tierRange) * 100)));

  return {
    currentRank,
    nextRank,
    tierIndex,
    progressPercent,
    rpInCurrentTier,
    tierRange,
    isMaxRank,
  };
}

export interface MatchRPBreakdown {
  placementPoints: number;
  killPoints: number;
  damageBonus: number;
  survivalBonus: number;
  totalRPGain: number;
  oldRP: number;
  newRP: number;
  isRankUp: boolean;
  oldRank: RankInfo;
  newRank: RankInfo;
}

export function calculateMatchRP(params: {
  rank: number;
  totalPlayers: number;
  kills: number;
  damageDealt: number;
  timeSurvivedSeconds: number;
  currentRP: number;
}): MatchRPBreakdown {
  const { rank, totalPlayers, kills, damageDealt, timeSurvivedSeconds, currentRP } = params;

  // 1. Placement Points (Free Fire Curve)
  let placementPoints = 0;
  if (rank === 1) {
    placementPoints = 55; // BOOYAH!
  } else if (rank === 2) {
    placementPoints = 42;
  } else if (rank === 3) {
    placementPoints = 36;
  } else if (rank <= 5) {
    placementPoints = 28;
  } else if (rank <= 10) {
    placementPoints = 20;
  } else if (rank <= 20) {
    placementPoints = 12;
  } else if (rank <= Math.floor(totalPlayers * 0.5)) {
    placementPoints = 5;
  } else {
    // Lower placement in higher ranks has slight penalty, but generous for bronze/silver
    if (currentRP >= 2600) {
      placementPoints = -8;
    } else if (currentRP >= 2100) {
      placementPoints = -3;
    } else {
      placementPoints = 2; // Never lose points in Bronze/Silver
    }
  }

  // 2. Kill Points (+5 RP per kill, up to 45 RP max)
  const killPoints = Math.min(45, kills * 5);

  // 3. Damage Bonus (+1 RP per 150 damage, up to 20 RP max)
  const damageBonus = Math.min(20, Math.floor(damageDealt / 150));

  // 4. Survival Time Bonus (+1 RP per 25 seconds alive, up to 15 RP max)
  const survivalBonus = Math.min(15, Math.floor(timeSurvivedSeconds / 25));

  const totalRPGain = Math.max(-15, placementPoints + killPoints + damageBonus + survivalBonus);
  const oldRP = currentRP;
  const newRP = Math.max(1000, oldRP + totalRPGain);

  const oldRankData = getRankByRP(oldRP);
  const newRankData = getRankByRP(newRP);
  const isRankUp = newRankData.tierIndex > oldRankData.tierIndex;

  return {
    placementPoints,
    killPoints,
    damageBonus,
    survivalBonus,
    totalRPGain,
    oldRP,
    newRP,
    isRankUp,
    oldRank: oldRankData.currentRank,
    newRank: newRankData.currentRank,
  };
}
