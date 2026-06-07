import React from 'react';
import { Trophy, ShieldAlert, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { GameStats, PlayerSymbol, GameMode, Difficulty, VisualSkin } from '../types';

interface ScoreBoardProps {
  stats: GameStats;
  gameMode: GameMode;
  difficulty: Difficulty;
  currentPlayer: PlayerSymbol;
  winnerSymbol: PlayerSymbol | 'Draw' | null;
  status: string;
  skin: VisualSkin;
  challengerName?: string;
  opponentName?: string;
  myPlayerSymbol?: PlayerSymbol | null;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  stats,
  gameMode,
  difficulty,
  currentPlayer,
  winnerSymbol,
  status,
  skin,
  challengerName,
  opponentName,
  myPlayerSymbol
}) => {
  // Compute win ratios
  const totalPvP = stats.pvpXWins + stats.pvpOWins + stats.pvpDraws;
  const totalAI = stats.aiXWins + stats.aiOWins + stats.aiDraws;

  const getWinRateX = () => {
    if (gameMode === 'PvP') {
      if (totalPvP === 0) return '0%';
      return `${Math.round((stats.pvpXWins / totalPvP) * 100)}%`;
    } else {
      if (totalAI === 0) return '0%';
      return `${Math.round((stats.aiXWins / totalAI) * 100)}%`;
    }
  };

  const getActiveTurnGlow = (player: PlayerSymbol) => {
    if (status !== 'playing') return '';
    if (currentPlayer !== player) return 'opacity-30 border-transparent scale-95';

    if (player === 'X') {
      return 'border-silver-300 shadow-[0_0_15px_rgba(206,212,218,0.25)] scale-100 bg-silver-900/40';
    } else {
      return skin === 'crimson'
        ? 'border-crimson-500 shadow-[0_0_15px_rgba(217,4,41,0.25)] scale-100 bg-crimson-900/10'
        : 'border-gold-400 shadow-[0_0_15px_rgba(212,175,55,0.25)] scale-100 bg-gold-900/10';
    }
  };

  // Human vs AI / Online descriptions
  const leftLabel = gameMode === 'Online' ? 'Player X (Host)' : 'Player X';
  const rightLabel = gameMode === 'Online' ? 'Player O (Guest)' : (gameMode === 'AI' ? `Sovereign AI (${difficulty})` : 'Player O');

  const displayNameX = gameMode === 'Online' ? (challengerName || 'Host Challenger') : 'Challenger X';
  const displayNameO = gameMode === 'Online' ? (opponentName || 'Awaiting opponent...') : (gameMode === 'AI' ? 'Architect intellect' : 'Opponent O');

  const leftWins = gameMode === 'PvP' ? stats.pvpXWins : stats.aiXWins;
  const rightWins = gameMode === 'PvP' ? stats.pvpOWins : stats.aiOWins;
  const draws = gameMode === 'PvP' ? stats.pvpDraws : stats.aiDraws;

  const currentInitiativeUser = gameMode === 'Online'
    ? (currentPlayer === 'X' ? (challengerName || 'Host') : (opponentName || 'Guest'))
    : (currentPlayer === 'X' ? 'Sovereign Challenger' : gameMode === 'AI' ? 'Regent Artificial Intellect' : 'Imperial Opponent');

  return (
    <div id="score-block" className="w-full space-y-4">
      {/* 1. Turn Indictor / Royal Announcement */}
      <div className="relative overflow-hidden rounded-2xl bg-silver-950/70 border border-silver-800/40 p-4 shadow-lg text-center flex flex-col items-center justify-center min-h-[85px]">
        {/* Subtle royal background grid style */}
        <div className="absolute inset-0 bg-radial-gradient from-silver-950 to-black opacity-60 pointer-events-none" />

        {status === 'playing' && (
          <div className="relative z-10 flex flex-col items-center animate-fade-in">
            <span className="text-[10px] tracking-widest uppercase text-silver-500 font-semibold mb-1">Current Initiative</span>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-display font-black ${currentPlayer === 'X' ? 'text-silver-100' : 'text-gold-400'}`}>
                {currentPlayer}
              </span>
              <span className="text-sm font-space text-silver-300 font-medium truncate max-w-[220px]">
                — {currentInitiativeUser}
              </span>
            </div>
            {gameMode === 'Online' && myPlayerSymbol && (
              <span className="text-[9px] uppercase tracking-widest text-sky-400 font-bold mt-1.5 font-space">
                You are Player {myPlayerSymbol} {myPlayerSymbol === currentPlayer ? '(Your turn!)' : '(Wait)'}
              </span>
            )}
          </div>
        )}

        {status === 'ended' && winnerSymbol && (
          <div id="winner-announcement" className="relative z-10 flex flex-col items-center animate-bounce">
            <Trophy className="w-5 h-5 text-gold-500 mb-1" />
            <div className="text-center">
              <p className="text-[10px] tracking-widest uppercase text-gold-400 font-bold font-space">Victory Proclaimed</p>
              <h2 className="text-sm md:text-base font-display font-medium text-silver-100 flex items-center justify-center gap-1.5 mt-1">
                {winnerSymbol === 'Draw' ? (
                  <span className="text-silver-300 uppercase tracking-widest text-xs">Imperial Standstill (Draw)</span>
                ) : (
                  <>
                    <span className={`font-black ${winnerSymbol === 'X' ? 'text-silver-250' : 'text-gold-400'}`}>
                      {winnerSymbol === 'X' ? displayNameX : displayNameO}
                    </span>
                    <span className="uppercase tracking-widest text-xs font-light">Rules Domain!</span>
                  </>
                )}
              </h2>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div className="relative z-10 py-1 flex flex-col items-center text-center">
            <Sparkles className="w-5 h-5 text-crimson-400 mb-1 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-silver-300 font-display">Ready your mind for battle</span>
            <span className="text-[10px] text-silver-500 mt-0.5">Click any cell on the board above to deploy initiative</span>
          </div>
        )}
      </div>

      {/* 2. Standings Matrix (Championship Series Aesthetic) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Left Card: X standing (Victor style ribbon border-r-4) */}
        <div className={`p-4 rounded-xl border-r-4 border border-silver-800/20 transition-all duration-300 flex flex-col justify-between min-h-[100px] ${
          currentPlayer === 'X' && status === 'playing'
            ? 'border-crimson-500 bg-gradient-to-l from-crimson-800/20 to-crimson-950/40 shadow-[0_0_15px_rgba(217,4,41,0.2)]'
            : 'border-[#8B0000] bg-gradient-to-l from-[#8B0000]/10 to-transparent'
        }`}>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gold-400 font-semibold mb-1 truncate">{leftLabel}</p>
            <h3 className="text-white text-sm font-display font-medium uppercase tracking-wide truncate">{displayNameX}</h3>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-xl font-sans font-bold text-white leading-none">
              {gameMode === 'Online' ? (myPlayerSymbol === 'X' ? 'YOU' : 'HOST') : leftWins}
            </span>
            <div className="flex items-center gap-1.5">
              {gameMode !== 'Online' && <span className="text-[9px] font-mono text-silver-450">Win Ratio: {getWinRateX()}</span>}
              {currentPlayer === 'X' && status === 'playing' && (
                <span className="w-2.5 h-2.5 bg-crimson-500 rounded-full shadow-[0_0_8px_#d90429] animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Middle Card: Draws / Standstills */}
        <div className="p-4 rounded-xl border border-silver-800/40 bg-silver-950/40 flex flex-col justify-between min-h-[100px]">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-silver-400 font-semibold mb-1">Standstills</p>
            <h3 className="text-silver-303 text-xs font-space uppercase tracking-wider">Draw Matches</h3>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-xl font-sans font-bold text-silver-300 leading-none">
              {gameMode === 'Online' ? 'LIVE' : draws}
            </span>
            <span className="text-[9px] font-mono text-silver-550">Stable vector</span>
          </div>
        </div>

        {/* Right Card: O standing (Elena style ribbon border-l-4) */}
        <div className={`p-4 rounded-xl border-l-4 border border-silver-800/20 transition-all duration-300 flex flex-col justify-between min-h-[100px] ${
          currentPlayer === 'O' && status === 'playing'
            ? 'border-gold-400 bg-gradient-to-r from-gold-950/20 to-gold-900/10 shadow-[0_0_15px_rgba(212,175,55,0.25)]'
            : 'border-silver-500 bg-gradient-to-r from-silver-950/40 to-transparent'
        }`}>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-silver-400 font-semibold mb-1 truncate w-full">{rightLabel}</p>
            <h3 className="text-white text-sm font-display font-medium uppercase tracking-wide truncate">
              {displayNameO}
            </h3>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-xl font-sans font-bold text-white leading-none">
              {gameMode === 'Online' ? (myPlayerSymbol === 'O' ? 'YOU' : 'GUEST') : rightWins}
            </span>
            <div className="flex items-center gap-1.5">
              {gameMode !== 'Online' && <span className="text-[9px] font-mono text-silver-450">Imperial wins</span>}
              {currentPlayer === 'O' && status === 'playing' && (
                <span className="w-2.5 h-2.5 bg-gold-400 rounded-full shadow-[0_0_8px_#D4AF37] animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Streaks tracker bar */}
      <footer className="bg-silver-950/50 border border-silver-800/40 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-silver-400">
          <TrendingUp className="w-3.5 h-3.5 text-gold-400" />
          <span>Combat Streak: <strong className="text-silver-200">{stats.currentStreak}</strong></span>
        </div>
        <div className="text-silver-500 text-[10px]">
          Best Continuous Reign: <strong className="text-gold-400">{stats.bestStreak}</strong>
        </div>
      </footer>
    </div>
  );
};
