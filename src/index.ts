import "./styles.css";
import { createSineWT, createNoiseWT } from "./audio/wt";
import { createOscillator } from "./audio/oscillator";
import { f32toU8, u8toF32 } from "./audio/utils";
import { convertSampleToF32, mixVoices, renderNote } from "./audio/sample";
import { wtFrames } from "./wt256";

// const SAMPLE_RATE = 7250;
// const SAMPLE_RATE = 8750;
const SAMPLE_RATE = 10750;
const WT_SIZE = 64;

const BPM = 120;

const SNARE_FREQ = 130.81;
const SNARE_FREQ_TRANSIENT_MULTIPLIER = 5;
const SNARE_TRANSIENT_FREQ = SNARE_FREQ * SNARE_FREQ_TRANSIENT_MULTIPLIER;

const KICK_FREQ = 46.25;
const KICK_FREQ_TRANSIENT_MULTIPLIER = 9;
const KICK_TRANSIENT_FREQ = KICK_FREQ * KICK_FREQ_TRANSIENT_MULTIPLIER;

const RISER_FREQ = 46.25;
const RISER_FREQ_TRANSIENT_MULTIPLIER = 4 * 9;
const RISER_TRANSIENT_FREQ = RISER_FREQ * RISER_FREQ_TRANSIENT_MULTIPLIER;

const NUM_VOICES = 5;
const DURATION = 2;
const START_FREQ = 55 * 2 * 4;
const END_FREQ = 46.25 * 2 * 4;
const DRIFT_DEPTH = 0.0125;
const DITHER_DEPTH = 0.15;
const UNISON = 0.005;

// ================================================================

const sineWT = createSineWT(WT_SIZE);
const noiseWT = createNoiseWT(WT_SIZE);

// ================================================================

const snareTone = createOscillator({
  wt: sineWT,
  sampleRate: SAMPLE_RATE,
  duration: 0.25,
  freqFn: (t) => {
    const tP = 1 - Math.pow(t, 0.075);
    return SNARE_FREQ + (SNARE_TRANSIENT_FREQ - SNARE_FREQ) * tP;
  },
  envelopeFn: (t) => 1 - Math.pow(t, 0.075),
  driveFn: (v) => Math.tanh(v * 1.25),
  postDriveFn: (v) => Math.tanh(v * 3.25),
});

const snareTail = createOscillator({
  wt: noiseWT,
  sampleRate: SAMPLE_RATE,
  duration: 1.25,
  freqFn: () => 220,
  envelopeFn: (t) => 1 - Math.pow(t, 0.005),
  postDriveFn: (v) => Math.tanh(v * 7.5),
});

const snare = new Uint8ClampedArray(
  Math.max(snareTone.length, snareTail.length)
);
for (let i = 0; i < snare.length; i++) {
  let value = 0;

  if (i < snareTone.length) value += u8toF32(snareTone[i]);
  if (i < snareTail.length) value += u8toF32(snareTail[i]);

  snare[i] = f32toU8(Math.tanh(value * 2));
}

// ================================================================

const kickTone = createOscillator({
  wt: sineWT,
  sampleRate: SAMPLE_RATE,
  duration: 0.275,
  freqFn: (t) => {
    const tP = 1 - Math.pow(t, 0.05);
    return KICK_FREQ + (KICK_TRANSIENT_FREQ - KICK_FREQ) * tP;
  },
  envelopeFn: (t) => 1 - Math.pow(t, 0.125),
  driveFn: (v) => Math.tanh(v * 1.75),
  postDriveFn: (v) => Math.tanh(v * 4.25),
});

// ================================================================

const hat = createOscillator({
  wt: noiseWT,
  sampleRate: SAMPLE_RATE,
  duration: 0.15,
  freqFn: () => 46.25 * 16,
  envelopeFn: (t) => 1 - Math.pow(t, 0.0025),
  postDriveFn: (v) => Math.tanh(v * 5.5),
});

