# Bangkok Digital Twin — prototype

A responsive city intelligence dashboard built with Three.js and a real Blender asset pipeline. Includes a procedural city district, stylized Bangkok landmarks, Chao Phraya river, orbit and overhead views, selectable landmarks, animated traffic, environmental overlays, and a simulated 24-hour timeline.

**All geometry is schematic and all telemetry is simulated.** Landmark positions are approximate. The coordinate readout is a Bangkok reference, not a georeferenced model. The flood overlay is a fixed-width illustrative river corridor, not a flood prediction. Traffic, weather, AQI and river readings are sample values; sensors and comparison figures are illustrative. This is not an operational digital twin or a navigation tool.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open http://localhost:5173. The exported model is included, so Blender is only needed when rebuilding assets.

```sh
npm run build
npm run preview
npm test
```

Tests use an installed Google Chrome through Playwright and automatically start Vite when needed. They check GLB loading, layer state, camera navigation, time playback, the information dialog, and mobile overflow.

## Blender

- `blender/bangkok.blend` — editable city scene, materials, camera and lighting.
- `blender/build_city.py` — deterministic procedural generator (seed 42).
- `public/models/bangkok.glb` — browser model, exported directly from Blender.

On this Mac:

```sh
npm run assets
```

Elsewhere, use your Blender executable:

```sh
blender --background --python blender/build_city.py
```

Blender geometry is joined by material for efficient rendering; rerun the generator to change individual buildings. The GLB uses the standard glTF Y-up conversion. Babylon/other conversions are not required.

## Controls

- Drag: orbit; right-drag: pan; scroll: zoom.
- Landmark rows and floating pins: fly to the selected landmark.
- 2D: overhead perspective; 3D / Reset view: restore the initial camera.
- N: north-oriented view; orbit icon: automatic rotation.
- Layers: toggle buildings, animated traffic, sample air-quality zones and river corridor.
- Timeline: change the simulated time, or play/pause. Time affects sample metrics, lighting and traffic speed.
- Info: methodology and GLB download.

The UI uses Google Fonts when available with system fallbacks. WebGL hardware acceleration is required. No API keys or external live feeds are needed.

## Extending into a real twin

Replace the schematic scene with licensed georeferenced building and transport data, define a geographic-to-local coordinate transform, and connect validated telemetry with timestamps and quality flags. Environmental forecasting requires a calibrated model and appropriate source data.

Technical references: [Three.js installation](https://threejs.org/manual/en/installation.html), [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html).
