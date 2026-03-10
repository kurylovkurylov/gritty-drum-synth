// ── Sample-rate-agnostic wavetable ─────────────────────────────────────────
// Source     : sample_wavetable.json
// Fundamental: 32.7152 Hz  |  2 frames  |  table size: 256
//
// Phase accumulation (works at any sample rate):
//   phaseInc = frequency * TABLE_SIZE / SAMPLE_RATE
//   phase    = (phase + phaseInc) % TABLE_SIZE
//   idx      = Math.floor(phase)   ← integer table index

export const TABLE_SIZE = 256;

export const wavetableFrame0 = new Uint8Array([
  119, 141, 89, 131, 184, 162, 168, 149, 138, 129, 127, 128, 138, 166, 181, 154,
  130, 188, 187, 137, 137, 105, 60, 199, 111, 102, 135, 34, 42, 111, 73, 80, 87,
  97, 122, 108, 117, 123, 114, 101, 67, 89, 83, 32, 41, 84, 31, 42, 116, 167,
  54, 152, 159, 120, 147, 129, 103, 140, 161, 159, 164, 153, 135, 127, 87, 84,
  126, 104, 85, 106, 50, 130, 122, 70, 112, 129, 118, 96, 198, 197, 169, 145,
  128, 162, 178, 143, 140, 134, 116, 126, 97, 63, 66, 96, 110, 104, 88, 114,
  167, 58, 126, 137, 154, 173, 47, 81, 125, 114, 115, 114, 116, 124, 131, 159,
  164, 167, 176, 142, 121, 158, 196, 106, 129, 112, 94, 159, 48, 123, 150, 103,
  158, 211, 133, 140, 155, 159, 145, 131, 153, 138, 133, 150, 132, 124, 183,
  191, 135, 178, 168, 113, 146, 192, 116, 186, 176, 137, 116, 159, 131, 66, 69,
  60, 65, 78, 90, 122, 142, 179, 143, 109, 187, 186, 169, 126, 188, 133, 70,
  114, 144, 206, 119, 175, 178, 169, 160, 126, 130, 136, 113, 131, 132, 122,
  153, 167, 147, 140, 129, 128, 121, 194, 114, 81, 105, 122, 96, 25, 107, 157,
  156, 167, 167, 134, 130, 124, 127, 134, 130, 161, 144, 123, 125, 105, 80, 147,
  175, 89, 115, 154, 102, 78, 162, 121, 137, 119, 76, 142, 158, 135, 160, 150,
  163, 184, 182, 184, 162, 112, 114, 142, 128, 105, 118, 68, 9, 117, 75, 101,
]);
export const wavetableFrame1 = new Uint8Array([
  128, 165, 174, 181, 184, 164, 150, 135, 109, 91, 81, 58, 51, 46, 45, 68, 86,
  100, 108, 114, 124, 121, 121, 130, 127, 134, 143, 143, 150, 155, 155, 158,
  156, 156, 149, 134, 118, 80, 48, 34, 16, 6, 17, 19, 32, 61, 74, 92, 118, 126,
  141, 160, 164, 174, 187, 185, 195, 204, 200, 205, 207, 201, 201, 196, 196,
  207, 207, 207, 195, 182, 175, 154, 140, 133, 115, 107, 106, 92, 86, 74, 59,
  62, 69, 74, 91, 108, 119, 137, 151, 160, 172, 184, 187, 199, 206, 204, 216,
  217, 209, 216, 200, 181, 180, 167, 164, 165, 165, 169, 168, 171, 171, 162,
  168, 164, 157, 160, 160, 154, 157, 157, 154, 156, 156, 157, 154, 156, 159,
  154, 163, 177, 177, 183, 183, 169, 162, 148, 130, 119, 101, 89, 82, 78, 78,
  94, 114, 132, 146, 160, 171, 172, 177, 187, 178, 182, 184, 173, 173, 166, 155,
  153, 142, 129, 120, 104, 82, 62, 45, 35, 27, 24, 25, 21, 28, 33, 35, 40, 46,
  51, 56, 60, 62, 65, 66, 71, 73, 73, 82, 76, 81, 86, 78, 79, 90, 97, 110, 117,
  122, 128, 126, 131, 125, 120, 122, 112, 104, 106, 91, 76, 66, 48, 43, 41, 35,
  37, 42, 45, 50, 55, 57, 64, 69, 68, 70, 70, 64, 64, 57, 37, 30, 19, 5, 7, 6,
  3, 13, 18, 22, 35, 39, 43, 50, 53, 55, 51, 52, 55, 49, 54, 60, 59, 72, 81, 85,
  103, 109, 110,
]);

const wtEnvelope = [1.0, 0.156736];

export const wtFrames: [Uint8Array, Uint8Array] = [
  wavetableFrame0,
  wavetableFrame1,
];

// ── Drop-in render loop ─────────────────────────────────────────────────────
//
// Remove your sawtooth wavetable build entirely, then replace the
// inner sample loop with this:
//
// let phase = 0;
//
// for (let i = 0; i < totalSamples; i++) {
//   const t         = i / totalSamples;
//   const gain      = 1 - t;
//   const baseFreq  = START_FREQ + (END_FREQ - START_FREQ) * t;
//   const frequency = baseFreq * (1 + drift[i] * DRIFT_DEPTH);
//
//   // ── Phase accumulation (SR-agnostic) ──
//   const phaseInc  = frequency * TABLE_SIZE / SAMPLE_RATE;
//
//   // ── Wavetable read with sub-sample lerp + jitter ──
//   const jitter    = (Math.random() - 0.5) * 3;
//   const pos       = (phase + jitter + TABLE_SIZE) % TABLE_SIZE;
//   const idxA      = Math.floor(pos) % TABLE_SIZE;
//   const idxB      = (idxA + 1) % TABLE_SIZE;
//   const tPhase    = pos - Math.floor(pos);
//
//   // ── Frame morphing ──
//   const frameF    = t * 1;
//   const frameA    = Math.floor(frameF);
//   const frameB    = Math.min(frameA + 1, 1);
//   const tFrame    = frameF - frameA;
//
//   const readFrame = (fr, a, b, t) =>
//     (fr[a] - 128) * (1 - t) + (fr[b] - 128) * t;
//
//   const rawA      = readFrame(wtFrames[frameA], idxA, idxB, tPhase);
//   const rawB      = readFrame(wtFrames[frameB], idxA, idxB, tPhase);
//   const raw       = rawA * (1 - tFrame) + rawB * tFrame;
//
//   const envAmp    = wtEnvelope[frameA] * (1 - tFrame) + wtEnvelope[frameB] * tFrame;
//   const dither    = Math.random() - 0.5;
//   sample[i]       = Math.round(raw * gain * envAmp + dither) + 128;
//
//   phase = (phase + phaseInc) % TABLE_SIZE;
// }
