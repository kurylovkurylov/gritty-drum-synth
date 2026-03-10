import { WTGeneratorFn } from "./types";

export const sineFn: WTGeneratorFn = (size, i) =>
  Math.sin((i / size) * Math.PI * 2);

export const noiseFn: WTGeneratorFn = (_size, _i) => Math.random() * 2 - 1;
