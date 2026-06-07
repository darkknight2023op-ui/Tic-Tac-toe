import React from 'react';
import { ScrollText, ArrowRight, CornerDownRight } from 'lucide-react';
import { MoveRecord, VisualSkin } from '../types';

interface MoveHistoryProps {
  moves: MoveRecord[];
  skin: VisualSkin;
}

const CELL_COORDINATES: { [key: number]: string } = {
  0: 'Top-Left',
  1: 'Top-Center',
  2: 'Top-Right',
  3: 'Middle-Left',
  4: 'True Center',
  5: 'Middle-Right',
  6: 'Bottom-Left',
  7: 'Bottom-Center',
  8: 'Bottom-Right'
};

export const MoveHistory: React.FC<MoveHistoryProps> = ({ moves, skin }) => {
  const getSkinAccent = () => {
    switch (skin) {
      case 'crimson': return 'text-crimson-450 bg-crimson-950/25 border-crimson-900/30';
      case 'gold': return 'text-gold-400 bg-gold-950/15 border-gold-900/30';
      case 'silver': return 'text-silver-250 bg-silver-900/30 border-silver-700/30';
      case 'obsidian': return 'text-neutral-300 bg-neutral-900/50 border-neutral-800';
    }
  };

  return (
    <div id="combat-log" className="w-full bg-silver-950/60 border border-silver-800/40 rounded-2xl p-4 flex flex-col h-[200px] shadow-lg backdrop-blur-md">
      {/* Title */}
      <div className="flex items-center gap-1.5 mb-2 shrink-0">
        <ScrollText className="w-4 h-4 text-silver-400" />
        <h4 className="text-xs font-semibold uppercase tracking-widest text-silver-300 font-space">Tactical Timeline</h4>
      </div>

      {/* Log list empty state */}
      {moves.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-[11px] text-silver-550 italic">
          <span>No moves deployed in this match yet</span>
        </div>
      ) : (
        /* Timeline flow */
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
          {moves.map((move, idx) => {
            const coordinateName = CELL_COORDINATES[move.index] || `Cell ${move.index}`;
            const isX = move.player === 'X';

            return (
              <div 
                key={idx}
                className={`flex items-center justify-between p-2 rounded-lg border text-[11px] font-medium transition-all ${
                  isX 
                    ? 'bg-silver-900/3ame-10 border-silver-800/20 hover:border-silver-700/40 text-silver-300' 
                    : 'bg-gold-500/5 border-gold-950/20 hover:border-gold-900/30 text-silver-300'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-4 h-4 rounded flex items-center justify-center font-display font-black text-[9px] ${
                    isX ? 'bg-silver-200 text-black' : 'bg-gold-500 text-black'
                  }`}>
                    {move.player}
                  </span>
                  <CornerDownRight className="w-3 h-3 text-silver-500 shrink-0" />
                  <span className="truncate">
                    Acquired <strong className={isX ? 'text-silver-200' : 'text-gold-300'}>{coordinateName}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-mono text-silver-500">{move.timestamp}</span>
                  <span className="text-[10px] font-bold text-silver-400">#{idx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
