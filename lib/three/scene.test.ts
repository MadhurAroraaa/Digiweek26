import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createCinematicWorld } from './scene/createCinematicWorld';
import { animateWorld } from './scene/animateWorld';
import { getPerformanceSettings } from '@/lib/performance/tier';

describe('Three.js scene and animation', () => {
  it('creates complete procedural world elements for high tier', () => {
    const scene = new THREE.Scene();
    const settings = getPerformanceSettings('high');
    const world = createCinematicWorld(scene, settings, 'high');

    expect(world.root).toBeDefined();
    expect(world.sky).toBeDefined();
    expect(world.stars.geometry.attributes.position.count).toBe(settings.starCount);
    expect(world.energyPoints.geometry.attributes.position.count).toBe(settings.energyParticleCount);
    expect(world.rocks.length).toBe(6);
    expect(world.fragments.length).toBe(18);
    expect(world.deviceRings.length).toBe(3);
    expect(world.ribbons.length).toBe(3);
    expect(world.greenLight.intensity).toBeGreaterThan(0);
  });

  it('adjusts particle counts appropriately for low tier', () => {
    const scene = new THREE.Scene();
    const settings = getPerformanceSettings('low');
    const world = createCinematicWorld(scene, settings, 'low');

    expect(world.stars.geometry.attributes.position.count).toBe(150);
    expect(world.energyPoints.geometry.attributes.position.count).toBe(180);
  });

  it('animates scene objects deterministically across frame steps', () => {
    const scene = new THREE.Scene();
    const settings = getPerformanceSettings('high');
    const world = createCinematicWorld(scene, settings, 'high');

    const fakeBloom = { strength: 0, threshold: 0 } as unknown as import('three/examples/jsm/postprocessing/UnrealBloomPass.js').UnrealBloomPass;
    const fakeFilm = {
      uniforms: {
        uTime: { value: 0 },
        uStrength: { value: 0 },
        uChromatic: { value: 0 },
        uVignette: { value: 0 },
      },
    } as unknown as import('three/examples/jsm/postprocessing/ShaderPass.js').ShaderPass;

    const initialRockY = world.rocks[0].position.y;

    const narrative = animateWorld({
      world,
      bloomPass: fakeBloom,
      filmPass: fakeFilm,
      now: 1000,
      dt: 0.016,
      scrollProgress: 0.5,
      pointerX: 0.2,
      pointerY: -0.1,
      performanceTier: 'high',
    });

    expect(narrative.uiOpacity).toBeGreaterThanOrEqual(0.1);
    expect(narrative.titleScale).toBeGreaterThanOrEqual(1.0);
    expect(world.sky.material.uniforms.uTime.value).toBeCloseTo(0.11, 2);
    expect(fakeBloom.strength).toBeGreaterThan(0.2);
    expect(fakeFilm.uniforms.uTime.value).toBe(1);
    expect(world.rocks[0].position.y).not.toBe(initialRockY);
  });
});
