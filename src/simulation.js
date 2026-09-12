// Deterministic sample signals, shared by cards, stations, charts and exports.
// Values are illustrative; this module has no live data connection.
export const stations = [
  {
    id: "TR-01",
    name: "Silom junction",
    type: "traffic",
    x: 32,
    z: 72,
    online: true,
  },
  {
    id: "TR-02",
    name: "Ratchathewi junction",
    type: "traffic",
    x: 77,
    z: -55,
    online: true,
  },
  {
    id: "AQ-01",
    name: "Lumphini park",
    type: "air",
    x: 43,
    z: 2,
    online: true,
  },
  {
    id: "AQ-02",
    name: "West bank",
    type: "air",
    x: -91,
    z: -38,
    online: false,
  },
  {
    id: "WL-01",
    name: "Riverfront south",
    type: "river",
    x: riverX(53),
    z: 53,
    online: true,
  },
  {
    id: "WL-02",
    name: "Riverfront north",
    type: "river",
    x: riverX(-78),
    z: -78,
    online: true,
  },
];

export const stationTypes = {
  traffic: {
    label: "Traffic speed",
    unit: "km/h",
    color: "#79dcc0",
    precision: 1,
  },
  air: {
    label: "Air quality",
    unit: "sample index",
    color: "#e1ba7c",
    precision: 0,
  },
  river: {
    label: "River level",
    unit: "m · sample datum",
    color: "#82b8ff",
    precision: 2,
  },
};

export function riverX(z) {
  const y = -z;
  return -33 + 19 * Math.sin(y / 48) + 8 * Math.sin(y / 23);
}

export function signalAt(type, minutes, index = 0) {
  const hour = (((minutes % 1440) + 1440) % 1440) / 60;
  const rush =
    Math.exp(-(((hour - 8) / 2) ** 2)) + Math.exp(-(((hour - 18) / 2.3) ** 2));
  if (type === "traffic")
    return (
      37 - 15 * rush + 2 * Math.sin((hour * Math.PI) / 12 + index) - index * 1.4
    );
  if (type === "air")
    return 49 + 22 * rush + 6 * Math.sin((hour * Math.PI) / 12) + index * 2;
  return (
    1.82 + 0.19 * Math.sin(((minutes - 870) * Math.PI) / 720) + index * 0.035
  );
}

export function stationValue(station, minutes) {
  if (!station.online) return null;
  const index = stations
    .filter((s) => s.type === station.type)
    .indexOf(station);
  return signalAt(station.type, minutes, index);
}

export function cityAt(minutes) {
  const average = (type) => {
    const active = stations.filter((s) => s.type === type && s.online);
    return (
      active.reduce((sum, s) => sum + stationValue(s, minutes), 0) /
      active.length
    );
  };
  return {
    traffic: average("traffic"),
    air: average("air"),
    river: average("river"),
  };
}

export function formatTime(minutes) {
  const minute = Math.floor(((minutes % 1440) + 1440) % 1440);
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export function scenarioWidth(rise) {
  // Visual mapping only: schematic world units, not a calibrated flood model.
  return 9 + Number(rise) * 8;
}
