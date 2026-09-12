import {
  assets,
  defaults,
  reading,
  fleet,
  totals,
  formatTime,
} from "./power";
import { createPowerScene } from "./dtia-scene";
import "./dtia.css";

document.title = "Digital Twin Research Center for Infrastructure Assets (DTIA)";
const $ = (s) => document.querySelector(s);
const state = defaults();
let mode = "monitor",
  playing = false,
  lastMinute = -1;
const badge = (status, label = status) =>
  `<span class="p-badge ${status}"><i></i>${label}</span>`;
$("#app").innerHTML = `
<aside class="p-rail"><a class="p-mark" href="/" aria-label="DTIA lab home">◈</a><span class="rail-word">DTIA</span><nav><button data-mode="monitor" class="selected" title="Transformer monitoring">▦</button><button data-mode="analyze" title="Fleet analytics">▥</button><button data-mode="optimize" title="Power optimizer">ϟ</button></nav><a class="city-link" href="?view=city" title="DTIA city showcase">BK</a></aside>
<div class="p-workspace"><header class="p-header"><span>Grid intelligence <span class="p-separator">/</span> <b>Distribution digital twin</b></span><div>${badge("demo", "SIMULATED DATA")}<button id="dtia-about" aria-label="About the DTIA prototype">ⓘ</button></div></header>
<main class="p-main"><section class="p-heading"><div><div class="p-eyebrow">DTIA LAB · INFRASTRUCTURE ASSET SHOWCASE</div><h1>Digital Twin Research Center <em>for Infrastructure Assets (DTIA)</em></h1><p>Distribution asset monitoring, analytics and simulation <span>·</span> DTIA research showcase</p></div><button class="p-button" id="dtia-export">↓ Export snapshot</button></section>
<div class="p-navigation"><div class="p-tabs" aria-label="Dashboard view"><button data-mode="monitor" class="selected"><b>Monitor</b></button><button data-mode="analyze"><b>Analyze</b></button><button data-mode="optimize"><b>Optimize</b></button></div><label class="p-filter">Service area <select id="dtia-feeder"><option value="all">All sample feeders</option><option value="PTY-01">PTY-01 · Coastal</option><option value="PTY-02">PTY-02 · Inland</option></select></label></div>
<section class="p-metrics"><article><span>◈ Monitored transformers</span><strong id="p-online"></strong><small id="p-availability"></small></article><article><span>ϟ Active power</span><strong id="p-power"></strong><small>Total from online assets</small></article><article><span>▥ Fleet utilization</span><strong id="p-loading"></strong><small>Capacity-weighted apparent load</small></article><article><span>△ Assets needing review</span><strong id="p-alerts"></strong><small>Illustrative alarm thresholds</small></article></section>
<section class="p-mode-copy"><span id="p-mode-tag">MONITOR / NETWORK OBSERVABILITY</span><p id="p-mode-text">Explore the network. Select a transformer to inspect its electrical state.</p></section>
<div class="p-grid"><section class="p-map-card" id="p-map-card"><div class="p-card-head"><span><i class="p-dot"></i> Pattaya sample distribution network</span><div class="p-segment"><button id="dtia-3d" class="selected">3D</button><button id="dtia-2d">2D</button></div></div><div id="dtia-viewport"><div id="dtia-loading">Building your network view…</div><div class="p-map-note">CHONBURI · SCHEMATIC DISTRICT<small>8 TRANSFORMERS / 2 SAMPLE FEEDERS</small></div><div id="power-pins"></div><div class="p-map-tools"><button id="dtia-reset" title="Reset camera">⌂</button><button id="dtia-zoom-in" title="Zoom in">+</button><button id="dtia-zoom-out" title="Zoom out">−</button></div><div class="p-layers"><h3>NETWORK LAYERS</h3><label>Building context<input type="checkbox" id="dtia-buildings" checked /></label><label>Feeder connections<input type="checkbox" id="dtia-feeders" checked /></label><label>Asset labels<input type="checkbox" id="dtia-labels" checked /></label></div><div class="p-map-legend">${badge("normal", "Normal")}${badge("watch", "Review")}${badge("critical", "Critical")}${badge("offline", "Offline")}</div><span class="p-map-caption">Illustrative layout · Blender asset</span></div><div class="p-timeline"><button id="dtia-play" aria-label="Play sample day">▶</button><div><strong id="dtia-clock">18:00</strong><small>ICT · SAMPLE DAY</small></div><div class="p-time-range"><input id="dtia-time" aria-label="Simulation time" type="range" min="0" max="1439" value="1080"/><div><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span></div></div></div></section>
<section class="p-analytics p-panel" id="p-analytics" hidden><div class="p-card-head"><span>Fleet loading · 24-hour heatmap</span><small>SAMPLE PROFILE</small></div><p class="p-help">Each cell shows total apparent loading / rated capacity. Click an asset to inspect it.</p><div class="p-heatmap" id="p-heatmap"></div><div class="p-heat-legend"><span>Low &lt;25%</span><span>25–80%</span><span>80–100%</span><span>Overload &gt;100%</span></div><div class="p-analytics-note"><h3>Turn measurements into a review queue.</h3><p>Fleet ranking below uses loading, current imbalance and low-voltage flags. Offline assets remain visible and are excluded from measured fleet totals.</p><button class="p-button" id="analytics-monitor">Return to monitoring ↗</button></div></section>
<aside class="p-inspector p-panel"><div class="p-card-head"><span>Transformer detail</span><span class="p-mini">DTIA SAMPLE</span></div><div class="p-inspector-body"><label class="p-field" for="dtia-asset">Selected asset</label><select id="dtia-asset"></select><div class="p-asset-heading"><div><h2 id="p-asset-name"></h2><small id="p-asset-meta"></small></div><button id="dtia-locate" class="p-icon-button" title="Locate selected transformer">↗</button></div><div id="p-asset-status"></div><div class="p-reading-grid" id="p-readings"></div><div class="p-phase-head"><b>Phase loading</b><small>% of phase rating</small></div><div id="p-phases"></div><div class="p-trend-head"><b>Daily loading profile</b><span>0–180%</span></div><div id="p-trend"></div><div id="p-issues"></div></div></aside></div>
<div class="p-bottom-grid"><section class="p-panel p-fleet"><div class="p-card-head"><div><span>Transformer review queue</span><small id="p-row-count"></small></div><label class="p-search"><span>⌕</span><input id="dtia-search" placeholder="Find asset…" aria-label="Find transformer"/></label></div><div class="p-table-scroll"><table><thead><tr><th>Asset / feeder</th><th>Rating</th><th>Loading</th><th>Risk score ↓</th><th>Condition</th></tr></thead><tbody id="p-fleet-rows"></tbody></table></div><p class="p-table-note">Sample score 0–100 · Illustrative prioritization for infrastructure research.</p></section>
<section class="p-panel p-scenario"><div class="p-card-head"><span>What-if laboratory</span><span class="p-mini">LOCAL SIMULATION</span></div><div class="p-scenario-body"><div class="p-slider-head"><label for="dtia-ev">EV demand growth</label><output id="dtia-ev-value">+0%</output></div><input id="dtia-ev" type="range" min="0" max="100" value="0"/><div class="p-slider-head"><label for="dtia-solar">Rooftop solar adoption</label><output id="dtia-solar-value">0%</output></div><input id="dtia-solar" type="range" min="0" max="100" value="0"/><div class="p-optimize-switch"><div><b>Power-quality compensation</b><small id="p-optimize-target"></small></div><label><span class="sr-only">Enable Compensation simulation</span><input id="dtia-optimize" type="checkbox"/></label></div><div id="p-optimize-comparison"></div><p class="p-help">Illustrative compensation, not a hardware command or a validated power-flow result. EV and solar assumptions apply to the filtered view and the rest of the sample fleet.</p><button class="p-button p-reset-scenario" id="dtia-scenario-reset">↺ Reset assumptions</button></div></section></div>
<footer class="p-footer"><span><i class="p-dot"></i> DTIA lab showcase · Generated telemetry · Research simulation</span><button id="dtia-lab-info">About DTIA ↗</button></footer></main></div>
<dialog id="dtia-info"><button id="dtia-info-close" aria-label="Close information">×</button><div class="p-eyebrow">ABOUT DTIA LAB</div><h2>Digital Twin Research Center for Infrastructure Assets (DTIA)</h2><p>A DTIA lab showcase for exploring infrastructure assets through interactive digital twins. This demonstration brings together distribution asset monitoring, fleet analytics and power-quality simulation.</p><p>Assets, feeder topology and telemetry are synthetic. The coastal district is a schematic environment; asset names and locations are fictional.</p><p>Alarm thresholds, risk scores and scenario responses are demonstration assumptions. Compensation affects only the selected online asset. An offline device has unknown electrical state, not a confirmed outage.</p><a href="?view=city">Explore the DTIA city showcase ↗</a></dialog>`;

