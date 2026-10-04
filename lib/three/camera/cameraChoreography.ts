import * as THREE from 'three';

/**
 * Camera Choreography System for the DigiWeek '26 Cinematic Experience.
 *
 * Defines the spline trajectories for both camera world position and lookAt target.
 * Scroll progress (0 -> 1) maps deterministically to points along the Catmull-Rom curves.
 * Damped pointer offsets are applied on top of the base path, fading to zero as the
 * journey approaches full reveal.
 */

// Camera trajectory control points through the spatial scene
export const CAMERA_CONTROL_POINTS: readonly THREE.Vector3[] = [
  new THREE.Vector3(-7.2, 2.8, 17.8),
  new THREE.Vector3(-5.0, 2.1, 13.8),
  new THREE.Vector3(-2.5, 1.7, 10.2),
  new THREE.Vector3(-0.8, 1.35, 7.3),
  new THREE.Vector3(1.0, 1.55, 5.0),
  new THREE.Vector3(2.8, 2.15, 2.4),
  new THREE.Vector3(4.0, 2.9, 0.2),
  new THREE.Vector3(2.5, 3.9, -2.8),
];

// Target look-at trajectory control points
export const TARGET_CONTROL_POINTS: readonly THREE.Vector3[] = [
  new THREE.Vector3(-0.2, 1.3, -1.4),
  new THREE.Vector3(-0.1, 1.35, -1.7),
  new THREE.Vector3(-0.2, 1.55, -1.8),
  new THREE.Vector3(0.25, 1.8, -2.2),
  new THREE.Vector3(1.4, 2.0, -3.4),
  new THREE.Vector3(2.8, 2.7, -4.5),
  new THREE.Vector3(3.0, 3.4, -5.1),
  new THREE.Vector3(2.3, 4.0, -5.0),
];

export interface CameraChoreography {
  cameraCurve: THREE.CatmullRomCurve3;
  targetCurve: THREE.CatmullRomCurve3;
  evaluate(
    scrollProgress: number,
    pointerX: number,
    pointerY: number,
    reducedMotion: boolean,
    outCameraPosition: THREE.Vector3,
    outTargetPosition: THREE.Vector3,
  ): void;
}

export function createCameraChoreography(): CameraChoreography {
  const cameraCurve = new THREE.CatmullRomCurve3(
    [...CAMERA_CONTROL_POINTS],
    false,
    'catmullrom',
    0.45,
  );

  const targetCurve = new THREE.CatmullRomCurve3(
    [...TARGET_CONTROL_POINTS],
    false,
    'catmullrom',
    0.45,
  );

  return {
    cameraCurve,
    targetCurve,
    evaluate(
      scrollProgress: number,
      pointerX: number,
      pointerY: number,
      reducedMotion: boolean,
      outCameraPosition: THREE.Vector3,
      outTargetPosition: THREE.Vector3,
    ) {
      // Clamp progress to valid curve interval [0, 1]
      const progress = Math.max(0, Math.min(1, scrollProgress));

      // Sample curve points along splines without allocating new vectors
      cameraCurve.getPointAt(progress, outCameraPosition);
      targetCurve.getPointAt(progress, outTargetPosition);

      // Subtle parallax response: strongest in hero view, smoothly diminishing as scroll progresses
      const pointerStrength = reducedMotion ? 0 : 0.16 * (1 - progress);
      outCameraPosition.x += pointerX * pointerStrength;
      outCameraPosition.y += pointerY * pointerStrength * 0.55;

      const targetStrength = 1 - progress;
      outTargetPosition.x += pointerX * 0.055 * targetStrength;
      outTargetPosition.y += pointerY * 0.035 * targetStrength;
    },
  };
}
