import { describe, expect, it } from 'vitest';
import { getPerformanceSettings, selectPerformanceTier } from './tier';

describe('performance tier selection', () => {
  it('selects low for narrow or coarse-pointer devices', () => {
    expect(selectPerformanceTier({ width: 390, devicePixelRatio: 3, hasCoarsePointer: true })).toBe('low');
    expect(selectPerformanceTier({ width: 1200, devicePixelRatio: 1, hasCoarsePointer: true })).toBe('low');
  });

  it('selects medium for tablets, high DPR screens, and lower core counts', () => {
    expect(selectPerformanceTier({ width: 900, devicePixelRatio: 1, hasCoarsePointer: false })).toBe('medium');
    expect(selectPerformanceTier({ width: 1440, devicePixelRatio: 2, hasCoarsePointer: false })).toBe('medium');
    expect(selectPerformanceTier({ width: 1440, devicePixelRatio: 1, hardwareConcurrency: 4, hasCoarsePointer: false })).toBe('medium');
  });

  it('selects high only for desktop-class profiles', () => {
    expect(selectPerformanceTier({ width: 1440, devicePixelRatio: 1, hardwareConcurrency: 8, hasCoarsePointer: false })).toBe('high');
  });

  it('returns deterministic render budgets per tier', () => {
    expect(getPerformanceSettings('high').energyParticleCount).toBeGreaterThan(getPerformanceSettings('medium').energyParticleCount);
    expect(getPerformanceSettings('low').maxPixelRatio).toBe(1);
  });
});
