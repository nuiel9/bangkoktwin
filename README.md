# Bangkok Digital Twin — prototype

A responsive city intelligence dashboard built with Three.js and a real Blender asset pipeline. Includes a procedural city district, stylized Bangkok landmarks, Chao Phraya river, orbit and overhead views, selectable landmarks, animated traffic, environmental overlays, and a simulated 24-hour timeline.

**All geometry is schematic and all telemetry is simulated.** Landmark positions are approximate. The coordinate readout is a Bangkok reference, not a georeferenced model. The flood overlay is an adjustable illustrative river corridor, not a flood prediction. Traffic, weather, air quality and river readings are sample values. The air-quality index is a synthetic indicator, not an official US AQI calculation. River heights use an arbitrary sample datum. This is not an operational digital twin or a navigation tool.

## Interactive station simulation

Six selectable stations cover traffic, air quality and river level. Five are online; one demonstrates the offline state. Click a map marker or choose a station in the inspector to see its reading and daily profile. City cards average online stations by type, and their hourly changes are calculated from the same sample signals. Moving the timeline updates readings, the chart cursor, traffic speed and lighting together.

The flood layer includes an added-water-level slider from 0 to 3 m. It maps to an illustrative corridor width in schematic world units; this is not terrain-based inundation. The station count reports geometric intersections with that overlay, not predicted damage or flood risk. Scenario changes do not alter baseline sample telemetry.

Export CSV downloads all six stations at the selected simulation time, including units, online/offline status, sample provenance and scenario settings. Offline readings are exported as blank values.

`src/simulation.js` owns sample station definitions and deterministic signals. `src/inspector.js` connects them to the chart, markers, scenario controls and export.

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

Tests use an installed Google Chrome through Playwright and automatically start Vite when needed. They check GLB loading, layer state, camera navigation, time playback, the information dialog, mobile overflow, station/card consistency, offline handling, changing flood extent and CSV contents.

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
- Layers: toggle buildings, animated traffic, sample air-quality zones, river corridor and sample station markers. The legend follows enabled layers.
- Stations / Landmarks tabs: switch the inspector without increasing the desktop sidebar height.
- Flood scenario: adjust added water level to change the illustrative extent.
- Station inspector: select a station, locate it in the city, or export the current sample snapshot.
- Timeline: change the simulated time, or play/pause. Time affects sample metrics, lighting and traffic speed.
- Info: methodology and GLB download.

The UI uses Google Fonts when available with system fallbacks. WebGL hardware acceleration is required. No API keys or external live feeds are needed.

## Extending into a real twin

Replace the schematic scene with licensed georeferenced building and transport data, define a geographic-to-local coordinate transform, and connect validated telemetry with timestamps and quality flags. Environmental forecasting requires a calibrated model and appropriate source data.

Technical references: [Three.js installation](https://threejs.org/manual/en/installation.html), [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html).
