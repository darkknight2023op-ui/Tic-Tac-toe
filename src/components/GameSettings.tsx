import React, { startTransition } from 'react';
import { 
  Users, 
  Cpu, 
  Globe,
  Volume2, 
  VolumeX, 
  Sparkles, 
  RotateCcw, 
  ShieldAlert,
  Flame,
  Info
} from 'lucide-react';
import { GameMode, Difficulty, VisualSkin, SoundConfig } from '../types';
import { playClick } from '../lib/audio';

interface GameSettingsProps {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  difficulty: Difficulty;
  setDifficulty: (diff: Difficulty) => void;
  skin: VisualSkin;
  setSkin: (skin: VisualSkin) => void;
  soundConfig: SoundConfig;
  setSoundConfig: (config: SoundConfig | ((prev: SoundConfig) => SoundConfig)) => void;
  onResetStats: () => void;
}

export const GameSettings: React.FC<GameSettingsProps> = ({
  gameMode,
  setGameMode,
  difficulty,
  setDifficulty,
  skin,
  setSkin,
  soundConfig,
  setSoundConfig,
  onResetStats
}) => {
  const toggleSound = () => {
    playClick();
    setSoundConfig((prev) => ({
      ...prev,
      masterEnabled: !prev.masterEnabled
    }));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setSoundConfig((prev) => ({
      ...prev,
      fxVolume: vol
    }));
  };

  const selectMode = (mode: GameMode) => {
    if (mode !== gameMode) {
      playClick();
      setGameMode(mode);
    }
  };

  const selectDiff = (diff: Difficulty) => {
    if (diff !== difficulty) {
      playClick();
      setDifficulty(diff);
    }
  };

  const selectSkin = (selectedSkin: VisualSkin) => {
    if (selectedSkin !== skin) {
      playClick();
      // Visual skins change should render immediately
      startTransition(() => {
        setSkin(selectedSkin);
      });
    }
  };

  return (
    <div id="game-controls" className="w-full bg-silver-950/60 border border-silver-800/40 rounded-2xl p-5 md:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.3)] backdrop-blur-md">
      {/* Visual Identity Title */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-gold-500 animate-pulse" />
        <h3 className="font-display text-base font-semibold tracking-wide text-silver-100">Sovereign Controls</h3>
      </div>

      <div className="space-y-5">
        {/* Duel Mode Toggle (Championship Format) */}
        <section className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-silver-450 block">Game Arena</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              id="mode-pvp-btn"
              onClick={() => selectMode('PvP')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                gameMode === 'PvP'
                  ? 'bg-crimson-600/20 border-crimson-500 text-crimson-400 shadow-[0_0_15px_rgba(217,4,41,0.15)]'
                  : 'bg-silver-950/40 border-silver-850 text-silver-305 hover:bg-silver-900/80'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pass & Play</span>
            </button>
            <button
              id="mode-ai-btn"
              onClick={() => selectMode('AI')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                gameMode === 'AI'
                  ? 'bg-gold-500/10 border-gold-500 text-gold-400 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                  : 'bg-silver-950/40 border-silver-850 text-silver-305 hover:bg-silver-900/80'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Sovereign AI</span>
            </button>
            <button
              id="mode-online-btn"
              onClick={() => selectMode('Online')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                gameMode === 'Online'
                  ? 'bg-sky-500/15 border-sky-550 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                  : 'bg-silver-950/40 border-silver-850 text-silver-305 hover:bg-silver-900/80'
              }`}
            >
              <Globe className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Online Arena</span>
            </button>
          </div>
        </section>

        {/* AI Complexity Levels */}
        {gameMode === 'AI' && (
          <section className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-silver-400 block">AI Intelligence</label>
            <div className="grid grid-cols-4 gap-2">
              {(['easy', 'medium', 'hard', 'chaos'] as Difficulty[]).map((diff) => {
                const getDiffStyle = () => {
                  if (difficulty !== diff) {
                    return 'bg-silver-905/30 border-silver-800/60 text-silver-400 hover:bg-silver-900/50';
                  }
                  switch (diff) {
                    case 'easy':
                      return 'bg-silver-500/10 border-silver-400 text-silver-200';
                    case 'medium':
                      return 'bg-blue-600/10 border-blue-500/80 text-blue-400';
                    case 'hard':
                      return 'bg-gold-500/20 border-gold-500 text-gold-400 shadow-[0_0_10px_rgba(212,175,55,0.15)]';
                    case 'chaos':
                      return 'bg-crimson-600/25 border-crimson-500 text-crimson-400 animate-pulse shadow-[0_0_12px_rgba(217,4,41,0.2)]';
                  }
                };

                return (
                  <button
                    id={`diff-${diff}-btn`}
                    key={diff}
                    onClick={() => selectDiff(diff)}
                    className={`py-2 rounded-lg border text-[11px] font-semibold uppercase tracking-widest transition-all cursor-pointer ${getDiffStyle()}`}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
            {difficulty === 'chaos' && (
              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-crimson-950/20 border border-crimson-900/20 text-[10px] text-crimson-300/80">
                <Flame className="w-3.5 h-3.5 text-crimson-400 shrink-0 mt-0.5" />
                <span>Chaos AI will act unpredictably. Be prepared for sudden blunders or flash-moves.</span>
              </div>
            )}
          </section>
        )}

        {/* Visual Skin Customizer - Red, Black (Obsidian), Gold, Silver */}
        <section className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-silver-400 block">Sovereign Skin</label>
          <div className="grid grid-cols-4 gap-2">
            {(['crimson', 'gold', 'silver', 'obsidian'] as VisualSkin[]).map((s) => {
              const getSkinBtnStyles = () => {
                const base = "flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border text-[10px] font-medium tracking-wide uppercase transition-all cursor-pointer ";
                const act = s === skin;
                switch (s) {
                  case 'crimson':
                    return base + (act 
                      ? 'bg-crimson-600/30 border-crimson-500 text-crimson-400 shadow-lg shadow-crimson-950/50' 
                      : 'bg-silver-900/25 border-silver-800/40 text-silver-400 hover:text-crimson-400 hover:border-crimson-800');
                  case 'gold':
                    return base + (act 
                      ? 'bg-gold-500/20 border-gold-500 text-gold-400 shadow-lg shadow-gold-950/20' 
                      : 'bg-silver-900/25 border-silver-800/40 text-silver-400 hover:text-gold-400 hover:border-gold-800');
                  case 'silver':
                    return base + (act 
                      ? 'bg-silver-300/10 border-silver-400 text-silver-250 shadow-lg shadow-silver-950/35' 
                      : 'bg-silver-900/25 border-silver-800/40 text-silver-400 hover:text-silver-300 hover:border-silver-500');
                  case 'obsidian':
                    return base + (act 
                      ? 'bg-black border-silver-600 text-silver-200 shadow-lg shadow-black/80' 
                      : 'bg-silver-900/25 border-silver-800/40 text-silver-400 hover:text-silver-300 hover:border-silver-700');
                }
              };

              // Skin circular indicators
              const getSkinDot = () => {
                switch (s) {
                  case 'crimson': return 'bg-crimson-500';
                  case 'gold': return 'bg-gold-400';
                  case 'silver': return 'bg-silver-300';
                  case 'obsidian': return 'bg-neutral-800 border border-silver-600';
                }
              };

              return (
                <button
                  id={`skin-${s}-btn`}
                  key={s}
                  onClick={() => selectSkin(s)}
                  className={getSkinBtnStyles()}
                >
                  <span className={`w-3 h-3 rounded-full ${getSkinDot()}`} />
                  <span>{s}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Audio controls */}
        <section className="space-y-2 border-t border-silver-800/40 pt-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-silver-400">Tactile Acoustics</label>
            <button
              id="sound-mute-toggle"
              onClick={toggleSound}
              className="text-silver-400 hover:text-silver-100 transition-colors p-1 rounded-md cursor-pointer"
              title={soundConfig.masterEnabled ? 'Mute' : 'Unmute'}
            >
              {soundConfig.masterEnabled && soundConfig.fxVolume > 0 ? (
                <Volume2 className="w-4 h-4 text-gold-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-crimson-500" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <VolumeX className="w-3.5 h-3.5 text-silver-600 shrink-0" />
            <input
              id="sound-vol-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundConfig.fxVolume}
              onChange={handleVolumeChange}
              disabled={!soundConfig.masterEnabled}
              className="w-full xl:w-[220px] h-1.5 rounded-lg bg-silver-900 accent-gold-500 cursor-pointer disabled:opacity-40"
            />
            <Volume2 className="w-3.5 h-3.5 text-silver-400 shrink-0" />
          </div>
        </section>

        {/* Reset utilities */}
        <div className="pt-2 flex gap-2">
          <button
            id="reset-stats-btn"
            onClick={() => {
              playClick();
              onResetStats();
            }}
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-silver-900/60 hover:bg-crimson-900/10 border border-silver-800 hover:border-crimson-800/40 rounded-xl text-xs text-silver-300 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Win Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};
