import assets from "../public/data/dtia-assets.json";
export { assets };
export const formatTime = (minutes) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(Math.floor(minutes % 60)).padStart(2, "0")}`;
export const defaults = () => ({
  minute: 1080,
  ev: 0,
  solar: 0,
  optimize: false,
  selected: "DT-003",
  feeder: "all",
});

export function reading(
  asset,
  state,
  optimized = state.optimize && asset.id === state.selected,
) {
  if (!asset.online) return null;
  const h = state.minute / 60;
  const day =
    0.57 +
    0.24 * Math.exp(-(((h - 13) / 4) ** 2)) +
    0.49 * Math.exp(-(((h - 19) / 3) ** 2));
  const sunlight = Math.max(0, Math.sin(((h - 6) * Math.PI) / 12));
  const evLoad = (state.ev / 100) * (asset.id === "DT-007" ? 0.48 : 0.23);
  const solarOutput = (state.solar / 100) * sunlight * 0.38;
  const kw =
    asset.capacity *
    0.9 *
    Math.max(0.03, asset.base * day + evLoad - solarOutput);
  const pf = optimized ? 0.98 : 0.9;
  const kva = kw / pf;
  const loading = (kva / asset.capacity) * 100;
  const skew = asset.imbalance * (optimized ? 0.16 : 1);
  const phases = [1 + skew, 1 - skew * 0.65, 1 - skew * 0.35].map(
    (weight) => loading * weight,
  );
  const voltages = phases.map((load) =>
    optimized ? 230 - load * 0.028 : 232 - load * 0.17,
  );
  const currents = phases.map(
    (load, i) => ((((asset.capacity / 3) * load) / 100) * 1000) / voltages[i],
  );
  const meanCurrent = currents.reduce((a, b) => a + b, 0) / 3;
  const imbalance =
    (Math.max(...currents.map((i) => Math.abs(i - meanCurrent))) /
      meanCurrent) *
    100;
  const temp = 31 + (loading / 100) ** 1.7 * 39;
  const thd = optimized ? 3.2 : 5.1 + asset.imbalance * 6;
  const issues = [];
  // Demonstration thresholds, not operational policy or a certified power-flow model.
  if (loading > 100) issues.push("Overload");
  if (Math.max(...phases) > 100 && loading <= 100)
    issues.push("Phase overload");
  if (imbalance > 20) issues.push("Current imbalance");
  if (Math.min(...voltages) < 207) issues.push("Undervoltage");
  if (temp > 80) issues.push("High temperature");
  if (loading < 25) issues.push("Underutilized");
  const risk = Math.min(
    100,
    Math.round(
      Math.max(0, loading - 60) * 0.9 +
        imbalance * 0.6 +
        (Math.min(...voltages) < 207 ? 15 : 0),
    ),
  );
  const status =
    loading > 100 || Math.min(...voltages) < 207
      ? "critical"
      : issues.length
        ? "watch"
        : "normal";
  return {
    kw,
    kva,
    loading,
    phases,
    voltages,
    currents,
    imbalance,
    temp,
    thd,
    pf,
    issues,
    risk,
    status,
  };
}

export function fleet(state) {
  return assets
    .filter((a) => state.feeder === "all" || a.feeder === state.feeder)
    .map((asset) => ({ asset, values: reading(asset, state) }));
}

export function totals(rows) {
  const active = rows.filter((r) => r.values);
  const capacity = active.reduce((n, r) => n + r.asset.capacity, 0);
  return {
    online: active.length,
    count: rows.length,
    kw: active.reduce((n, r) => n + r.values.kw, 0),
    loading: capacity
      ? (active.reduce((n, r) => n + r.values.kva, 0) / capacity) * 100
      : 0,
    alerts: active.filter((r) => r.values.issues.length).length,
  };
}
