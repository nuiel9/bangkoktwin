import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { assets } from "./power";

export const statusColors = {
  normal: "#6ed9b2",
  watch: "#e9bd6d",
  critical: "#f4828e",
  offline: "#8090a1",
};

export function createPowerScene(viewport, onSelect) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor("#121523");
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  viewport.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#121523", 0.0017);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1500);
  camera.position.set(200, 225, 285);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(4, 0, 0);
  controls.enableDamping = true;
  controls.minDistance = 28;
  controls.maxDistance = 650;
  controls.maxPolarAngle = Math.PI / 2.12;
  scene.add(new THREE.HemisphereLight("#ddd8ff", "#242337", 3));
  const sun = new THREE.DirectionalLight("#d9e7ff", 3);
  sun.position.set(50, 100, 20);
  scene.add(sun);
  const grid = new THREE.GridHelper(700, 70, "#303046", "#212236");
  grid.position.y = -2.3;
  scene.add(grid);
  const context = [];
  new GLTFLoader().load(
    "/models/pea-distribution.glb",
    (g) => {
      scene.add(g.scene);
      g.scene.traverse((o) => {
        if (o.isMesh && o.name === "Buildings") context.push(o);
      });
      document.querySelector("#pea-loading").remove();
      window.__peaReady = true;
    },
    undefined,
    () => {
      document.querySelector("#pea-loading").textContent =
        "Model unavailable. Reload to retry.";
    },
  );
  const routes = new THREE.Group();
  scene.add(routes);
  const flows = [];
  const visualAssets = assets.map((a) => {
    const color = a.feeder === "PTY-01" ? "#b5a0f5" : "#68bddb";
    const spine = a.feeder === "PTY-01" ? -5 : 27;
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(8, 10, -99),
        new THREE.Vector3(spine, 10, -87),
        new THREE.Vector3(spine, 10, a.z),
        new THREE.Vector3(a.x, 7, a.z),
      ],
      false,
      "centripetal",
    );
    const route = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 70, 0.3, 4, false),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }),
    );
    routes.add(route);
    const flow = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 6, 6),
      new THREE.MeshBasicMaterial({ color: "#efddff" }),
    );
    routes.add(flow);
    flows.push({ curve, mesh: flow, asset: a });
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(6.8, 7.3, 40),
      new THREE.MeshBasicMaterial({
        color: statusColors.normal,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(a.x, 0.95, a.z);
    scene.add(ring);
    const pin = document.createElement("button");
    pin.className = "power-pin";
    pin.title = `${a.id} · ${a.name}`;
    pin.setAttribute("aria-label", `Inspect ${a.id}, ${a.name}`);
    pin.innerHTML = `<span>ϟ</span><b>${a.id}</b><small></small>`;
    pin.onclick = () => onSelect(a.id);
    document.querySelector("#power-pins").append(pin);
    return { asset: a, pin, ring, route, flow };
  });
  let target = null,
    labels = true;
  controls.addEventListener("start", () => (target = null));
  function focus(asset) {
    controls.enableRotate = true;
    setMode(false);
    target = {
      position: new THREE.Vector3(asset.x + 58, 76, asset.z + 82),
      center: new THREE.Vector3(asset.x, 3, asset.z),
    };
  }
  function setMode(overhead) {
    controls.enableRotate = !overhead;
    document.querySelector("#pea-2d").classList.toggle("selected", overhead);
    document.querySelector("#pea-3d").classList.toggle("selected", !overhead);
  }
  function reset() {
    setMode(false);
    target = {
      position: new THREE.Vector3(200, 225, 285),
      center: new THREE.Vector3(4, 0, 0),
    };
  }
  document.querySelector("#pea-reset").onclick = reset;
  document.querySelector("#pea-3d").onclick = reset;
  document.querySelector("#pea-2d").onclick = () => {
    setMode(true);
    target = {
      position: new THREE.Vector3(4, 345, 0.1),
      center: new THREE.Vector3(4, 0, 0),
    };
  };
  for (const [id, factor] of [
    ["pea-zoom-in", 0.8],
    ["pea-zoom-out", 1.2],
  ])
    document.querySelector(`#${id}`).onclick = () => {
      target = null;
      const old = camera.position.distanceTo(controls.target);
      camera.position
        .sub(controls.target)
        .multiplyScalar(THREE.MathUtils.clamp(old * factor, 28, 650) / old)
        .add(controls.target);
    };
  document.querySelector("#pea-buildings").onchange = (e) =>
    context.forEach((o) => (o.visible = e.target.checked));
  document.querySelector("#pea-feeders").onchange = (e) =>
    (routes.visible = e.target.checked);
  document.querySelector("#pea-labels").onchange = (e) =>
    (labels = e.target.checked);
  function update(rows, selected) {
    const visible = new Map(rows.map((r) => [r.asset.id, r]));
    visualAssets.forEach((item) => {
      const row = visible.get(item.asset.id);
      item.active = !!row;
      item.ring.visible = !!row;
      item.route.visible = !!row;
      item.flow.visible = !!row && !!row.values;
      if (!row) return;
      const color = statusColors[row.values?.status || "offline"];
      item.pin.style.setProperty("--asset-color", color);
      item.ring.material.color.set(color);
      item.pin.classList.toggle("selected", item.asset.id === selected);
      item.pin.querySelector("small").textContent = row.values
        ? `${row.values.loading.toFixed(0)}%`
        : "Offline";
    });
  }
  new ResizeObserver(() => {
    const w = viewport.clientWidth,
      h = viewport.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }).observe(viewport);
  const clock = new THREE.Clock(),
    v = new THREE.Vector3();
  let elapsed = 0;
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    if (target) {
      camera.position.lerp(target.position, 0.07);
      controls.target.lerp(target.center, 0.07);
      if (camera.position.distanceTo(target.position) < 0.1) target = null;
    }
    controls.update();
    visualAssets.forEach((item) => {
      v.set(item.asset.x, 12, item.asset.z).project(camera);
      item.pin.hidden =
        !labels ||
        !item.active ||
        v.z > 1 ||
        v.z < -1 ||
        Math.abs(v.x) > 1 ||
        Math.abs(v.y) > 1;
      item.pin.style.transform = `translate(-50%,-100%) translate(${(v.x * 0.5 + 0.5) * viewport.clientWidth}px,${(-v.y * 0.5 + 0.5) * viewport.clientHeight}px)`;
    });
    flows.forEach((f, i) =>
      f.mesh.position.copy(
        f.curve.getPointAt((elapsed * 0.035 + i * 0.12) % 1),
      ),
    );
    if (viewport.clientWidth) renderer.render(scene, camera);
  }
  animate();
  return { update, focus, reset, camera, controls, scene };
}
