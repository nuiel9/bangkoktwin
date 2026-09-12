if (new URLSearchParams(location.search).get("view") === "city") {
  await import("./city.js");
} else {
  await import("./dtia.js");
}
