const view = new URLSearchParams(location.search).get("view");
const path = location.pathname.replace(/\/$/, "");
if (view === "city" || path === "/showcase/city") {
  await import("./city.js");
} else if (view === "distribution" || path === "/showcase/distribution") {
  await import("./dtia.js");
} else {
  await import("./lab.js");
}
