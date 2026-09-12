// Original Bangkok demonstration, available at ?view=city.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { cityAt, stations, formatTime } from "./simulation";
import { createInspector } from "./inspector";
import {
  createIcons,
  Boxes,
  LayoutDashboard,
  Layers,
  Wind,
  Building2,
  Info,
  Scan,
  CarFront,
  Waves,
  RadioTower,
  LoaderCircle,
  Plus,
  Minus,
  Orbit,
  SlidersHorizontal,
  Play,
  Pause,
  CloudSun,
  MoveUpRight,
  Activity,
  Box,
  X,
  Building,
  Landmark,
  Castle,
  ChevronRight,
} from "lucide";
const icons = {
  Boxes,
  LayoutDashboard,
  Layers,
  Wind,
  Building2,
  Info,
  Scan,
  CarFront,
  Waves,
  RadioTower,
  LoaderCircle,
  Plus,
  Minus,
  Orbit,
  SlidersHorizontal,
  Play,
  Pause,
  CloudSun,
  MoveUpRight,
  Activity,
  Box,
  X,
  Building,
  Landmark,
  Castle,
  ChevronRight,
};
import "./style.css";
import "./inspector.css";
document.title = "Bangkok · City Digital Twin";
const icon = (name, cls = "") => `<i data-lucide="${name}" class="${cls}"></i>`;
document.querySelector("#app").innerHTML = `
<aside class="rail"><a class="brand" href="#" aria-label="Bangkok home">${icon("boxes")}</a><div class="rail-nav"><button class="active" title="City overview" id="overview">${icon("layout-dashboard")}</button><button title="Toggle map layers" id="layer-nav">${icon("layers")}</button><button title="Show air quality" id="air-nav">${icon("wind")}</button><button title="Open landmark details" id="landmark-nav">${icon("building-2")}</button></div><div class="rail-bottom"><span class="vertical">BANGKOK METROPOLITAN</span><span class="avatar">BK</span></div></aside>
<div class="workspace"><header><div class="breadcrumb">Urban intelligence <span>/</span> <b>City overview</b></div><div class="header-right"><span class="demo-tag"><i></i> SIMULATION MODE</span><span class="header-date">12 Sep 2026</span><button id="info" title="About this prototype">${icon("info")}</button></div></header>
<main><section class="page-heading"><div><div class="eyebrow">CITY DIGITAL TWIN <span>01 / THAILAND</span></div><h1>Bangkok<span class="thai">กรุงเทพมหานคร</span></h1><p>A new perspective on a city that never stands still.</p></div><button class="outline" id="reset">${icon("scan")} Reset view</button></section>
<section class="metrics"><article><div class="metric-label">${icon("car-front")} Traffic flow <span class="live-dot"></span></div><div class="metric-value"><span id="traffic-value">32.4</span><small>km/h</small></div><div class="metric-foot"><span class="positive">↗ 8.2%</span> vs. previous hour <svg viewBox="0 0 110 26"><path d="M1 23L15 19L25 21L38 13L49 16L61 9L73 11L86 4L99 7L109 2"/></svg></div></article><article><div class="metric-label">${icon("wind")} Air quality <span class="status amber">Moderate</span></div><div class="metric-value"><span id="aqi-value">58</span><small>US AQI</small></div><div class="metric-foot">PM2.5 <b id="pm-value">15.8 µg/m³</b><div class="aqi-strip"></div></div></article><article><div class="metric-label">${icon("waves")} River level <span class="status">Normal</span></div><div class="metric-value"><span id="river-value">1.82</span><small>m MSL</small></div><div class="metric-foot"><span class="positive">↓ 0.04 m</span> below previous hour</div></article><article><div class="metric-label">${icon("radio-tower")} Sample sensors <span class="live-dot"></span></div><div class="metric-value">128<small>/ 132 online</small></div><div class="metric-foot"><span class="positive">97.0% availability</span><span class="tiny-bars">▂▅▃▆▅▇▅▆▇▆</span></div></article></section>
<div class="content-grid"><section class="map-card"><div class="map-toolbar"><div class="map-title"><span class="live-dot"></span> Bangkok metropolitan area <span class="subtle">/ 3D EXPLORER</span></div><div class="segmented"><button id="view3d" class="selected">3D</button><button id="view2d">2D</button></div></div><div id="viewport"><div class="map-noise"></div><div class="map-location">13.7563° N &nbsp; 100.5018° E<small>SCHEMATIC CITY MODEL · BLENDER → THREE.JS</small></div><div id="loading">${icon("loader-circle")} Loading Bangkok geometry…</div><div id="labels"></div><div class="map-controls"><button id="north" title="Orient north">N<span>↑</span></button><button id="zoom-in" title="Zoom in">${icon("plus")}</button><button id="zoom-out" title="Zoom out">${icon("minus")}</button><button id="rotate" title="Toggle automatic orbit">${icon("orbit")}</button></div><div class="layer-panel"><div class="mini-heading">MAP LAYERS ${icon("sliders-horizontal")}</div><label><span><i class="layer-dot buildings"></i>3D buildings</span><input id="buildings" type="checkbox" checked /></label><label><span><i class="layer-dot traffic"></i>Traffic network</span><input id="traffic" type="checkbox" checked /></label><label><span><i class="layer-dot air"></i>Air quality</span><input id="air" type="checkbox" /></label><label><span><i class="layer-dot flood"></i>Flood scenario</span><input id="flood" type="checkbox" /></label></div><div class="map-legend"><span><i style="background:#58d4b1"></i>Free flow</span><span><i style="background:#e1b768"></i>Moderate</span><span><i style="background:#d8736d"></i>Congested</span></div><div class="map-scale">━━━━━<span>Illustrative scale</span></div></div><div class="timeline"><button id="play" title="Play simulation">${icon("play")}</button><div class="time-current"><b id="clock">14:30</b><small>ICT · UTC+7</small></div><div class="time-track"><input id="time" type="range" min="0" max="1439" value="870" aria-label="Simulation time"/><div><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span></div></div><span class="playback-tag">SAMPLE DAY</span></div></section>
<aside class="details"><section class="detail-card"><div class="section-title">City pulse <span class="sample-pill">SAMPLE DATA</span></div><div class="weather"><span class="sun-icon">${icon("cloud-sun")}</span><div><strong id="temperature">32°</strong><span>Partly cloudy</span></div><div class="weather-location">Bangkok, TH<small>Feels like 37°C</small></div></div><div class="weather-stats"><div>Humidity<b>68<span>%</span></b></div><div>Wind<b>12<span>km/h</span></b></div><div>UV index<b>6<span>High</span></b></div></div></section>
<section class="detail-card landmark-card"><div class="section-title">Explore landmarks ${icon("move-up-right")}</div><p class="card-subtitle">Select a place to fly into the city.</p><div id="landmarks"></div><div id="landmark-detail"></div></section><section class="detail-card activity"><div class="section-title">Scenario insights ${icon("activity")}</div><div class="insight"><span class="insight-icon">${icon("car-front")}</span><div><b>Evening commute ahead</b><p>Explore changing traffic patterns with the simulation timeline.</p><small>TRAFFIC · SIMULATED</small></div></div><div class="insight"><span class="insight-icon blue">${icon("waves")}</span><div><b>Riverfront resilience</b><p>Enable the flood scenario to inspect the river corridor.</p><small>ENVIRONMENT · ILLUSTRATIVE</small></div></div></section></aside></div><footer><span><i class="live-dot"></i> Prototype ready <span class="footer-divider">|</span> Illustrative geometry & simulated telemetry. Not for operational use.</span><span>THREE.JS <span>×</span> BLENDER ${icon("box")}</span></footer></main></div><dialog id="about"><button id="close-about" aria-label="Close">${icon("x")}</button><div class="eyebrow">ABOUT THIS PROTOTYPE</div><h2>A city, in perspective.</h2><p>This interactive sample uses a procedural Blender model rendered with Three.js. Bangkok landmarks and the Chao Phraya are stylized, with approximate placements, not surveyed GIS geometry.</p><p>Traffic, air quality, water levels, weather, and sensor counts are simulated. The flood layer is an illustrative corridor, not a hydrological prediction.</p><p>Drag to orbit · Scroll to zoom · Right-drag to pan. Select a landmark to focus the camera.</p><a href="/models/bangkok.glb" download>Download the Blender-exported GLB ↗</a></dialog>`;
const landmarks = [
  {
    name: "King Power MahaNakhon",
    area: "SILOM · SATHON",
    x: 12,
    z: 39,
    h: 55,
    type: "building-2",
    description:
      "A stylized pixelated tower, anchoring the Silom–Sathon skyline.",
    height: "Pixel tower",
    built: "Silom–Sathon",
  },
  {
    name: "Wat Arun",
    area: "CHAO PHRAYA RIVERFRONT",
    x: -49,
    z: -20,
    h: 23,
    type: "landmark",
    description:
      "The Temple of Dawn, represented by its central prang and four smaller spires.",
    height: "Temple",
    built: "Riverfront",
  },
  {
    name: "Baiyoke Tower II",
    area: "RATCHATHEWI",
    x: 53,
    z: -28,
    h: 68,
    type: "building",
    description:
      "A stepped tower and antenna rising above the illustrative city blocks.",
    height: "Observation tower",
    built: "Ratchathewi",
  },
  {
    name: "The Grand Palace",
    area: "PHRA NAKHON",
    x: -12,
    z: -60,
    h: 10,
    type: "castle",
    description:
      "A simplified palace compound with golden roofs and ceremonial halls.",
    height: "Palace",
    built: "Historic district",
  },
];
const landmarkList = document.querySelector("#landmarks");
landmarkList.innerHTML = landmarks
  .map(
    (l, i) =>
      `<button class="landmark-row ${i === 0 ? "chosen" : ""}" data-index="${i}"><span class="landmark-symbol">${icon(l.type)}</span><span><b>${l.name}</b><small>${l.area}</small></span>${icon("chevron-right")}</button>`,
  )
  .join("");
