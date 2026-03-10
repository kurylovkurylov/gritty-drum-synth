import { U8_MID } from "../const";

export const u8toF32 = (value: number) => (value - U8_MID) / U8_MID;
export const f32toU8 = (value: number) => value * U8_MID + U8_MID;
