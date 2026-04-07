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

// ── Sound: Shake / Rattle ─────────────────────────────────────────────────────
// Burst of filtered noise with pitch wobble — sounds like liquid sloshing
function playShakeSound() {
  const ctx = getAudioCtx();
  const duration = 0.65;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // White noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Band-pass filter to make it sound more like a hollow knock/liquid slosh
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.setValueAtTime(280, ctx.currentTime);
  bpf.frequency.linearRampToValueAtTime(120, ctx.currentTime + duration);
  bpf.Q.value = 1.8;

  // Amplitude envelope: quick attack, decay
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.04);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  source.connect(bpf);
  bpf.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + duration);
}

// ── Sound: Mystical Chime ─────────────────────────────────────────────────────
// Ascending arpeggiated sine tones with reverb-like tail
function playChimeSound() {
  const ctx = getAudioCtx();

  // Pentatonic-ish ascending chord (Hz)
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5 E5 G5 C6 E6

  notes.forEach((freq, i) => {
    const osc      = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const startTime = ctx.currentTime + i * 0.1;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    // Slight vibrato
    osc.frequency.linearRampToValueAtTime(freq * 1.003, startTime + 0.15);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.22, startTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.4);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 1.4);
  });
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