let network;
try {
  network = createPowerScene($("#dtia-viewport"), (id) => selectAsset(id, false));
} catch (error) {
  $("#dtia-loading").textContent = "3D unavailable in this browser. Asset monitoring and analytics remain available.";
  network = { update() {}, focus() {} };
  console.warn("WebGL scene unavailable", error.message);
}
$("#dtia-solar").insertAdjacentHTML('afterend', '<p class="p-help" id="p-solar-guidance"></p>');
const selectedAsset = () => assets.find((a) => a.id === state.selected);
function switchMode(next) {
  mode = next;
  document
    .querySelectorAll("[data-mode]")
    .forEach((b) => b.classList.toggle("selected", b.dataset.mode === mode));
  $("#p-analytics").hidden = mode !== "analyze";
  $("#p-map-card").hidden = mode === "analyze";
  $("#p-mode-tag").textContent = {
    monitor: "MONITOR / NETWORK OBSERVABILITY",
    analyze: "ANALYZE / FLEET ANALYTICS",
    optimize: "OPTIMIZE / POWER QUALITY LAB",
  }[mode];
  $("#p-mode-text").textContent = {
    monitor: "Explore the network. Select a transformer to inspect its electrical state.",
    analyze: "Compare daily utilization and prioritize assets for engineering review.",
    optimize: "Compare uncompensated and compensated phases on the selected transformer.",
  }[mode];
  $(".p-scenario").classList.toggle("highlight", mode === "optimize");
  render();
}
document
  .querySelectorAll("[data-mode]")
  .forEach((b) => (b.onclick = () => switchMode(b.dataset.mode)));
