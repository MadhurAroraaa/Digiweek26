import type { IUniform } from 'three';

/**
 * Post-processing shader simulating 35mm film grain, subtle lens chromatic aberration,
 * and radial edge vignette.
 *
 * Designed for full-screen quad passes in Three.js EffectComposer.
 */
export interface FilmShaderUniforms {
  tDiffuse: IUniform;
  uTime: IUniform<number>;
  uStrength: IUniform<number>;
  uChromatic: IUniform<number>;
  uVignette: IUniform<number>;
  [uniform: string]: IUniform;
}

export const FilmShader = {
  name: 'FilmShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uStrength: { value: 0.08 },
    uChromatic: { value: 0.004 },
    uVignette: { value: 0.22 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uStrength;
    uniform float uChromatic;
    uniform float uVignette;
    varying vec2 vUv;

    // High-frequency pseudo-random noise generator
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      vec2 centerOffset = uv - 0.5;
      float distSquared = dot(centerOffset, centerOffset);
      vec2 chromaticDir = normalize(centerOffset + vec2(0.0001));
      vec2 chromaticOffset = chromaticDir * distSquared * uChromatic;

      // Radial RGB split (chromatic aberration)
      vec3 color;
      color.r = texture2D(tDiffuse, uv + chromaticOffset).r;
      color.g = texture2D(tDiffuse, uv).g;
      color.b = texture2D(tDiffuse, uv - chromaticOffset).b;

      // Dynamic film grain
      float noise = hash(floor(uv * 900.0) + floor(uTime * 30.0));
      color += (noise - 0.5) * uStrength;

      // Radial smooth vignette
      float vignette = smoothstep(0.95, 0.18, distance(uv, vec2(0.5)) * 1.15);
      color *= mix(1.0 - uVignette, 1.0, vignette);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};
