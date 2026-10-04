# DigiWeek '26

Immersive Coming Soon website for DigiWeek '26 by UCC & DA at J.C. Bose University of Science & Technology, YMCA, Faridabad.

The current public phase intentionally keeps events and sponsors hidden. Approved public content lives in code as empty `events` and `sponsors` arrays, so the site displays Coming Soon states until real data is added.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Three.js with post-processing
- Vitest + Testing Library
- Playwright
- ESLint

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run browser verification with:

```bash
npm run e2e
```

## Project Structure

- `app/page.tsx` wires the homepage sections together.
- `app/layout.tsx` defines app metadata and global shell.
- `app/globals.css` contains the current visual system and responsive layout.
- `components/Experience.tsx` mounts and owns the Three.js hero scene.
- `components/navigation/` contains the fixed header and full-screen menu.
- `components/sections/` contains About, Events, Team, Sponsors, and Contact.
- `components/ui/CustomCursor.tsx` owns desktop cursor behavior.
- `data/content.ts` contains public navigation, team, event, sponsor, and social data.
- `lib/animation/` contains testable scroll/easing/damping helpers.
- `lib/performance/` selects deterministic High, Medium, and Low quality tiers.
- `lib/three/` contains WebGL disposal helpers.
- `public/assets/` contains approved public images, logos, and video.

## Content Boundaries

Team data is centralized in `data/content.ts`.

Future event records should be added to the `events` array only after approval. Until then it must stay empty so Events remains Coming Soon.

Future sponsor records should be added to the `sponsors` array only after approval. Until then it must stay empty so Sponsors remains Coming Soon.

Social links and phone contact live in `socials`.

## Three.js Scene

`components/Experience.tsx` creates the renderer, scene, camera, post-processing composer, geometry, lights, scroll state, and pointer state on mount. It does not push per-frame values through React state.

Scroll progress is normalized with `normalizeScrollProgress` from `lib/animation/math.ts`. That progress drives the camera curve, target curve, reveal timing, bloom, film pass, portal, device, ribbons, and hero UI CSS variables.

Pointer interaction is enabled only for fine-pointer devices. It is damped inside the render loop and cleaned up on unmount.

The scene uses deterministic performance tiers from `lib/performance/tier.ts`:

- `high`: desktop-class devices, higher particle and star budgets
- `medium`: tablets, high-DPR screens, or lower CPU concurrency
- `low`: mobile or coarse-pointer devices

On unmount, the scene cancels animation, removes listeners, disposes geometries, materials, textures, composer resources, renderer resources, and removes the canvas.

## Assets

Visible site assets are stored under:

- `public/assets/brand/`
- `public/assets/real/`
- `public/assets/video/`

Replace an asset by keeping the same public path when preserving the current layout. Add new assets only when they are approved for public release.

## Tests

- Unit tests cover animation math and performance tier selection.
- Component tests cover Team, Contact, Events Coming Soon, and Sponsors Coming Soon rendering.
- E2E tests cover homepage loading, console errors, canvas initialization, menu navigation, scroll, mobile overflow, and reduced motion loading.