// ================================================================

const secPerBeat = 60 / BPM;
const secPerStep = secPerBeat / 4; // 16th notes
const samplePerStep = Math.floor(SAMPLE_RATE * secPerStep);
const loopSampleCount = samplePerStep * 16 * 8;

type SampleType = "kick" | "snare";

const samples: Record<SampleType, Uint8ClampedArray> = {
  kick: kickTone,
  snare: snare,
};

const loopBase: (SampleType | null)[] = [
  "kick",
  null,
  "kick",
  null,

  "snare",
  null,
  null,
  null,

  "kick",
  "kick",
  null,
  null,

  "snare",
  null,
  "kick",
  null,

  "kick",
  "kick",
  null,
  "kick",

  "snare",
  "kick",
  null,
  "kick",

  null,
  "kick",
  "kick",
  "snare",

  "snare",
  null,
  "kick",
  "kick",
];

const loopEnding = [...loopBase];

for (let i = 5; i < loopEnding.length; i++) {
  loopEnding[i] = null;
  if (loopEnding.length - i <= 6) loopEnding[i] = "snare";
}

const loop: (SampleType | null)[] = [
  ...loopBase,
  ...loopBase,
  ...loopBase,
  ...loopEnding,
];

// ================================================================

const riserTone = createOscillator({
  wt: sineWT,
  sampleRate: SAMPLE_RATE,
  duration: loopSampleCount / SAMPLE_RATE,
  freqFn: (t) => {
    const tP = Math.pow(t, 5);
    return RISER_FREQ + (RISER_TRANSIENT_FREQ - RISER_FREQ) * tP;
  },
  envelopeFn: (t) => Math.pow(t, 3.5),
  driveFn: (v) => Math.tanh(v * 5),
  postDriveFn: (v) => Math.tanh(v * 2),
});

const riserNoise = createOscillator({
  wt: noiseWT,
  sampleRate: SAMPLE_RATE,
  duration: loopSampleCount / SAMPLE_RATE,
  freqFn: (t) => t,
  envelopeFn: (t) => Math.pow(t, 6.5),
  driveFn: (v) => Math.tanh(v * 1.25),
  postDriveFn: (v) => Math.tanh(v * 2.5),
});

const riser = new Uint8ClampedArray(
  Math.max(riserTone.length, riserNoise.length)
);
for (let i = 0; i < riser.length; i++) {
  let value = 0;

  if (i < riserTone.length) value += u8toF32(riserTone[i]) * 0.25;
  if (i < riserNoise.length) value += u8toF32(riserNoise[i]) * 0.75;
  if (riser.length - i <= samplePerStep * 6) value = 0;

  riser[i] = f32toU8(Math.tanh(value * 1.5));
}

// ================================================================

const crash = createOscillator({
  wt: noiseWT,
  sampleRate: SAMPLE_RATE,
  duration: loopSampleCount / SAMPLE_RATE,
  freqFn: (t) => 7250 - 2750 * t,
  envelopeFn: (t) => 1 - Math.pow(t, 0.00075),
  postDriveFn: (v) => Math.tanh(v * 12.5),
});

// ================================================================

const drumLoop = new Uint8ClampedArray(loopSampleCount);
let loopIdx = -1;
let currentSample: Uint8ClampedArray | null = null;

for (let i = 0; i < loopSampleCount; i++) {
  const sampleIdx = i % samplePerStep;

  if (sampleIdx === 0) {
    loopIdx++;
    const current = loop[loopIdx];
    currentSample = current ? samples[current] : null;
  }

  let sample = currentSample ? u8toF32(currentSample[sampleIdx]) : 0;
  sample += u8toF32(hat[sampleIdx]) * 1.75;
  // sample += u8toF32(riser[i]) * 0.25;
  sample += u8toF32(crash[i]) * 1.25;
  drumLoop[i] = f32toU8(Math.tanh(sample * 1.75));
}

