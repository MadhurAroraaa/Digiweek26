import * as THREE from 'three';
import type { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { smoothstep } from '@/lib/animation/math';
import type { PerformanceTier } from '@/lib/performance/tier';
import type { CinematicWorld } from './createCinematicWorld';

export interface FrameAnimationContext {
  world: CinematicWorld;
  bloomPass: UnrealBloomPass;
  filmPass: ShaderPass;
  now: number;
  dt: number;
  scrollProgress: number;
  pointerX: number;
  pointerY: number;
  performanceTier: PerformanceTier;
}

export interface FrameNarrativeState {
  uiOpacity: number;
  titleScale: number;
  reveal: number;
  transformation: number;
}

/**
 * Executes per-frame updates for all scene elements, lighting, shaders, and materials.
 * Strictly avoids memory allocations (no Vector3, closures, or arrays created in hot loop).
 */
export function animateWorld({
  world,
  bloomPass,
  filmPass,
  now,
  dt,
  scrollProgress,
  pointerX,
  pointerY,
  performanceTier,
}: FrameAnimationContext): FrameNarrativeState {
  const s = scrollProgress;

  // Narrative milestones driven strictly by normalized scroll progress
  const build = smoothstep(0.04, 0.24, s);
  const discovery = smoothstep(0.18, 0.47, s);
  const charge = smoothstep(0.42, 0.68, s);
  const transformation = smoothstep(0.64, 0.90, s);
  const reveal = smoothstep(0.86, 1.0, s);

  // 1. Sky & Celestial Atmosphere
  world.sky.material.uniforms.uTime.value = now * 0.00011;
  world.sky.material.uniforms.uPulse.value = 0.22 + Math.sin(now * 0.0006) * 0.07 + transformation * 0.55;
  world.stars.rotation.y = now * 0.0000035;
  world.stars.position.x = pointerX * 0.055;
  world.stars.position.y = pointerY * 0.035;

  // 2. Parallax Foreground & Terrain Layers
  world.foreground.position.x = pointerX * 0.04;
  world.foreground.position.y = pointerY * 0.02;
  world.foliage.rotation.y = pointerX * 0.018;
  world.relief.position.x = pointerX * 0.035;
  world.relief.position.y = 1.45 + pointerY * 0.02;

  // 3. Floating Rocks (looping with index-based offsets without allocating closures)
  const rocks = world.rocks;
  const rockCount = rocks.length;
  for (let i = 0; i < rockCount; i++) {
    const rock = rocks[i];
    rock.rotation.y += dt * (0.003 + i * 0.0007);
    rock.position.y += Math.sin(now * 0.00028 + i) * 0.00055;
  }

  // 4. Floating World Fragments
  const fragments = world.fragments;
  const fragmentCount = fragments.length;
  for (let i = 0; i < fragmentCount; i++) {
    const fragment = fragments[i];
    fragment.rotation.x += dt * (0.012 + i * 0.001);
    fragment.rotation.y += dt * (0.016 + i * 0.0008);
    fragment.position.y += Math.sin(now * 0.00026 + i * 1.7) * 0.0012;
  }

  // 5. Transformation Device Kinetics
  const device = world.device;
  device.position.x = -0.8 + Math.sin(s * Math.PI * 1.2) * 0.16;
  device.rotation.y = -0.22 + discovery * 0.34;
  device.rotation.x = Math.sin(now * 0.00023) * 0.01 + charge * 0.045;

  const rings = world.deviceRings;
  if (rings.length >= 3) {
    rings[0].rotation.z += dt * 0.13;
    rings[1].rotation.z -= dt * 0.09;
    rings[2].rotation.z += dt * 0.065;
  }
  world.hourglass.rotation.z += dt * 0.18;

  // 6. Dynamic Device & Scene Illuminations
  world.deviceFaceMaterial.emissiveIntensity = 0.12 + charge * 2.0 + transformation * 5.8;
  world.greenLight.intensity = 2.1 + charge * 8 + transformation * 38;
  world.portalLight.intensity = 0.8 + transformation * 8 + reveal * 4;

  // 7. Monument & Portal Energy Reaction
  world.centerMonument.rotation.y = Math.sin(now * 0.00015) * 0.008 + transformation * 0.08;
  world.centerMonument.scale.setScalar(1 + transformation * 0.05);

  world.portal.rotation.z = Math.sin(now * 0.00022) * 0.012 + transformation * 0.18;
  world.portal.scale.setScalar(0.96 + discovery * 0.06 + transformation * 0.14);

  world.portalBeam.material.opacity = transformation * 0.12;
  world.portalBeam.scale.x = 0.6 + transformation * 2.2;
  world.innerRing.material.opacity = 0.52 + transformation * 0.42;
  world.haloRing.material.opacity = 0.12 + transformation * 0.3;

  // 8. Energy Ribbons
  const ribbons = world.ribbons;
  const ribbonCount = ribbons.length;
  for (let i = 0; i < ribbonCount; i++) {
    const line = ribbons[i];
    const mat = line.material as THREE.LineBasicMaterial;
    mat.opacity = Math.max(0.0, charge * 0.06 + transformation * 0.28);
    line.position.y = Math.sin(now * 0.00035 + i) * 0.05 * charge;
  }

  // 9. Particle Field
  world.energyPoints.material.opacity = charge * 0.12 + transformation * 0.68;
  world.energyPoints.rotation.y += dt * (0.08 + transformation * 1.3);
  world.energyPoints.rotation.z = Math.sin(now * 0.0008) * 0.18 * transformation;

  // 10. Lighting & Post-Processing Modulation
  world.coolLight.intensity = 1.15 - transformation * 0.24;
  world.ambientLight.intensity = 0.48 + transformation * 0.06;

  bloomPass.strength = 0.26 + transformation * 1.18 + reveal * 0.36;
  bloomPass.threshold = 0.9 - transformation * 0.12;

  filmPass.uniforms.uTime.value = now * 0.001;
  filmPass.uniforms.uStrength.value = (performanceTier === 'high' ? 0.055 : 0.04) + transformation * 0.012;
  filmPass.uniforms.uChromatic.value = 0.0028 + transformation * 0.018;
  filmPass.uniforms.uVignette.value = 0.16 + transformation * 0.14;

  // Return UI choreography state
  const uiOpacity = Math.max(0.1, 1 - smoothstep(0.55, 0.84, s));
  const titleScale = 1 + build * 0.01;

  return {
    uiOpacity,
    titleScale,
    reveal,
    transformation,
  };
}
