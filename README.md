# DigiWeek '26 — Official Website

Cinematic, immersive web experience for **DigiWeek '26** organized by UCC & DA at J.C. Bose University of Science & Technology, YMCA, Faridabad.

---

## 1. Project Phase & Public Content Rules
- **Current Status**: Public teaser & "Coming Soon" phase.
- **Approved Public Content**:
  - `events` array in `data/content.ts` is strictly `[]` (renders designated "Events Coming Soon" lockup).
  - `sponsors` array in `data/content.ts` is strictly `[]` (renders architectural "Coming Soon." status).
  - Do **not** invent or publish tentative event lineups, dates, or sponsor assets until officially approved.

---

## 2. Tech Stack
- **Framework**: Next.js (App Router, Turbopack, React 19)
- **Language**: TypeScript (strict mode)
- **3D / Graphics**: Three.js (WebGL, procedural world generation, custom GLSL shaders, EffectComposer)
- **Unit & Integration Testing**: Vitest + React Testing Library + JSDOM
- **End-to-End Testing**: Playwright
- **Linting & Code Quality**: ESLint

---

## 3. Getting Started

### Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Verification & Production Build
```bash
npm run typecheck   # Strict TypeScript check (0 errors)
npm run lint        # ESLint check (0 warnings)
npm test            # 27 unit & integration tests in Vitest
npm run build       # Next.js optimized static production build
```

---

## 4. Architecture & Directory Structure

```
├── app/
│   ├── layout.tsx             # Root layout & page metadata
│   ├── page.tsx               # Entry point wiring header, experience, sections, & menu
│   └── globals.css            # Responsive layout, typography, and palette styling
├── components/
│   ├── Experience.tsx         # WebGL canvas lifecycle & direct hero DOM orchestration
│   ├── navigation/
│   │   ├── SiteHeader.tsx     # Fixed top wordmark, institution badge, and menu trigger
│   │   └── MenuLayer.tsx      # Fullscreen dialog menu with keyboard Escape handling
│   ├── sections/
│   │   ├── AboutSection.tsx   # Legacy archive, campus media, and video reel
│   │   ├── EventsSection.tsx  # Dynamic events or "Coming Soon" panel
│   │   ├── TeamSection.tsx    # Centralized student organizing committee
│   │   ├── SponsorsSection.tsx# Dynamic sponsor grid or "Coming Soon" panel
│   │   └── ContactSection.tsx # Social channels, phone, and institutional partner marks
│   └── ui/
│       └── CustomCursor.tsx   # Fine-pointer GPU-accelerated cursor
├── data/
│   └── content.ts             # Single source of truth for public navigation, team, events, and socials
├── lib/
│   ├── animation/
│   │   └── math.ts            # clamp01, smoothstep, exponential damp, and scroll normalization
│   ├── performance/
│   │   └── tier.ts            # Deterministic High / Medium / Low quality tier selection
│   └── three/
│       ├── camera/
│       │   └── cameraChoreography.ts # 3D Catmull-Rom camera & lookAt splines
│       ├── scene/
│       │   ├── createCinematicWorld.ts # Procedural geometry, lights, terrain & models
│       │   └── animateWorld.ts         # Zero-allocation per-frame transform/shader updates
│       ├── shaders/
│       │   └── FilmShader.ts           # 35mm grain, chromatic aberration, vignette shader
│       └── dispose.ts         # Safe recursive WebGL and texture cleanup
├── public/assets/
│   ├── brand/                 # UCC & university partner logos
│   ├── real/                  # Historical and campus archive photographs
│   └── video/                 # Event highlight loop (MP4)
└── test/
    └── e2e/home.spec.ts       # Playwright end-to-end scenarios
```

---

## 5. WebGL Lifecycle & Performance System

### High-Level Scene Architecture
1. **Procedural World (`lib/three/scene/createCinematicWorld.ts`)**:
   - Celestial atmosphere using GLSL procedural noise sky shader.
   - Textural relief terrain generated mathematically with calculated vertex normals catching green rim light.
   - Architectural horizon silhouettes, portal halo with cylindrical energy beam, floating rock dodecahedrons, and the focal transformation device.
2. **Deterministic Camera Choreography (`lib/three/camera/cameraChoreography.ts`)**:
   - Single source of truth: `scrollProgress` (0 -> 1) maps deterministically to 3D Catmull-Rom splines for both camera position and target orientation.
   - Fine-pointer mouse movement provides subtle parallax deflection in the hero view, smoothly diminishing as the user scrolls deeper into the world.
3. **Zero Hot-Path Allocations (`lib/three/scene/animateWorld.ts`)**:
   - No `Vector3`, `Matrix4`, arrays, or closures are instantiated inside `requestAnimationFrame`.
   - Mesh rotations and transforms update via indexed for-loops.
4. **Direct Hero DOM Updates**:
   - Opacity and title transform are applied directly to component element refs rather than writing CSS custom properties to `:root`, preventing document-wide CSS recalculation.
5. **Deterministic Performance Tiers (`lib/performance/tier.ts`)**:
   - `high`: Full particle budgets (440 stars, 520 energy particles, 132x76 relief grid, max DPR 1.5).
   - `medium`: Balanced budgets for high-DPR screens or lower concurrency devices.
   - `low`: Lightweight budgets (150 stars, 180 energy particles, 78x46 relief grid, max DPR 1.0) with coarse-pointer optimizations for mobile devices.
6. **Leak-Proof Resource Disposal (`lib/three/dispose.ts`)**:
   - Cancels active `requestAnimationFrame`.
   - Removes scroll, pointer, resize, and visibility listeners.
   - Traverses scene graph disposing all geometries, materials, uniform textures, EffectComposer passes, and forces WebGL context loss.

---

## 6. How to Add Future Content

### Adding Events
When the event lineup is officially approved:
1. Open `data/content.ts`.
2. Populate the `events` array:
   ```ts
   export const events: readonly EventRecord[] = [
     {
       title: 'Keynote & Inauguration',
       description: 'Opening address and launch of DigiWeek 2026.',
       date: 'October 2026',
       venue: 'Main Auditorium',
     },
   ];
   ```
3. `EventsSection.tsx` automatically switches from the "Coming Soon" panel to the populated events list.

### Adding Sponsors
When sponsorship partnerships are confirmed:
1. Place sponsor logos into `public/assets/brand/`.
2. Open `data/content.ts`.
3. Add entries to the `sponsors` array:
   ```ts
   export const sponsors: readonly SponsorRecord[] = [
     {
       name: 'Partner Name',
       logoSrc: '/assets/brand/partner-logo.png',
       url: 'https://partner.com',
     },
   ];
   ```
4. `SponsorsSection.tsx` automatically renders the active partner grid.

### Replacing Media Assets
- Assets are kept in `public/assets/real/` and `public/assets/video/`.
- Ensure images are optimized (WebP, JPG, or compressed PNG) and videos are muted and optimized for web delivery.
