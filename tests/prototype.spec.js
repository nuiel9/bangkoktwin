import { test, expect } from '@playwright/test';
test('Blender scene and simulation controls work', async ({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5173');
 await page.waitForFunction(()=>window.__cityReady);
 await expect(page.locator('#viewport canvas')).toBeVisible();
 expect(await page.evaluate(()=>window.__twin.buildingGroups.length)).toBe(4);
 await page.locator('#air').check();expect(await page.evaluate(()=>window.__twin.airGroup.visible)).toBe(true);
 await page.locator('#flood').check();expect(await page.evaluate(()=>window.__twin.floodGroup.visible)).toBe(true);
 await page.locator('#traffic').uncheck();expect(await page.evaluate(()=>window.__twin.traffic.visible)).toBe(false);
 await page.locator('#buildings').uncheck();expect(await page.evaluate(()=>window.__twin.buildingGroups.every(o=>!o.visible))).toBe(true);
 await page.locator('#buildings').check();
 await page.locator('[data-index="1"]').click();await expect(page.locator('#landmark-detail h3')).toHaveText('Wat Arun');
 await page.waitForTimeout(1800);expect(await page.evaluate(()=>Math.abs(window.__twin.controls.target.x+49)<1)).toBe(true);
 await page.locator('#time').fill('1080');await expect(page.locator('#clock')).toHaveText('18:00');
 await page.locator('#play').click();await expect(page.locator('#clock')).not.toHaveText('18:00');await page.locator('#play').click();
 await page.locator('#view2d').click();await expect(page.locator('#view2d')).toHaveClass('selected');
 await page.locator('#reset').click();await expect(page.locator('#view3d')).toHaveClass('selected');
 await page.locator('#info').click();await expect(page.locator('#about')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#about')).not.toBeVisible();
 expect(errors).toEqual([]);
});
test('mobile layout fits and landmark controls remain usable',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:5173');await page.waitForFunction(()=>window.__cityReady);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('[data-index="2"]').click();await expect(page.locator('#landmark-detail h3')).toHaveText('Baiyoke Tower II');
 await page.screenshot({path:'/tmp/bangkok-mobile.png',fullPage:true});
});
