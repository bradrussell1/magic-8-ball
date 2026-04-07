// ── Responses ────────────────────────────────────────────────────────────────
const RESPONSES = [
  "Ask your father",
  "Clearly Broken",
  "You are eating alone tonight",
  "$1.99 for more answers",
  "We have been trying to reach you about your car's extended warranty",
  "Yes",
  "New Ball. Who dis?",
  "Fuck that hurt",
];

// ── State ─────────────────────────────────────────────────────────────────────
let lastIndex = -1;
let audioCtx = null;

// ── DOM References ────────────────────────────────────────────────────────────
const ball        = document.getElementById('ball');
const responseText = document.getElementById('responseText');
const runBtn       = document.getElementById('runBtn');

// ── Audio Context (lazy init to comply with browser autoplay policy) ──────────
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// ── Sound: SSB64 Home Run Bat — Swing Whoosh ─────────────────────────────────
// Fast filtered-noise sweep simulating the bat cutting through the air
function playShakeSound() {
  const ctx = getAudioCtx();
  const t   = ctx.currentTime;

  // ── Whoosh layer: high-pass noise sweeping downward ──
  const whooshDur  = 0.28;
  const bufSize    = Math.ceil(ctx.sampleRate * whooshDur);
  const buffer     = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data       = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.setValueAtTime(3200, t);
  hpf.frequency.exponentialRampToValueAtTime(400, t + whooshDur);
  hpf.Q.value = 0.8;

  const whooshGain = ctx.createGain();
  whooshGain.gain.setValueAtTime(0, t);
  whooshGain.gain.linearRampToValueAtTime(0.7, t + 0.02);
  whooshGain.gain.exponentialRampToValueAtTime(0.001, t + whooshDur);

  noise.connect(hpf);
  hpf.connect(whooshGain);
  whooshGain.connect(ctx.destination);
  noise.start(t);
  noise.stop(t + whooshDur);

  // ── Wind rush layer: band-pass noise for body of swing ──
  const bufSize2 = Math.ceil(ctx.sampleRate * 0.22);
  const buffer2  = ctx.createBuffer(1, bufSize2, ctx.sampleRate);
  const data2    = buffer2.getChannelData(0);
  for (let i = 0; i < bufSize2; i++) data2[i] = Math.random() * 2 - 1;

  const noise2 = ctx.createBufferSource();
  noise2.buffer = buffer2;

  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.setValueAtTime(900, t + 0.01);
  bpf.frequency.exponentialRampToValueAtTime(200, t + 0.22);
  bpf.Q.value = 1.5;

  const rushGain = ctx.createGain();
  rushGain.gain.setValueAtTime(0.3, t + 0.01);
  rushGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

  noise2.connect(bpf);
  bpf.connect(rushGain);
  rushGain.connect(ctx.destination);
  noise2.start(t + 0.01);
  noise2.stop(t + 0.22);
}

