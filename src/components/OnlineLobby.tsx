import React from 'react';
import { Globe, Plus, LogIn, User, Sparkles, ShieldAlert } from 'lucide-react';
import { playClick } from '../lib/audio';

interface OnlineLobbyProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  lobbyRoomCode: string;
  setLobbyRoomCode: (code: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  isLoading: boolean;
  skin: 'crimson' | 'gold' | 'silver' | 'obsidian';
  onGoogleSignIn: () => void;
  authErrorMsg: string | null;
  authUserInfo: { uid: string; displayName: string | null; isAnonymous: boolean } | null;
  onSignOut: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  playerName,
  setPlayerName,
  lobbyRoomCode,
  setLobbyRoomCode,
  onCreateRoom,
  onJoinRoom,
  isLoading,
  skin,
  onGoogleSignIn,
  authErrorMsg,
  authUserInfo,
  onSignOut
}) => {
  const getSkinAccentText = () => {
    switch (skin) {
      case 'crimson': return 'text-crimson-450';
      case 'gold': return 'text-gold-400';
      case 'silver': return 'text-silver-300';
      case 'obsidian': return 'text-silver-450';
    }
  };

  const getSkinAccentBorder = () => {
    switch (skin) {
      case 'crimson': return 'border-crimson-500/35 focus:border-crimson-500 shadow-crimson-950/20';
      case 'gold': return 'border-gold-500/25 focus:border-gold-500 shadow-gold-950/20';
      case 'silver': return 'border-silver-500/25 focus:border-silver-500 shadow-silver-950/20';
      case 'obsidian': return 'border-silver-850 focus:border-silver-500 shadow-black/40';
    }
  };

  const accentColor = getSkinAccentText();
  const accentBorder = getSkinAccentBorder();

  return (
    <div className="w-full max-w-[420px] mx-auto bg-silver-950/40 border border-silver-800/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-6">
      
      {/* Visual Header */}
      <div className="text-center space-y-1.5">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-400/30 flex items-center justify-center animate-pulse">
            <Globe className="w-6 h-6 text-sky-400 animate-spin-slow" />
          </div>
        </div>
        <h2 className="text-lg font-display tracking-widest text-silver-100 uppercase">Online Arena Lobby</h2>
        <p className="text-[10px] tracking-wider text-silver-450 uppercase">Invite a friend with a custom code</p>
      </div>

      {/* Connection Failure/Diagnostic Alerts */}
      {authErrorMsg && (
        <div className="p-4 bg-red-950/20 border border-red-900/35 rounded-2xl text-xs space-y-2.5 text-red-200 leading-normal font-sans">
          <div className="font-semibold flex items-center gap-1.5 text-red-400 uppercase tracking-widest text-[10px]">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>Anonymous Authentication Restricted</span>
          </div>
          <p className="text-[11px] leading-relaxed text-silver-300">
            Anonymous sign-in is deactivated in your Google Firebase Console project. Please proceed with:
          </p>
          <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-red-950 text-silver-400 text-[11px] leading-relaxed">
            <p>
              <strong className="text-sky-400">Option A (Easiest):</strong> Click the white <span className="font-semibold">Sign In with Google</span> button below. It is fully pre-configured and will activate instantly.
            </p>
            <div className="h-px bg-silver-800/10 my-1" />
            <p>
              <strong className="text-gold-400">Option B:</strong> Enable continuous Guest login in Firebase Console:
            </p>
            <ol className="list-decimal pl-4 mt-1 space-y-1 text-silver-305 text-[10px]">
              <li>Access <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">Firebase Console</a> and open your project.</li>
              <li>Go to <strong className="text-white">Build &gt; Authentication &gt; Sign-in method</strong>.</li>
              <li>Click <strong className="text-white">Add new provider</strong> under Sign-in providers.</li>
              <li>Toggle <strong className="text-white">Anonymous</strong> to enabled and save your preference.</li>
            </ol>
          </div>
        </div>
      )}

      {/* User Session Info / Google Sign-In trigger */}
      <div className="space-y-4">
        {authUserInfo ? (
          <div className="flex items-center justify-between p-3.5 bg-sky-950/15 border border-sky-900/25 rounded-xl font-sans">
            <div className="flex items-center gap-2 max-w-[75%]">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
              <p className="text-xs text-sky-305 font-medium truncate">
                Signed in: <span className="font-bold text-white">{authUserInfo.displayName || authUserInfo.uid.substring(0, 8)}</span>
              </p>
            </div>
            <button
              id="google-sign-out"
              onClick={() => {
                playClick();
                onSignOut();
              }}
              className="text-[10px] text-silver-450 hover:text-white uppercase tracking-wider font-semibold hover:underline cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            id="google-signin-btn"
            onClick={() => {
              playClick();
              onGoogleSignIn();
            }}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs tracking-widest uppercase rounded-xl transition-all shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.123C18.29 1.745 15.42 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.34 0 10.55-4.453 10.55-10.715 0-.726-.08-1.284-.175-1.69H12.24z"
              />
            </svg>
            <span>Sign In with Google</span>
          </button>
        )}

        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-silver-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-silver-500" />
            <span>Sovereign Name</span>
          </label>
          <input
            id="player-name-input"
            type="text"
            placeholder="Challenger Name"
            maxLength={18}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl bg-black/60 border ${accentBorder} text-white font-sans text-sm focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-all`}
          />
        </div>

        <div className="border-t border-silver-800/10 my-4" />

        {/* Action: Create Match */}
        <button
          id="create-online-room-btn"
          onClick={onCreateRoom}
          disabled={isLoading || !playerName.trim()}
          className="w-full relative group overflow-hidden py-3.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-500/90 hover:to-sky-600/90 text-white font-semibold text-xs tracking-widest uppercase rounded-xl transition-all shadow-lg hover:shadow-sky-500/20 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4 text-white" />
              <span>Host Online Realm (Player X)</span>
            </>
          )}
        </button>

        {/* OR Divider */}
        <div className="flex items-center gap-3 py-2 text-[10px] uppercase tracking-widest text-silver-550">
          <div className="flex-1 h-px bg-silver-800/20" />
          <span>Or Join Existing</span>
          <div className="flex-1 h-px bg-silver-800/20" />
        </div>

        {/* Action: Join Match */}
        <div className="flex flex-col gap-2">
          <input
            id="join-code-input"
            type="text"
            placeholder="Room Code (6 Chars)"
            maxLength={6}
            value={lobbyRoomCode}
            onChange={(e) => setLobbyRoomCode(e.target.value.toUpperCase())}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl bg-black/40 border border-silver-800/50 text-white font-mono text-center tracking-widest placeholder:tracking-normal focus:outline-none focus:border-sky-500 transition-all text-sm uppercase`}
          />
          <button
            id="join-online-room-btn"
            onClick={onJoinRoom}
            disabled={isLoading || !playerName.trim() || lobbyRoomCode.length < 4}
            className="w-full py-3.5 bg-silver-900 border border-silver-800 hover:bg-silver-800/80 text-silver-200 font-semibold text-xs tracking-widest uppercase rounded-xl transition-all active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-black/20"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-silver-600 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4 text-silver-400" />
                <span>Join Online Realm (Player O)</span>
              </>
            )}
          </button>
        </div>

      </div>

      <div className="flex items-start gap-2 p-3 bg-sky-950/15 border border-sky-900/10 rounded-xl text-[10px] text-sky-305/85 font-sans leading-relaxed">
        <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <span>Configure your name and host a match to share the custom realm code with your teammate. It will synchronize moves reactively!</span>
      </div>

    </div>
  );
};