const drumLoopF32 = new Float32Array(drumLoop.length);

for (let i = 0; i < drumLoop.length; i++) {
  drumLoopF32[i] = Math.tanh(u8toF32(drumLoop[i]) * 1.125);
}

// ================================================================

const voices = new Array(NUM_VOICES);
for (let i = 0; i < NUM_VOICES; i++) {
  const startUnison = 1 + UNISON * (Math.random() * 2 - 1);
  const endUnison = 1 + UNISON * (Math.random() * 2 - 1);

  const sample = renderNote(
    wtFrames,
    SAMPLE_RATE,
    DURATION,
    START_FREQ * startUnison,
    END_FREQ * endUnison,
    DRIFT_DEPTH,
    DITHER_DEPTH
  );

  voices[i] = sample;
}

const synthSample = mixVoices(voices);
const waveformRaw = convertSampleToF32(synthSample);
// FIXME: make consistent sample count calculation
const waveform = waveformRaw.slice(0, loopSampleCount / 8);

// ================================================================

const audioCtx = new AudioContext();

const drumsBuffer = audioCtx.createBuffer(1, drumLoopF32.length, SAMPLE_RATE);
drumsBuffer.copyToChannel(drumLoopF32, 0);

const drumsToggle = audioCtx.createGain();
drumsToggle.gain.value = 0;
drumsToggle.connect(audioCtx.destination);

const drumsGain = audioCtx.createGain();
drumsGain.gain.value = 0.825;
drumsGain.connect(drumsToggle);

const drumsSrc = audioCtx.createBufferSource();
drumsSrc.buffer = drumsBuffer;
drumsSrc.loop = true;
drumsSrc.connect(drumsToggle);

const synthBuffer = audioCtx.createBuffer(1, waveform.length, SAMPLE_RATE);
synthBuffer.copyToChannel(waveform, 0);

const synthToggle = audioCtx.createGain();
synthToggle.gain.value = 1;
synthToggle.connect(audioCtx.destination);

const synthGain = audioCtx.createGain();
synthGain.gain.value = 0.75;
synthGain.connect(synthToggle);

const synthSrc = audioCtx.createBufferSource();
synthSrc.buffer = synthBuffer;
synthSrc.loop = true;
synthSrc.playbackRate.value = 1;
synthSrc.connect(synthGain);

const synthSrc1 = audioCtx.createBufferSource();
synthSrc1.buffer = synthBuffer;
synthSrc1.loop = true;
synthSrc1.playbackRate.value = 0.5;
synthSrc1.connect(synthGain);

const synthSrc2 = audioCtx.createBufferSource();
synthSrc2.buffer = synthBuffer;
synthSrc2.loop = true;
synthSrc2.playbackRate.value = 0.25;
synthSrc2.connect(synthGain);

let started = false;

const play = () => {
  audioCtx.resume();

  if (started) return;
  drumsSrc.start();
  synthSrc.start();
  synthSrc1.start();
  synthSrc2.start();

  started = true;
};

let isDrumsOn = false;

const handleDrumsToggle = () => {
  isDrumsOn = !isDrumsOn;
  drumsToggle.gain.value = isDrumsOn ? 1 : 0;
};

let isSynthOn = true;

const handleSynthToggle = () => {
  isSynthOn = !isSynthOn;
  synthToggle.gain.value = isSynthOn ? 1 : 0;
};

const playBtn = document.createElement("button");
playBtn.innerText = "Play";
playBtn.addEventListener("click", play);

const toggleDrumsBtn = document.createElement("button");
toggleDrumsBtn.innerText = "Toggle Drums";
toggleDrumsBtn.addEventListener("click", handleDrumsToggle);

const toggleSynthBtn = document.createElement("button");
toggleSynthBtn.innerText = "Toggle Synth";
toggleSynthBtn.addEventListener("click", handleSynthToggle);

document.body.append(playBtn, toggleDrumsBtn, toggleSynthBtn);
