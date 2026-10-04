export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }

  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function damp(current: number, target: number, lambda: number, deltaTime: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * deltaTime));
}

export function normalizeScrollProgress(sectionTop: number, sectionHeight: number, viewportHeight: number) {
  const scrollableDistance = Math.max(1, sectionHeight - viewportHeight);
  return clamp01(-sectionTop / scrollableDistance);
}
