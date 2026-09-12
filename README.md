# Digital Twin Research Center for Infrastructure Assets (DTIA)

DTIA's public research-lab website introduces its mission, research directions, approach and working demonstrators. The homepage uses a live 3D view of the existing Blender city model; showcase images are captured from the actual apps. It includes project notes, category filters, accessible mobile navigation, reduced-motion controls and the supplied public contact address: **suwilai.ph@kmitl.ac.th**. No university affiliation, staff, publications or partnerships are asserted.

## Website and showcase routes

- `/` — DTIA research lab website.
- `/showcase/distribution` — distribution asset digital twin, with a Blender coastal district, eight synthetic transformers, two sample feeders and power-quality what-if controls.
- `/showcase/city` — Bangkok city digital twin.
- `/?view=distribution` and `/?view=city` — compatible alternate showcase links.

Both demonstrators link back to the lab homepage. Links perform normal page navigation so the distinct website and dashboard styles remain isolated. The host must serve `index.html` for client routes; Vite dev and preview provide this automatically.

The public site is implemented in `src/lab.js` and `src/lab.css`; `src/lab-visual.js` renders the hero from the real city asset. `public/lab` contains images of the working demonstrators. The current mission and research directions are editorial framing for the lab website; demonstrator notes distinguish implemented capabilities from simulation assumptions.

Run `npm install` followed by `npm run dev`, then open **http://localhost:5174/**. Both development and preview use strict port 5174; they fail clearly if it is occupied instead of silently using a different port.

## Distribution asset showcase

This DTIA research demonstration covers transformer monitoring, fleet-level analysis and power-quality compensation using synthetic data. It has no connection to operational utility systems.

- **Monitor:** select an asset on the 3D network or in the inspector. View synthetic apparent/active power, phase voltage/current/loading, oil temperature, power factor and a daily loading profile.
- **Analyze:** compare a 24-hour utilization heatmap, filter by sample feeder, search the review queue and inspect the illustrative risk ranking.
- **Optimize:** preview or enable compensation for the selected online transformer. The model reduces phase imbalance and harmonic distortion and raises power factor, while preserving active demand. Selecting a different asset clears compensation.
- **Scenarios:** EV demand and time-dependent solar generation affect all sample assets; the feeder selector only filters the view. The timeline, fleet totals, inspector, model labels, queue and export share one deterministic model.
- **Export:** download the filtered fleet at the selected sample time with scenario parameters and synthetic-data provenance. Offline values are blank, not zero. Offline telemetry does not imply an outage.

### Model assumptions

All asset names, locations, customer counts, ratings, readings, feeder connectivity and alarm rules are invented for the demonstration. The coastal model is Pattaya-inspired, not georeferenced. No operational switching, maintenance orders or remote hardware controls exist.

`src/power.js` defines the sample formulas. Apparent power is active power divided by the assumed power factor; total loading is apparent power / capacity. Phase weights sum to three, so their average matches total loading. Scenario current imbalance is the maximum phase-current deviation from the mean, divided by the mean. Fleet utilization is weighted by online transformer capacity. Risk is a bounded illustrative score from load, current imbalance and undervoltage flags, not a validated operational risk methodology.

Demo review thresholds: total/phase loading above 100%, current imbalance above 20%, phase voltage below 207 V, temperature above 80°C, or loading below 25%. The optimizer's assumed power factor (0.98), harmonic distortion (3.2%) and compensation effect are not validated performance claims. Solar output follows daylight; EV and solar inputs are scenario adoption/growth parameters, not capacity forecasts. These simplified formulas are not a three-phase power-flow, harmonic or thermal solver.

Assets are defined in `public/data/dtia-assets.json`, shared by the browser model and the Blender generator:

```sh
blender --background --python blender/build_dtia.py
```

The editable result is `blender/dtia-distribution.blend`; the browser loads `public/models/dtia-distribution.glb`. Both are included.

## Original Bangkok demonstration

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

Open http://localhost:5174/?view=city. The exported model is included, so Blender is only needed when rebuilding assets.

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
