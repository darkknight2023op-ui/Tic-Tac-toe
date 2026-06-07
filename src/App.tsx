import { useState, useEffect, useRef, useTransition, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  RotateCcw, 
  HelpCircle, 
  Sparkles, 
  Check, 
  Radio, 
  Share2, 
  Lightbulb,
  Volume2,
  VolumeX,
  Copy,
  LogOut,
  Wifi,
  WifiOff
} from 'lucide-react';
import { SovereignBoard } from './components/SovereignBoard';
import { GameSettings } from './components/GameSettings';
import { ScoreBoard } from './components/ScoreBoard';
import { MoveHistory } from './components/MoveHistory';
import { OnlineLobby } from './components/OnlineLobby';
import { checkWinnerFlat, calculateAIMove } from './lib/ai';
import { 
  db, 
  auth, 
  ensureSignedIn, 
  signInWithGoogle,
  OperationType, 
  handleFirestoreError 
} from './lib/firebase';
import { 
  doc, 
  setDoc, 
  updateDoc,
  getDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  playMoveSound, 
  playWinnerSound, 
  playDrawSound, 
  playRestartSound, 
  playClick, 
  playErrorSound,
  updateAudioSettings,
  startAmbientDrone,
  stopAmbientDrone
} from './lib/audio';
import { PlayerSymbol, GameMode, Difficulty, VisualSkin, GameStats, MoveRecord, SoundConfig } from './types';

