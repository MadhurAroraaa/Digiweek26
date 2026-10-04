import * as THREE from 'three';
import type { PerformanceSettings, PerformanceTier } from '@/lib/performance/tier';

/**
 * Deterministic pseudo-random number generator for procedural scene generation.
 * Guarantees identical rock, star, foliage, and fragment placement on every load.
 */
export function createSeededRandom(seed = 2601) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function makeBox(
  material: THREE.Material,
  size: [width: number, height: number, depth: number],
  position: [x: number, y: number, z: number],
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  return mesh;
}

function makeRock(
  material: THREE.Material,
  position: [x: number, y: number, z: number],
  scale: [x: number, y: number, z: number],
): THREE.Mesh {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), material);
  rock.position.set(...position);
  rock.scale.set(...scale);
  return rock;
}

function makeRing(
  radius: number,
  tube: number,
  color: number,
  opacity: number,
  position: [x: number, y: number, z: number],
  rotation: [x: number, y: number, z: number],
): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 14, 180),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
  );
  ring.position.set(...position);
  ring.rotation.set(...rotation);
  return ring;
}

export interface CinematicWorld {
  root: THREE.Group;
  sky: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  stars: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  relief: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  centerMonument: THREE.Group;
  portal: THREE.Group;
  portalBeam: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
  innerRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  haloRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  foreground: THREE.Group;
  foliage: THREE.Group;
  rocks: THREE.Mesh[];
  fragments: THREE.Mesh[];
  device: THREE.Group;
  deviceFaceMaterial: THREE.MeshStandardMaterial;
  hourglass: THREE.Mesh;
  deviceRings: THREE.Mesh[];
  ribbons: THREE.Line[];
  energyPoints: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  ambientLight: THREE.HemisphereLight;
  coolLight: THREE.DirectionalLight;
  greenLight: THREE.PointLight;
  portalLight: THREE.PointLight;
}

/**
 * Constructs the entire 3D cinematic spatial world for DigiWeek '26.
 */
