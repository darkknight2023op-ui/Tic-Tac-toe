import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerSymbol, VisualSkin } from '../types';
import { playHoverTick } from '../lib/audio';

interface SovereignBoardProps {
  board: Array<PlayerSymbol | null>;
  onCellClick: (index: number) => void;
  currentPlayer: PlayerSymbol;
  winnerLine: number[] | null;
  winnerSymbol: PlayerSymbol | 'Draw' | null;
  skin: VisualSkin;
  disabled: boolean;
}

export const SovereignBoard: React.FC<SovereignBoardProps> = ({
  board,
  onCellClick,
  currentPlayer,
  winnerLine,
  winnerSymbol,
  skin,
  disabled
}) => {
  // Styles based on selected visual skin
  const getSkinStyles = () => {
    switch (skin) {
      case 'crimson':
        return {
          gridLine: 'bg-gradient-to-r from-crimson-700 via-crimson-500 to-crimson-700 shadow-[0_0_15px_rgba(217,4,41,0.4)]',
          gridLineV: 'bg-gradient-to-b from-crimson-700 via-crimson-500 to-crimson-700 shadow-[0_0_15px_rgba(217,4,41,0.4)]',
          cellBg: 'bg-silver-900/60 hover:bg-crimson-900/10 border border-silver-800/40',
          xColor: 'stroke-silver-200 drop-shadow-[0_0_8px_rgba(248,249,250,0.6)]',
          oColor: 'stroke-gold-400 drop-shadow-[0_0_8px_rgba(232,202,107,0.6)]',
          winnerCell: 'bg-gradient-to-br from-crimson-900/30 via-crimson-950/40 to-silver-950/30 border-crimson-500/60 shadow-[inset_0_0_15px_rgba(217,4,41,0.25)]',
          strikeColor: 'bg-crimson-500 shadow-[0_0_20px_#d90429]'
        };
      case 'gold':
        return {
          gridLine: 'bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 shadow-[0_0_15px_rgba(212,175,55,0.4)]',
          gridLineV: 'bg-gradient-to-b from-gold-600 via-gold-400 to-gold-600 shadow-[0_0_15px_rgba(212,175,55,0.4)]',
          cellBg: 'bg-black hover:bg-gold-900/10 border border-gold-900/30',
          xColor: 'stroke-gold-500 drop-shadow-[0_0_10px_rgba(212,175,55,0.7)]',
          oColor: 'stroke-silver-300 drop-shadow-[0_0_8px_rgba(206,212,218,0.5)]',
          winnerCell: 'bg-gradient-to-br from-gold-950/20 via-gold-900/10 to-black border-gold-500 shadow-[inset_0_0_15px_rgba(212,175,55,0.2)]',
          strikeColor: 'bg-gold-400 shadow-[0_0_20px_#dbb03c]'
        };
      case 'silver':
        return {
          gridLine: 'bg-gradient-to-r from-silver-600 via-silver-300 to-silver-600 shadow-[0_0_10px_rgba(173,181,189,0.3)]',
          gridLineV: 'bg-gradient-to-b from-silver-600 via-silver-300 to-silver-600 shadow-[0_0_10px_rgba(173,181,189,0.3)]',
          cellBg: 'bg-silver-800/40 hover:bg-silver-700/20 border border-silver-700/40',
          xColor: 'stroke-silver-50 drop-shadow-[0_0_6px_rgba(248,249,250,0.4)]',
          oColor: 'stroke-crimson-400 drop-shadow-[0_0_6px_rgba(217,4,41,0.4)]',
          winnerCell: 'bg-gradient-to-br from-silver-800/20 via-silver-700/35 to-silver-900/20 border-silver-300 shadow-[inset_0_0_15px_rgba(173,181,189,0.15)]',
          strikeColor: 'bg-silver-100 shadow-[0_0_15px_#ced4da]'
        };
      case 'obsidian':
        return {
          gridLine: 'bg-gradient-to-r from-silver-800 via-silver-600 to-silver-800',
          gridLineV: 'bg-gradient-to-b from-silver-800 via-silver-600 to-silver-800',
          cellBg: 'bg-silver-950/90 hover:bg-silver-900/50 border border-silver-800/70',
          xColor: 'stroke-crimson-500 drop-shadow-[0_0_12px_rgba(217,4,41,0.8)]',
          oColor: 'stroke-gold-400 drop-shadow-[0_0_12px_rgba(212,175,55,0.8)]',
          winnerCell: 'bg-silver-900/40 border-silver-650 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]',
          strikeColor: 'bg-gold-500 shadow-[0_0_25px_rgba(212,175,55,0.9)]'
        };
    }
  };

  const style = getSkinStyles();

  // Determine the strike line positioning for winning combos
  const getStrikeLineStyle = () => {
    if (!winnerLine) return null;
    const sorted = [...winnerLine].sort((a, b) => a - b);
    const code = sorted.join(',');

    switch (code) {
      // Rows
      case '0,1,2':
        return 'top-[16.6%] left-[5%] right-[5%] h-1';
      case '3,4,5':
        return 'top-[50%] left-[5%] right-[5%] h-1 -translate-y-1/2';
      case '6,7,8':
        return 'bottom-[16.6%] left-[5%] right-[5%] h-1';
      // Columns
      case '0,3,6':
        return 'left-[16.6%] top-[5%] bottom-[5%] w-1';
      case '1,4,7':
        return 'left-[50%] top-[5%] bottom-[5%] w-1 -translate-x-1/2';
      case '2,5,8':
        return 'right-[16.6%] top-[5%] bottom-[5%] w-1';
      // Diagonals
      case '0,4,8':
        return 'top-[50%] left-[50%] w-[125%] h-1 -translate-x-1/2 -translate-y-1/2 rotate-45 transform-gpu origin-center';
      case '2,4,6':
        return 'top-[50%] left-[50%] w-[125%] h-1 -translate-x-1/2 -translate-y-1/2 -rotate-45 transform-gpu origin-center';
      default:
        return null;
    }
  };

  const strikeStyle = getStrikeLineStyle();

  const getCornerBorderColor = () => {
    switch (skin) {
      case 'crimson': return 'border-crimson-500';
      case 'gold': return 'border-gold-500';
      case 'silver': return 'border-silver-400';
      case 'obsidian': return 'border-silver-500';
    }
  };

  const cornerColor = getCornerBorderColor();

  return (
    <div id="board-container" className="relative w-full max-w-[420px] aspect-square mx-auto rounded-2xl p-4 bg-silver-900/20 border border-silver-800/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Board Frame Decorative Borders (Professional Polish Theme) */}
      <div className={`absolute -inset-1.5 border ${skin === 'crimson' ? 'border-crimson-500/15' : skin === 'gold' ? 'border-gold-400/20' : 'border-silver-500/15'} rounded-3xl pointer-events-none`} />
      <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 ${cornerColor} rounded-tl-2xl pointer-events-none`} />
      <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 ${cornerColor} rounded-tr-2xl pointer-events-none`} />
      <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 ${cornerColor} rounded-bl-2xl pointer-events-none`} />
      <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 ${cornerColor} rounded-br-2xl pointer-events-none`} />

      {/* Visual background subtle shadow effects */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40 rounded-2xl pointer-events-none" />

      {/* Grid Lines - Animated elegantly */}
      <div className="absolute inset-0 p-6 pointer-events-none">
        <div className="relative w-full h-full">
          {/* Horizontal grid lines */}
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`absolute top-1/3 left-0 right-0 h-[3px] rounded-full origin-left ${style.gridLine}`}
          />
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
            className={`absolute top-2/3 left-0 right-0 h-[3px] rounded-full origin-left ${style.gridLine}`}
          />

          {/* Vertical grid lines */}
          <motion.div 
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.05 }}
            className={`absolute top-0 bottom-0 left-1/3 w-[3px] rounded-full origin-top ${style.gridLineV}`}
          />
          <motion.div 
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className={`absolute top-0 bottom-0 left-2/3 w-[3px] rounded-full origin-top ${style.gridLineV}`}
          />
        </div>
      </div>

      {/* Cells Grid */}
      <div className="grid grid-cols-3 grid-rows-3 h-full gap-[9px] relative z-10">
        {board.map((cell, index) => {
          const isWinnerCell = winnerLine && winnerLine.includes(index);
          return (
            <motion.button
              id={`cell-${index}`}
              key={index}
              disabled={disabled || cell !== null}
              onMouseEnter={() => {
                if (cell === null && !disabled) {
                  playHoverTick();
                }
              }}
              onClick={() => onCellClick(index)}
              className={`relative flex items-center justify-center rounded-xl transition-all duration-300 overflow-hidden cursor-pointer selection:bg-transparent ${
                isWinnerCell ? style.winnerCell : style.cellBg
              }`}
              style={{ contentVisibility: 'auto' }}
              whileHover={!disabled && cell === null ? { scale: 1.02 } : {}}
              whileTap={!disabled && cell === null ? { scale: 0.98 } : {}}
            >
              <AnimatePresence mode="wait">
                {cell === null && !disabled && (
                  // Ghost preview mark
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-10 transition-opacity duration-300">
                    {currentPlayer === 'X' ? (
                      <svg className="w-16 h-16 stroke-silver-400 stroke-[5]" viewBox="0 0 100 100" fill="none">
                        <path d="M 25 25 L 75 75 M 75 25 L 25 75 animate-pulse" />
                      </svg>
                    ) : (
                      <svg className="w-16 h-16 stroke-gold-300 stroke-[5]" viewBox="0 0 100 100" fill="none">
                        <circle cx="50" cy="50" r="25" className="animate-pulse" />
                      </svg>
                    )}
                  </div>
                )}

                {cell !== null && (
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0, rotate: cell === 'X' ? -45 : 45 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-4/5 h-4/5 flex items-center justify-center"
                  >
                    {cell === 'X' ? (
                      <svg 
                        className={`w-full h-full stroke-[8] ${style.xColor}`} 
                        viewBox="0 0 100 100" 
                        fill="none"
                        strokeLinecap="round"
                      >
                        {/* Drag and drawing animation for X */}
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          d="M 25 25 L 75 75"
                        />
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}
                          d="M 75 25 L 25 75"
                        />
                      </svg>
                    ) : (
                      <svg 
                        className={`w-full h-full stroke-[8] ${style.oColor}`} 
                        viewBox="0 0 100 100" 
                        fill="none"
                        strokeLinecap="round"
                      >
                        {/* Circular sweep drawing O */}
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          d="M 50 15 A 35 35 0 1 1 49.9 15 Z"
                        />
                      </svg>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Direct visual strike line when winner matched */}
      <AnimatePresence>
        {winnerLine && strikeStyle && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'backOut' }}
            className={`absolute rounded-full z-20 pointer-events-none ${style.strikeColor} ${strikeStyle}`}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
