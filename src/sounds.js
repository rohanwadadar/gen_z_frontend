// Sound effects using Web Audio API — no external files needed
let audioCtx = null;
const getCtx = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
};

const playTone = (freq, dur, type = 'sine', vol = 0.12) => {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + dur);
    } catch { /* silently fail if no audio ctx */ }
};

export const sounds = {
    send: () => {
        playTone(880, 0.08, 'sine', 0.08);
        setTimeout(() => playTone(1100, 0.06, 'sine', 0.06), 60);
    },
    receive: () => {
        playTone(660, 0.07, 'sine', 0.09);
        setTimeout(() => playTone(880, 0.08, 'sine', 0.07), 70);
    },
    notification: () => {
        playTone(900, 0.1, 'sine', 0.1);
        setTimeout(() => playTone(1200, 0.12, 'sine', 0.09), 100);
        setTimeout(() => playTone(900, 0.1, 'sine', 0.08), 220);
    },
    pop: () => playTone(1400, 0.05, 'triangle', 0.06),
    error: () => {
        playTone(300, 0.12, 'sawtooth', 0.07);
        setTimeout(() => playTone(250, 0.15, 'sawtooth', 0.06), 120);
    },
};
