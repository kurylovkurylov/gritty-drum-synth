import { buildSmoothNoise } from "./lfo";

export const renderNote = (
  table: [Uint8Array, Uint8Array],
  sampleRate: number,
  duration: number,
  startFreq: number,
  endFreq: number,
  driftDepth: number,
  ditherDepth: number
) => {
  const tableSize = table[0].length;

  const totalSamples = Math.floor(sampleRate * duration);

  const drift = buildSmoothNoise(12, totalSamples);
  let phase = 0;

  const sample = new Uint8Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / totalSamples;

    const tP = Math.pow(t, 0.15);
    const tWt = Math.pow(t, 0.65);
    const tD = Math.pow(1 - t, 1.5);

    const gain = 1 - t;
    const baseFreq = startFreq + (endFreq - startFreq) * tP;
    const frequency = baseFreq * (1 + drift[i] * driftDepth);

    const phaseInc = (frequency * tableSize) / sampleRate;
    phase = (phase + phaseInc) % tableSize;

    const jitter = Math.floor((Math.random() - 0.5) * 3); // ±1 sample
    // const jitter = 0;
    const idx = (Math.floor(phase) + jitter + tableSize) % tableSize;

    const raw0 = table[0][idx] - 128; // center around 0: [-128, 127]
    const raw1 = table[1][idx] - 128; // center around 0: [-128, 127]

    const raw = raw0 * (1 - tWt) + raw1 * tWt;

    const dither = (Math.random() - 0.5) * (128 * ditherDepth) * tD; // [-0.5, 0.5]
    // const dither = 0;

    sample[i] = Math.round(raw * gain + dither) + 128; // apply gain, re-center to [0, 255]
  }

  return sample;
};

export const convertSampleToF32 = (sample: Uint8Array) => {
  const totalSamples = sample.length;

  const waveform = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    waveform[i] = (sample[i] - 128) / 128;
  }

  return waveform;
};

export const mixVoices = (voices: Uint8Array[]): Uint8Array => {
  const length = voices[0].length;
  const mixed = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    // Uint8 uses 128 as zero-center, so convert to signed first
    let sum = 0;
    for (const voice of voices) {
      sum += voice[i] - 128;
    }

    // Average to prevent clipping, re-center at 128, clamp to [0, 255]
    const avg = sum / voices.length;
    mixed[i] = Math.max(0, Math.min(255, Math.round(avg + 128)));
  }

  return mixed;
};