// ── Sound: SSB64 Home Run Bat — Heavy BONK Impact ────────────────────────────
// Deep low-freq thud + sharp transient crack simulating the iconic bat hit
function playChimeSound() {
  const ctx = getAudioCtx();
  const t   = ctx.currentTime;

  // ── Crack transient: very short noise burst ──
  const crackDur = 0.04;
  const cBuf     = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * crackDur), ctx.sampleRate);
  const cData    = cBuf.getChannelData(0);
  for (let i = 0; i < cData.length; i++) cData[i] = Math.random() * 2 - 1;

  const crack = ctx.createBufferSource();
  crack.buffer = cBuf;

  const crackHpf = ctx.createBiquadFilter();
  crackHpf.type = 'highpass';
  crackHpf.frequency.value = 2000;

  const crackGain = ctx.createGain();
  crackGain.gain.setValueAtTime(1.2, t);
  crackGain.gain.exponentialRampToValueAtTime(0.001, t + crackDur);

  crack.connect(crackHpf);
  crackHpf.connect(crackGain);
  crackGain.connect(ctx.destination);
  crack.start(t);
  crack.stop(t + crackDur);

  // ── Thud body: sine oscillator pitched ~65 Hz (deep wooden thump) ──
  const thud = ctx.createOscillator();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(130, t);
  thud.frequency.exponentialRampToValueAtTime(55, t + 0.18);

  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0, t);
  thudGain.gain.linearRampToValueAtTime(1.1, t + 0.008);
  thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

  thud.connect(thudGain);
  thudGain.connect(ctx.destination);
  thud.start(t);
  thud.stop(t + 0.55);

  // ── Mid-body resonance: square wave ~220 Hz for metallic bat ring ──
  const ring = ctx.createOscillator();
  ring.type = 'square';
  ring.frequency.setValueAtTime(220, t);
  ring.frequency.exponentialRampToValueAtTime(110, t + 0.3);

  const ringFilter = ctx.createBiquadFilter();
  ringFilter.type = 'bandpass';
  ringFilter.frequency.value = 300;
  ringFilter.Q.value = 4;

  const ringGain = ctx.createGain();
  ringGain.gain.setValueAtTime(0.18, t + 0.005);
  ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

  ring.connect(ringFilter);
  ringFilter.connect(ringGain);
  ringGain.connect(ctx.destination);
  ring.start(t + 0.005);
  ring.stop(t + 0.35);

  // ── Distant crowd "OOH" shimmer after the hit ──
  const shimmerDur = 0.6;
  const sBuf       = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * shimmerDur), ctx.sampleRate);
  const sData      = sBuf.getChannelData(0);
  for (let i = 0; i < sData.length; i++) sData[i] = Math.random() * 2 - 1;

  const shimmer = ctx.createBufferSource();
  shimmer.buffer = sBuf;

  const shimBpf = ctx.createBiquadFilter();
  shimBpf.type = 'bandpass';
  shimBpf.frequency.setValueAtTime(3500, t + 0.05);
  shimBpf.frequency.exponentialRampToValueAtTime(800, t + 0.05 + shimmerDur);
  shimBpf.Q.value = 3;

  const shimGain = ctx.createGain();
  shimGain.gain.setValueAtTime(0, t + 0.05);
  shimGain.gain.linearRampToValueAtTime(0.12, t + 0.1);
  shimGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05 + shimmerDur);

  shimmer.connect(shimBpf);
  shimBpf.connect(shimGain);
  shimGain.connect(ctx.destination);
  shimmer.start(t + 0.05);
  shimmer.stop(t + 0.05 + shimmerDur);
}

// ── Pick a random response (no repeat) ───────────────────────────────────────
function pickResponse() {
  let idx;
  do {
    idx = Math.floor(Math.random() * RESPONSES.length);
  } while (idx === lastIndex);
  lastIndex = idx;
  return RESPONSES[idx];
}

// ── Main reveal sequence ──────────────────────────────────────────────────────
function reveal() {
  // Prevent double-click spam
  runBtn.disabled = true;

  // 1. Play rattle immediately
  playShakeSound();

  // 2. Add shake class to ball
  ball.classList.add('shaking');

  // 3. Fade out current text
  responseText.style.opacity = '0';

  // 4. After shake finishes, swap text and play chime
  setTimeout(() => {
    ball.classList.remove('shaking');

    const newResponse = pickResponse();
    responseText.textContent = newResponse;

    // Fade in new text
    responseText.style.opacity = '1';

    // Play chime on reveal
    playChimeSound();

    // Re-enable button after chime starts
    setTimeout(() => {
      runBtn.disabled = false;
    }, 600);

  }, 700); // matches shake animation duration
}

// ── Event Listeners ───────────────────────────────────────────────────────────
runBtn.addEventListener('click', reveal);

// Allow clicking the ball itself too
ball.addEventListener('click', () => {
  if (!runBtn.disabled) reveal();
});
