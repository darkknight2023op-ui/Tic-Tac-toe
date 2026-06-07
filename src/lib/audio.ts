// Premium Web Audio Synthesizer for Tic Tac Toe

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientOscillator1: OscillatorNode | null = null;
let ambientOscillator2: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

let isMutedGlobal = false;
let globalVolume = 0.5;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = isMutedGlobal ? 0 : globalVolume;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function updateAudioSettings(muted: boolean, volume: number) {
  isMutedGlobal = muted;
  globalVolume = volume;
  if (masterGain) {
    masterGain.gain.linearRampToValueAtTime(
      muted ? 0 : volume,
      (audioCtx?.currentTime || 0) + 0.1
    );
  }
}

// 1. Hover Tick - Ultra-short luxurious tick sound
export function playHoverTick() {
  try {
    const ctx = getAudioContext();
    if (isMutedGlobal) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

    osc.connect(gain);
    if (masterGain) gain.connect(masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Graceful fallback for browsers inhibiting audio
  }
}

// 2. Click Sound - Standard pop click
export function playClick() {
  try {
    const ctx = getAudioContext();
    if (isMutedGlobal) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    osc.connect(gain);
    if (masterGain) gain.connect(masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch (e) {}
}

// 3. Move Pluck - Play unique golden/silver chimes
export function playMoveSound(player: 'X' | 'O') {
  try {
    const ctx = getAudioContext();
    if (isMutedGlobal) return;

    const now = ctx.currentTime;
    
    if (player === 'X') {
      // Crimson Crown 'X' Sound: Twin ringing high-frequency bell plucks
      // Clean, bright, pure tones
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // C6 slide up

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now); // E5
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      if (masterGain) gain.connect(masterGain);

      osc1.start();
      osc2.start();
      osc1.stop(now + 0.26);
      osc2.stop(now + 0.26);
    } else {
      // Sovereign 'O' Sound: Warm, round double bell plucks
      // Golden, melodic resonance
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(392.00, now); // G4
      osc1.frequency.exponentialRampToValueAtTime(329.63, now + 0.2); // E4 slide down

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(493.88, now); // B4

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      if (masterGain) gain.connect(masterGain);

      osc1.start();
      osc2.start();
      osc1.stop(now + 0.31);
      osc2.stop(now + 0.31);
    }
  } catch (e) {}
}

// 4. Winner Fanfare - A royal-sounding chord progression
export function playWinnerSound() {
  try {
    const ctx = getAudioContext();
    if (isMutedGlobal) return;

    const now = ctx.currentTime;
    const notes = [
      261.63, // C4 (t=0.0)
      329.63, // E4 (t=0.1)
      392.00, // G4 (t=0.2)
      523.25, // C5 (t=0.3)
      659.25, // E5 (t=0.4)
      783.99, // G5 (t=0.5)
      1046.50 // C6 (t=0.6)
    ];

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + index * 0.08;

      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);
      
      // Pitch shimmer vibrato
      osc.frequency.linearRampToValueAtTime(freq + 4, noteTime + 0.4);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.7);

      osc.connect(gain);
      if (masterGain) gain.connect(masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.81);
    });
  } catch (e) {}
}

// 5. Draw Sound - A warm but slightly somber minor seventh resolution
export function playDrawSound() {
  try {
    const ctx = getAudioContext();
    if (isMutedGlobal) return;

    const now = ctx.currentTime;
    const notes = [293.66, 349.23, 440.00, 523.25]; // D minor seventh (D4, F4, A4, C5)

    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq - 15, now + 0.8);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

      osc.connect(gain);
      if (masterGain) gain.connect(masterGain);

      osc.start();
      osc.stop(now + 1.0);
    });
  } catch (e) {}
}

// 6. Restart/Reset Sound - A futuristic energy swell
export function playRestartSound() {
  try {
    const ctx = getAudioContext();
    if (isMutedGlobal) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.45);

    gain.gain.setValueAtTime(0.012, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    if (masterGain) gain.connect(masterGain);

    osc.start();
    osc.stop(now + 0.46);
  } catch (e) {}
}

// 7. Invalid Move buzzer
export function playErrorSound() {
  try {
    const ctx = getAudioContext();
    if (isMutedGlobal) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.15);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    if (masterGain) gain.connect(masterGain);

    osc.start();
    osc.stop(now + 0.18);
  } catch (e) {}
}

// 8. Dynamic Ambient sound drone to create a luxury grand casino vibe
export function startAmbientDrone() {
  try {
    const ctx = getAudioContext();
    if (ambientOscillator1) return; // Already running

    const now = ctx.currentTime;
    ambientOscillator1 = ctx.createOscillator();
    ambientOscillator2 = ctx.createOscillator();
    ambientGain = ctx.createGain();

    ambientOscillator1.type = 'sine';
    // Very low warm fundamental
    ambientOscillator1.frequency.setValueAtTime(55.00, now); // A1

    ambientOscillator2.type = 'triangle';
    // Low fifth fifth fifth
    ambientOscillator2.frequency.setValueAtTime(82.41, now); // E2

    ambientGain.gain.setValueAtTime(0, now);
    // Fade in ambient music slowly
    ambientGain.gain.linearRampToValueAtTime(0.035, now + 3.0);

    ambientOscillator1.connect(ambientGain);
    ambientOscillator2.connect(ambientGain);
    if (masterGain) ambientGain.connect(masterGain);

    ambientOscillator1.start();
    ambientOscillator2.start();
  } catch (e) {}
}

export function stopAmbientDrone() {
  try {
    const ctx = audioCtx;
    if (!ctx) return;
    
    if (ambientGain) {
      const now = ctx.currentTime;
      ambientGain.gain.cancelScheduledValues(now);
      ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
      ambientGain.gain.linearRampToValueAtTime(0, now + 1.0);
      
      setTimeout(() => {
        try {
          if (ambientOscillator1) ambientOscillator1.stop();
          if (ambientOscillator2) ambientOscillator2.stop();
          ambientOscillator1 = null;
          ambientOscillator2 = null;
          ambientGain = null;
        } catch (err) {}
      }, 1100);
    }
  } catch (e) {}
}
