export type PlayerSymbol = 'X' | 'O';

export type GameMode = 'PvP' | 'AI' | 'Online';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'chaos';

export type GameStatus = 'idle' | 'playing' | 'ended';

export interface GameStats {
  pvpXWins: number;
  pvpOWins: number;
  pvpDraws: number;
  aiXWins: number;
  aiOWins: number; // AI wins
  aiDraws: number;
  currentStreak: number;
  bestStreak: number;
}

export interface MoveRecord {
  index: number;
  player: PlayerSymbol;
  timestamp: string;
}

export interface SoundConfig {
  masterEnabled: boolean;
  fxVolume: number; // 0 to 1
  ambientEnabled: boolean;
}

export type VisualSkin = 'crimson' | 'gold' | 'silver' | 'obsidian';
