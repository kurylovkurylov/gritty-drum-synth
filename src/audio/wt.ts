import { noiseFn, sineFn } from "./generators";
import { f32toU8 } from "./utils";
import { CreateWTFn, WTGeneratorFn } from "./types";

const createWT = (
  size: number,
  generatorFn: WTGeneratorFn
): Uint8ClampedArray => {
  if (size <= 0 || !Number.isInteger(size))
    throw new RangeError(`WT size must be a positive integer, got: ${size}`);

  const wt = new Uint8ClampedArray(size);
  const gen = generatorFn.bind(null, size);

  for (let i = 0; i < size; i++) wt[i] = f32toU8(gen(i));

  return wt;
};

export const createSineWT: CreateWTFn = (size) => createWT(size, sineFn);
export const createNoiseWT: CreateWTFn = (size) => createWT(size, noiseFn);