createIcons({ icons });
const viewport = document.querySelector("#viewport");
const metricCards = document.querySelectorAll(".metrics article");
metricCards[0].querySelector(".metric-foot").innerHTML =
  '<span id="traffic-change" class="positive"></span> vs. previous hour';
metricCards[1].querySelector(".metric-value small").textContent =
  "sample index";
metricCards[1].querySelector(".metric-foot").innerHTML =
  "Average of online sample stations";
metricCards[2].querySelector(".metric-value small").textContent =
  "m · sample datum";
metricCards[2].querySelector(".status").textContent = "Sample";
metricCards[2].querySelector(".metric-foot").innerHTML =
  '<span id="river-change" class="positive"></span> vs. previous hour';
const onlineCount = stations.filter((s) => s.online).length;
metricCards[3].querySelector(".metric-value").innerHTML =
  `${onlineCount}<small>/ ${stations.length} online</small>`;
metricCards[3].querySelector(".metric-foot").innerHTML =
  '<span class="positive">6 selectable stations</span><span>· 1 offline</span>';
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (e) {
  document.querySelector("#loading").textContent =
    "WebGL unavailable. Please use a browser with hardware acceleration.";
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor("#0c1922");
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.65;
viewport.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2("#0c1922", 0.0017);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1500);
camera.position.set(210, 210, 260);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.12;
controls.minDistance = 35;
controls.maxDistance = 640;
controls.target.set(0, 0, 0);
controls.autoRotateSpeed = 0.6;
scene.add(new THREE.HemisphereLight("#c4efff", "#192c39", 3));
const sun = new THREE.DirectionalLight("#a4d4ed", 3);
sun.position.set(50, 120, 30);
scene.add(sun);
const grid = new THREE.GridHelper(1000, 100, "#19313d", "#142632");
grid.position.y = -2.2;
scene.add(grid);
let city;
const buildingGroups = [];
new GLTFLoader().load(
  "/models/bangkok.glb",
  (g) => {
    city = g.scene;
    scene.add(city);
    city.traverse((o) => {
      if (o.isMesh) {
        if (/Architecture|Roof|Landmark|Temple/.test(o.name))
          buildingGroups.push(o);
        o.material.side = THREE.DoubleSide;
      }
    });
    document.querySelector("#loading").remove();
    window.__cityReady = true;
  },
  undefined,
  (e) => {
    document.querySelector("#loading").textContent =
      "City model could not load. Refresh to retry.";
    console.error(e);
  },
);
const traffic = new THREE.Group();
scene.add(traffic);
let seed = 18;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const routes = [];
const cars = [];
for (let i = 0; i < 12; i++) {
  const x = -105 + i * 19;
  const points = [];
  for (let j = 0; j < 12; j++)
    points.push(
      new THREE.Vector3(x + Math.sin(j * 0.5 + i) * 3, 0.6, -115 + j * 21),
    );
  const curve = new THREE.CatmullRomCurve3(points);
  const color = i % 4 === 0 ? "#d58d6c" : i % 3 === 0 ? "#d5bd78" : "#4bbaad";
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 80, 0.23, 4, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65 }),
  );
  traffic.add(mesh);
  routes.push(curve);
  for (let j = 0; j < 7; j++) {
    const car = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.5, 1.6),
      new THREE.MeshBasicMaterial({ color }),
    );
    traffic.add(car);
    cars.push({
      mesh: car,
      curve,
      offset: rand(),
      speed: 0.008 + rand() * 0.012,
    });
  }
}
const airGroup = new THREE.Group();
scene.add(airGroup);
airGroup.visible = false;
for (let i = 0; i < 14; i++) {
  const x = rand() * 200 - 100,
    z = rand() * 200 - 100;
  const circle = new THREE.Mesh(
    new THREE.CircleGeometry(13 + rand() * 14, 48),
    new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? "#dba659" : "#5fd2ad",
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
    }),
  );
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(x, 1, z);
  airGroup.add(circle);
}
const floodGroup = new THREE.Group();
scene.add(floodGroup);
floodGroup.visible = false;
const floodPoints = [];
for (let i = 0; i <= 120; i++) {
  const y = -125 + (i * 250) / 120;
  floodPoints.push(
    new THREE.Vector3(
      -33 + 19 * Math.sin(y / 48) + 8 * Math.sin(y / 23),
      1.5,
      -y,
    ),
  );
}
const fverts = [];
for (const p of floodPoints) {
  fverts.push(p.x - 15, p.y, p.z, p.x + 15, p.y, p.z);
}
const findices = [];
for (let i = 0; i < 120; i++) {
  const k = i * 2;
  findices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
}
const fg = new THREE.BufferGeometry();
fg.setAttribute("position", new THREE.Float32BufferAttribute(fverts, 3));
fg.setIndex(findices);
fg.computeVertexNormals();
floodGroup.add(
  new THREE.Mesh(
    fg,
    new THREE.MeshBasicMaterial({
      color: "#498df4",
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  ),
);
const labelRoot = document.querySelector("#labels");
landmarks.forEach((l, i) => {
  const el = document.createElement("button");
  el.className = "scene-label";
  el.innerHTML = `<span class="pin"></span><span>${i === 0 ? "MahaNakhon" : i === 2 ? "Baiyoke II" : l.name}</span>`;
  el.onclick = () => selectLandmark(i, true);
  labelRoot.append(el);
  l.el = el;
});
let destination = null,
  selected = 0,
  inspector;
function selectLandmark(index, fly) {
  selected = index;
  inspector?.showLandmarks();
  const l = landmarks[index];
  document
    .querySelectorAll(".landmark-row")
    .forEach((e, i) => e.classList.toggle("chosen", i === index));
  document.querySelector("#landmark-detail").innerHTML =
    `<span class="detail-caption">SELECTED LANDMARK</span><h3>${l.name}</h3><p>${l.description}</p><div class="landmark-meta"><span>${l.height}</span><span>${l.built}</span><span>Blender asset ↗</span></div>`;
  if (fly) {
    setCameraMode(false);
    controls.autoRotate = false;
    document.querySelector("#rotate").classList.remove("selected");
    destination = {
      target: new THREE.Vector3(l.x, l.h * 0.3, l.z),
      position: new THREE.Vector3(l.x + 85, l.h + 65, l.z + 100),
    };
  }
}
landmarkList.onclick = (e) => {
  const row = e.target.closest("[data-index]");
  if (row) selectLandmark(Number(row.dataset.index), true);
};
selectLandmark(0, false);
function resize() {
  const w = viewport.clientWidth,
    h = viewport.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);
controls.addEventListener("start", () => (destination = null));
const $ = (s) => document.querySelector(s);
inspector = createInspector({
  viewport,
  camera,
  floodGeometry: fg,
  floodPoints,
  floodGroup,
  focus: (station) => {
    setCameraMode(false);
    controls.autoRotate = false;
    $("#rotate").classList.remove("selected");
    $("#view3d").classList.add("selected");
    $("#view2d").classList.remove("selected");
    destination = {
      position: new THREE.Vector3(station.x + 65, 100, station.z + 85),
      target: new THREE.Vector3(station.x, 5, station.z),
    };
  },
});
$("#traffic").onchange = (e) => (traffic.visible = e.target.checked);
$("#air").onchange = (e) => (airGroup.visible = e.target.checked);
$("#flood").onchange = (e) => (floodGroup.visible = e.target.checked);
$("#buildings").onchange = (e) => {
  buildingGroups.forEach((o) => (o.visible = e.target.checked));
  labelRoot.hidden = !e.target.checked;
};
function setCameraMode(overhead) {
  controls.enableRotate = !overhead;
  $("#view2d").classList.toggle("selected", overhead);
  $("#view3d").classList.toggle("selected", !overhead);
  if (overhead) {
    controls.autoRotate = false;
    $("#rotate").classList.remove("selected");
  }
}
function reset() {
  setCameraMode(false);
  destination = {
    position: new THREE.Vector3(210, 210, 260),
    target: new THREE.Vector3(0, 0, 0),
  };
  controls.autoRotate = false;
  $("#rotate").classList.remove("selected");
}
$("#reset").onclick = reset;
$("#overview").onclick = reset;
$("#view3d").onclick = reset;
$("#view2d").onclick = () => {
  setCameraMode(true);
  destination = {
    position: new THREE.Vector3(0, 340, 0.1),
    target: new THREE.Vector3(),
  };
};
function zoom(factor) {
  destination = null;
  const distance = camera.position.distanceTo(controls.target);
  const next = THREE.MathUtils.clamp(
    distance * factor,
    controls.minDistance,
    controls.maxDistance,
  );
  camera.position
    .sub(controls.target)
    .multiplyScalar(next / distance)
    .add(controls.target);
}
$("#zoom-in").onclick = () => zoom(0.8);
$("#zoom-out").onclick = () => zoom(1.2);
$("#north").onclick = () => {
  setCameraMode(false);
  controls.autoRotate = false;
  $("#rotate").classList.remove("selected");
  destination = {
    position: new THREE.Vector3(0, 240, 250),
    target: new THREE.Vector3(),
  };
};
$("#rotate").onclick = (e) => {
  destination = null;
  setCameraMode(false);
  controls.autoRotate = !controls.autoRotate;
  e.currentTarget.classList.toggle("selected", controls.autoRotate);
};
$("#layer-nav").onclick = () => $(".layer-panel").classList.toggle("collapsed");
$("#air-nav").onclick = () => {
  $("#air").checked = !$("#air").checked;
  $("#air").dispatchEvent(new Event("change"));
};
$("#landmark-nav").onclick = () => selectLandmark((selected + 1) % 4, true);
$("#info").onclick = () => $("#about").showModal();
$("#close-about").onclick = () => $("#about").close();
$("#about").onclick = (e) => {
  if (e.target === $("#about")) $("#about").close();
};
let minutes = 870,
  playing = false,
  elapsed = 0,
  trafficSpeed = 1;
function setTime(value) {
  minutes = Number(value);
  $("#time").value = minutes;
  $("#clock").textContent = formatTime(minutes);
  const current = cityAt(minutes),
    previous = cityAt(minutes - 60);
  $("#traffic-value").textContent = current.traffic.toFixed(1);
  $("#aqi-value").textContent = Math.round(current.air);
  $("#river-value").textContent = current.river.toFixed(2);
  const trafficChange = (current.traffic / previous.traffic - 1) * 100;
  const riverChange = current.river - previous.river;
  $("#traffic-change").textContent =
    `${trafficChange >= 0 ? "↗ +" : "↘ "}${trafficChange.toFixed(1)}%`;
  $("#river-change").textContent =
    `${riverChange >= 0 ? "+" : ""}${riverChange.toFixed(2)} m`;
  trafficSpeed = current.traffic / 37;
  const badge = metricCards[1].querySelector(".status");
  badge.textContent = current.air <= 50 ? "Low" : "Elevated";
  badge.classList.toggle("amber", current.air > 50);
  const hour = minutes / 60;
  $("#temperature").textContent =
    Math.round(29 + 4 * Math.sin(((hour - 7) / 24) * Math.PI * 2)) + "°";
  sun.intensity = hour >= 6 && hour < 19 ? 3 : 0.65;
  inspector.update(minutes);
}
$("#time").oninput = (e) => setTime(e.target.value);
$("#play").onclick = () => {
  playing = !playing;
  $("#play").innerHTML = icon(playing ? "pause" : "play");
  $("#play").title = playing ? "Pause simulation" : "Play simulation";
  createIcons({ icons });
};
setTime(870);
const clock = new THREE.Clock();
const v = new THREE.Vector3();
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt * trafficSpeed;
  if (playing) setTime((minutes + dt * 20) % 1440);
  if (destination) {
    camera.position.lerp(destination.position, 0.055);
    controls.target.lerp(destination.target, 0.055);
    if (camera.position.distanceTo(destination.position) < 0.1)
      destination = null;
  }
  controls.update();
  cars.forEach((c) => {
    const t = (elapsed * c.speed + c.offset) % 1;
    c.mesh.position.copy(c.curve.getPointAt(t));
    c.mesh.lookAt(c.curve.getPointAt(Math.min(t + 0.002, 1)));
  });
  landmarks.forEach((l, i) => {
    v.set(l.x, l.h + 4, l.z).project(camera);
    l.el.style.transform = `translate(-50%,-100%) translate(${(v.x * 0.5 + 0.5) * viewport.clientWidth}px,${(-v.y * 0.5 + 0.5) * viewport.clientHeight}px)`;
    l.el.style.display = v.z > 1 || v.z < -1 ? "none" : "";
    l.el.classList.toggle("selected", i === selected);
  });
  inspector.project();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
window.__twin = {
  scene,
  camera,
  controls,
  traffic,
  airGroup,
  floodGroup,
  buildingGroups,
  selectLandmark,
};
