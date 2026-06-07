import { Difficulty, PlayerSymbol } from '../types';

// Helper to check for a winner on a flat board array
export function checkWinnerFlat(board: Array<string | null>): { winner: PlayerSymbol | 'Draw' | null; line: number[] | null } {
  const winningLines = [
    [0, 1, 2], // Row 1
    [3, 4, 5], // Row 2
    [6, 7, 8], // Row 3
    [0, 3, 6], // Col 1
    [1, 4, 7], // Col 2
    [2, 5, 8], // Col 3
    [0, 4, 8], // Diag 1
    [2, 4, 6], // Diag 2
  ];

  for (let i = 0; i < winningLines.length; i++) {
    const [a, b, c] = winningLines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as PlayerSymbol, line: winningLines[i] };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: 'Draw', line: null };
  }

  return { winner: null, line: null };
}

// Check if any moves are left
const isMovesLeft = (board: Array<string | null>): boolean => {
  return board.some((cell) => cell === null);
};

// Evaluate the board score for minimax
// AI is 'O', Human is 'X'
const evaluateBoard = (board: Array<string | null>, aiSymbol: PlayerSymbol): number => {
  const opponentSymbol: PlayerSymbol = aiSymbol === 'O' ? 'X' : 'O';
  const { winner } = checkWinnerFlat(board);

  if (winner === aiSymbol) {
    return 10;
  } else if (winner === opponentSymbol) {
    return -10;
  }
  return 0;
};

// Standard Minimax with Alpha-Beta pruning or standard optimal depth search
const minimax = (
  board: Array<string | null>,
  depth: number,
  isMax: boolean,
  aiSymbol: PlayerSymbol
): number => {
  const score = evaluateBoard(board, aiSymbol);
  const opponentSymbol: PlayerSymbol = aiSymbol === 'O' ? 'X' : 'O';

  // If Maximizer has won
  if (score === 10) return score - depth;

  // If Minimizer has won
  if (score === -10) return score + depth;

  // If no more moves are available, it's a draw
  if (!isMovesLeft(board)) return 0;

  if (isMax) {
    let best = -1000;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiSymbol;
        best = Math.max(best, minimax(board, depth + 1, false, aiSymbol));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = 1000;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = opponentSymbol;
        best = Math.min(best, minimax(board, depth + 1, true, aiSymbol));
        board[i] = null;
      }
    }
    return best;
  }
};

// Computes the best move for the AI using minimax logic
export function getBestMove(board: Array<string | null>, aiSymbol: PlayerSymbol): number {
  let bestVal = -1000;
  let bestMove = -11;

  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = aiSymbol;
      const moveVal = minimax(board, 0, false, aiSymbol);
      board[i] = null;

      if (moveVal > bestVal) {
        bestMove = i;
        bestVal = moveVal;
      }
    }
  }

  return bestMove >= 0 ? bestMove : getRandomMove(board);
}

// Get a completely random available move
export function getRandomMove(board: Array<string | null>): number {
  const availableIndices: number[] = [];
  board.forEach((cell, idx) => {
    if (cell === null) {
      availableIndices.push(idx);
    }
  });

  if (availableIndices.length === 0) return -1;
  const randomIndex = Math.floor(Math.random() * availableIndices.length);
  return availableIndices[randomIndex];
}

// Combined decision core
export function calculateAIMove(
  board: Array<string | null>,
  difficulty: Difficulty,
  aiSymbol: PlayerSymbol
): number {
  const availableCount = board.filter((cell) => cell === null).length;
  if (availableCount === 0) return -1;

  // Always win instantly or block opponent from winning if a potential move exists (tactical heuristic)
  const opponentSymbol: PlayerSymbol = aiSymbol === 'O' ? 'X' : 'O';

  // 1. Can AI win in one move?
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const copyBoard = [...board];
      copyBoard[i] = aiSymbol;
      if (checkWinnerFlat(copyBoard).winner === aiSymbol) {
        return i;
      }
    }
  }

  // 2. Can opponent win in one move? If so, block them!
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const copyBoard = [...board];
      copyBoard[i] = opponentSymbol;
      if (checkWinnerFlat(copyBoard).winner === opponentSymbol) {
        return i;
      }
    }
  }

  switch (difficulty) {
    case 'easy':
      // 100% random
      return getRandomMove(board);

    case 'medium':
      // 60% standard best move, 40% random move
      if (Math.random() < 0.6) {
        return getBestMove(board, aiSymbol);
      } else {
        return getRandomMove(board);
      }

    case 'hard':
      // 100% unbeatable minimax
      return getBestMove(board, aiSymbol);

    case 'chaos':
      // Wild chaotic shifts!
      // 25% makes a completely arbitrary random move
      // 75% tries to play optimal, but if it has center or corner it might make unpredictable moves
      if (Math.random() < 0.25) {
        return getRandomMove(board);
      } else {
        return getBestMove(board, aiSymbol);
      }

    default:
      return getBestMove(board, aiSymbol);
  }
}
