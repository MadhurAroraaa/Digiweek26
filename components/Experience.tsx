'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { damp, normalizeScrollProgress, smoothstep } from '@/lib/animation/math';
import { disposeRenderer, disposeScene } from '@/lib/three/dispose';
import { getPerformanceSettings, selectPerformanceTier } from '@/lib/performance/tier';

function createSeededRandom(seed = 2601) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function makeBox(
  material: THREE.Material,
  size: [number, number, number],
  position: [number, number, number],
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  return mesh;
}

function makeRock(material: THREE.Material, position: [number, number, number], scale: [number, number, number]) {
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
  position: [number, number, number],
  rotation: [number, number, number],
) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 14, 180),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
  );
  ring.position.set(...position);
  ring.rotation.set(...rotation);
  return ring;
}

const FilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uStrength: { value: 0.08 },
    uChromatic: { value: 0.004 },
    uVignette: { value: 0.22 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uStrength;
    uniform float uChromatic;
    uniform float uVignette;
    varying vec2 vUv;

    float hash(vec2 p){
      return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
    }

    void main(){
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float d = dot(c,c);
      vec2 dir = normalize(c + vec2(0.0001));
      vec2 off = dir * d * uChromatic;

      vec3 col;
      col.r = texture2D(tDiffuse, uv + off).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - off).b;

      float n = hash(floor(uv * 900.0) + floor(uTime * 30.0));
      col += (n - 0.5) * uStrength;

      float vignette = smoothstep(0.95, 0.18, distance(uv, vec2(0.5)) * 1.15);
      col *= mix(1.0 - uVignette, 1.0, vignette);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export default function Experience() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = () => window.innerWidth;
    const height = () => window.innerHeight;
    const prefersCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const performanceTier = selectPerformanceTier({
      width: width(),
      devicePixelRatio: window.devicePixelRatio,
      hardwareConcurrency: navigator.hardwareConcurrency,
      hasCoarsePointer: prefersCoarsePointer,
    });
    const performanceSettings = getPerformanceSettings(performanceTier);
    const random = createSeededRandom();

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020805, performanceTier === 'high' ? 0.018 : performanceTier === 'medium' ? 0.022 : 0.028);

    const camera = new THREE.PerspectiveCamera(42, width() / height(), 0.1, 180);
    camera.position.set(-7.8, 3.0, 18.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width(), height());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, performanceSettings.maxPixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x020504, 1);
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(width(), height()),
      performanceTier === 'high' ? 0.48 : 0.32,
      0.5,
      0.78,
    );
    bloom.threshold = 0.86;
    bloom.strength = 0.28;
    bloom.radius = 0.48;
    composer.addPass(bloom);

    const film = new ShaderPass(FilmShader);
    film.uniforms.uStrength.value = performanceTier === 'high' ? 0.055 : 0.04;
    film.uniforms.uChromatic.value = 0.0028;
    film.uniforms.uVignette.value = 0.16;
    composer.addPass(film);

    const world = new THREE.Group();
    scene.add(world);

    // The background carries the cinematic reveal, so it stays in WebGL rather than CSS.
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(72, 48, 32),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: { uTime: { value: 0 }, uPulse: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vPos;
          void main(){
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uPulse;
          varying vec3 vPos;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
          float noise(vec2 p){
            vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
          }
          void main(){
            vec3 n = normalize(vPos);
            float h = clamp(n.y * .5 + .5, 0., 1.);
            vec3 bottom = vec3(.0015,.004,.005);
            vec3 mid = vec3(.006,.018,.015);
            vec3 top = vec3(.012,.028,.034);
            vec3 c = mix(bottom, mid, smoothstep(.12,.55,h));
            c = mix(c, top, smoothstep(.55,1.,h));
            float cloud = noise(n.xz*3.6 + vec2(uTime*.003,-uTime*.002));
            c += vec3(.002,.012,.009) * cloud;
            float horizon = exp(-pow((n.y + .01)*7.0,2.0));
            c += vec3(0.,.038,.02) * horizon * (.45 + uPulse*.8);
            float star = step(.9981, hash(floor(n.xz*520.0)));
            c += vec3(.36,.62,.52) * star * (.55 + .45*h);
            gl_FragColor = vec4(c,1.);
          }
        `,
      }),
    );
    world.add(sky);

    const starCount = performanceSettings.starCount;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const a = random() * Math.PI * 2;
      const r = 30 + random() * 30;
      starPositions[i * 3] = Math.cos(a) * r;
      starPositions[i * 3 + 1] = (random() - .15) * 21;
      starPositions[i * 3 + 2] = -32 - random() * 30;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0x9dffd1, size: performanceTier === 'low' ? .028 : .04, transparent: true, opacity: .42, depthWrite: false }),
    );
    world.add(stars);

    // Dense displaced relief surface. This is deliberately textural rather than a flat poster: the
    // camera can move through the changing normals and the relief catches the green rim light.
    const reliefGeo = new THREE.PlaneGeometry(26, 14.2, performanceSettings.reliefSegments.width, performanceSettings.reliefSegments.height);
    const reliefPos = reliefGeo.attributes.position as THREE.BufferAttribute;
    for (let i=0;i<reliefPos.count;i++) {
      const x = reliefPos.getX(i);
      const y = reliefPos.getY(i);
      const arc = Math.abs(Math.hypot(x-3.0, y-1.4) - 4.2);
      const arcLift = Math.exp(-Math.pow(arc/0.75,2)) * .26;
      const ridge = Math.exp(-Math.pow((x+3.4)/2.4,2) - Math.pow((y-.2)/3.2,2)) * .18;
      const ripple = Math.sin(x*1.25 + y*.8)*.035 + Math.sin(y*2.4 - x*.35)*.025;
      reliefPos.setZ(i, arcLift + ridge + ripple);
    }
    reliefPos.needsUpdate = true;
    reliefGeo.computeVertexNormals();
    const relief = new THREE.Mesh(
      reliefGeo,
      new THREE.MeshStandardMaterial({
        color:0x07100d,
        roughness:.94,
        metalness:.08,
        emissive:0x01140a,
        emissiveIntensity:.17,
        side:THREE.DoubleSide,
      })
    );
    relief.rotation.x = -.06;
    relief.position.set(0,1.45,-10.6);
    world.add(relief);

    // Layered geometry gives the camera parallax without loading heavy hero textures.
    const farMat = new THREE.MeshStandardMaterial({ color: 0x0a1713, roughness: .92, metalness: .05 });
    const midMat = new THREE.MeshStandardMaterial({ color: 0x12221c, roughness: .78, metalness: .18 });
    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x142a1f,
      roughness: .56,
      metalness: .26,
      emissive: 0x07371f,
      emissiveIntensity: .16,
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x040907, roughness: .98, metalness: 0 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0x26332e, roughness: .4, metalness: .68 });
    const energyMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: .62, blending: THREE.AdditiveBlending, depthWrite: false });

    const horizon = new THREE.Group();
    horizon.position.set(0, -1.55, -12.5);
    world.add(horizon);

    const buildingXs = [-9,-7.2,-5.6,-3.8,-2.1,0,2.0,3.9,5.6,7.5,9.2];
    const buildingDepths = [1.9,2.4,1.8,2.5,2.0,2.9,2.1,2.4,1.8,2.4,1.8];
    buildingXs.forEach((x, i) => {
      const h = [2.6,4.2,3.1,4.8,2.9,5.2,3.4,4.4,2.7,4.5,3.0][i];
      const b = makeBox(farMat, [1.25, h, buildingDepths[i]], [x, h * .5 - .05, (i % 2) * .18]);
      horizon.add(b);
      if (i % 2 === 0) {
        const slit = makeBox(energyMat, [.08, h*.58, buildingDepths[i]+.03], [x - .18, h*.52, .02]);
        slit.material = energyMat;
        (slit.material as THREE.MeshBasicMaterial).opacity = .11;
        horizon.add(slit);
      }
    });

    const centerMonument = new THREE.Group();
    centerMonument.position.set(0, 0, -1.1);
    const base = makeBox(midMat, [5.7, 1.6, 2.0], [0, .8, 0]);
    centerMonument.add(base);
    const body = makeBox(greenMat, [4.5, 4.5, 1.35], [0, 3.0, 0]);
    centerMonument.add(body);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.9, 8), midMat);
    crown.position.y = 5.8;
    crown.rotation.y = Math.PI/8;
    centerMonument.add(crown);
    horizon.add(centerMonument);

    const portal = new THREE.Group();
    portal.position.set(2.9, 4.0, -4.8);
    portal.rotation.y = -0.18;
    world.add(portal);

    const outer = makeRing(4.15, .34, 0x204a37, .72, [0,0,0], [Math.PI/2,0,0]);
    const inner = makeRing(3.64, .055, 0x00ff88, .64, [0,0,.06], [Math.PI/2,0,0]);
    const halo = makeRing(4.55, .04, 0xb7ffe0, .20, [0,0,.08], [Math.PI/2,0,0]);
    portal.add(outer, inner, halo);

    const portalDisc = new THREE.Mesh(
      new THREE.CircleGeometry(3.55, 96),
      new THREE.MeshBasicMaterial({ color: 0x06110c, transparent: true, opacity: .86, side: THREE.DoubleSide }),
    );
    portalDisc.rotation.x = -Math.PI/2;
    portalDisc.position.z = -.02;
    portal.add(portalDisc);

    const portalBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(.14, .85, 8.5, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x4dffad, transparent: true, opacity: .0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }),
    );
    portalBeam.rotation.z = Math.PI/2;
    portalBeam.position.x = -0.6;
    portalBeam.position.z = -0.05;
    portal.add(portalBeam);

    const foreground = new THREE.Group();
    world.add(foreground);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x07120e, roughness: .9, metalness: .03 });
    const frameGlowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false });

    const leftFrame = new THREE.Group();
    leftFrame.position.set(-7.0, 1.1, 4.6);
    leftFrame.rotation.z = -.08;
    leftFrame.add(makeBox(frameMat, [.65, 6.8, 1.25], [0,0,0]));
    leftFrame.add(makeBox(frameMat, [3.8,.55,1.0], [1.55,3.05,0]));
    leftFrame.add(makeBox(frameGlowMat, [.06, 5.2, 1.32], [.36,0,.1]));
    foreground.add(leftFrame);

    const rightFrame = new THREE.Group();
    rightFrame.position.set(7.1, 0.7, 6.4);
    rightFrame.rotation.z = .06;
    rightFrame.add(makeBox(frameMat, [.72, 7.6, 1.4], [0,0,0]));
    rightFrame.add(makeBox(frameMat, [3.2,.65,1.1], [-1.2,3.5,0]));
    rightFrame.add(makeBox(frameGlowMat, [.06, 5.6, 1.5], [-.38,0,.08]));
    foreground.add(rightFrame);

    const rocks: THREE.Object3D[] = [];
    [
      [-9.1,-2.0,3.6,2.7,2.9,2.0],
      [9.0,-2.0,4.2,2.6,3.6,2.2],
      [-4.9,-2.15,5.9,1.3,1.65,1.2],
      [5.0,-2.2,6.4,1.5,1.8,1.4],
      [-11.0,-2.4,0.2,2.3,3.1,1.7],
      [11.1,-2.35,.1,2.5,3.3,1.8],
    ].forEach((v, i) => {
      const rock = makeRock(darkMat, [v[0],v[1],v[2]], [v[3],v[4],v[5]]);
      rock.rotation.set(i*.18, i*.33, i*.09);
      foreground.add(rock);
      rocks.push(rock);
    });

    // -------------------- foreground foliage silhouettes --------------------
    const foliage = new THREE.Group();
    foliage.position.set(-3.8,-2.35,3.2);
    world.add(foliage);
    const trunk = makeBox(darkMat, [.52,4.0,.55],[0,1.7,0]);
    trunk.rotation.z = -.12;
    foliage.add(trunk);
    for (let i=0;i<14;i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(.6 + random()*.45, 8, 6), darkMat);
      leaf.scale.set(1.1 + random()*.7, .75 + random()*.35, .55 + random()*.4);
      leaf.position.set((random()-.5)*2.6, 1.6 + random()*2.6, (random()-.5)*.9);
      leaf.rotation.z = random()*.7;
      foliage.add(leaf);
    }

    // -------------------- focal transformation device --------------------
    const device = new THREE.Group();
    device.position.set(-.8, 1.15, -1.4);
    device.rotation.y = -.22;
    world.add(device);

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.5, .65, 10), silverMat);
    pedestal.position.y = -.58;
    device.add(pedestal);

    const pedestalBand = new THREE.Mesh(new THREE.TorusGeometry(1.2,.06,10,96), energyMat);
    pedestalBand.rotation.x = Math.PI/2;
    pedestalBand.position.y = -.22;
    (pedestalBand.material as THREE.MeshBasicMaterial).opacity = .32;
    device.add(pedestalBand);

    const casing = new THREE.Mesh(new THREE.CylinderGeometry(1.33,1.25,.48,12), silverMat);
    casing.rotation.x = Math.PI/2;
    device.add(casing);

    const bezel = new THREE.Mesh(new THREE.TorusGeometry(1.03,.17,16,96), new THREE.MeshStandardMaterial({ color:0x0b120f, roughness:.3, metalness:.9 }));
    bezel.rotation.x = Math.PI/2;
    bezel.position.z = .26;
    device.add(bezel);

    const strapMat = new THREE.MeshStandardMaterial({ color:0x050907, roughness:.74, metalness:.12 });
    const strap = new THREE.Mesh(new THREE.BoxGeometry(.72,3.35,.18), strapMat);
    strap.position.set(0,-.18,-.06);
    device.add(strap);
    const sideButton = new THREE.Mesh(new THREE.CapsuleGeometry(.1,.38,4,10), silverMat);
    sideButton.rotation.z = Math.PI/2;
    sideButton.position.set(-1.26,.02,.12);
    device.add(sideButton);
    const sideButton2 = sideButton.clone();
    sideButton2.position.x = 1.26;
    device.add(sideButton2);

    const faceMat = new THREE.MeshStandardMaterial({ color:0x02140c, roughness:.18, metalness:.5, emissive:0x00ff88, emissiveIntensity:.16 });
    const face = new THREE.Mesh(new THREE.CylinderGeometry(.81,.81,.12,8), faceMat);
    face.rotation.x = Math.PI/2;
    face.position.z = .32;
    device.add(face);

    const hourglass = new THREE.Mesh(
      new THREE.OctahedronGeometry(.42,0),
      new THREE.MeshBasicMaterial({ color:0x9dffd2 }),
    );
    hourglass.scale.set(1,.98,.33);
    hourglass.position.z = .41;
    device.add(hourglass);

    const deviceRings: THREE.Mesh[] = [];
    [1.15,1.34,1.54].forEach((r,i)=>{
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r,.026,8,120), new THREE.MeshBasicMaterial({ color:0x51ffad, transparent:true, opacity:.18 - i*.025, depthWrite:false }));
      ring.rotation.x = Math.PI/2;
      ring.position.z = .37 + i*.02;
      device.add(ring);
      deviceRings.push(ring);
    });

    // Energy geometry is static; only object transforms and material opacity animate per frame.
    const ribbonGroup = new THREE.Group();
    world.add(ribbonGroup);

    const ribbonMat = new THREE.LineBasicMaterial({ color:0x00ff88, transparent:true, opacity:.0, blending:THREE.AdditiveBlending, depthWrite:false });
    const ribbons: THREE.Line[] = [];
    for(let j=0;j<3;j++){
      const pts: THREE.Vector3[] = [];
      for(let i=0;i<34;i++){
        const t=i/33;
        const x = -8.2 + t*12.8;
        const y = -0.2 + Math.sin(t*8 + j*1.3)*(.22 + t*.48) + j*.28;
        const z = 1.8 - t*7.5 + Math.sin(t*5+j)*.22;
        pts.push(new THREE.Vector3(x,y,z));
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ribbonMat.clone());
      ribbonGroup.add(line); ribbons.push(line);
    }

    const energyCount = performanceSettings.energyParticleCount;
    const energyPositions = new Float32Array(energyCount * 3);
    for(let i=0;i<energyCount;i++){
      const t = random();
      const angle = random()*Math.PI*2;
      const radius = .15 + Math.pow(random(),.7) * (1.1 + t*3.3);
      energyPositions[i*3] = -.8 + Math.cos(angle)*radius;
      energyPositions[i*3+1] = 1.1 + (random()-.5)*(1.3 + t*3.4);
      energyPositions[i*3+2] = -1.4 + Math.sin(angle)*radius - t*3.8;
    }
    const energyGeo = new THREE.BufferGeometry();
    energyGeo.setAttribute('position', new THREE.BufferAttribute(energyPositions,3));
    const energyPoints = new THREE.Points(
      energyGeo,
      new THREE.PointsMaterial({ color:0x84ffc4, size:performanceTier === 'low' ? .032 : .045, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false }),
    );
    world.add(energyPoints);

    // -------------------- small floating world fragments --------------------
    const fragments: THREE.Mesh[] = [];
    const fragmentMat = new THREE.MeshStandardMaterial({ color:0x0e1d17, roughness:.72, metalness:.24 });
    for(let i=0;i<18;i++){
      const geo = i%3===0 ? new THREE.OctahedronGeometry(.32 + random()*.4,0) : new THREE.DodecahedronGeometry(.18 + random()*.32,0);
      const f = new THREE.Mesh(geo, fragmentMat);
      const side = i%2===0 ? -1 : 1;
      f.position.set(side*(5.5 + random()*6), -.2 + random()*7.8, -5 - random()*16);
      f.rotation.set(random()*2,random()*2,random()*2);
      f.scale.y = .55 + random()*.9;
      world.add(f); fragments.push(f);
    }

    // -------------------- lights --------------------
    const ambient = new THREE.HemisphereLight(0x13231e, 0x020504, .48);
    scene.add(ambient);
    const cool = new THREE.DirectionalLight(0x5f7b72, 1.15);
    cool.position.set(-8,9,10);
    scene.add(cool);
    const greenLight = new THREE.PointLight(0x00ff88, 2.2, 14, 2);
    greenLight.position.set(-.8,1.55,-1.1);
    scene.add(greenLight);
    const portalLight = new THREE.PointLight(0x42ffaf, 1.0, 18, 2);
    portalLight.position.set(2.9,4,-4.3);
    scene.add(portalLight);

    // Scroll progress is the single source of truth for camera and reveal choreography.
    const cameraPoints = [
      new THREE.Vector3(-7.2, 2.8, 17.8),
      new THREE.Vector3(-5.0, 2.1, 13.8),
      new THREE.Vector3(-2.5, 1.7, 10.2),
      new THREE.Vector3(-.8, 1.35, 7.3),
      new THREE.Vector3(1.0, 1.55, 5.0),
      new THREE.Vector3(2.8, 2.15, 2.4),
      new THREE.Vector3(4.0, 2.9, .2),
      new THREE.Vector3(2.5, 3.9, -2.8),
    ];
    const targetPoints = [
      new THREE.Vector3(-.2, 1.3, -1.4),
      new THREE.Vector3(-.1, 1.35, -1.7),
      new THREE.Vector3(-.2, 1.55, -1.8),
      new THREE.Vector3(.25, 1.8, -2.2),
      new THREE.Vector3(1.4, 2.0, -3.4),
      new THREE.Vector3(2.8, 2.7, -4.5),
      new THREE.Vector3(3.0, 3.4, -5.1),
      new THREE.Vector3(2.3, 4.0, -5.0),
    ];
    const cameraCurve = new THREE.CatmullRomCurve3(cameraPoints, false, 'catmullrom', .45);
    const targetCurve = new THREE.CatmullRomCurve3(targetPoints, false, 'catmullrom', .45);
    const cameraPos = new THREE.Vector3();
    const target = new THREE.Vector3();

    const pointerRaw = new THREE.Vector2();
    const pointer = new THREE.Vector2();
    let scrollTarget = 0;
    let scrollProgress = 0;

    const readScroll = () => {
      const hero = mount.closest('.experience') as HTMLElement | null;
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      scrollTarget = normalizeScrollProgress(rect.top, rect.height, height());
    };

    const onScroll = () => readScroll();
    const onPointer = (e: PointerEvent) => {
      pointerRaw.x = (e.clientX / width()) * 2 - 1;
      pointerRaw.y = -(e.clientY / height()) * 2 + 1;
    };
    const onResize = () => {
      camera.aspect = width()/height();
      camera.updateProjectionMatrix();
      renderer.setSize(width(),height());
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, performanceSettings.maxPixelRatio));
      composer.setSize(width(),height());
      readScroll();
    };
    const onVisibilityChange = () => {
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    window.addEventListener('scroll', onScroll, { passive:true });
    if (!prefersCoarsePointer) {
      window.addEventListener('pointermove', onPointer, { passive:true });
    }
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    readScroll();

    let raf = 0;
    let last = performance.now();
    let disposed = false;

    const frame = (now: number) => {
      if (disposed) return;
      if (document.hidden) {
        raf = 0;
        return;
      }
      const dt = Math.min(.033,(now-last)/1000);
      last = now;

      scrollProgress = damp(scrollProgress, scrollTarget, reducedMotion ? 60 : 11, dt);
      pointer.x = damp(pointer.x, pointerRaw.x, reducedMotion ? 100 : 6, dt);
      pointer.y = damp(pointer.y, pointerRaw.y, reducedMotion ? 100 : 6, dt);

      cameraCurve.getPointAt(scrollProgress,cameraPos);
      targetCurve.getPointAt(scrollProgress,target);

      const pointerAmount = reducedMotion ? 0 : (.16 * (1-scrollProgress));
      camera.position.copy(cameraPos);
      camera.position.x += pointer.x * pointerAmount;
      camera.position.y += pointer.y * pointerAmount * .55;
      target.x += pointer.x * .055 * (1-scrollProgress);
      target.y += pointer.y * .035 * (1-scrollProgress);
      camera.lookAt(target);

      const s = scrollProgress;
      const build = smoothstep(.04,.24,s);
      const discovery = smoothstep(.18,.47,s);
      const charge = smoothstep(.42,.68,s);
      const transformation = smoothstep(.64,.9,s);
      const reveal = smoothstep(.86,1,s);

      // Living scene even before interaction.
      sky.material.uniforms.uTime.value = now*.00011;
      sky.material.uniforms.uPulse.value = .22 + Math.sin(now*.0006)*.07 + transformation*.55;
      stars.rotation.y = now*.0000035;
      stars.position.x = pointer.x*.055;
      stars.position.y = pointer.y*.035;

      foreground.position.x = pointer.x*.04;
      foreground.position.y = pointer.y*.02;
      foliage.rotation.y = pointer.x*.018;
      relief.position.x = pointer.x * .035;
      relief.position.y = 1.45 + pointer.y * .02;

      rocks.forEach((r,i)=>{
        r.rotation.y += dt*(.003 + i*.0007);
        r.position.y += Math.sin(now*.00028 + i)*.00055;
      });
      fragments.forEach((f,i)=>{
        f.rotation.x += dt*(.012+i*.001);
        f.rotation.y += dt*(.016+i*.0008);
        f.position.y += Math.sin(now*.00026+i*1.7)*.0012;
      });

      // Subtle device discovery and mechanical response.
      device.position.x = -.8 + Math.sin(s*Math.PI*1.2)*.16;
      device.rotation.y = -.22 + discovery*.34;
      device.rotation.x = Math.sin(now*.00023)*.01 + charge*.045;
      deviceRings[0].rotation.z += dt*.13;
      deviceRings[1].rotation.z -= dt*.09;
      deviceRings[2].rotation.z += dt*.065;
      hourglass.rotation.z += dt*.18;

      faceMat.emissiveIntensity = .12 + charge*2.0 + transformation*5.8;
      greenLight.intensity = 2.1 + charge*8 + transformation*38;
      portalLight.intensity = .8 + transformation*8 + reveal*4;

      // World responds to transformation.
      centerMonument.rotation.y = Math.sin(now*.00015)*.008 + transformation*.08;
      centerMonument.scale.setScalar(1 + transformation*.05);
      portal.rotation.z = Math.sin(now*.00022)*.012 + transformation*.18;
      portal.scale.setScalar(.96 + discovery*.06 + transformation*.14);
      (portalBeam.material as THREE.MeshBasicMaterial).opacity = transformation*.12;
      portalBeam.scale.x = .6 + transformation*2.2;
      (inner.material as THREE.MeshBasicMaterial).opacity = .52 + transformation*.42;
      (halo.material as THREE.MeshBasicMaterial).opacity = .12 + transformation*.3;

      ribbons.forEach((line,i)=>{
        const mat = line.material as THREE.LineBasicMaterial;
        mat.opacity = Math.max(.0, charge*.06 + transformation*.28);
        line.position.y = Math.sin(now*.00035+i)*.05*charge;
      });

      const eMat = energyPoints.material as THREE.PointsMaterial;
      eMat.opacity = charge*.12 + transformation*.68;
      energyPoints.rotation.y += dt*(.08 + transformation*1.3);
      energyPoints.rotation.z = Math.sin(now*.0008)*.18*transformation;

      // Subtle scene lighting changes.
      cool.intensity = 1.15 - transformation*.24;
      ambient.intensity = .48 + transformation*.06;
      bloom.strength = .26 + transformation*1.18 + reveal*.36;
      bloom.threshold = .9 - transformation*.12;
      film.uniforms.uTime.value = now*.001;
      film.uniforms.uStrength.value = (performanceTier === 'high' ? .055 : .04) + transformation*.012;
      film.uniforms.uChromatic.value = .0028 + transformation*.018;
      film.uniforms.uVignette.value = .16 + transformation*.14;

      // Hero typography is restrained and progressively clears away.
      const uiOpacity = Math.max(.1, 1 - smoothstep(.55,.84,s));
      const titleScale = 1 + build*.01;
      document.documentElement.style.setProperty('--hero-ui-opacity',String(uiOpacity));
      document.documentElement.style.setProperty('--hero-title-scale',String(titleScale));
      document.documentElement.style.setProperty('--hero-accent',String(.32 + transformation*.68));
      document.documentElement.style.setProperty('--hero-reveal',String(reveal));
      document.documentElement.style.setProperty('--hero-curtain',String(transformation));

      composer.render();
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll',onScroll);
      if (!prefersCoarsePointer) {
        window.removeEventListener('pointermove',onPointer);
      }
      window.removeEventListener('resize',onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      disposeScene(scene);
      disposeRenderer(renderer, composer);
    };
  }, []);

  return (
    <section className="experience" aria-label="DigiWeek cinematic introduction">
      <div ref={mountRef} className="webgl-canvas" />
      <div className="hero-grain" />
      <div className="hero-vignette" />
      <div className="hero-curtain" />

      <div className="hero-ui">
        <div className="hero-kicker">UCC &amp; DA · J.C. BOSE UNIVERSITY · FARIDABAD</div>
        <h1>DIGIWEEK <span>&apos;26</span></h1>
        <p>A different world.<br />Built by students.</p>
        <div className="hero-meta"><span>COMING SOON</span><span>SCROLL TO ENTER</span></div>
      </div>

      <div className="hero-scroll"><span>↓</span> SCROLL</div>
      <div className="hero-stage-note">THE NEXT WORLD IS LOADING</div>
    </section>
  );
}