$("#analytics-monitor").onclick = () => switchMode("monitor");
function selectAsset(id, fly = false) {
  state.selected = id;
  state.optimize = false;
  $("#dtia-optimize").checked = false;
  $("#dtia-asset").value = id;
  render();
  if (fly) {
    switchMode("monitor");
    network.focus(selectedAsset());
  }
}
function updateAssetOptions() {
  const rows = fleet(state);
  $("#dtia-asset").innerHTML = rows
    .map(
      (r) =>
        `<option value="${r.asset.id}">${r.asset.id} · ${r.asset.name}</option>`,
    )
    .join("");
  if (!rows.some((r) => r.asset.id === state.selected)) {
    state.selected = rows[0].asset.id;
    state.optimize = false;
    $("#dtia-optimize").checked = false;
  }
  $("#dtia-asset").value = state.selected;
}
$("#dtia-asset").onchange = (e) => selectAsset(e.target.value);
$("#dtia-feeder").onchange = (e) => {
  state.feeder = e.target.value;
  updateAssetOptions();
  render();
};
$("#dtia-locate").onclick = () => {
  switchMode("monitor");
  network.focus(selectedAsset());
};
$("#dtia-time").oninput = (e) => {
  state.minute = Number(e.target.value);
  render();
};
$("#dtia-play").onclick = () => {
  playing = !playing;
  $("#dtia-play").textContent = playing ? "Ⅱ" : "▶";
  $("#dtia-play").setAttribute(
    "aria-label",
    playing ? "Pause sample day" : "Play sample day",
  );
};
for (const key of ["ev", "solar"])
  $(`#dtia-${key}`).oninput = (e) => {
    state[key] = Number(e.target.value);
    render();
  };
$("#dtia-optimize").onchange = (e) => {
  state.optimize = e.target.checked;
  render();
};
$("#dtia-scenario-reset").onclick = () => {
  state.ev = 0;
  state.solar = 0;
  state.optimize = false;
  $("#dtia-ev").value = 0;
  $("#dtia-solar").value = 0;
  $("#dtia-optimize").checked = false;
  render();
};
$("#dtia-search").oninput = () => renderTable(fleet(state));
$("#p-fleet-rows").onclick = (e) => {
  const row = e.target.closest("[data-asset]");
  if (row) selectAsset(row.dataset.asset, true);
};
$("#p-heatmap").onclick = (e) => {
  const button = e.target.closest("[data-asset]");
  if (button) selectAsset(button.dataset.asset, false);
};
$("#dtia-about").onclick = () => $("#dtia-info").showModal();
$("#dtia-lab-info").onclick = () => $("#dtia-info").showModal();
$("#dtia-info-close").onclick = () => $("#dtia-info").close();

