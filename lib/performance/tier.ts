export type PerformanceTier = 'high' | 'medium' | 'low';

export type PerformanceProfileInput = {
  width: number;
  devicePixelRatio: number;
  hardwareConcurrency?: number;
  hasCoarsePointer: boolean;
};

export type PerformanceSettings = {
  tier: PerformanceTier;
  maxPixelRatio: number;
  starCount: number;
  energyParticleCount: number;
  reliefSegments: {
    width: number;
    height: number;
  };
};

export function selectPerformanceTier({
  width,
  devicePixelRatio,
  hardwareConcurrency,
  hasCoarsePointer,
}: PerformanceProfileInput): PerformanceTier {
  if (width < 760 || hasCoarsePointer) {
    return 'low';
  }

  if (width < 1180 || devicePixelRatio > 1.75 || (hardwareConcurrency !== undefined && hardwareConcurrency <= 4)) {
    return 'medium';
  }

  return 'high';
}

export function getPerformanceSettings(tier: PerformanceTier): PerformanceSettings {
  if (tier === 'high') {
    return {
      tier,
      maxPixelRatio: 1.5,
      starCount: 440,
      energyParticleCount: 520,
      reliefSegments: { width: 132, height: 76 },
    };
  }

  if (tier === 'medium') {
    return {
      tier,
      maxPixelRatio: 1.25,
      starCount: 280,
      energyParticleCount: 320,
      reliefSegments: { width: 132, height: 76 },
    };
  }

  return {
    tier,
    maxPixelRatio: 1,
    starCount: 150,
    energyParticleCount: 180,
    reliefSegments: { width: 78, height: 46 },
  };
}
