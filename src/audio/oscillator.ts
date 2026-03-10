import { u8toF32, f32toU8 } from "./utils";

export interface OscillatorOptions {
  wt: Uint8ClampedArray;
  sampleRate: number;
  duration: number;
  freqFn: (t: number) => number;
  envelopeFn?: (t: number) => number;
  driveFn?: (v: number) => number;
  postDriveFn?: (v: number) => number;
}

export const createOscillator = ({
  wt,
  sampleRate,
  duration,
  freqFn,
  envelopeFn = () => 1,
  driveFn = (v) => v,
  postDriveFn = (v) => v,
}: OscillatorOptions): Uint8ClampedArray => {
  const totalSamples = Math.floor(sampleRate * duration);
  const wtSize = wt.length;

  const out = new Uint8ClampedArray(totalSamples);
  let phase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / totalSamples;
    const currentFreq = freqFn(t);

    phase = (phase + (currentFreq * wtSize) / sampleRate) % wtSize;

    const raw = u8toF32(wt[Math.floor(phase)]);
    out[i] = f32toU8(postDriveFn(driveFn(raw) * envelopeFn(t)));
  }

  return out;
};