function renderTable(rows) {
  const query = $("#dtia-search").value.trim().toLowerCase();
  const sorted = rows
    .filter((r) =>
      `${r.asset.id} ${r.asset.name} ${r.asset.feeder}`
        .toLowerCase()
        .includes(query),
    )
    .sort((a, b) => (b.values?.risk ?? -1) - (a.values?.risk ?? -1));
  $("#p-row-count").textContent =
    `${sorted.length} assets · current sample time`;
  $("#p-fleet-rows").innerHTML =
    sorted
      .map(
        ({ asset: a, values: v }) =>
          `<tr class="${a.id === state.selected ? "active" : ""}"><td><button data-asset="${a.id}"><b>${a.id} <span>${a.name}</span></b><small>${a.feeder}</small></button></td><td>${a.capacity}<small>kVA</small></td><td>${v ? v.loading.toFixed(1) + "%" : "—"}</td><td>${v ? `<span class="p-risk"><i style="width:${v.risk}%"></i><b>${v.risk}</b></span>` : "Unknown"}</td><td>${badge(v?.status || "offline", v?.issues[0] || (v ? "Normal" : "No telemetry"))}</td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="5" class="p-empty">No transformers match your search.</td></tr>';
}

function heatColor(value) {
  return value > 100
    ? "#bb5f74"
    : value > 80
      ? "#a78653"
      : value < 25
        ? "#34465e"
        : "#407d77";
}
function renderHeatmap(rows) {
  $("#p-heatmap").innerHTML =
    `<div class="p-heat-head"><span>Asset / hour</span>${[0, 4, 8, 12, 16, 20].map((h) => `<span>${String(h).padStart(2, "0")}</span>`).join("")}</div>` +
    rows
      .map(
        ({ asset: a }) =>
          `<div class="p-heat-row"><button data-asset="${a.id}">${a.id}</button>${Array.from(
            { length: 24 },
            (_, h) => {
              const v = reading(a, { ...state, minute: h * 60 });
              return `<span style="background:${v ? heatColor(v.loading) : "#252733"}" title="${a.id}, ${h}:00, ${v ? v.loading.toFixed(1) + "%" : "offline"}"></span>`;
            },
          ).join("")}</div>`,
      )
      .join("");
}

function trend(a) {
  if (!a.online)
    return '<div class="p-no-data">No telemetry · electrical state unknown</div>';
  const vals = Array.from({ length: 49 }, (_, i) =>
    reading(a, { ...state, minute: (i * 1439) / 48 }),
  );
  const pts = vals
    .map(
      (v, i) =>
        `${(i * 300) / 48},${75 - (Math.min(180, v.loading) / 180) * 65}`,
    )
    .join(" ");
  const x = (state.minute / 1439) * 300;
  return `<svg viewBox="0 0 300 85" role="img" aria-label="24 hour loading profile for ${a.id}"><path d="M0 39H300" stroke="#805464" stroke-dasharray="3 4"/><polyline points="${pts}" fill="none" stroke="#b6a1f4" stroke-width="2"/><line x1="${x}" x2="${x}" y1="5" y2="80" stroke="#e4e0f3" stroke-dasharray="3 3"/></svg><div class="p-chart-labels"><span>00:00</span><span>100% threshold</span><span>23:59</span></div>`;
}

function render() {
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', button.dataset.mode === mode));
  const solarAvailability = Math.max(0, Math.sin((state.minute / 60 - 6) * Math.PI / 12));
  $('#p-solar-guidance').textContent = solarAvailability < 0.01
    ? 'No modeled solar generation at this time. Move the timeline between 06:00 and 18:00 to explore daytime solar.'
    : `Daylight factor: ${(solarAvailability * 100).toFixed(0)}% of the sample solar profile.`;
  const rows = fleet(state),
    summary = totals(rows),
    a = selectedAsset(),
    v = reading(a, state),
    base = reading(a, state, false),
    preview = reading(a, state, true);
  $("#p-online").innerHTML =
    `${summary.online}<small>/ ${summary.count}</small>`;
  $("#p-availability").textContent =
    `${summary.count - summary.online} offline · telemetry availability`;
  $("#p-power").innerHTML =
    `${(summary.kw / 1000).toFixed(2)}<small>MW</small>`;
  $("#p-loading").innerHTML = `${summary.loading.toFixed(1)}<small>%</small>`;
  $("#p-alerts").innerHTML = `${summary.alerts}<small>assets</small>`;
  $("#dtia-clock").textContent = formatTime(state.minute);
  $("#dtia-time").value = state.minute;
  $("#p-asset-name").textContent = a.name;
  $("#p-asset-meta").textContent =
    `${a.id} / ${a.feeder} / ${a.capacity} kVA / ${a.customers} sample customers`;
  $("#p-asset-status").innerHTML = badge(
    v?.status || "offline",
    v
      ? `${v.status === "normal" ? "Normal operation" : v.status === "critical" ? "Critical · review required" : "Review recommended"}`
      : "Telemetry offline",
  );
  $("#p-readings").innerHTML = [
    ["Apparent power", v?.kva, "kVA", 1],
    ["Active power", v?.kw, "kW", 1],
    ["Oil temperature", v?.temp, "°C", 1],
    ["Power factor", v?.pf, "", 2],
  ]
    .map(
      ([label, value, unit, precision]) =>
        `<div><small>${label}</small><strong>${value == null ? "—" : value.toFixed(precision)}<span>${unit}</span></strong></div>`,
    )
    .join("");
  $("#p-phases").innerHTML = ["A", "B", "C"]
    .map(
      (phase, i) =>
        `<div class="p-phase"><b>${phase}</b><div><span style="width:${v ? Math.min((v.phases[i] / 180) * 100, 100) : 0}%;background:${v ? heatColor(v.phases[i]) : "#333"}"></span></div><strong>${v ? v.phases[i].toFixed(0) + "%" : "—"}</strong><small>${v ? v.voltages[i].toFixed(0) + " V · " + v.currents[i].toFixed(0) + " A" : "No data"}</small></div>`,
    )
    .join("");
  $("#p-trend").innerHTML = trend(a);
  $("#p-issues").innerHTML = v
    ? v.issues.length
      ? v.issues.map((issue) => `<span>△ ${issue}</span>`).join("")
      : '<span class="p-clear">No active sample alarms</span>'
    : "<span>○ Offline is not proof of an outage</span>";
  $("#dtia-ev-value").textContent = `+${state.ev}%`;
  $("#dtia-solar-value").textContent = `${state.solar}%`;
  $("#p-optimize-target").textContent = `Selected asset only · ${a.id}`;
  $("#dtia-optimize").disabled = !a.online;
  $("#p-optimize-comparison").innerHTML = base
    ? `<div class="p-compare-title"><b>${state.optimize ? "Compensation enabled" : "Compensation preview"}</b><span>Before → ${state.optimize ? "After" : "Potential"}</span></div>${[
        ["Current imbalance", base.imbalance, preview.imbalance, "%"],
        ["Current THD", base.thd, preview.thd, "%"],
        ["Power factor", base.pf, preview.pf, ""],
      ]
        .map(
          ([label, b, c, unit]) =>
            `<div class="p-compare"><span>${label}</span><b>${b.toFixed(unit ? 1 : 2)}${unit} <i>→</i> <em>${c.toFixed(unit ? 1 : 2)}${unit}</em></b></div>`,
        )
        .join("")}`
    : '<p class="p-help">Compensation simulation unavailable for offline telemetry. Select an online transformer.</p>';
  renderTable(rows);
  if (mode === "analyze") renderHeatmap(rows);
  network.update(rows, state.selected);
}

