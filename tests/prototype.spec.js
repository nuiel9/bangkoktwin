import { test, expect } from "@playwright/test";
test("Blender scene and simulation controls work", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?view=city");
  await page.waitForFunction(() => window.__cityReady);
  await expect(page.locator("#viewport canvas")).toBeVisible();
  expect(await page.evaluate(() => window.__twin.buildingGroups.length)).toBe(
    4,
  );
  await page.locator("#air").check();
  expect(await page.evaluate(() => window.__twin.airGroup.visible)).toBe(true);
  await page.locator("#flood").check();
  expect(await page.evaluate(() => window.__twin.floodGroup.visible)).toBe(
    true,
  );
  await page.locator("#traffic").uncheck();
  expect(await page.evaluate(() => window.__twin.traffic.visible)).toBe(false);
  await page.locator("#buildings").uncheck();
  expect(
    await page.evaluate(() =>
      window.__twin.buildingGroups.every((o) => !o.visible),
    ),
  ).toBe(true);
  await page.locator("#buildings").check();
  await page.locator("#landmarks-tab").click();
  await page.locator('[data-index="1"]').click();
  await expect(page.locator("#landmark-detail h3")).toHaveText("Wat Arun");
  await page.waitForTimeout(1800);
  expect(
    await page.evaluate(
      () => Math.abs(window.__twin.controls.target.x + 49) < 1,
    ),
  ).toBe(true);
  await page.locator("#time").fill("1080");
  await expect(page.locator("#clock")).toHaveText("18:00");
  await page.locator("#play").click();
  await expect(page.locator("#clock")).not.toHaveText("18:00");
  await page.locator("#play").click();
  await page.locator("#view2d").click();
  await expect(page.locator("#view2d")).toHaveClass("selected");
  await page.locator("#reset").click();
  await expect(page.locator("#view3d")).toHaveClass("selected");
  await page.locator("#info").click();
  await expect(page.locator("#about")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#about")).not.toBeVisible();
  expect(errors).toEqual([]);
});
test("mobile layout fits and landmark controls remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?view=city");
  await page.waitForFunction(() => window.__cityReady);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator("#flood").check();
  await page.locator("#flood-rise").fill("2");
  expect(
    await page.locator("#flood-rise").evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return (
        document.elementFromPoint(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
        ) === el
      );
    }),
  ).toBe(true);
  await page.locator("#landmarks-tab").click();
  await page.locator('[data-index="2"]').click();
  await expect(page.locator("#landmark-detail h3")).toHaveText(
    "Baiyoke Tower II",
  );
  await page.screenshot({ path: "/tmp/bangkok-mobile.png", fullPage: true });
});
test("station readings, offline handling, flood extent and CSV stay consistent", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?view=city");
  await page.waitForFunction(() => window.__cityReady);
  await page.locator("#station-select").selectOption("AQ-01");
  await page.locator("#time").fill("1080");
  await expect(page.locator("#station-time")).toHaveText("18:00");
  await expect(page.locator("#station-value")).toHaveText(
    await page.locator("#aqi-value").textContent(),
  );
  const evening = await page.locator("#station-value").textContent();
  await page.locator("#time").fill("720");
  await expect(page.locator("#station-value")).not.toHaveText(evening);
  await page.getByRole("button", { name: "West bank, Air quality, offline", exact: true }).click();
  await expect(page.locator("#station-select")).toHaveValue("AQ-02");
  await expect(page.locator("#station-status")).toHaveText("Offline");
  await expect(page.locator("#station-value")).toHaveText("—");
  await expect(page.locator(".chart-empty")).toContainText("No readings");
  await page.locator("#station-select").selectOption("WL-01");
  await page.locator("#flood").check();
  await expect(page.locator("#flood-settings")).toBeVisible();
  await expect(page.locator("#station-note")).toContainText(
    "Inside the illustrative flood overlay",
  );
  const extent = () =>
    page.evaluate(() => {
      const p =
        window.__twin.floodGroup.children[0].geometry.attributes.position;
      return p.getX(1) - p.getX(0);
    });
  const narrow = await extent();
  await page.locator("#flood-rise").fill("2.5");
  expect(await extent()).toBeGreaterThan(narrow);
  await expect(page.locator("#flood-rise-value")).toHaveText("+2.50 m");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export-snapshot").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("bangkok-sample-1200.csv");
  const stream = await download.createReadStream();
  let csv = "";
  for await (const chunk of stream) csv += chunk;
  expect(csv.split("\r\n")).toHaveLength(7);
  expect(csv).toContain('"AQ-02","West bank","air","offline","12:00",""');
  expect(csv).toContain('"simulated","true","2.50"');
  await page.locator("#flood").uncheck();
  await expect(page.locator("#flood-settings")).toBeHidden();
  await expect(page.locator(".map-legend")).not.toContainText("Flood scenario");
  await page.locator("#view2d").click();
  await page.locator("#focus-station").click();
  await expect(page.locator("#view3d")).toHaveClass("selected");
  await expect
    .poll(() => page.evaluate(() => window.__twin.controls.target.z))
    .toBeCloseTo(53, 0);
  expect(errors).toEqual([]);
});
