import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createCameraChoreography,
  CAMERA_CONTROL_POINTS,
  TARGET_CONTROL_POINTS,
} from './camera/cameraChoreography';

describe('camera choreography', () => {
  it('initializes CatmullRom spline curves with correct control points', () => {
    const choreography = createCameraChoreography();
    expect(choreography.cameraCurve.points.length).toBe(CAMERA_CONTROL_POINTS.length);
    expect(choreography.targetCurve.points.length).toBe(TARGET_CONTROL_POINTS.length);
  });

  it('evaluates start position at scroll progress 0', () => {
    const choreography = createCameraChoreography();
    const cameraPos = new THREE.Vector3();
    const targetPos = new THREE.Vector3();

    choreography.evaluate(0, 0, 0, false, cameraPos, targetPos);

    expect(cameraPos.x).toBeCloseTo(CAMERA_CONTROL_POINTS[0].x, 1);
    expect(cameraPos.y).toBeCloseTo(CAMERA_CONTROL_POINTS[0].y, 1);
    expect(cameraPos.z).toBeCloseTo(CAMERA_CONTROL_POINTS[0].z, 1);

    expect(targetPos.x).toBeCloseTo(TARGET_CONTROL_POINTS[0].x, 1);
    expect(targetPos.y).toBeCloseTo(TARGET_CONTROL_POINTS[0].y, 1);
  });

  it('evaluates end position at scroll progress 1', () => {
    const choreography = createCameraChoreography();
    const cameraPos = new THREE.Vector3();
    const targetPos = new THREE.Vector3();

    choreography.evaluate(1, 0, 0, false, cameraPos, targetPos);

    const lastCamPoint = CAMERA_CONTROL_POINTS[CAMERA_CONTROL_POINTS.length - 1];
    expect(cameraPos.x).toBeCloseTo(lastCamPoint.x, 1);
    expect(cameraPos.y).toBeCloseTo(lastCamPoint.y, 1);
    expect(cameraPos.z).toBeCloseTo(lastCamPoint.z, 1);
  });

  it('applies pointer offset in hero view and zeroes it at full reveal', () => {
    const choreography = createCameraChoreography();
    const heroPosWithoutPointer = new THREE.Vector3();
    const heroTargetWithoutPointer = new THREE.Vector3();
    choreography.evaluate(0, 0, 0, false, heroPosWithoutPointer, heroTargetWithoutPointer);

    const heroPosWithPointer = new THREE.Vector3();
    const heroTargetWithPointer = new THREE.Vector3();
    choreography.evaluate(0, 1, 1, false, heroPosWithPointer, heroTargetWithPointer);

    // Should deflect when pointer is active at progress 0
    expect(heroPosWithPointer.x).toBeGreaterThan(heroPosWithoutPointer.x);

    // At progress 1, pointer offset should vanish completely
    const endPosWithoutPointer = new THREE.Vector3();
    const endTargetWithoutPointer = new THREE.Vector3();
    choreography.evaluate(1, 0, 0, false, endPosWithoutPointer, endTargetWithoutPointer);

    const endPosWithPointer = new THREE.Vector3();
    const endTargetWithPointer = new THREE.Vector3();
    choreography.evaluate(1, 1, 1, false, endPosWithPointer, endTargetWithPointer);

    expect(endPosWithPointer.x).toBeCloseTo(endPosWithoutPointer.x, 5);
    expect(endPosWithPointer.y).toBeCloseTo(endPosWithoutPointer.y, 5);
  });

  it('ignores pointer offset when reducedMotion is enabled', () => {
    const choreography = createCameraChoreography();
    const posWithoutPointer = new THREE.Vector3();
    const targetWithoutPointer = new THREE.Vector3();
    choreography.evaluate(0, 0, 0, true, posWithoutPointer, targetWithoutPointer);

    const posWithPointer = new THREE.Vector3();
    const targetWithPointer = new THREE.Vector3();
    choreography.evaluate(0, 1, 1, true, posWithPointer, targetWithPointer);

    expect(posWithPointer.x).toBeCloseTo(posWithoutPointer.x, 5);
    expect(posWithPointer.y).toBeCloseTo(posWithoutPointer.y, 5);
  });
});
