let audioCtx = null;
let unlocked = false;

function getCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

/** Call once after a user gesture so later notification chimes are allowed. */
export async function unlockNotifySound() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  unlocked = true;
}

/**
 * Soft two-tone school chime (no audio file required).
 * Safe to call repeatedly; no-ops if audio is blocked.
 */
export function playNotifySound() {
  const ctx = getCtx();
  if (!ctx || !unlocked) return;

  const now = ctx.currentTime;
  const tones = [
    { freq: 784, at: 0 },
    { freq: 1046.5, at: 0.12 },
  ];

  tones.forEach(({ freq, at }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + at);
    gain.gain.setValueAtTime(0.0001, now + at);
    gain.gain.exponentialRampToValueAtTime(0.14, now + at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + at);
    osc.stop(now + at + 0.45);
  });
}
