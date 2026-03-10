export const buildSmoothNoise = (
  numPoints: number,
  totalSamples: number
): Float32Array => {
  // Random waypoints
  const waypoints = new Float32Array(numPoints + 1);
  for (let i = 0; i <= numPoints; i++) {
    waypoints[i] = Math.random() * 2 - 1; // [-1, 1]
  }

  // Cosine interpolation between waypoints
  const noise = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = (i / totalSamples) * numPoints;
    const a = Math.floor(t);
    const b = a + 1;
    const f = t - a;
    const smooth = (1 - Math.cos(f * Math.PI)) / 2; // cosine ease
    noise[i] = waypoints[a] * (1 - smooth) + waypoints[b] * smooth;
  }

  return noise;
};
