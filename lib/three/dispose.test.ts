import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { disposeMaterial, disposeRenderer, disposeScene } from './dispose';

describe('Three.js resource disposal', () => {
  it('disposes materials and directly attached textures', () => {
    const texture = new THREE.Texture();
    const textureDisposeSpy = vi.spyOn(texture, 'dispose');

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const matDisposeSpy = vi.spyOn(material, 'dispose');

    disposeMaterial(material);

    expect(matDisposeSpy).toHaveBeenCalledOnce();
    expect(textureDisposeSpy).toHaveBeenCalledOnce();
  });

  it('disposes textures nested in ShaderMaterial uniforms', () => {
    const texture = new THREE.Texture();
    const textureDisposeSpy = vi.spyOn(texture, 'dispose');

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: texture },
      },
    });
    const matDisposeSpy = vi.spyOn(shaderMaterial, 'dispose');

    disposeMaterial(shaderMaterial);

    expect(matDisposeSpy).toHaveBeenCalledOnce();
    expect(textureDisposeSpy).toHaveBeenCalledOnce();
  });

  it('recursively disposes all geometries and materials across scene graph', () => {
    const scene = new THREE.Scene();
    const geo1 = new THREE.BoxGeometry(1, 1, 1);
    const mat1 = new THREE.MeshBasicMaterial();
    const mesh1 = new THREE.Mesh(geo1, mat1);

    const geo2 = new THREE.SphereGeometry(1, 8, 8);
    const mat2 = new THREE.MeshStandardMaterial();
    const mesh2 = new THREE.Mesh(geo2, mat2);

    const group = new THREE.Group();
    group.add(mesh2);
    scene.add(mesh1);
    scene.add(group);

    const geo1Spy = vi.spyOn(geo1, 'dispose');
    const geo2Spy = vi.spyOn(geo2, 'dispose');
    const mat1Spy = vi.spyOn(mat1, 'dispose');
    const mat2Spy = vi.spyOn(mat2, 'dispose');

    disposeScene(scene);

    expect(geo1Spy).toHaveBeenCalledOnce();
    expect(geo2Spy).toHaveBeenCalledOnce();
    expect(mat1Spy).toHaveBeenCalledOnce();
    expect(mat2Spy).toHaveBeenCalledOnce();
    expect(scene.children.length).toBe(0);
  });

  it('disposes renderer and forces context loss without throwing', () => {
    const renderer = {
      dispose: vi.fn(),
      forceContextLoss: vi.fn(),
      domElement: document.createElement('canvas'),
    } as unknown as THREE.WebGLRenderer;

    const parent = document.createElement('div');
    parent.appendChild(renderer.domElement);

    const composer = {
      passes: [{ dispose: vi.fn() }],
      dispose: vi.fn(),
    } as unknown as EffectComposer;

    disposeRenderer(renderer, composer);

    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
    expect(composer.dispose).toHaveBeenCalledOnce();
    expect(composer.passes[0].dispose).toHaveBeenCalledOnce();
    expect(parent.contains(renderer.domElement)).toBe(false);
  });
});
