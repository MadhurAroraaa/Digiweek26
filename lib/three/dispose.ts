import * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

/**
 * Safely disposes a Three.js material and any attached textures,
 * including textures stored inside ShaderMaterial uniforms.
 */
export function disposeMaterial(material: THREE.Material): void {
  // Dispose any texture instances directly attached as properties
  const matRecord = material as unknown as Record<string, unknown>;
  for (const key of Object.keys(matRecord)) {
    const value = matRecord[key];
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }

  // Dispose textures nested inside ShaderMaterial uniforms
  if ('uniforms' in material) {
    const shaderMat = material as THREE.ShaderMaterial;
    if (shaderMat.uniforms) {
      for (const uniformName of Object.keys(shaderMat.uniforms)) {
        const uVal = shaderMat.uniforms[uniformName]?.value;
        if (uVal instanceof THREE.Texture) {
          uVal.dispose();
        }
      }
    }
  }

  material.dispose();
}

/**
 * Traverses a Three.js scene hierarchy and comprehensively disposes
 * all geometries and materials to avoid WebGL memory leaks.
 */
export function disposeScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    // Dispose geometry
    if ('geometry' in object && object.geometry instanceof THREE.BufferGeometry) {
      object.geometry.dispose();
    }

    // Dispose material(s)
    if ('material' in object && object.material) {
      if (Array.isArray(object.material)) {
        for (let i = 0; i < object.material.length; i++) {
          disposeMaterial(object.material[i]);
        }
      } else {
        disposeMaterial(object.material as THREE.Material);
      }
    }
  });

  scene.clear();
}

/**
 * Cleans up the WebGLRenderer and EffectComposer pipeline,
 * disposes all post-processing passes, forces WebGL context loss,
 * and safely unmounts the canvas DOM element.
 */
export function disposeRenderer(
  renderer: THREE.WebGLRenderer,
  composer?: EffectComposer | null,
): void {
  if (composer) {
    for (let i = 0; i < composer.passes.length; i++) {
      const pass = composer.passes[i] as { dispose?: () => void };
      if (typeof pass.dispose === 'function') {
        pass.dispose();
      }
    }
    composer.dispose();
  }

  renderer.dispose();
  renderer.forceContextLoss();

  if (renderer.domElement && renderer.domElement.parentElement) {
    renderer.domElement.parentElement.removeChild(renderer.domElement);
  }
}
