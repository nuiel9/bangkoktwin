import * as THREE from "three";
import {
  stations,
  stationTypes,
  stationValue,
  formatTime,
  riverX,
  scenarioWidth,
} from "./simulation";

export function createInspector({
  viewport,
  camera,
  floodGeometry,
  floodPoints,
  floodGroup,
  focus,
}) {
  let minutes = 870;
  let selected = stations[0];
  let rise = 0.75;
  let chartStation = null;
  const panel = document.querySelector(".activity");
  const landmarkPanel = document.querySelector(".landmark-card");
  const tabs = document.createElement("div");
  tabs.className = "inspector-tabs";
  tabs.innerHTML =
    '<button id="stations-tab" aria-pressed="true">Sample stations</button><button id="landmarks-tab" aria-pressed="false">Landmarks</button>';
  landmarkPanel.before(tabs);
  panel.className = "detail-card sensor-card";
  panel.innerHTML = `
    <div class="section-title">Station inspector <span class="sample-pill">SIMULATED</span></div>
    <label class="field-label" for="station-select">Sample station</label>
    <select id="station-select">${stations.map((s) => `<option value="${s.id}">${s.id} · ${s.name}${s.online ? "" : " (offline)"}</option>`).join("")}</select>
    <div class="station-heading"><span id="station-kind"></span><span id="station-status" class="status"></span></div>
    <div class="station-value"><strong id="station-value"></strong><span id="station-unit"></span></div>
    <div class="station-time">Sample time <span id="station-time"></span> ICT</div>
    <div id="station-chart" class="station-chart"></div>
    <div class="chart-caption"><span>00:00</span><span>24-hour sample profile</span><span>23:59</span></div>
    <p id="station-note" class="station-note"></p>
    <div class="station-actions"><button id="focus-station" class="outline">Locate station ↗</button><button id="export-snapshot" class="outline">Export CSV ↓</button></div>`;

  const layers = document.querySelector(".layer-panel");
  layers.insertAdjacentHTML(
    "beforeend",
    `
    <label><span><i class="layer-dot sensors"></i>Sample stations</span><input id="sensors" type="checkbox" checked /></label>
    <div id="flood-settings" hidden>
      <label for="flood-rise" class="flood-rise-label">Added water level <output id="flood-rise-value">+0.75 m</output></label>
      <input id="flood-rise" type="range" min="0" max="3" step="0.05" value="0.75" />
      <p>Illustrative extent · <span id="corridor-count"></span> stations inside overlay</p>
    </div>`,
  );

  const pinRoot = document.createElement("div");
  pinRoot.id = "sensor-pins";
  viewport.append(pinRoot);
  const pins = stations.map((station) => {
    const button = document.createElement("button");
    button.className = "sensor-pin";
    button.style.setProperty(
      "--station-color",
      stationTypes[station.type].color,
    );
    button.setAttribute(
      "aria-label",
      `${station.name}, ${stationTypes[station.type].label}${station.online ? "" : ", offline"}`,
    );
    button.title = `${station.id} · ${station.name}`;
    button.innerHTML = `<span>${station.online ? "◉" : "×"}</span><small>${station.id}</small>`;
    button.onclick = () => select(station.id);
    pinRoot.append(button);
    return { station, button };
  });
  const $ = (selector) => document.querySelector(selector);

  function showPanel(stationMode) {
    panel.hidden = !stationMode;
    landmarkPanel.hidden = stationMode;
    $("#stations-tab").setAttribute("aria-pressed", stationMode);
    $("#landmarks-tab").setAttribute("aria-pressed", !stationMode);
  }
  $("#stations-tab").onclick = () => showPanel(true);
  $("#landmarks-tab").onclick = () => showPanel(false);

  function drawChart() {
    chartStation = selected.id;
    if (!selected.online) {
      $("#station-chart").innerHTML =
        '<div class="chart-empty">No readings available · station offline</div>';
      return;
    }
    const values = Array.from({ length: 97 }, (_, i) =>
      stationValue(selected, (i * 1439) / 96),
    );
    const min = Math.min(...values),
      max = Math.max(...values);
    const y = (value) => 62 - ((value - min) / Math.max(max - min, 0.01)) * 48;
    const points = values
      .map(
        (value, i) => `${((i * 256) / 96).toFixed(2)},${y(value).toFixed(2)}`,
      )
      .join(" ");
    $("#station-chart").innerHTML =
      `<svg viewBox="0 0 256 76" role="img" aria-label="${stationTypes[selected.type].label} over the simulated day, from ${min.toFixed(2)} to ${max.toFixed(2)} ${stationTypes[selected.type].unit}">
      <path d="M0 14H256M0 38H256M0 62H256" class="chart-grid"/>
      <polyline points="${points}" fill="none" stroke="${stationTypes[selected.type].color}" stroke-width="2"/>
      <line id="chart-cursor" y1="6" y2="70" stroke="#e7f4fa" stroke-dasharray="3 3"/>
    </svg>`;
  }

  function updateReadings() {
    const type = stationTypes[selected.type];
    const value = stationValue(selected, minutes);
    $("#station-kind").textContent = type.label;
    $("#station-value").textContent =
      value === null ? "—" : value.toFixed(type.precision);
    $("#station-unit").textContent = type.unit;
    $("#station-time").textContent = formatTime(minutes);
    $("#station-status").textContent = selected.online ? "Online" : "Offline";
    $("#station-status").classList.toggle("offline", !selected.online);
    const inside =
      Math.abs(selected.x - riverX(selected.z)) <= scenarioWidth(rise);
    $("#station-note").textContent = !selected.online
      ? "Offline stations have no readings and are excluded from city averages."
      : floodGroup.visible && inside
        ? "Inside the illustrative flood overlay. This is a visual intersection, not a flood-risk assessment."
        : "Generated sample reading. City cards average online stations of the same type.";
    if (chartStation !== selected.id) drawChart();
    const cursor = $("#chart-cursor");
    if (cursor) {
      const x = (minutes / 1439) * 256;
      cursor.setAttribute("x1", x);
      cursor.setAttribute("x2", x);
    }
  }

  function select(id) {
    showPanel(true);
    selected = stations.find((s) => s.id === id) || stations[0];
    $("#station-select").value = selected.id;
    pins.forEach(({ station, button }) =>
      button.classList.toggle("selected", station.id === selected.id),
    );
    updateReadings();
  }

  function updateFlood() {
    const positions = floodGeometry.attributes.position;
    const width = scenarioWidth(rise);
    floodPoints.forEach((p, i) => {
      positions.setXYZ(i * 2, p.x - width, 0.3 + rise * 2, p.z);
      positions.setXYZ(i * 2 + 1, p.x + width, 0.3 + rise * 2, p.z);
    });
    positions.needsUpdate = true;
    floodGeometry.computeBoundingSphere();
    $("#flood-rise-value").textContent = `+${rise.toFixed(2)} m`;
    $("#corridor-count").textContent = stations.filter(
      (s) => Math.abs(s.x - riverX(s.z)) <= width,
    ).length;
    $("#flood-settings").hidden = !floodGroup.visible;
    updateReadings();
  }

  function updateLegend() {
    const entries = [];
    if ($("#traffic").checked)
      entries.push(
        '<span><i style="background:#79dcc0"></i>Traffic routes</span>',
      );
    if ($("#air").checked)
      entries.push(
        '<span><i style="background:#e1ba7c"></i>Sample air zones</span>',
      );
    if ($("#flood").checked)
      entries.push(
        '<span><i style="background:#82b8ff"></i>Flood scenario</span>',
      );
    if ($("#sensors").checked)
      entries.push(
        '<span><i style="background:#d8e8f1"></i>Selectable stations</span>',
      );
    document.querySelector(".map-legend").innerHTML =
      entries.join("") || "<span>Base city model</span>";
  }

  $("#station-select").onchange = (e) => select(e.target.value);
  $("#focus-station").onclick = () => {
    $("#sensors").checked = true;
    pinRoot.hidden = false;
    updateLegend();
    focus(selected);
  };
  $("#sensors").onchange = (e) => {
    pinRoot.hidden = !e.target.checked;
    updateLegend();
  };
  $("#flood-rise").oninput = (e) => {
    rise = Number(e.target.value);
    updateFlood();
  };
  ["traffic", "air", "flood"].forEach((id) =>
    $(`#${id}`).addEventListener("change", () => {
      updateLegend();
      if (id === "flood") {
        floodGroup.visible = $("#flood").checked;
        updateFlood();
      }
    }),
  );
  $("#export-snapshot").onclick = () => {
    const rows = [
      [
        "station_id",
        "station_name",
        "type",
        "status",
        "sample_time_ICT",
        "value",
        "unit",
        "data_source",
        "flood_scenario_enabled",
        "added_water_level_m",
      ],
    ];
    stations.forEach((s) =>
      rows.push([
        s.id,
        s.name,
        s.type,
        s.online ? "online" : "offline",
        formatTime(minutes),
        s.online
          ? stationValue(s, minutes).toFixed(stationTypes[s.type].precision)
          : "",
        stationTypes[s.type].unit,
        "simulated",
        floodGroup.visible,
        rise.toFixed(2),
      ]),
    );
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `bangkok-sample-${formatTime(minutes).replace(":", "")}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const projected = new THREE.Vector3();
  function project() {
    if (pinRoot.hidden) return;
    pins.forEach(({ station, button }) => {
      projected.set(station.x, 12, station.z).project(camera);
      button.style.transform = `translate(-50%,-100%) translate(${(projected.x * 0.5 + 0.5) * viewport.clientWidth}px,${(-projected.y * 0.5 + 0.5) * viewport.clientHeight}px)`;
      button.hidden =
        projected.z > 1 ||
        projected.z < -1 ||
        Math.abs(projected.x) > 1 ||
        Math.abs(projected.y) > 1;
    });
  }

  select(selected.id);
  updateFlood();
  updateLegend();
  return {
    project,
    showLandmarks: () => showPanel(false),
    update: (value) => {
      minutes = value;
      updateReadings();
    },
  };
}