$("#dtia-export").onclick = () => {
  const rows = [
    [
      "asset_id",
      "feeder",
      "rating_kva",
      "status",
      "time_ict",
      "active_kw",
      "apparent_kva",
      "loading_pct",
      "imbalance_pct",
      "risk_score",
      "ev_growth_pct",
      "solar_adoption_pct",
      "optimize_applied",
      "provenance",
    ],
  ];
  fleet(state).forEach(({ asset: a, values: v }) =>
    rows.push([
      a.id,
      a.feeder,
      a.capacity,
      v?.status || "offline",
      formatTime(state.minute),
      v?.kw.toFixed(2) ?? "",
      v?.kva.toFixed(2) ?? "",
      v?.loading.toFixed(2) ?? "",
      v?.imbalance.toFixed(2) ?? "",
      v?.risk ?? "",
      state.ev,
      state.solar,
      !!v && state.optimize && a.id === state.selected,
      "synthetic demonstration",
    ]),
  );
  const csv = rows
    .map((row) =>
      row.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `dtia-transformers-${formatTime(state.minute).replace(":", "")}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
updateAssetOptions();
render();
let last = performance.now();
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (playing) {
    state.minute = (state.minute + dt * 20) % 1440;
    if (Math.floor(state.minute) !== lastMinute) {
      lastMinute = Math.floor(state.minute);
      render();
    }
  }
}
requestAnimationFrame(tick);
window.__dtia = { state, network, reading, assets };
