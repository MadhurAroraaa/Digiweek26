'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { damp, normalizeScrollProgress } from '@/lib/animation/math';
import { createCameraChoreography } from '@/lib/three/camera/cameraChoreography';
import { disposeRenderer, disposeScene } from '@/lib/three/dispose';
import { animateWorld } from '@/lib/three/scene/animateWorld';
import { createCinematicWorld } from '@/lib/three/scene/createCinematicWorld';
import { FilmShader } from '@/lib/three/shaders/FilmShader';
import { getPerformanceSettings, selectPerformanceTier } from '@/lib/performance/tier';

/**
 * DigiWeek '26 Hero Experience.
 *
 * Coordinates the full WebGL lifecycle:
 * - Initializes Three.js scene, camera choreography, post-processing
 * - Drives camera and world transformation deterministically from scroll progress
 * - Manages memory-safe render loop with 0 hot-path allocations
 * - Disposes WebGL resources on unmount
 */
export default function Experience() {
  const containerRef = useRef<HTMLElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const heroUiRef = useRef<HTMLDivElement | null>(null);
  const heroGrainRef = useRef<HTMLDivElement | null>(null);
  const heroVignetteRef = useRef<HTMLDivElement | null>(null);
  const heroCurtainRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const heroContainer = containerRef.current;
    if (!mount || !heroContainer) return;

    // Viewport dimensions cached on resize to avoid hot-path DOM querying
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    const prefersCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const performanceTier = selectPerformanceTier({
      width: viewportWidth,
      devicePixelRatio: window.devicePixelRatio,
      hardwareConcurrency: navigator.hardwareConcurrency,
      hasCoarsePointer: prefersCoarsePointer,
    });
    const performanceSettings = getPerformanceSettings(performanceTier);

    // -------------------- Three.js Scene & Camera --------------------
    const scene = new THREE.Scene();
    const fogDensity =
      performanceTier === 'high' ? 0.018 : performanceTier === 'medium' ? 0.022 : 0.028;
    scene.fog = new THREE.FogExp2(0x020805, fogDensity);

    const camera = new THREE.PerspectiveCamera(42, viewportWidth / viewportHeight, 0.1, 180);
    camera.position.set(-7.8, 3.0, 18.5);

    // -------------------- Renderer & Post-Processing --------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(viewportWidth, viewportHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, performanceSettings.maxPixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x020504, 1);
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(viewportWidth, viewportHeight),
      performanceTier === 'high' ? 0.48 : 0.32,
      0.5,
      0.78,
    );
    bloomPass.threshold = 0.86;
    bloomPass.strength = 0.28;
    bloomPass.radius = 0.48;
    composer.addPass(bloomPass);

    const filmPass = new ShaderPass(FilmShader);
    filmPass.uniforms.uStrength.value = performanceTier === 'high' ? 0.055 : 0.04;
    filmPass.uniforms.uChromatic.value = 0.0028;
    filmPass.uniforms.uVignette.value = 0.16;
    composer.addPass(filmPass);

    // -------------------- Spatial World & Camera Choreography --------------------
    const world = createCinematicWorld(scene, performanceSettings, performanceTier);
    const choreography = createCameraChoreography();

    // Reusable vectors for hot-loop camera evaluation (pre-allocated to avoid GC churn)
    const evaluatedCameraPos = new THREE.Vector3();
    const evaluatedTargetPos = new THREE.Vector3();

    // -------------------- Input & Scroll State --------------------
    const rawPointer = new THREE.Vector2(0, 0);
    const dampedPointer = new THREE.Vector2(0, 0);
    let targetScrollProgress = 0;
    let currentScrollProgress = 0;

    const updateScrollProgress = () => {
      const rect = heroContainer.getBoundingClientRect();
      targetScrollProgress = normalizeScrollProgress(rect.top, rect.height, viewportHeight);
    };

    const handleScroll = () => {
      updateScrollProgress();
    };

    const handlePointerMove = (event: PointerEvent) => {
      rawPointer.x = (event.clientX / viewportWidth) * 2 - 1;
      rawPointer.y = -(event.clientY / viewportHeight) * 2 + 1;
    };

    const handleResize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;

      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();

      const pixelRatio = Math.min(window.devicePixelRatio, performanceSettings.maxPixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      renderer.setPixelRatio(pixelRatio);
      composer.setSize(viewportWidth, viewportHeight);
      bloomPass.resolution.set(viewportWidth, viewportHeight);

      updateScrollProgress();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !disposed) {
        lastTimestamp = performance.now();
        animationFrameId = requestAnimationFrame(renderFrame);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (!prefersCoarsePointer) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
    }
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    updateScrollProgress();

    // -------------------- Render Loop --------------------
    let animationFrameId = 0;
    let lastTimestamp = performance.now();
    let disposed = false;

    const renderFrame = (now: number) => {
      if (disposed) return;
      if (document.hidden) {
        animationFrameId = 0;
        return;
      }

      const deltaTime = Math.min(0.033, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      // Smooth damping for scroll and pointer (snappier under reduced motion)
      currentScrollProgress = damp(
        currentScrollProgress,
        targetScrollProgress,
        reducedMotion ? 60 : 11,
        deltaTime,
      );
      dampedPointer.x = damp(dampedPointer.x, rawPointer.x, reducedMotion ? 100 : 6, deltaTime);
      dampedPointer.y = damp(dampedPointer.y, rawPointer.y, reducedMotion ? 100 : 6, deltaTime);

      // Evaluate camera position & lookAt target along splines
      choreography.evaluate(
        currentScrollProgress,
        dampedPointer.x,
        dampedPointer.y,
        reducedMotion,
        evaluatedCameraPos,
        evaluatedTargetPos,
      );

      camera.position.copy(evaluatedCameraPos);
      camera.lookAt(evaluatedTargetPos);

      // Animate world elements, shaders, lights, and post-processing
      const narrativeState = animateWorld({
        world,
        bloomPass,
        filmPass,
        now,
        dt: deltaTime,
        scrollProgress: currentScrollProgress,
        pointerX: dampedPointer.x,
        pointerY: dampedPointer.y,
        performanceTier,
      });

      // Update hero DOM overlays directly to avoid document-wide CSS custom property invalidation
      if (heroUiRef.current) {
        heroUiRef.current.style.opacity = String(narrativeState.uiOpacity);
        heroUiRef.current.style.transform = `translateY(-50%) scale(${narrativeState.titleScale})`;
      }
      if (heroGrainRef.current) {
        heroGrainRef.current.style.opacity = String(0.055 * (1 - narrativeState.reveal));
      }
      if (heroVignetteRef.current) {
        heroVignetteRef.current.style.opacity = String(0.35 * (1 - narrativeState.reveal));
      }
      if (heroCurtainRef.current) {
        heroCurtainRef.current.style.opacity = String(narrativeState.transformation);
      }

      composer.render();
      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    // -------------------- Safe Resource Disposal --------------------
    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrameId);

      window.removeEventListener('scroll', handleScroll);
      if (!prefersCoarsePointer) {
        window.removeEventListener('pointermove', handlePointerMove);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      disposeScene(scene);
      disposeRenderer(renderer, composer);
    };
  }, []);

  return (
    <section ref={containerRef} className="experience" aria-label="DigiWeek cinematic introduction">
      <div ref={mountRef} className="webgl-canvas" />
      <div ref={heroGrainRef} className="hero-grain" />
      <div ref={heroVignetteRef} className="hero-vignette" />
      <div ref={heroCurtainRef} className="hero-curtain" />

      <div ref={heroUiRef} className="hero-ui">
        <div className="hero-brand-lockup">
          <div className="hero-brand-logos">
            <img
              src="/assets/brand/ucc-logo.png"
              alt="UCC & DA Logo"
              className="hero-brand-logo hero-logo-ucc"
              width={38}
              height={38}
            />
            <img
              src="/assets/brand/university-logo.png"
              alt="J.C. Bose University Logo"
              className="hero-brand-logo hero-logo-univ"
              width={38}
              height={38}
            />
          </div>
          <div className="hero-kicker">A FLAGSHIP INITIATIVE BY UCC &amp; DA</div>
        </div>

        <h1>DIGIWEEK <span>&apos;26</span></h1>

        <div className="hero-institution-line">
          <span>J.C. BOSE UNIVERSITY OF SCIENCE &amp; TECHNOLOGY</span>
          <em>YMCA · FARIDABAD</em>
        </div>

        <p>A different world.<br />Built by students.</p>
        <div className="hero-meta"><span>COMING SOON</span><span>SCROLL TO ENTER</span></div>
      </div>

      <div className="hero-scroll"><span>↓</span> SCROLL</div>
      <div className="hero-stage-note">THE NEXT WORLD IS LOADING</div>
    </section>
  );
}
