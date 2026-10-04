import { describe, expect, it } from 'vitest';
import { clamp01, damp, normalizeScrollProgress, smoothstep } from './math';

describe('animation math', () => {
  it('clamps values to normalized progress', () => {
    expect(clamp01(-0.3)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(1.7)).toBe(1);
  });

  it('smooths between edges deterministically', () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });

  it('normalizes section scroll against available distance', () => {
    expect(normalizeScrollProgress(0, 1850, 1000)).toBe(0);
    expect(normalizeScrollProgress(-425, 1850, 1000)).toBe(0.5);
    expect(normalizeScrollProgress(-1200, 1850, 1000)).toBe(1);
  });

  it('damps toward the target without overshooting', () => {
    const next = damp(0, 1, 8, 1 / 60);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });
});