export default function App() {
  const [isPending, startTransition] = useTransition();

  // 1. Core States
  const [board, setBoard] = useState<Array<PlayerSymbol | null>>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<PlayerSymbol>('X');
  const [status, setStatus] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [winnerSymbol, setWinnerSymbol] = useState<PlayerSymbol | 'Draw' | null>(null);
  const [winnerLine, setWinnerLine] = useState<number[] | null>(null);
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [isAiCalculating, setIsAiCalculating] = useState<boolean>(false);

  // Rematching & starting turns
  const [startingPlayerRule, setStartingPlayerRule] = useState<'X' | 'O' | 'alternate'>('alternate');
  const [lastGameStarter, setLastGameStarter] = useState<PlayerSymbol>('O'); // So first game starts with X if alternate

  // 2. Customizers
  const [gameMode, setGameMode] = useState<GameMode>('AI');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [skin, setSkin] = useState<VisualSkin>('crimson');
  const [isRulesExpanded, setIsRulesExpanded] = useState<boolean>(false);

  // 3. Stats State with standard initializers
  const [stats, setStats] = useState<GameStats>({
    pvpXWins: 0,
    pvpOWins: 0,
    pvpDraws: 0,
    aiXWins: 0,
    aiOWins: 0,
    aiDraws: 0,
    currentStreak: 0,
    bestStreak: 0
  });

  // 4. Acoustic Audio configurations
  const [soundConfig, setSoundConfig] = useState<SoundConfig>({
    masterEnabled: true,
    fxVolume: 0.6,
    ambientEnabled: false
  });

  // Share Notification State
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // 5. Firebase Online Lobby & Multiplayer Custom states
  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      return localStorage.getItem('sovereign_ttt_player_name') || `Sovereign #${Math.floor(1000 + Math.random() * 9000)}`;
    } catch {
      return `Sovereign #${Math.floor(1000 + Math.random() * 9000)}`;
    }
  });
  const [onlineMatchId, setOnlineMatchId] = useState<string>('');
  const [myPlayerSymbol, setMyPlayerSymbol] = useState<PlayerSymbol | null>(null);
  const [lobbyRoomCode, setLobbyRoomCode] = useState<string>('');
  const [onlineOpponentName, setOnlineOpponentName] = useState<string>('');
  const [creatorName, setCreatorName] = useState<string>('');
  const [isLobbyConnecting, setIsLobbyConnecting] = useState<boolean>(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);
  const [authUserInfo, setAuthUserInfo] = useState<{ uid: string; displayName: string | null; isAnonymous: boolean } | null>(null);

  // Synchronize authentication status with state reactively
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUserInfo({
          uid: user.uid,
          displayName: user.displayName,
          isAnonymous: user.isAnonymous
        });
        if (user.displayName) {
          setPlayerName(user.displayName);
          localStorage.setItem('sovereign_ttt_player_name', user.displayName);
        }
      } else {
        setAuthUserInfo(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Canvas context reference for custom skin-flowing animations
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- LOCAL PERSISTENCE LOADER ---
  useEffect(() => {
    try {
      const storedStats = localStorage.getItem('sovereign_ttt_stats_v3');
      if (storedStats) {
        setStats(JSON.parse(storedStats));
      }
      const storedSkin = localStorage.getItem('sovereign_ttt_skin');
      if (storedSkin) {
        setSkin(storedSkin as VisualSkin);
      }
      const storedMode = localStorage.getItem('sovereign_ttt_mode');
      if (storedMode) {
        setGameMode(storedMode as GameMode);
      }
      const storedDiff = localStorage.getItem('sovereign_ttt_diff');
      if (storedDiff) {
        setDifficulty(storedDiff as Difficulty);
      }
      const storedSound = localStorage.getItem('sovereign_ttt_sound');
      if (storedSound) {
        const parsed = JSON.parse(storedSound);
        setSoundConfig(parsed);
      }
    } catch (e) {
      console.warn('Persistency disabled or blocked by sandbox rules');
    }
  }, []);

  // --- SAVE PERSISTENCE SHIFTS ---
  useEffect(() => {
    try {
      localStorage.setItem('sovereign_ttt_stats_v3', JSON.stringify(stats));
    } catch (e) {}
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('sovereign_ttt_skin', skin);
    if (gameMode === 'Online' && onlineMatchId && myPlayerSymbol === 'X') {
      const matchDocRef = doc(db, 'matches', onlineMatchId);
      updateDoc(matchDocRef, { skin, updatedAt: serverTimestamp() }).catch(console.error);
    }
  }, [skin, gameMode, onlineMatchId, myPlayerSymbol]);

  useEffect(() => {
    try {
      localStorage.setItem('sovereign_ttt_player_name', playerName);
    } catch (e) {}
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('sovereign_ttt_mode', gameMode);
  }, [gameMode]);

  useEffect(() => {
    localStorage.setItem('sovereign_ttt_diff', difficulty);
    // Restart match if difficulty changes for AI to sync cleanly
    resetMatchGrid();
  }, [difficulty]);

  useEffect(() => {
    localStorage.setItem('sovereign_ttt_sound', JSON.stringify(soundConfig));
    updateAudioSettings(!soundConfig.masterEnabled, soundConfig.fxVolume);
    
    // Ambient back-drone handling
    if (soundConfig.masterEnabled && soundConfig.ambientEnabled) {
      startAmbientDrone();
    } else {
      stopAmbientDrone();
    }
  }, [soundConfig]);

  // Clean ambient audio context on shutdown
  useEffect(() => {
    return () => {
      stopAmbientDrone();
    };
  }, []);

  // --- ONLINE REAL-TIME DUEL ACTIONS ---
  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createOnlineRoom = async () => {
    if (!playerName.trim()) {
      triggerToastNotification("Sovereign Name cannot be empty.");
      return;
    }
    setIsLobbyConnecting(true);
    playClick();

    try {
      const user = await ensureSignedIn(playerName);
      setAuthErrorMsg(null);
      const code = generateRoomCode();
      const matchDocRef = doc(db, 'matches', code);

      const initialMatch = {
        roomId: code,
        challengerId: user.uid,
        challengerName: playerName.trim(),
        opponentId: '',
        opponentName: '',
        boardState: Array(9).fill(''),
        activePlayer: 'X',
        status: 'waiting',
        winnerSymbol: '',
        skin: skin,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(matchDocRef, initialMatch);

      setOnlineMatchId(code);
      setMyPlayerSymbol('X');
      setBoard(Array(9).fill(null));
      setWinnerSymbol(null);
      setWinnerLine(null);
      setStatus('idle');
      triggerToastNotification("Arena room established! Code: " + code);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/admin-restricted-operation' || err?.message?.includes('admin-restricted-operation')) {
        setAuthErrorMsg("Anonymous sign-in is deactivated by default Firebase console policies.");
        triggerToastNotification("Guest access restricted. Try Sign In with Google!");
      } else {
        triggerToastNotification("Establishing realm failed.");
      }
    } finally {
      setIsLobbyConnecting(false);
    }
  };

  const joinOnlineRoom = async () => {
    const formattedCode = lobbyRoomCode.trim().toUpperCase();
    if (!playerName.trim()) {
      triggerToastNotification("Sovereign Name cannot be empty.");
      return;
    }
    if (!formattedCode) {
      triggerToastNotification("Realm Code cannot be empty.");
      return;
    }
    setIsLobbyConnecting(true);
    playClick();

    try {
      const user = await ensureSignedIn(playerName);
      setAuthErrorMsg(null);
      const matchDocRef = doc(db, 'matches', formattedCode);
      const matchDoc = await getDoc(matchDocRef);

      if (!matchDoc.exists()) {
        triggerToastNotification("Sovereign match code not found.");
        setIsLobbyConnecting(false);
        return;
      }

      const data = matchDoc.data();
      if (data.status !== 'waiting' || data.opponentId !== '') {
        triggerToastNotification("Arena list is full or already playing.");
        setIsLobbyConnecting(false);
        return;
      }

      // Join Match using precise updateDoc to target only Action 1 fields
      await updateDoc(matchDocRef, {
        opponentId: user.uid,
        opponentName: playerName.trim(),
        status: 'playing',
        updatedAt: serverTimestamp()
      });

      setOnlineMatchId(formattedCode);
      setMyPlayerSymbol('O');
      setBoard(data.boardState.map((val: string) => val === '' ? null : val));
      setWinnerSymbol(null);
      setWinnerLine(null);
      setStatus('playing');
      setSkin(data.skin || skin);
      triggerToastNotification("Joined match chamber successfully!");
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/admin-restricted-operation' || err?.message?.includes('admin-restricted-operation')) {
        setAuthErrorMsg("Anonymous sign-in is deactivated by default Firebase console policies.");
        triggerToastNotification("Guest access restricted. Try Sign In with Google!");
      } else {
        triggerToastNotification("Joining realm chamber failed.");
      }
    } finally {
      setIsLobbyConnecting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLobbyConnecting(true);
    setAuthErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      triggerToastNotification(`Welcome as ${user.displayName || 'Sovereign'}!`);
    } catch (err: any) {
      console.error(err);
      triggerToastNotification("Google Sign-In failed or was cancelled.");
    } finally {
      setIsLobbyConnecting(false);
    }
  };

  const handleSignOut = async () => {
    setIsLobbyConnecting(true);
    try {
      await signOut(auth);
      setPlayerName(`Sovereign #${Math.floor(1000 + Math.random() * 9000)}`);
      triggerToastNotification("Signed out successfully.");
    } catch (err) {
      console.error(err);
      triggerToastNotification("Sign-out failed.");
    } finally {
      setIsLobbyConnecting(false);
    }
  };

  const exitOnlineRoom = () => {
    setOnlineMatchId('');
    setMyPlayerSymbol(null);
    setBoard(Array(9).fill(null));
    setStatus('idle');
    setWinnerSymbol(null);
    setWinnerLine(null);
  };

  const executeOnlineMove = async (index: number) => {
    const nextBoard = board.map((cell, i) => (i === index ? myPlayerSymbol : cell));
    const { winner, line } = checkWinnerFlat(nextBoard);
    let fireWinner: string = '';
    let nextStatus: string = 'playing';

    if (winner) {
      nextStatus = 'ended';
      fireWinner = winner === 'Draw' ? 'draw' : winner;
    }

    const matchDocRef = doc(db, 'matches', onlineMatchId);
    const fireBoardState = nextBoard.map((val) => val === null ? '' : val);

    try {
      await setDoc(matchDocRef, {
        boardState: fireBoardState,
        activePlayer: currentPlayer === 'X' ? 'O' : 'X',
        status: nextStatus,
        winnerSymbol: fireWinner,
        updatedAt: serverTimestamp()
      }, { merge: true });

      playMoveSound(myPlayerSymbol!);
    } catch (err) {
      console.error(err);
      triggerToastNotification("Synchronization error.");
    }
  };

  // --- REAL-TIME FIRESTORE MATCH LISTENER ---
  useEffect(() => {
    if (gameMode !== 'Online' || !onlineMatchId) return;

    const matchDocRef = doc(db, 'matches', onlineMatchId);

    const unsubscribe = onSnapshot(
      matchDocRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          triggerToastNotification("Arena match was dissolved.");
          exitOnlineRoom();
          return;
        }

        const data = docSnap.data();
        
        // Sync skin if host changed it
        if (data.skin && data.skin !== skin) {
          setSkin(data.skin);
        }

        // Reconstruct Board State
        if (data.boardState) {
          setBoard(data.boardState.map((val: string) => {
            if (val === 'X') return 'X';
            if (val === 'O') return 'O';
            return null;
          }));
        }

        // Sync turn state
        if (data.activePlayer) {
          setCurrentPlayer(data.activePlayer);
        }

        // Sync game status
        if (data.status) {
          setStatus(data.status as any);
        }

        // Sync winner
        if (data.winnerSymbol) {
          if (data.winnerSymbol === 'draw') {
             setWinnerSymbol('Draw');
             setWinnerLine(null);
          } else {
             setWinnerSymbol(data.winnerSymbol);
             // Re-evaluate line locally to draw striking line
             const { line } = checkWinnerFlat(data.boardState.map((val: string) => {
               if (val === 'X') return 'X';
               if (val === 'O') return 'O';
               return null;
             }));
             setWinnerLine(line);
          }
        } else {
          setWinnerSymbol(null);
          setWinnerLine(null);
        }

        // Sync player names
        if (myPlayerSymbol === 'X') {
          setOnlineOpponentName(data.opponentName || '');
          setCreatorName(data.challengerName);
        } else {
          setOnlineOpponentName(data.challengerName || '');
          setCreatorName(data.challengerName);
        }

        // Highlight joins
        if (data.status === 'playing' && status === 'idle') {
          playRestartSound();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `matches/${onlineMatchId}`);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [onlineMatchId, gameMode, myPlayerSymbol]);

  // --- AMBIENT CANVAS DRAW SYSTEM ---
  // Paints dynamic slow glowing light reflections matching the responsive screen skin (Red, Black, Gold, Silver)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Particle class for dynamic sparks
    class Particle {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      speedX: number = 0;
      speedY: number = 0;
      alpha: number = 0;
      decay: number = 0;

      constructor() {
        this.reset();
        this.y = Math.random() * height; // Distribute initially
      }

      reset() {
        this.x = Math.random() * width;
        this.y = height + 10;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = -(Math.random() * 0.6 + 0.2);
        this.alpha = Math.random() * 0.5 + 0.1;
        this.decay = Math.random() * 0.002 + 0.001;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= this.decay;
        if (this.alpha <= 0 || this.y < -10) {
          this.reset();
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = getParticleColor();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const getParticleColor = () => {
      switch (skin) {
        case 'crimson': return '#d90429';
        case 'gold': return '#d4af37';
        case 'silver': return '#ced4da';
        case 'obsidian': return '#780000';
      }
    };

    const getGlowGradient = () => {
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        Math.max(width, height)
      );

      switch (skin) {
        case 'crimson':
          gradient.addColorStop(0, 'rgba(26, 4, 10, 0.9)');
          gradient.addColorStop(1, 'rgba(7, 1, 2, 0.98)');
          break;
        case 'gold':
          gradient.addColorStop(0, 'rgba(15, 12, 4, 0.9)');
          gradient.addColorStop(1, 'rgba(4, 3, 1, 0.98)');
          break;
        case 'silver':
          gradient.addColorStop(0, 'rgba(15, 17, 22, 0.91)');
          gradient.addColorStop(1, 'rgba(8, 9, 12, 0.98)');
          break;
        case 'obsidian':
          gradient.addColorStop(0, 'rgba(11, 12, 16, 0.95)');
          gradient.addColorStop(1, 'rgba(2, 3, 5, 1)');
          break;
      }
      return gradient;
    };

    const particles: Particle[] = Array.from({ length: 45 }, () => new Particle());

    const draw = () => {
      ctx.globalAlpha = 1;
      ctx.fillStyle = getGlowGradient();
      ctx.fillRect(0, 0, width, height);

      // Draw flowing background subtle light beams
      const time = Date.now() * 0.0005;
      ctx.strokeStyle = getParticleColor();
      ctx.lineWidth = 1;
      
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(time * 0.05);
      
      // Light sweeps
      for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = 0.025;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-width, -height / 2 + i * 200);
        ctx.lineTo(-width, height / 2 + i * 200);
        ctx.closePath();
        ctx.fillStyle = getParticleColor();
        ctx.fill();
      }
      ctx.restore();

      // Render flowing energy embers
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      rId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rId);
      window.removeEventListener('resize', handleResize);
    };
  }, [skin]);

  // --- DYNAMIC CORE GAMEPLAY CORE ---

  // Main cell submission
  const handleCellClick = (index: number) => {
    // Blocks if cell is loaded, AI is thinking, or match is paused
    if (board[index] !== null || status === 'ended' || isAiCalculating) {
      playErrorSound();
      return;
    }

    if (gameMode === 'Online') {
      if (!onlineMatchId) {
        triggerToastNotification("No active online room selected.");
        return;
      }
      if (onlineOpponentName === '') {
        triggerToastNotification("Please wait for an opponent to enter.");
        return;
      }
      if (currentPlayer !== myPlayerSymbol) {
        triggerToastNotification("Not your turn cycle! Wait for opponent.");
        return;
      }
      executeOnlineMove(index);
    } else {
      executeMove(index, currentPlayer);
    }
  };

  const getStartingPlayer = (): PlayerSymbol => {
    if (startingPlayerRule === 'X') return 'X';
    if (startingPlayerRule === 'O') return 'O';
    // Alternate starter
    return lastGameStarter === 'X' ? 'O' : 'X';
  };

  // Triggers move placement on state matrix
  const executeMove = (index: number, player: PlayerSymbol) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newRecord: MoveRecord = { index, player, timestamp };

    const nextBoard = [...board];
    nextBoard[index] = player;

    setBoard(nextBoard);
    setMoves((prev) => [...prev, newRecord]);
    setStatus('playing');
    playMoveSound(player);

    // Inspect outcome ratios
    const { winner, line } = checkWinnerFlat(nextBoard);

    if (winner) {
      setWinnerSymbol(winner);
      setWinnerLine(line);
      setStatus('ended');
      
      // Resolve statistics
      resolveGameOutcome(winner);
    } else {
      // Rotate active initiative
      setCurrentPlayer(player === 'X' ? 'O' : 'X');
    }
  };

  // Triggers AI move action when current turn calls O under AI-arena mode
  useEffect(() => {
    if (gameMode !== 'AI' || status === 'ended') return;

    // AI is always Player 'O' in tournament context
    if (currentPlayer === 'O') {
      setIsAiCalculating(true);

      // Creative "pondering delay" to simulate deep analytical calculations
      // Longer variations under chaos mode
      const delay = difficulty === 'chaos' 
        ? Math.floor(Math.random() * 1100) + 200 
        : Math.floor(Math.random() * 450) + 400;

      const aiTimer = setTimeout(() => {
        const bestMoveIndex = calculateAIMove(board, difficulty, 'O');
        
        if (bestMoveIndex >= 0 && board[bestMoveIndex] === null) {
          executeMove(bestMoveIndex, 'O');
        }
        setIsAiCalculating(false);
      }, delay);

      return () => clearTimeout(aiTimer);
    }
  }, [board, currentPlayer, gameMode, difficulty, status]);

  // Manage win ratios, continuous streaks, and metadata logs
  const resolveGameOutcome = (outcome: PlayerSymbol | 'Draw') => {
    if (outcome === 'Draw') {
      playDrawSound();
      setStats((prev) => ({
        ...prev,
        pvpDraws: gameMode === 'PvP' ? prev.pvpDraws + 1 : prev.pvpDraws,
        aiDraws: gameMode === 'AI' ? prev.aiDraws + 1 : prev.aiDraws,
        currentStreak: 0 // Draw resets streak
      }));
    } else if (outcome === 'X') {
      // User won or Player X won
      playWinnerSound();
      
      setStats((prev) => {
        const streak = prev.currentStreak + 1;
        return {
          ...prev,
          pvpXWins: gameMode === 'PvP' ? prev.pvpXWins + 1 : prev.pvpXWins,
          aiXWins: gameMode === 'AI' ? prev.aiXWins + 1 : prev.aiXWins,
          currentStreak: streak,
          bestStreak: Math.max(prev.bestStreak, streak)
        };
      });
    } else if (outcome === 'O') {
      // Player O or AI won
      if (gameMode === 'AI') {
        // AI wins, beats the human. Play somber draw/error theme or basic sound
        playDrawSound();
      } else {
        // Pass & Play Player O wins, triumphant fanfare
        playWinnerSound();
      }

      setStats((prev) => ({
        ...prev,
        pvpOWins: gameMode === 'PvP' ? prev.pvpOWins + 1 : prev.pvpOWins,
        aiOWins: gameMode === 'AI' ? prev.aiOWins + 1 : prev.aiOWins,
        currentStreak: 0 // AI/O win breaks Player X streak
      }));
    }
  };

  // Restart active tournament grid (re-zeroes grid matrix but preserves global win scores)
  const resetMatchGrid = async () => {
    playRestartSound();
    
    if (gameMode === 'Online') {
      if (!onlineMatchId) return;
      if (myPlayerSymbol !== 'X') {
        triggerToastNotification("Only Host (Player X) can restart the round.");
        return;
      }
      
      const matchDocRef = doc(db, 'matches', onlineMatchId);
      try {
        await setDoc(matchDocRef, {
          boardState: Array(9).fill(''),
          activePlayer: 'X',
          status: 'playing',
          winnerSymbol: '',
          updatedAt: serverTimestamp()
        }, { merge: true });
        triggerToastNotification("Round reset triggered!");
      } catch (err) {
        console.error(err);
        triggerToastNotification("Failed to reset Arena.");
      }
    } else {
      // Choose starting initiative based on rules
      const nextFirstMover = getStartingPlayer();
      
      setBoard(Array(9).fill(null));
      setWinnerSymbol(null);
      setWinnerLine(null);
      setStatus('idle');
      setMoves([]);
      setIsAiCalculating(false);
      setCurrentPlayer(nextFirstMover);

      // Cache last starter for alternating rules
      setLastGameStarter(nextFirstMover);
    }
  };

  // Complete reset (wipes grid AND stats trackers back to default)
  const handleResetWins = () => {
    setStats({
      pvpXWins: 0,
      pvpOWins: 0,
      pvpDraws: 0,
      aiXWins: 0,
      aiOWins: 0,
      aiDraws: 0,
      currentStreak: 0,
      bestStreak: 0
    });
    triggerToastNotification('Win record successfully cleared');
  };

  // Copy current shared app link dynamically to simulated copybuffer
  const shareMatchStats = async () => {
    playClick();
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      triggerToastNotification('App Link copied to clipboard!');
    } catch (err) {
      triggerToastNotification('Sharing is restricted by frame sandboxes');
    }
  };

  const triggerToastNotification = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification(null);
    }, 3000);
  };

  // Toggle dynamic atmospheric soundtrack
  const handleToggleBackgroundDrone = () => {
    playClick();
    setSoundConfig((prev) => ({
      ...prev,
      ambientEnabled: !prev.ambientEnabled
    }));
  };

  return (
    <div id="application-layer" className="min-h-screen relative overflow-hidden flex flex-col selection:bg-crimson-600/30 selection:text-white">
      {/* 1. Dynamic Canvas Layer for fluid back drop glares matching current active skin */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* 2. Top Navigation Bar (Professional Polish Grandmaster Theme) */}
      <header className="relative z-10 w-full border-b border-gold-500/25 bg-black/60 backdrop-blur-md px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 border-2 border-gold-500 flex items-center justify-center rotate-45 shrink-0 bg-black/40">
              <span className="-rotate-45 text-gold-400 font-display font-black text-xl">S</span>
            </div>
            <div>
              <h1 className="text-gold-400 text-xl tracking-[0.2em] font-display font-light uppercase">SOVEREIGN TRIAD</h1>
              <p className="text-silver-400 text-[10px] tracking-[0.3em] uppercase opacity-60">Championship Series</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {/* Ambient Ambient Drone Synthesizer Button */}
            <button
              id="ambient-drone-toggle"
              onClick={handleToggleBackgroundDrone}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-semibold tracking-wider transition-all cursor-pointer ${
                soundConfig.masterEnabled && soundConfig.ambientEnabled
                  ? 'bg-gold-500/10 border-gold-400 text-gold-300 shadow-[0_0_8px_rgba(212,175,55,0.2)]'
                  : 'bg-silver-950/40 border-silver-850 text-silver-550 hover:text-silver-300'
              }`}
            >
              <Radio className={`w-3 h-3 ${soundConfig.masterEnabled && soundConfig.ambientEnabled ? 'animate-pulse text-gold-400' : ''}`} />
              <span>{soundConfig.ambientEnabled ? 'AMBIENT DRONE ON' : 'AMBIENT DRONE OFF'}</span>
            </button>

            {/* Match Type & Stakes Metadata values according to the Polish HTML design */}
            <div className="hidden sm:flex space-x-8 text-center md:text-right">
              <div>
                <p className="text-silver-450 text-[9px] uppercase tracking-widest mb-0.5">Arena Format</p>
                <p className="text-white text-[11px] font-sans font-medium">
                  {gameMode === 'Online' ? 'ONLINE REGISTERED ARENA' : gameMode === 'AI' ? `AI Duel / ${difficulty.toUpperCase()}` : 'Local hotseat Pass-Play'}
                </p>
              </div>
              <div>
                <p className="text-silver-450 text-[9px] uppercase tracking-widest mb-0.5">Tournament Stakes</p>
                <p className="text-gold-400 text-[11px] font-sans font-medium italic">5,000 Gold Dust</p>
              </div>
            </div>

            {/* Quick Share Trigger */}
            <button
              id="share-app-btn"
              onClick={shareMatchStats}
              className="p-2 border border-silver-850 bg-silver-900/10 hover:bg-silver-900/60 rounded-full text-silver-400 hover:text-white transition-all cursor-pointer"
              title="Share Link"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Split View Layout Structure */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT/CENTER STAGE: Elegant Board and Controls (7 Cols on Destkop) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center gap-6 w-full">
          
          {gameMode === 'Online' && !onlineMatchId ? (
            <OnlineLobby
              playerName={playerName}
              setPlayerName={setPlayerName}
              lobbyRoomCode={lobbyRoomCode}
              setLobbyRoomCode={setLobbyRoomCode}
              onCreateRoom={createOnlineRoom}
              onJoinRoom={joinOnlineRoom}
              isLoading={isLobbyConnecting}
              skin={skin}
              onGoogleSignIn={handleGoogleSignIn}
              authErrorMsg={authErrorMsg}
              authUserInfo={authUserInfo}
              onSignOut={handleSignOut}
            />
          ) : (
            <>
              {/* Active Tournament Series Indicators */}
              {gameMode === 'Online' ? (
                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-sky-950/15 border border-sky-900/30 rounded-2xl p-3 md:px-5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-450 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-550"></span>
                    </span>
                    <span className="text-xs font-semibold tracking-wide text-sky-400 font-space flex items-center gap-1.5">
                      REALM ACTIVE: <span className="font-mono text-white select-all bg-black/40 py-0.5 px-2 rounded border border-sky-900/40">{onlineMatchId}</span>
                    </span>
                    <button
                      id="copy-match-id-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(onlineMatchId);
                        triggerToastNotification("Championship Code copied!");
                      }}
                      className="text-silver-400 hover:text-white p-1 rounded hover:bg-white/5 transition-all"
                      title="Copy Code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-silver-305 uppercase font-semibold font-space">
                      {onlineOpponentName ? `Duel Enemy: ${onlineOpponentName}` : "Waiting for companion..."}
                    </span>
                    <button
                      id="exit-lobby-btn"
                      onClick={exitOnlineRoom}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-crimson-950/30 hover:bg-crimson-900/40 border border-crimson-900/45 text-[10px] text-crimson-450 uppercase font-mono transition-all cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Leave</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full flex items-center justify-between bg-black/30 border border-silver-850/40 rounded-2xl p-3 md:px-5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status === 'playing' ? 'bg-emerald-500 animate-ping' : 'bg-silver-600'}`} />
                    <span className="text-xs font-semibold tracking-wide text-silver-300">
                      {gameMode === 'AI' ? `${difficulty.toUpperCase()} MATCH ARENA` : 'LOCAL HOTSEAT PASS & PLAY'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-silver-450">
                    <span className="font-space">First Turn rule:</span>
                    <select
                      id="starting-player-select"
                      value={startingPlayerRule}
                      onChange={(e) => {
                        playClick();
                        setStartingPlayerRule(e.target.value as any);
                      }}
                      className="bg-silver-950/80 border border-silver-805 rounded-lg py-1 px-1.5 font-semibold text-gold-400 cursor-pointer focus:outline-none focus:border-gold-500 animate-fade-in"
                    >
                      <option value="alternate">Alternate Turns</option>
                      <option value="X">Challenger X First</option>
                      <option value="O">Opponent O First</option>
                    </select>
                  </div>
                </div>
              )}

              {/* The Sovereign 3x3 play board */}
              <SovereignBoard
                board={board}
                onCellClick={handleCellClick}
                currentPlayer={currentPlayer}
                winnerLine={winnerLine}
                winnerSymbol={winnerSymbol}
                skin={skin}
                disabled={status === 'ended' || isAiCalculating || (gameMode === 'Online' && (onlineOpponentName === '' || currentPlayer !== myPlayerSymbol))}
              />

              {/* Core Action Tools */}
              <div className="flex justify-center gap-3 w-full max-w-[420px]">
                {status !== 'idle' ? (
                  <button
                    id="rematch-btn"
                    onClick={resetMatchGrid}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-black font-semibold text-sm tracking-wider uppercase rounded-xl select-none hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-black animate-spin-reverse" />
                    <span>Reset Round</span>
                  </button>
                ) : (
                  <button
                    id="reset-match-btn"
                    onClick={resetMatchGrid}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-silver-905 hover:bg-silver-800 text-silver-100 font-semibold border border-silver-800 text-sm tracking-widest uppercase rounded-xl transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-gold-400" />
                    <span>Initialize Board</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT SIDEBAR: Sovereign Controls and Analytics Feed (5 Cols on Desktop) */}
        <div id="analytics-sidebar" className="lg:col-span-5 xl:col-span-4 space-y-6 w-full">
          {/* Active Tournament Standings metadata */}
          <ScoreBoard
            stats={stats}
            gameMode={gameMode}
            difficulty={difficulty}
            currentPlayer={currentPlayer}
            winnerSymbol={winnerSymbol}
            status={status}
            skin={skin}
            challengerName={gameMode === 'Online' ? creatorName : undefined}
            opponentName={gameMode === 'Online' ? onlineOpponentName : undefined}
            myPlayerSymbol={gameMode === 'Online' ? myPlayerSymbol : undefined}
          />

          {/* Sizing Controller menu */}
          <GameSettings
            gameMode={gameMode}
            setGameMode={setGameMode}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            skin={skin}
            setSkin={setSkin}
            soundConfig={soundConfig}
            setSoundConfig={setSoundConfig}
            onResetStats={handleResetWins}
          />

          {/* Past moves tactical timeline log */}
          <MoveHistory moves={moves} skin={skin} />

          {/* Premium rules and deep instructions slider card */}
          <div className="w-full bg-silver-950/40 border border-silver-800/30 rounded-xl p-4">
            <button
              id="rules-accordion-btn"
              onClick={() => {
                playClick();
                setIsRulesExpanded(!isRulesExpanded);
              }}
              className="flex items-center justify-between w-full text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-silver-300 text-xs font-semibold uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-silver-400" />
                <span>Ancient Lore of Triad</span>
              </div>
              <span className="text-[10px] text-gold-400 underline font-mono select-none">
                {isRulesExpanded ? 'HIDE RULES' : 'VIEW RULES'}
              </span>
            </button>

            <AnimatePresence>
              {isRulesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-3 text-xs text-silver-450 space-y-2 border-t border-silver-850/40 pt-3"
                >
                  <p>
                    Since antiquity, sages did lock minds in the sacred Tic Tac Toe, seeking to align three symbols along a critical vector: Rows, Columns, or Diagonal Planes.
                  </p>
                  <div className="flex items-start gap-2 bg-silver-900/20 p-2.5 rounded-lg border border-silver-800/30">
                    <Lightbulb className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-silver-200">Pro-Tip for Sovereigns:</strong> Allege to occupy the center slot immediately if initiative starts with you. If blocked, force your adversary into corners to build dual split-lines. There is no possibility of defilement on perfect hard difficulties!
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer / Creator Attribution */}
      <footer className="relative z-10 w-full py-8 mt-auto text-center border-t border-white/5 bg-black/20">
        <p id="creator-attribution" className="text-xs md:text-sm tracking-[0.3em] font-space font-bold text-gold-400 uppercase">
          CRAFTED BY ANSHUM
        </p>
      </footer>

      {/* 4. Beautiful floating toast alerts */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/90 border border-gold-500/50 text-gold-400 font-space text-xs py-2.5 px-5 rounded-full shadow-2xl flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