export function createCinematicWorld(
  scene: THREE.Scene,
  performanceSettings: PerformanceSettings,
  performanceTier: PerformanceTier,
): CinematicWorld {
  const random = createSeededRandom();
  const world = new THREE.Group();
  scene.add(world);

  // -------------------- Sky Sphere (Procedural Atmosphere Shader) --------------------
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uPulse;
      varying vec3 vPos;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      void main() {
        vec3 n = normalize(vPos);
        float h = clamp(n.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 bottom = vec3(0.0015, 0.004, 0.005);
        vec3 mid = vec3(0.006, 0.018, 0.015);
        vec3 top = vec3(0.012, 0.028, 0.034);
        vec3 c = mix(bottom, mid, smoothstep(0.12, 0.55, h));
        c = mix(c, top, smoothstep(0.55, 1.0, h));

        float cloud = noise(n.xz * 3.6 + vec2(uTime * 0.003, -uTime * 0.002));
        c += vec3(0.002, 0.012, 0.009) * cloud;

        float horizon = exp(-pow((n.y + 0.01) * 7.0, 2.0));
        c += vec3(0.0, 0.038, 0.02) * horizon * (0.45 + uPulse * 0.8);

        float star = step(0.9981, hash(floor(n.xz * 520.0)));
        c += vec3(0.36, 0.62, 0.52) * star * (0.55 + 0.45 * h);

        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });

  const sky = new THREE.Mesh(new THREE.SphereGeometry(72, 48, 32), skyMaterial);
  world.add(sky);

  // -------------------- Star Field --------------------
  const starCount = performanceSettings.starCount;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 30 + random() * 30;
    starPositions[i * 3] = Math.cos(angle) * radius;
    starPositions[i * 3 + 1] = (random() - 0.15) * 21;
    starPositions[i * 3 + 2] = -32 - random() * 30;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0x9dffd1,
      size: performanceTier === 'low' ? 0.028 : 0.04,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  world.add(stars);

  // -------------------- Textural Displaced Relief Surface --------------------
  const reliefGeometry = new THREE.PlaneGeometry(
    26,
    14.2,
    performanceSettings.reliefSegments.width,
    performanceSettings.reliefSegments.height,
  );
  const reliefPositions = reliefGeometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < reliefPositions.count; i++) {
    const x = reliefPositions.getX(i);
    const y = reliefPositions.getY(i);
    const arc = Math.abs(Math.hypot(x - 3.0, y - 1.4) - 4.2);
    const arcLift = Math.exp(-Math.pow(arc / 0.75, 2)) * 0.26;
    const ridge = Math.exp(-Math.pow((x + 3.4) / 2.4, 2) - Math.pow((y - 0.2) / 3.2, 2)) * 0.18;
    const ripple = Math.sin(x * 1.25 + y * 0.8) * 0.035 + Math.sin(y * 2.4 - x * 0.35) * 0.025;
    reliefPositions.setZ(i, arcLift + ridge + ripple);
  }
  reliefPositions.needsUpdate = true;
  reliefGeometry.computeVertexNormals();

  const relief = new THREE.Mesh(
    reliefGeometry,
    new THREE.MeshStandardMaterial({
      color: 0x07100d,
      roughness: 0.94,
      metalness: 0.08,
      emissive: 0x01140a,
      emissiveIntensity: 0.17,
      side: THREE.DoubleSide,
    }),
  );
  relief.rotation.x = -0.06;
  relief.position.set(0, 1.45, -10.6);
  world.add(relief);

  // -------------------- Shared Horizon Materials --------------------
  const farMat = new THREE.MeshStandardMaterial({ color: 0x0a1713, roughness: 0.92, metalness: 0.05 });
  const midMat = new THREE.MeshStandardMaterial({ color: 0x12221c, roughness: 0.78, metalness: 0.18 });
  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x142a1f,
    roughness: 0.56,
    metalness: 0.26,
    emissive: 0x07371f,
    emissiveIntensity: 0.16,
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x040907, roughness: 0.98, metalness: 0 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0x26332e, roughness: 0.4, metalness: 0.68 });
  const energyMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.62,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // -------------------- Horizon Architecture --------------------
  const horizon = new THREE.Group();
  horizon.position.set(0, -1.55, -12.5);
  world.add(horizon);

  const buildingXs = [-9, -7.2, -5.6, -3.8, -2.1, 0, 2.0, 3.9, 5.6, 7.5, 9.2];
  const buildingDepths = [1.9, 2.4, 1.8, 2.5, 2.0, 2.9, 2.1, 2.4, 1.8, 2.4, 1.8];
  const buildingHeights = [2.6, 4.2, 3.1, 4.8, 2.9, 5.2, 3.4, 4.4, 2.7, 4.5, 3.0];

  for (let i = 0; i < buildingXs.length; i++) {
    const x = buildingXs[i];
    const height = buildingHeights[i];
    const depth = buildingDepths[i];
    const buildingMesh = makeBox(farMat, [1.25, height, depth], [x, height * 0.5 - 0.05, (i % 2) * 0.18]);
    horizon.add(buildingMesh);

    if (i % 2 === 0) {
      const slitMaterial = energyMat.clone();
      slitMaterial.opacity = 0.11;
      const slitMesh = makeBox(slitMaterial, [0.08, height * 0.58, depth + 0.03], [x - 0.18, height * 0.52, 0.02]);
      horizon.add(slitMesh);
    }
  }

  // -------------------- Center Monument --------------------
  const centerMonument = new THREE.Group();
  centerMonument.position.set(0, 0, -1.1);
  const base = makeBox(midMat, [5.7, 1.6, 2.0], [0, 0.8, 0]);
  centerMonument.add(base);
  const body = makeBox(greenMat, [4.5, 4.5, 1.35], [0, 3.0, 0]);
  centerMonument.add(body);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.9, 8), midMat);
  crown.position.y = 5.8;
  crown.rotation.y = Math.PI / 8;
  centerMonument.add(crown);
  horizon.add(centerMonument);

  // -------------------- Portal Structure --------------------
  const portal = new THREE.Group();
  portal.position.set(2.9, 4.0, -4.8);
  portal.rotation.y = -0.18;
  world.add(portal);

  const outerRing = makeRing(4.15, 0.34, 0x204a37, 0.72, [0, 0, 0], [Math.PI / 2, 0, 0]);
  const innerRing = makeRing(3.64, 0.055, 0x00ff88, 0.64, [0, 0, 0.06], [Math.PI / 2, 0, 0]) as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  const haloRing = makeRing(4.55, 0.04, 0xb7ffe0, 0.20, [0, 0, 0.08], [Math.PI / 2, 0, 0]) as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  portal.add(outerRing, innerRing, haloRing);

  const portalDisc = new THREE.Mesh(
    new THREE.CircleGeometry(3.55, 96),
    new THREE.MeshBasicMaterial({ color: 0x06110c, transparent: true, opacity: 0.86, side: THREE.DoubleSide }),
  );
  portalDisc.rotation.x = -Math.PI / 2;
  portalDisc.position.z = -0.02;
  portal.add(portalDisc);

  const portalBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.85, 8.5, 32, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x4dffad,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  portalBeam.rotation.z = Math.PI / 2;
  portalBeam.position.x = -0.6;
  portalBeam.position.z = -0.05;
  portal.add(portalBeam);

  // -------------------- Foreground Framing Architecture --------------------
  const foreground = new THREE.Group();
  world.add(foreground);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x07120e, roughness: 0.9, metalness: 0.03 });
  const frameGlowMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const leftFrame = new THREE.Group();
  leftFrame.position.set(-7.0, 1.1, 4.6);
  leftFrame.rotation.z = -0.08;
  leftFrame.add(makeBox(frameMat, [0.65, 6.8, 1.25], [0, 0, 0]));
  leftFrame.add(makeBox(frameMat, [3.8, 0.55, 1.0], [1.55, 3.05, 0]));
  leftFrame.add(makeBox(frameGlowMat, [0.06, 5.2, 1.32], [0.36, 0, 0.1]));
  foreground.add(leftFrame);

  const rightFrame = new THREE.Group();
  rightFrame.position.set(7.1, 0.7, 6.4);
  rightFrame.rotation.z = 0.06;
  rightFrame.add(makeBox(frameMat, [0.72, 7.6, 1.4], [0, 0, 0]));
  rightFrame.add(makeBox(frameMat, [3.2, 0.65, 1.1], [-1.2, 3.5, 0]));
  rightFrame.add(makeBox(frameGlowMat, [0.06, 5.6, 1.5], [-0.38, 0, 0.08]));
  foreground.add(rightFrame);

  // -------------------- Foreground Geometric Rocks --------------------
  const rocks: THREE.Mesh[] = [];
  const rockConfigs = [
    [-9.1, -2.0, 3.6, 2.7, 2.9, 2.0],
    [9.0, -2.0, 4.2, 2.6, 3.6, 2.2],
    [-4.9, -2.15, 5.9, 1.3, 1.65, 1.2],
    [5.0, -2.2, 6.4, 1.5, 1.8, 1.4],
    [-11.0, -2.4, 0.2, 2.3, 3.1, 1.7],
    [11.1, -2.35, 0.1, 2.5, 3.3, 1.8],
  ] as const;

  for (let i = 0; i < rockConfigs.length; i++) {
    const [x, y, z, sx, sy, sz] = rockConfigs[i];
    const rock = makeRock(darkMat, [x, y, z], [sx, sy, sz]);
    rock.rotation.set(i * 0.18, i * 0.33, i * 0.09);
    foreground.add(rock);
    rocks.push(rock);
  }

  // -------------------- Foreground Foliage Silhouettes --------------------
  const foliage = new THREE.Group();
  foliage.position.set(-3.8, -2.35, 3.2);
  world.add(foliage);

  const trunk = makeBox(darkMat, [0.52, 4.0, 0.55], [0, 1.7, 0]);
  trunk.rotation.z = -0.12;
  foliage.add(trunk);

  for (let i = 0; i < 14; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.6 + random() * 0.45, 8, 6), darkMat);
    leaf.scale.set(1.1 + random() * 0.7, 0.75 + random() * 0.35, 0.55 + random() * 0.4);
    leaf.position.set((random() - 0.5) * 2.6, 1.6 + random() * 2.6, (random() - 0.5) * 0.9);
    leaf.rotation.z = random() * 0.7;
    foliage.add(leaf);
  }

  // -------------------- Focal Transformation Device --------------------
  const device = new THREE.Group();
  device.position.set(-0.8, 1.15, -1.4);
  device.rotation.y = -0.22;
  world.add(device);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.5, 0.65, 10), silverMat);
  pedestal.position.y = -0.58;
  device.add(pedestal);

  const pedestalBandMaterial = energyMat.clone();
  pedestalBandMaterial.opacity = 0.32;
  const pedestalBand = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.06, 10, 96), pedestalBandMaterial);
  pedestalBand.rotation.x = Math.PI / 2;
  pedestalBand.position.y = -0.22;
  device.add(pedestalBand);

  const casing = new THREE.Mesh(new THREE.CylinderGeometry(1.33, 1.25, 0.48, 12), silverMat);
  casing.rotation.x = Math.PI / 2;
  device.add(casing);

  const bezel = new THREE.Mesh(
    new THREE.TorusGeometry(1.03, 0.17, 16, 96),
    new THREE.MeshStandardMaterial({ color: 0x0b120f, roughness: 0.3, metalness: 0.9 }),
  );
  bezel.rotation.x = Math.PI / 2;
  bezel.position.z = 0.26;
  device.add(bezel);

  const strapMat = new THREE.MeshStandardMaterial({ color: 0x050907, roughness: 0.74, metalness: 0.12 });
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 3.35, 0.18), strapMat);
  strap.position.set(0, -0.18, -0.06);
  device.add(strap);

  const sideButton = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.38, 4, 10), silverMat);
  sideButton.rotation.z = Math.PI / 2;
  sideButton.position.set(-1.26, 0.02, 0.12);
  device.add(sideButton);

  const sideButton2 = sideButton.clone();
  sideButton2.position.x = 1.26;
  device.add(sideButton2);

  const deviceFaceMaterial = new THREE.MeshStandardMaterial({
    color: 0x02140c,
    roughness: 0.18,
    metalness: 0.5,
    emissive: 0x00ff88,
    emissiveIntensity: 0.16,
  });
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.81, 0.81, 0.12, 8), deviceFaceMaterial);
  face.rotation.x = Math.PI / 2;
  face.position.z = 0.32;
  device.add(face);

  const hourglass = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 0),
    new THREE.MeshBasicMaterial({ color: 0x9dffd2 }),
  );
  hourglass.scale.set(1, 0.98, 0.33);
  hourglass.position.z = 0.41;
  device.add(hourglass);

  const deviceRings: THREE.Mesh[] = [];
  const ringRadii = [1.15, 1.34, 1.54];
  for (let i = 0; i < ringRadii.length; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadii[i], 0.026, 8, 120),
      new THREE.MeshBasicMaterial({
        color: 0x51ffad,
        transparent: true,
        opacity: 0.18 - i * 0.025,
        depthWrite: false,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.z = 0.37 + i * 0.02;
    device.add(ring);
    deviceRings.push(ring);
  }

  // -------------------- Energy Ribbons --------------------
  const ribbonGroup = new THREE.Group();
  world.add(ribbonGroup);

  const ribbonMat = new THREE.LineBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const ribbons: THREE.Line[] = [];
  for (let j = 0; j < 3; j++) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 34; i++) {
      const t = i / 33;
      const x = -8.2 + t * 12.8;
      const y = -0.2 + Math.sin(t * 8 + j * 1.3) * (0.22 + t * 0.48) + j * 0.28;
      const z = 1.8 - t * 7.5 + Math.sin(t * 5 + j) * 0.22;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ribbonMat.clone());
    ribbonGroup.add(line);
    ribbons.push(line);
  }

  // -------------------- Energy Particles --------------------
  const energyCount = performanceSettings.energyParticleCount;
  const energyPositions = new Float32Array(energyCount * 3);
  for (let i = 0; i < energyCount; i++) {
    const t = random();
    const angle = random() * Math.PI * 2;
    const radius = 0.15 + Math.pow(random(), 0.7) * (1.1 + t * 3.3);
    energyPositions[i * 3] = -0.8 + Math.cos(angle) * radius;
    energyPositions[i * 3 + 1] = 1.1 + (random() - 0.5) * (1.3 + t * 3.4);
    energyPositions[i * 3 + 2] = -1.4 + Math.sin(angle) * radius - t * 3.8;
  }
  const energyGeometry = new THREE.BufferGeometry();
  energyGeometry.setAttribute('position', new THREE.BufferAttribute(energyPositions, 3));
  const energyPoints = new THREE.Points(
    energyGeometry,
    new THREE.PointsMaterial({
      color: 0x84ffc4,
      size: performanceTier === 'low' ? 0.032 : 0.045,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  world.add(energyPoints);

  // -------------------- Floating World Fragments --------------------
  const fragments: THREE.Mesh[] = [];
  const fragmentMat = new THREE.MeshStandardMaterial({ color: 0x0e1d17, roughness: 0.72, metalness: 0.24 });
  for (let i = 0; i < 18; i++) {
    const geo =
      i % 3 === 0
        ? new THREE.OctahedronGeometry(0.32 + random() * 0.4, 0)
        : new THREE.DodecahedronGeometry(0.18 + random() * 0.32, 0);
    const fragmentMesh = new THREE.Mesh(geo, fragmentMat);
    const side = i % 2 === 0 ? -1 : 1;
    fragmentMesh.position.set(side * (5.5 + random() * 6), -0.2 + random() * 7.8, -5 - random() * 16);
    fragmentMesh.rotation.set(random() * 2, random() * 2, random() * 2);
    fragmentMesh.scale.y = 0.55 + random() * 0.9;
    world.add(fragmentMesh);
    fragments.push(fragmentMesh);
  }

  // -------------------- Scene Lighting --------------------
  const ambientLight = new THREE.HemisphereLight(0x13231e, 0x020504, 0.48);
  scene.add(ambientLight);

  const coolLight = new THREE.DirectionalLight(0x5f7b72, 1.15);
  coolLight.position.set(-8, 9, 10);
  scene.add(coolLight);

  const greenLight = new THREE.PointLight(0x00ff88, 2.2, 14, 2);
  greenLight.position.set(-0.8, 1.55, -1.1);
  scene.add(greenLight);

  const portalLight = new THREE.PointLight(0x42ffaf, 1.0, 18, 2);
  portalLight.position.set(2.9, 4, -4.3);
  scene.add(portalLight);

  return {
    root: world,
    sky,
    stars,
    relief,
    centerMonument,
    portal,
    portalBeam,
    innerRing,
    haloRing,
    foreground,
    foliage,
    rocks,
    fragments,
    device,
    deviceFaceMaterial,
    hourglass,
    deviceRings,
    ribbons,
    energyPoints,
    ambientLight,
    coolLight,
    greenLight,
    portalLight,
  };
}
