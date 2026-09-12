import { test, expect } from "@playwright/test";

test("DTIA monitoring, feeder filters, analytics and offline assets work", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.waitForFunction(() => window.__dtiaReady);
  await expect(page).toHaveTitle("Digital Twin Research Center for Infrastructure Assets (DTIA)");
  await expect(page.locator("#p-online")).toHaveText("7/ 8");
  await expect(page.locator("#p-fleet-rows tr")).toHaveCount(8);
  await expect(page.locator("#p-asset-name")).toHaveText("Commercial Quarter");
  await page
    .getByRole("button", {
      name: "Inspect DT-002, Central Market",
      exact: true,
    })
    .click();
  await expect(page.locator("#dtia-asset")).toHaveValue("DT-002");
  await page.locator("#dtia-feeder").selectOption("PTY-02");
  await expect(page.locator("#p-fleet-rows tr")).toHaveCount(4);
  await expect(page.locator("#p-online")).toHaveText("3/ 4");
  await expect(page.locator("#dtia-asset")).toHaveValue("DT-005");
  await page.locator('.p-tabs [data-mode="analyze"]').click();
  await expect(page.locator("#p-analytics")).toBeVisible();
  await expect(page.locator(".p-heat-row")).toHaveCount(4);
  await page.locator("#dtia-search").fill("DT-008");
  await expect(page.locator("#p-fleet-rows tr")).toHaveCount(1);
  await page.locator('#p-fleet-rows [data-asset="DT-008"]').click();
  await expect(page.locator("#p-asset-status")).toHaveText("Telemetry offline");
  await expect(page.locator("#p-readings")).not.toContainText("0.0");
  await expect(page.locator("#dtia-optimize")).toBeDisabled();
  await expect(page.locator(".p-no-data")).toContainText(
    "electrical state unknown",
  );
  await page.locator("#dtia-about").click();
  await expect(page.locator("#dtia-info")).toBeVisible();
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});

test("scenarios conserve active power, improve sample balance and export consistent data", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__dtiaReady);
  const values = () =>
    page.evaluate(() => {
      const { state, assets, reading } = window.__dtia;
      return reading(
        assets.find((a) => a.id === state.selected),
        state,
      );
    });
  await page.locator('.p-tabs [data-mode="optimize"]').click();
  const base = await values();
  await page.locator("#dtia-optimize").check();
  const compensated = await values();
  expect(compensated.kw).toBeCloseTo(base.kw, 8);
  expect(compensated.imbalance).toBeLessThan(base.imbalance);
  expect(compensated.kva).toBeLessThan(base.kva);
  expect(compensated.phases.reduce((sum, p) => sum + p, 0) / 3).toBeCloseTo(
    compensated.loading,
    8,
  );
  await page.locator("#dtia-ev").fill("75");
  expect((await values()).kw).toBeGreaterThan(compensated.kw);
  await page.locator("#dtia-time").fill("720");
  const midday = await values();
  await page.locator("#dtia-solar").fill("70");
  expect((await values()).kw).toBeLessThan(midday.kw);
  await page.locator("#dtia-time").fill("0");
  const night = await values();
  await page.locator("#dtia-solar").fill("0");
  expect((await values()).kw).toBeCloseTo(night.kw, 8);
  await page.locator("#dtia-asset").selectOption("DT-007");
  await expect(page.locator("#dtia-optimize")).not.toBeChecked();
  await page.locator("#dtia-time").fill("1080");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#dtia-export").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("dtia-transformers-1800.csv");
  const stream = await download.createReadStream();
  let csv = "";
  for await (const chunk of stream) csv += chunk;
  expect(csv.split("\r\n")).toHaveLength(9);
  expect(csv).toContain(
    '"DT-008","PTY-02","250","offline","18:00","","","","",""',
  );
  expect(csv).toContain("synthetic demonstration");
  await page.locator("#dtia-scenario-reset").click();
  await expect(page.locator("#dtia-ev")).toHaveValue("0");
  await expect(page.locator("#dtia-solar")).toHaveValue("0");
  await page.locator("#dtia-play").click();
  await expect(page.locator("#dtia-clock")).not.toHaveText("18:00");
  await page.locator("#dtia-play").click();
});

test("DTIA mobile interface fits and keeps controls usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForFunction(() => window.__dtiaReady);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator("#dtia-feeders").uncheck();
  await page.locator("#dtia-asset").selectOption("DT-006");
  await expect(page.locator("#p-issues")).toContainText("Underutilized");
  await page.locator('.p-tabs [data-mode="analyze"]').click();
  await expect(page.locator(".p-heat-row")).toHaveCount(8);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
